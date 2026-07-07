/**
 * Riff's sound — hand-rolled Web Audio, no samples, no library.
 *
 * Each string is a Karplus-Strong plucked-string: a short burst of noise fed
 * into a delay line one period long, with a lowpass + slightly-under-unity
 * feedback so it rings and decays like a real string. The amp is a switchable
 * effect chain — clean, an overdrive waveshaper, or a convolution reverb whose
 * impulse response is synthesized (decaying noise), so nothing is downloaded.
 *
 * Nothing sounds until the cable is plugged in: the master gate sits at zero
 * until plug(true), which doubles as the user gesture browsers require before
 * an AudioContext may make noise.
 */

export type Tone = 'clean' | 'drive' | 'reverb'

// Standard tuning, low to high (Hz).
export const STRINGS = [
  { name: 'E', freq: 82.41 },
  { name: 'A', freq: 110.0 },
  { name: 'D', freq: 146.83 },
  { name: 'G', freq: 196.0 },
  { name: 'B', freq: 246.94 },
  { name: 'e', freq: 329.63 },
]

export const TONES: Tone[] = ['clean', 'drive', 'reverb']

function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024
  const curve = new Float32Array(new ArrayBuffer(n * 4))
  const k = amount
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x)) // soft clip
  }
  return curve
}

export class Riff {
  private ctx: AudioContext | null = null
  private master!: GainNode // plug gate
  private clean!: GainNode
  private drive!: GainNode
  private reverbWet!: GainNode
  private reverbDry!: GainNode
  private busIn!: GainNode // plucks feed here
  private ui!: GainNode // UI clicks bypass the plug gate (quiet, direct out)
  private tone: Tone = 'clean'
  plugged = false
  /** Capo fret (0 = off). Every pluck is raised this many semitones. */
  capo = 0

  /** Build the graph lazily on first plug (the required user gesture). */
  private ensure() {
    if (this.ctx) return
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)

    this.ui = ctx.createGain()
    this.ui.gain.value = 0.25
    this.ui.connect(ctx.destination)

    this.busIn = ctx.createGain()
    this.busIn.gain.value = 0.9

    // clean path
    this.clean = ctx.createGain()
    this.busIn.connect(this.clean)

    // drive path: waveshaper + a tone-taming lowpass + makeup trim
    this.drive = ctx.createGain()
    const shaper = ctx.createWaveShaper()
    shaper.curve = driveCurve(14)
    shaper.oversample = '4x'
    const driveLP = ctx.createBiquadFilter()
    driveLP.type = 'lowpass'
    driveLP.frequency.value = 3200
    const driveTrim = ctx.createGain()
    driveTrim.gain.value = 0.5
    this.busIn.connect(this.drive)
    this.drive.connect(shaper)
    shaper.connect(driveLP)
    driveLP.connect(driveTrim)
    this.driveTerminal = driveTrim

    // reverb path: dry + convolver wet (synthesized impulse)
    this.reverbDry = ctx.createGain()
    this.reverbDry.gain.value = 0.7
    this.reverbWet = ctx.createGain()
    this.reverbWet.gain.value = 0.5
    const conv = ctx.createConvolver()
    conv.buffer = this.impulse(2.4, 2.5)
    this.busIn.connect(this.reverbDry)
    this.busIn.connect(conv)
    conv.connect(this.reverbWet)

    // all paths start disconnected from master; setTone wires the active one
    this.applyTone()
  }

  private impulse(seconds: number, decay: number): AudioBuffer {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
      }
    }
    return buf
  }

  private applyTone() {
    if (!this.ctx) return
    for (const n of [this.clean, this.drive, this.reverbDry, this.reverbWet]) {
      try { n.disconnect(this.master) } catch { /* not connected */ }
    }
    // The drive path's tail (driveTrim) is chained off this.drive already, so
    // reconnect through the same terminal nodes.
    try { this.driveTerminal?.disconnect(this.master) } catch { /* not connected */ }
    if (this.tone === 'clean') this.clean.connect(this.master)
    else if (this.tone === 'drive') this.driveTerminal!.connect(this.master)
    else {
      this.reverbDry.connect(this.master)
      this.reverbWet.connect(this.master)
    }
  }

  private driveTerminal: GainNode | null = null

  setTone(tone: Tone) {
    this.tone = tone
    if (this.ctx) this.applyTone()
  }

  async plug(on: boolean) {
    this.ensure()
    const ctx = this.ctx!
    if (ctx.state === 'suspended') await ctx.resume()
    this.plugged = on
    const t = ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setTargetAtTime(on ? 0.85 : 0, t, 0.02)
  }

  /**
   * Pluck one open string (index 0..5). The Karplus-Strong string is
   * synthesized sample-by-sample into a buffer here in JS — a feedback DelayNode
   * would add a whole render block of loop latency, flattening the pitch by up
   * to an octave at the high end. Computing it directly gives exact tuning and
   * still touches no audio files.
   */
  /** Pluck string `index` fretted at `fret` (0 = open). The capo is a floor. */
  pluck(index: number, fret = 0, when = 0) {
    if (!this.ctx || !this.plugged) return
    const ctx = this.ctx
    const sr = ctx.sampleRate
    const semitones = Math.max(fret, this.capo)
    const freq = STRINGS[index].freq * Math.pow(2, semitones / 12)

    // Averaging two delayed taps adds half a sample of delay, so target N+0.5.
    const N = Math.max(2, Math.round(sr / freq - 0.5))
    const dur = 3.2
    const total = Math.floor(sr * dur)
    const y = new Float32Array(total)
    for (let i = 0; i <= N; i++) y[i] = Math.random() * 2 - 1 // seed N+1 samples
    // R just under 1 guarantees eventual silence; the 0.5 averaging is the
    // lowpass that mellows harmonics faster than the fundamental (that's the
    // pluck). A separate exponential envelope shapes the overall decay.
    const R = 0.9995
    for (let n = N + 1; n < total; n++) y[n] = R * 0.5 * (y[n - N] + y[n - N - 1])
    const tau = 1.1 * sr
    for (let n = 0; n < total; n++) y[n] *= Math.exp(-n / tau) * 0.8

    const buf = ctx.createBuffer(1, total, sr)
    buf.copyToChannel(y, 0)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(this.busIn)
    src.start(when || ctx.currentTime)
    src.onended = () => { try { src.disconnect() } catch { /* gone */ } }
  }

  strum() {
    if (!this.ctx || !this.plugged) return
    const t0 = this.ctx.currentTime
    STRINGS.forEach((_, i) => this.pluck(i, 0, t0 + i * 0.045))
  }

  setCapo(fret: number) {
    this.capo = Math.max(0, Math.min(9, Math.round(fret)))
  }

  /** Small tactile tick for UI buttons — synthesized, bypasses the plug gate. */
  async click() {
    this.ensure()
    const ctx = this.ctx!
    if (ctx.state === 'suspended') await ctx.resume()
    const t = ctx.currentTime
    const len = Math.floor(ctx.sampleRate * 0.014)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2400
    bp.Q.value = 1.4
    src.connect(bp)
    bp.connect(this.ui)
    src.start(t)
  }

  /** The jack-hits-the-socket sound: a short low thunk + tick out of the amp. */
  connectThunk() {
    if (!this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, t)
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.09)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.6, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
    osc.connect(g)
    g.connect(this.busIn)
    osc.start(t)
    osc.stop(t + 0.18)
    void this.click()
  }

  dispose() {
    this.ctx?.close()
    this.ctx = null
  }
}
