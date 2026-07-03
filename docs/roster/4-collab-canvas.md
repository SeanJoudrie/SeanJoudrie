# Roster 04 — Meld: a real-time collaborative whiteboard over WebRTC

> Build spec for **Fable** (the coding LLM). Every decision is made here. Do not
> redesign anything. Where a file is given, paste it verbatim. Where a hex, a
> ratio, a message shape, or a sequence is given, it is load-bearing — do not
> "improve" it. If something seems missing, it is in a later section; read the
> whole doc once before writing code, then build in the phase order of §13.

---

## 0 · Identity

| Field | Value |
| --- | --- |
| Product name | **Meld** |
| Tagline | *a shared whiteboard that melds every hand onto one board* |
| Demo slug | `meld` (route `#/demos/meld`) |
| Token prefix | `meld` (`--color-meld-*`, `.meld-root`, `.meld-label`, `body.meld-page`) |
| Range commission | **Commission '05'**, skill **"Real-time & WebRTC"** |
| Page dir | `portfolio/src/pages/Meld/` |
| Smoke | `portfolio/scripts/smoke-meld.mjs` |
| On-screen claim | **"Peer-to-peer over WebRTC · Supabase signals, then gets out of the way."** |
| Second claim (footer) | **"Hand-rolled RTCPeerConnection mesh · no SDK, no relay"** |

The name is short on purpose: the builder writes `meld` hundreds of times.
"Meld" = to merge/blend — every peer's strokes meld onto one surface.

---

## 1 · Locked decisions (do not revisit)

1. **Transport = real WebRTC peer-to-peer.** Supabase Realtime is the *signaling
   channel only*: it carries the SDP offer/answer and ICE candidates during the
   handshake. Once an `RTCDataChannel` is open, **all** cursor and stroke data
   flows peer-to-peer over that channel — never through Supabase. This is the
   entire point of the demo and the thing that makes REX's WebRTC claim true.
2. **Activity = freehand shared whiteboard drawing** (pen, width, eraser, clear).
3. **Rooms are ephemeral.** A shareable link `#/demos/meld?room=xxxxxx`. Room id
   is auto-generated on first visit. No database, no persistence — when the last
   peer leaves, the room simply ceases to exist (nothing to reset or moderate).
   Lowest possible abuse surface.
4. **Mesh, not star.** Full mesh of `RTCPeerConnection`s. **Cap = 6 peers.**
   Reason: a full mesh has `N·(N−1)/2` connections; at 6 that is 15 pairwise
   links, each peer holding 5 connections and broadcasting its cursor to 5
   channels ~40×/s. That is comfortable. Past ~6 the per-peer upload fan-out and
   handshake churn start to bite, and we have exactly 6 accessible peer colors.
   The 7th+ visitor sees a **"room is full"** state and does not connect.
5. **Glare-free negotiation** via a *deterministic initiator* rule backed by the
   *perfect-negotiation* guard — see §6.2. One line: **the peer with the
   lexicographically-greater id is the sole offerer for that pair, and the lesser
   id is the "polite" peer that rolls back on the rare collision, so two offers
   can never deadlock.**
6. New dependency: **`@supabase/supabase-js`** (added to `portfolio/package.json`).
   No other new runtime dep. No drawing library, no WebRTC wrapper library.

---

## 2 · Positioning & hiring signal

AeroScale proves *motion & data-viz*. Meridian proves *3D & WebGL*. Meld proves
the thing hiring managers are most nervous to take on faith: **real-time,
peer-to-peer networking**. It is the hardest of the three to fake, which is why
it is worth building for real.

**It makes REX's claim TRUE.** The REX case study already states Sean has WebRTC
experience. Until now that is an assertion. Meld is a live, inspectable,
hand-rolled `RTCPeerConnection` mesh with its own signaling protocol and its own
wire format — open two tabs and the strokes sync with Supabase's Realtime
dashboard showing *zero* stroke traffic, because strokes never touch it. The
demo's ethos line ("Supabase signals, then gets out of the way") is a claim a
reviewer can verify in DevTools: watch the WebRTC internals, watch the data
channel bytes climb while the WebSocket sits idle. That is the signal — not "I
used a realtime SaaS", but "I understand the protocol beneath it."

Hireable sub-skills on display: SDP offer/answer choreography, ICE, the glare
problem and perfect negotiation, mesh topology & its scaling limits, a compact
binary-ish wire protocol with coordinate normalization, per-frame batching on a
shared rAF, late-joiner state sync, presence, and graceful reconnect — plus the
honesty to name the TURN caveat (§10) instead of pretending NAT traversal is free.

---

## 3 · File tree

```
portfolio/
├── package.json                         # + "@supabase/supabase-js"
├── src/
│   ├── index.css                        # + @theme meld-* tokens (§4)
│   ├── App.tsx                          # + one lazy import + one DEMO_PAGES entry (§5)
│   ├── components/
│   │   └── Range.tsx                    # + COMMISSION '05' + MeldThumb in THUMBS (§5)
│   └── pages/
│       └── Meld/
│           ├── index.tsx                # page shell + room bootstrap (§7.1)
│           ├── theme.css                # scoped dark chrome (§4)
│           ├── supabaseClient.ts        # createClient (public anon key) (§6.0)
│           ├── protocol.ts              # DataChannel message types + encode/decode + normalize (§6.3)
│           ├── palette.ts              # peer colors, name generator, assignment (§7.6)
│           ├── signaling.ts             # Supabase Realtime signaling client (§6.1)
│           ├── peers.ts                 # perfect-negotiation mesh manager (§6.2)
│           ├── strokes.ts               # Stroke model + smoothing + canvas render (§7.2)
│           ├── useMeld.ts               # the orchestrator hook: wires all of the above (§6.4)
│           ├── Board.tsx                # canvas layers + pointer drawing + cursor overlay (§7.3)
│           ├── Cursors.tsx             # remote cursor DOM layer, interpolated via addTask (§7.4)
│           ├── Presence.tsx             # presence list + aria-live (§7.5)
│           └── Toolbar.tsx              # color / width / eraser / clear / share (§7.7)
└── scripts/
    └── smoke-meld.mjs                   # two-page sync smoke (§15)
```

Reused, unchanged: `src/lib/ticker.ts` (`addTask`, `easeOutCubic`), `src/lib/router.ts`
(`navigate`), `src/components/Reveal.tsx`. Meld starts **no** rAF loop of its own —
every per-frame job (cursor glide, live redraw, outgoing flush) rides `addTask`.

---

## 4 · Theme tokens (hex + WCAG)

Distinct "night studio" chrome: a cool near-black indigo-slate with a **bright
teal** UI accent — deliberately *not* AeroScale's blue-slate and *not* Meridian's
warm brass. Inside it floats a **warm near-white paper** drawing surface, so the
board reads like real paper under studio lights.

### 4.1 `@theme` additions — append inside the existing `@theme { … }` block in `src/index.css`

```css
  /* ---- Meld demo — collaborative whiteboard, scoped "night studio" chrome.
     Dark chrome + a LIGHT drawing surface. Text roles WCAG-checked vs bg AND
     card (all ≥ 4.5:1); per-peer stroke/cursor colors checked vs the light
     surface (all ≥ 4.5:1) and as white-text label pills (all ≥ 5:1).
     See docs/roster/4-collab-canvas.md §4. Do not retune by eye. ---- */
  --color-meld-bg: #0d1013;        /* app background (cool near-black)          */
  --color-meld-card: #161b21;      /* toolbar / panel surface                   */
  --color-meld-card-2: #1f262e;    /* raised chips, hover                        */
  --color-meld-line: rgb(255 255 255 / 0.08);
  --color-meld-ink: #f1f4f7;       /* primary text                              */
  --color-meld-ink-2: #b7c0cc;     /* secondary text                            */
  --color-meld-muted: #8b95a3;     /* labels, hints                             */
  --color-meld-accent: #37cdbb;    /* UI accent — bright teal (links, active)   */
  --color-meld-accent-2: #2aa596;  /* accent hover / pressed                    */
  --color-meld-surface: #f7f5ef;   /* THE DRAWING SURFACE — warm paper          */
  --color-meld-surface-2: #efe9db; /* surface grid dots                         */
  --color-meld-surface-ink: #211b12; /* text ON the light surface (empty hint)  */
```

### 4.2 Chrome text-role contrast (WCAG AA needs ≥ 4.5:1 for body text, ≥ 3:1 for large/UI)

| Token | Hex | vs `bg` #0d1013 | vs `card` #161b21 | vs `card-2` #1f262e |
| --- | --- | --- | --- | --- |
| `ink` | `#f1f4f7` | **17.28** | **15.68** | **13.84** |
| `ink-2` | `#b7c0cc` | **10.38** | **9.42** | **8.31** |
| `muted` | `#8b95a3` | **6.29** | **5.71** | **5.04** |
| `accent` | `#37cdbb` | **9.64** | **8.75** | **7.72** |
| `accent-2` | `#2aa596` | **6.29** | **5.71** | **5.03** |

Every text role clears 4.5:1 against **both** bg and card (and card-2). The
accent clears 4.5:1 too, so accent-colored text/icons are legal anywhere.

### 4.3 The light surface

`surface #f7f5ef` vs `bg #0d1013` = **17.50:1** — the paper reads as an obviously
distinct, brightly-lit plane inside the dark room. `surface-ink #211b12` on the
surface = 15.9:1 (the empty-board hint text). Grid dots `surface-2 #efe9db` are
decorative (contrast intentionally low, ~1.06:1, so they whisper).

### 4.4 Per-peer colors (the drawing palette) — vs the LIGHT surface #f7f5ef

Six hues, maximally separable, each a legal stroke color **and** a legal
white-text label-pill background. Strokes are graphical objects (WCAG 1.4.11 floor
3:1); we exceed 4.5:1 anyway so thin strokes stay legible. Assignment order below
is the palette index order.

| idx | Name | Hex | vs surface #f7f5ef | white text on it |
| --- | --- | --- | --- | --- |
| 0 | Coral | `#c33a24` | **4.88** | **5.31** |
| 1 | Amber | `#8a5b16` | **5.37** | **5.85** |
| 2 | Teal | `#0c7d74` | **4.58** | **5.00** |
| 3 | Indigo | `#3b52c4` | **6.04** | **6.58** |
| 4 | Magenta | `#a52f90` | **5.65** | **6.16** |
| 5 | Green | `#2f7d32` | **4.70** | **5.12** |

The chrome accent (bright teal `#37cdbb`, only ever on the *dark* chrome) and the
peer "Teal" (deep `#0c7d74`, only ever on the *light* surface) share a hue family
but live on opposite backgrounds and differ ~2× in luminance — never confusable.

### 4.5 `src/pages/Meld/theme.css` (paste verbatim)

```css
/* Meld — demo-scoped "night studio" chrome. Color tokens live in index.css
   @theme (meld-*); this sheet carries what utilities can't: color-scheme,
   selection, focus, the body swap, and the small-caps label. Cooler and
   darker than AeroScale, cooler than Meridian — the three read as three rooms. */
.meld-root {
  color-scheme: dark;
  font-family: var(--font-sans);
}
.meld-root ::selection {
  background: var(--color-meld-accent);
  color: var(--color-meld-bg);
}
.meld-root :focus-visible {
  outline-color: var(--color-meld-accent);
}

/* The demo owns the whole viewport — the body swap covers overscroll so
   rubber-banding never flashes the portfolio's paper. Toggled on mount. */
body.meld-page {
  background-color: var(--color-meld-bg);
}

/* Small-caps label — the cool twin of AeroScale's .aero-label / .meridian-label. */
.meld-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-meld-muted);
}

/* The drawing surface never shows a text caret and never lets touch-scroll
   steal a stroke — pointer drawing needs the whole gesture. */
.meld-surface {
  background-color: var(--color-meld-surface);
  touch-action: none;
  cursor: crosshair;
}

/* Remote cursor pointer + label. Position is written imperatively (translate3d)
   by the addTask loop, so these rules are pure paint. */
.meld-cursor {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  will-change: transform;
  z-index: 3;
}
.meld-cursor__name {
  transform: translate(10px, 6px);
  padding: 1px 6px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

/* Toast (join/leave) — enters up, leaves faster. Reduced-motion out below. */
@keyframes meld-toast-in { from { opacity: 0; transform: translateY(8px); } }
.meld-toast { animation: meld-toast-in var(--t-enter) var(--ease-out) both; }

/* A soft pulse on the "waiting for someone" dot while solo. */
@keyframes meld-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
.meld-wait-dot { animation: meld-pulse 1.6s var(--ease-out) infinite; }

@media (prefers-reduced-motion: reduce) {
  .meld-toast { animation: none; }
  .meld-wait-dot { animation: none; opacity: 0.7; }
}
```

---

## 5 · Router + App + Range integration

### 5.1 Router — no change needed

`router.ts` already parses `#/demos/<slug>(?...)` and keeps the query. The demo
owns the `?room=` param via `history.replaceState` (§7.1), exactly like Meridian
owns `?case=`. `navigate('#range')` returns to the portfolio.

### 5.2 `App.tsx` — two edits

Add the lazy import beside the others:

```tsx
const Meld = lazy(() => import('./pages/Meld'))
```

Add one entry to `DEMO_PAGES`:

```tsx
  meld: { Page: Meld, label: 'Meld collaborative whiteboard demo', shell: 'bg-meld-bg', spinner: 'text-meld-muted' },
```

### 5.3 `Range.tsx` — add Commission '05' and its thumb

Append to the `COMMISSIONS` array:

```tsx
  {
    n: '05',
    skill: 'Real-time & WebRTC',
    title: 'Meld — real-time collaborative whiteboard',
    caption:
      'Open the link in two tabs and draw together. Cursors and ink sync peer-to-peer over a hand-rolled WebRTC data-channel mesh — Supabase Realtime carries only the offer/answer handshake, then gets out of the way. Perfect-negotiation glare handling, up to six peers, per-frame batched strokes on a shared rAF, late-joiner snapshots. No WebRTC library, no relay.',
    href: '#/demos/meld',
  },
```

Register the thumb (extend the map — keep the existing entries):

```tsx
const THUMBS: Record<string, () => ReactNode> = { '01': AeroThumb, '02': MeridianThumb, '05': MeldThumb }
```

Add the component (paste beside `AeroThumb` / `MeridianThumb`). Dark card, light
paper surface, two peer strokes, two labeled cursors:

```tsx
/** A miniature of the board — the light paper glowing inside the dark studio,
    two hands mid-stroke. */
function MeldThumb() {
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0d1013" />
      {/* the light drawing surface */}
      <rect x="16" y="14" width="248" height="132" rx="7" fill="#f7f5ef" />
      {/* coral stroke */}
      <path d="M 44 104 C 68 60, 96 60, 108 92 S 150 128, 168 92"
        fill="none" stroke="#c33a24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {/* indigo stroke */}
      <path d="M 150 44 C 176 40, 196 66, 218 52"
        fill="none" stroke="#3b52c4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {/* teal cursor + label */}
      <g>
        <path d="M 172 92 l 0 16 l 4 -4 l 4 8 l 3 -1.5 l -4 -8 l 6 0 Z" fill="#0c7d74" stroke="#f7f5ef" strokeWidth="1" />
        <rect x="184" y="96" width="34" height="12" rx="3" fill="#0c7d74" />
        <text x="188" y="105" fontFamily="ui-monospace, monospace" fontSize="8" fill="#fff">calm fox</text>
      </g>
      {/* coral cursor + label */}
      <g>
        <path d="M 222 52 l 0 16 l 4 -4 l 4 8 l 3 -1.5 l -4 -8 l 6 0 Z" fill="#c33a24" stroke="#f7f5ef" strokeWidth="1" />
        <rect x="234" y="56" width="30" height="12" rx="3" fill="#c33a24" />
        <text x="238" y="65" fontFamily="ui-monospace, monospace" fontSize="8" fill="#fff">wry elk</text>
      </g>
    </svg>
  )
}
```

`COMMISSIONS.length` in the header count updates automatically.

---

## 6 · The networking layer (complete code)

Read this whole section before writing any of it — the four files interlock.

### 6.0 `src/pages/Meld/supabaseClient.ts`

The anon key is a **public** publishable key — it is safe in client bundles by
design (it only permits what Row-Level Security allows, and we enable no tables).
**There are no secrets in this demo.** Replace the two placeholder strings with
the real project URL + anon key produced during backend setup (§14).

```ts
import { createClient } from '@supabase/supabase-js'

// PUBLIC anon (publishable) key. Safe to commit — see §14. Not a secret.
const SUPABASE_URL = 'https://REPLACE_ME.supabase.co'
const SUPABASE_ANON_KEY = 'REPLACE_ME_ANON_KEY'

/** One client for the whole demo. We use ONLY Realtime (broadcast + presence)
    for signaling — no auth, no database, no storage. eventsPerSecond caps the
    signaling burst; SDP/ICE is low-volume so 10 is ample (strokes never come
    through here). */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
})
```

### 6.1 `src/pages/Meld/signaling.ts` — the Supabase Realtime signaling client

One channel per room, named `meld:<roomId>`. **Supabase Presence** gives us the
authoritative member list (who is in the room). **Broadcast** carries the
targeted SDP/ICE. Nothing else rides this channel.

```ts
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

/** The only two things signaling carries once you strip presence away. */
export type SignalMsg =
  | { kind: 'desc'; desc: RTCSessionDescriptionInit }
  | { kind: 'ice'; ice: RTCIceCandidateInit }

type SignalHandler = (from: string, msg: SignalMsg) => void
type MembersHandler = (ids: string[]) => void

/**
 * Signaling = Supabase Realtime, used ONLY for the handshake.
 *  - presence.track({id}) announces "I'm here"; presenceState() lists everyone.
 *  - broadcast 'signal' delivers a targeted {from,to,msg} SDP/ICE payload.
 * The moment a DataChannel opens (peers.ts), this object is idle for that peer.
 */
export class Signaling {
  private ch: RealtimeChannel
  private onSignalCb: SignalHandler = () => {}
  private onMembersCb: MembersHandler = () => {}

  constructor(
    public readonly room: string,
    public readonly selfId: string,
  ) {
    this.ch = supabase.channel(`meld:${room}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: selfId } },
    })
  }

  onSignal(cb: SignalHandler) { this.onSignalCb = cb }
  onMembers(cb: MembersHandler) { this.onMembersCb = cb }

  /** Targeted SDP/ICE to one peer. Others ignore it (to !== their id). */
  send(to: string, msg: SignalMsg) {
    void this.ch.send({ type: 'broadcast', event: 'signal', payload: { from: this.selfId, to, msg } })
  }

  /** Subscribe, wire handlers, then announce presence. Resolves once tracked. */
  async join(): Promise<void> {
    this.ch.on('broadcast', { event: 'signal' }, ({ payload }) => {
      const p = payload as { from: string; to: string; msg: SignalMsg }
      if (p.to !== this.selfId) return
      this.onSignalCb(p.from, p.msg)
    })
    this.ch.on('presence', { event: 'sync' }, () => {
      // presence keys ARE our peer ids (config.presence.key = selfId).
      this.onMembersCb(Object.keys(this.ch.presenceState()))
    })
    await new Promise<void>((resolve, reject) => {
      this.ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void this.ch.track({ id: this.selfId, at: Date.now() }).then(() => resolve())
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`signaling ${status}`))
        }
      })
    })
  }

  leave() {
    void supabase.removeChannel(this.ch)
  }
}
```

### 6.2 `src/pages/Meld/peers.ts` — the perfect-negotiation mesh manager

This is the heart. Two rules together make it glare-free:

- **Deterministic initiator.** For any pair `(A,B)`, the peer whose id is
  lexicographically **greater** is the sole *offerer* and it is the one that
  creates the `RTCDataChannel`. The lesser id waits and answers. Because only one
  side ever calls `createDataChannel`/offers, the ordinary case has **no glare
  at all**.
- **Perfect-negotiation guard** (belt & suspenders for ICE restarts /
  renegotiation): each side keeps `polite` (= "I am the lesser id"). If an offer
  arrives while we are mid-offer or not `stable`, the **impolite** side ignores it
  and the **polite** side rolls back — the textbook pattern — so the two can never
  livelock even on a re-offer.

```ts
import type { Signaling, SignalMsg } from './signaling'

export type PeerEvents = {
  onOpen: (id: string) => void            // data channel usable
  onClose: (id: string) => void           // peer gone (dropped/left)
  onMessage: (id: string, data: string) => void
}

/** STUN only. No TURN in this demo — the honest caveat is documented in §10. */
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
}

type PeerState = {
  pc: RTCPeerConnection
  dc: RTCDataChannel | null
  makingOffer: boolean
  polite: boolean          // true = lesser id = rolls back on collision
}

export class PeerMesh {
  private peers = new Map<string, PeerState>()

  constructor(
    private readonly selfId: string,
    private readonly sig: Signaling,
    private readonly ev: PeerEvents,
  ) {
    this.sig.onSignal((from, msg) => void this.onSignal(from, msg))
  }

  /** Ids of peers whose data channel is currently open. */
  openPeers(): string[] {
    return [...this.peers.entries()].filter(([, s]) => s.dc?.readyState === 'open').map(([id]) => id)
  }

  /** Send a wire string to one open peer. */
  sendTo(id: string, data: string) {
    const s = this.peers.get(id)
    if (s?.dc?.readyState === 'open') s.dc.send(data)
  }

  /** Broadcast a wire string to every open peer. */
  broadcast(data: string) {
    for (const s of this.peers.values()) if (s.dc?.readyState === 'open') s.dc.send(data)
  }

  /** Begin (or ignore, if already known) a connection to a member. Only the
      GREATER id actually initiates; the lesser id creates its half lazily when
      the first signal arrives (see onSignal). */
  connect(remoteId: string) {
    if (remoteId === this.selfId || this.peers.has(remoteId)) return
    const initiator = this.selfId > remoteId
    const st = this.create(remoteId)
    if (initiator) {
      // Creating the channel triggers onnegotiationneeded → the single offer.
      const dc = st.pc.createDataChannel('meld', { ordered: true })
      this.bindChannel(remoteId, dc)
    }
  }

  /** Tear down one peer (called on drop/leave). */
  drop(remoteId: string) {
    const s = this.peers.get(remoteId)
    if (!s) return
    try { s.dc?.close() } catch { /* noop */ }
    try { s.pc.close() } catch { /* noop */ }
    this.peers.delete(remoteId)
    this.ev.onClose(remoteId)
  }

  /** Tear the whole mesh down (page unmount / room change). */
  destroy() {
    for (const id of [...this.peers.keys()]) this.drop(id)
  }

  private create(remoteId: string): PeerState {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    const st: PeerState = { pc, dc: null, makingOffer: false, polite: this.selfId < remoteId }
    this.peers.set(remoteId, st)

    pc.onnegotiationneeded = async () => {
      try {
        st.makingOffer = true
        await pc.setLocalDescription()                       // implicit offer
        this.sig.send(remoteId, { kind: 'desc', desc: pc.localDescription!.toJSON() })
      } catch (err) {
        console.error('[meld] negotiation', err)
      } finally {
        st.makingOffer = false
      }
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.sig.send(remoteId, { kind: 'ice', ice: candidate.toJSON() })
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') pc.restartIce()   // network flip → re-signal
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') this.drop(remoteId)
    }

    // The polite side receives the channel the initiator created.
    pc.ondatachannel = ({ channel }) => this.bindChannel(remoteId, channel)

    return st
  }

  private bindChannel(remoteId: string, dc: RTCDataChannel) {
    const st = this.peers.get(remoteId)
    if (!st) return
    st.dc = dc
    dc.binaryType = 'arraybuffer'
    dc.onopen = () => this.ev.onOpen(remoteId)
    dc.onclose = () => this.ev.onClose(remoteId)
    dc.onmessage = (e) => this.ev.onMessage(remoteId, e.data as string)
  }

  /** The perfect-negotiation receive path. */
  private async onSignal(from: string, msg: SignalMsg) {
    // First contact from a GREATER-id initiator: create our (polite) half now.
    let st = this.peers.get(from)
    if (!st) {
      this.create(from)
      st = this.peers.get(from)!
    }
    const { pc } = st

    try {
      if (msg.kind === 'desc') {
        const desc = msg.desc
        const collision = desc.type === 'offer' && (st.makingOffer || pc.signalingState !== 'stable')
        if (!st.polite && collision) return                    // impolite ignores the glare
        if (st.polite && collision) {
          // roll back our own offer, then accept theirs
          await Promise.all([
            pc.setLocalDescription({ type: 'rollback' } as RTCLocalSessionDescriptionInit).catch(() => {}),
            pc.setRemoteDescription(desc),
          ])
        } else {
          await pc.setRemoteDescription(desc)
        }
        if (desc.type === 'offer') {
          await pc.setLocalDescription()                       // implicit answer
          this.sig.send(from, { kind: 'desc', desc: pc.localDescription!.toJSON() })
        }
      } else {
        try { await pc.addIceCandidate(msg.ice) } catch { /* candidate arrived pre-remote-desc; harmless */ }
      }
    } catch (err) {
      console.error('[meld] onSignal', err)
    }
  }
}
```

### 6.3 `src/pages/Meld/protocol.ts` — the DataChannel wire protocol

All app data (never signaling) travels as these messages, JSON-encoded strings.
**Coordinates are normalized 0..1** (x = px/cssWidth, y = px/cssHeight) so peers
with different window sizes agree; the receiver multiplies back by its own canvas
size. (Consequence: a drawing stretches to each viewport's aspect ratio — this is
the intended, simplest choice; noted in §10.) Stroke points are **batched per
frame** into a flat `[x,y,x,y,…]` array to keep message count low.

```ts
/** A committed/known stroke, shared verbatim in snapshots. */
export type WireStroke = {
  id: string          // globally unique: `${peerId}:${counter}`
  color: string       // hex from the peer palette (or surface color if erasing)
  width: number       // CSS px at width-1.0 reference; scales with canvas (see strokes.ts)
  erase: boolean      // true = eraser (destination-out)
  pts: number[]       // flat normalized [x0,y0,x1,y1,...]
}

/** The full DataChannel message set. `t` is the discriminant. */
export type Msg =
  | { t: 'cursor'; x: number; y: number }                                   // throttled ~40Hz
  | { t: 'stroke-start'; id: string; color: string; width: number; erase: boolean; x: number; y: number }
  | { t: 'stroke-point'; id: string; pts: number[] }                        // flat, batched per rAF
  | { t: 'stroke-end'; id: string }
  | { t: 'clear' }
  | { t: 'presence'; name: string; color: string }                          // sent on connect + on color reassignment
  | { t: 'snapshot'; strokes: WireStroke[] }                                // late-joiner board state

export const encode = (m: Msg): string => JSON.stringify(m)

/** Defensive decode — a malformed frame returns null and is dropped, never throws. */
export function decode(raw: string): Msg | null {
  try {
    const m = JSON.parse(raw) as Msg
    if (!m || typeof (m as { t?: unknown }).t !== 'string') return null
    return m
  } catch {
    return null
  }
}

/** Clamp helper for normalized coords (guards against out-of-canvas drags). */
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
```

### 6.4 `src/pages/Meld/useMeld.ts` — the orchestrator hook

Wires signaling + mesh + protocol + stroke store together and exposes one imperative
`net` API plus reactive UI state. **This is the only place the four network files
meet.** Board/Toolbar/Presence talk to `net`, never to peers/signaling directly.

Key responsibilities:
- generate `selfId` (`crypto.randomUUID()`), pick name+color (§7.6),
- admission/cap (sort member ids; my rank ≥ 6 ⇒ `roomFull`),
- on presence sync, `connect()` to every admitted member,
- on data-channel open: send my `presence`; **if I am the smallest-id established
  peer, send a `snapshot` to the newcomer** (single snapshot, no dup storm),
- route inbound messages into the stroke store / cursor buffer / presence map,
- own the shared-store refs that Board reads each frame.

```ts
import { useEffect, useRef, useState } from 'react'
import { Signaling } from './signaling'
import { PeerMesh } from './peers'
import { decode, encode, type Msg, type WireStroke } from './protocol'
import { StrokeStore } from './strokes'
import { PALETTE, pickColor, seededName } from './palette'

export type PeerInfo = { id: string; name: string; color: string }
export type RemoteCursor = { id: string; name: string; color: string; tx: number; ty: number; cx: number; cy: number }
export type Status = 'connecting' | 'solo' | 'connected' | 'room-full' | 'error'

/** Live network handle Board/Toolbar/Presence call into. Coords are normalized 0..1. */
export type MeldNet = {
  selfId: string
  self: PeerInfo
  store: StrokeStore                                   // shared stroke store (Board renders it)
  cursors: Map<string, RemoteCursor>                   // shared, mutated in place; Board reads each frame
  sendCursor: (x: number, y: number) => void
  startStroke: (color: string, width: number, erase: boolean, x: number, y: number) => string
  addPoints: (id: string, pts: number[]) => void       // flat normalized, already batched by Board
  endStroke: (id: string) => void
  clear: () => void
}

const CAP = 6

export function useMeld(room: string) {
  const [status, setStatus] = useState<Status>('connecting')
  const [peers, setPeers] = useState<PeerInfo[]>([])         // remote peers, drives Presence + N-count
  const netRef = useRef<MeldNet | null>(null)
  const liveRef = useRef({ setStatus, setPeers })
  liveRef.current = { setStatus, setPeers }

  useEffect(() => {
    const selfId = crypto.randomUUID()
    const self: PeerInfo = { id: selfId, name: seededName(selfId), color: pickColor(selfId, []) }
    const store = new StrokeStore()
    const cursors = new Map<string, RemoteCursor>()
    const info = new Map<string, PeerInfo>()              // remote id -> name/color
    let strokeSeq = 0
    let admitted = true

    const sig = new Signaling(room, selfId)
    const mesh = new PeerMesh(selfId, sig, {
      onOpen: (id) => {
        // Introduce myself.
        mesh.sendTo(id, encode({ t: 'presence', name: self.name, color: self.color }))
        // Single-snapshot rule: only the smallest-id established peer feeds the newcomer.
        const established = mesh.openPeers().filter((p) => p !== id)
        const smallest = [selfId, ...established].sort()[0]
        if (smallest === selfId) {
          mesh.sendTo(id, encode({ t: 'snapshot', strokes: store.toWire() }))
        }
        refreshPeers()
      },
      onClose: (id) => {
        info.delete(id)
        cursors.delete(id)
        store.endLive(id)                                 // finalize any dangling remote stroke
        refreshPeers()
      },
      onMessage: (id, raw) => handleMsg(id, raw),
    })

    function refreshPeers() {
      const list = mesh.openPeers().map((id) => info.get(id) ?? { id, name: '…', color: PALETTE[0] })
      liveRef.current.setPeers(list)
      liveRef.current.setStatus(admitted ? (list.length ? 'connected' : 'solo') : 'room-full')
    }

    function handleMsg(id: string, raw: string) {
      const m = decode(raw)
      if (!m) return
      switch (m.t) {
        case 'presence': {
          info.set(id, { id, name: m.name, color: m.color })
          const c = cursors.get(id)
          if (c) { c.name = m.name; c.color = m.color }
          refreshPeers()
          break
        }
        case 'cursor': {
          let c = cursors.get(id)
          const meta = info.get(id)
          if (!c) {
            c = { id, name: meta?.name ?? '…', color: meta?.color ?? PALETTE[0], tx: m.x, ty: m.y, cx: m.x, cy: m.y }
            cursors.set(id, c)
          }
          c.tx = m.x; c.ty = m.y                          // target; Board glides cx,cy toward it
          break
        }
        case 'stroke-start':
          store.start(m.id, id, m.color, m.width, m.erase, m.x, m.y)
          break
        case 'stroke-point':
          store.addPoints(m.id, m.pts)
          break
        case 'stroke-end':
          store.end(m.id)
          break
        case 'snapshot':
          store.loadWire(m.strokes)
          break
        case 'clear':
          store.clear()
          break
      }
    }

    // ---- imperative API used by the UI ----
    const net: MeldNet = {
      selfId,
      self,
      store,
      cursors,
      sendCursor: (x, y) => mesh.broadcast(encode({ t: 'cursor', x, y })),
      startStroke: (color, width, erase, x, y) => {
        const sid = `${selfId}:${strokeSeq++}`
        store.start(sid, selfId, color, width, erase, x, y)
        mesh.broadcast(encode({ t: 'stroke-start', id: sid, color, width, erase, x, y }))
        return sid
      },
      addPoints: (sid, pts) => {
        store.addPoints(sid, pts)
        mesh.broadcast(encode({ t: 'stroke-point', id: sid, pts }))
      },
      endStroke: (sid) => {
        store.end(sid)
        mesh.broadcast(encode({ t: 'stroke-end', id: sid }))
      },
      clear: () => {
        store.clear()
        mesh.broadcast(encode({ t: 'clear' }))
      },
    }
    netRef.current = net

    // ---- membership → connect / cap ----
    sig.onMembers((ids) => {
      const sorted = [...ids].sort()
      admitted = sorted.indexOf(selfId) < CAP           // deterministic admission
      if (!admitted) { refreshPeers(); return }
      for (const id of sorted) {
        if (id === selfId) continue
        if (sorted.indexOf(id) < CAP) mesh.connect(id)   // only mesh the first CAP ids
      }
      refreshPeers()
    })

    let cancelled = false
    sig.join()
      .then(() => { if (!cancelled) liveRef.current.setStatus((s) => (s === 'connecting' ? 'solo' : s)) })
      .catch(() => { if (!cancelled) liveRef.current.setStatus('error') })

    return () => {
      cancelled = true
      mesh.destroy()
      sig.leave()
      netRef.current = null
    }
  }, [room])

  return { status, peers, netRef }
}
```

Throttle/batch note: `sendCursor` is called by Board **at most once per frame**
(Board holds the latest pointer pos and flushes it in its `addTask` tick — ~40–60Hz).
`addPoints` is likewise called **once per frame** with the frame's accumulated
points (Board buffers raw pointermove points and flushes the batch each tick). So
the mesh never sees more than ~60 cursor + ~60 stroke messages/sec/peer while
drawing, and 0 while idle.

---

## 7 · Components & modules (dependency order, paste-ready)

### 7.1 `src/pages/Meld/index.tsx` — page shell + room bootstrap

Mirrors Meridian's shell (sticky header, body-class swap, `hero-in` cascade,
footer). Bootstraps the room id into the hash (`?room=`), then mounts the board.

```tsx
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { navigate } from '../../lib/router'
import { useMeld } from './useMeld'
import { Board } from './Board'
import { Toolbar } from './Toolbar'
import { Presence } from './Presence'
import './theme.css'

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** Read (or mint) the room id from the hash query and keep the URL shareable. */
function useRoomId(): string {
  const [room] = useState(() => {
    const q = window.location.hash.split('?')[1] ?? ''
    const found = new URLSearchParams(q).get('room')
    const id = found && /^[a-z0-9]{6,12}$/.test(found) ? found : mintRoom()
    history.replaceState(null, '', `#/demos/meld?room=${id}`)
    return id
  })
  return room
}

function mintRoom(): string {
  // 8 lowercase-alnum chars, crypto-random. Human-shareable, collision-safe enough.
  const a = new Uint8Array(8)
  crypto.getRandomValues(a)
  return [...a].map((b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('')
}

/** Wordmark — two overlapping strokes melding into one nib. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M 4 14 C 7 6, 10 6, 12 12" fill="none" stroke="var(--color-meld-accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 8 14 C 11 8, 14 8, 16 13" fill="none" stroke="var(--color-meld-accent)" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

export default function Meld() {
  const room = useRoomId()
  const { status, peers, netRef } = useMeld(room)

  useEffect(() => {
    document.body.classList.add('meld-page')
    const prev = document.title
    document.title = 'Meld — a shared whiteboard over WebRTC'
    return () => {
      document.body.classList.remove('meld-page')
      document.title = prev
    }
  }, [])

  const shareUrl = useMemo(() => `${location.origin}${location.pathname}#/demos/meld?room=${room}`, [room])

  return (
    <div className="meld-root flex min-h-svh flex-col bg-meld-bg text-meld-ink">
      <header className="sticky top-0 z-20 border-b border-meld-line bg-meld-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#range')}
            className="hero-in font-mono text-xs tracking-wide text-meld-muted transition-colors hover:text-meld-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-meld-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Meld</span>
            <span className="rounded-full border border-meld-accent/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-meld-accent">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-meld-muted md:block" style={d(80)}>
            Peer-to-peer over WebRTC · Supabase signals, then gets out of the way
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_18rem]">
        <div className="hero-in order-2 lg:order-1" style={d(120)}>
          <Board netRef={netRef} status={status} shareUrl={shareUrl} />
        </div>
        <aside className="hero-in order-1 flex flex-col gap-4 lg:order-2" style={d(180)}>
          <Toolbar netRef={netRef} shareUrl={shareUrl} />
          <Presence self={netRef.current?.self} peers={peers} status={status} />
        </aside>
      </div>

      <footer className="border-t border-meld-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="font-mono text-xs text-meld-muted">
            Hand-rolled RTCPeerConnection mesh — no SDK, no relay. Built for Sean Joudrie's portfolio.
          </p>
          <button
            onClick={() => navigate('#range')}
            className="font-mono text-xs text-meld-muted transition-colors hover:text-meld-ink"
          >
            Back to the portfolio →
          </button>
        </div>
      </footer>
    </div>
  )
}
```

> **Toolbar/Board coupling:** the pen color, width, and tool live in `Board`
> (drawing owns them) but the controls live in `Toolbar`. To keep it simple for
> the builder, **lift tool state into `index.tsx`** and pass it to both. Concretely,
> add these three lines inside `Meld()` and thread the props (shown in 7.3/7.7):
>
> ```tsx
> const [color, setColor] = useState('#c33a24')   // default = Coral
> const [width, setWidth] = useState(3)
> const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
> ```
> Then `<Toolbar … color={color} setColor={setColor} width={width} setWidth={setWidth} tool={tool} setTool={setTool} />`
> and `<Board … color={color} width={width} tool={tool} />`. (Props are typed in
> each component below.)

### 7.2 `src/pages/Meld/strokes.ts` — model, smoothing, render

Owns the stroke store and all canvas painting. Two-layer strategy for
performance: finished strokes are **baked once** into a `commit` bitmap; only
**live** (in-progress) strokes repaint each frame. Resize/snapshot replays the
history array in order (so eraser composites correctly).

```ts
import type { WireStroke } from './protocol'
import { clamp01 } from './protocol'

export type Stroke = {
  id: string
  peerId: string
  color: string
  width: number       // reference px at unit canvas; render scales it (see render)
  erase: boolean
  pts: number[]       // flat normalized [x,y,...]
  done: boolean
}

const REF = 900          // reference canvas dimension for width scaling

/**
 * Holds all strokes. `history` is the ordered list for replay (resize/late-join);
 * `live` maps id -> stroke for in-progress ones. Painting is done by Board, which
 * calls bake()/paintLive() with a 2D context and pixel size.
 */
export class StrokeStore {
  history: Stroke[] = []
  live = new Map<string, Stroke>()
  private byId = new Map<string, Stroke>()
  dirtyCommit = true       // true ⇒ Board should re-bake the commit layer

  start(id: string, peerId: string, color: string, width: number, erase: boolean, x: number, y: number) {
    if (this.byId.has(id)) return
    const s: Stroke = { id, peerId, color, width, erase, pts: [clamp01(x), clamp01(y)], done: false }
    this.history.push(s)
    this.byId.set(id, s)
    this.live.set(id, s)
  }

  addPoints(id: string, pts: number[]) {
    const s = this.byId.get(id)
    if (!s || s.done) return
    for (let i = 0; i + 1 < pts.length; i += 2) { s.pts.push(clamp01(pts[i]), clamp01(pts[i + 1])) }
  }

  end(id: string) {
    const s = this.byId.get(id)
    if (!s) return
    s.done = true
    this.live.delete(id)
    this.dirtyCommit = true      // bake it into the commit layer next frame
  }

  /** Finalize any dangling live stroke from a peer that dropped mid-draw. */
  endLive(peerId: string) {
    for (const s of [...this.live.values()]) if (s.peerId === peerId) this.end(s.id)
  }

  clear() {
    this.history = []
    this.live.clear()
    this.byId.clear()
    this.dirtyCommit = true
  }

  toWire(): WireStroke[] {
    return this.history.filter((s) => s.done).map((s) => ({ id: s.id, color: s.color, width: s.width, erase: s.erase, pts: s.pts }))
  }

  loadWire(strokes: WireStroke[]) {
    for (const w of strokes) {
      if (this.byId.has(w.id)) continue
      const s: Stroke = { ...w, peerId: w.id.split(':')[0], pts: [...w.pts], done: true }
      this.history.push(s)
      this.byId.set(w.id, s)
    }
    // keep global order stable-ish by id so eraser replay matches everywhere
    this.history.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    this.dirtyCommit = true
  }
}

/** Quadratic-midpoint smoothing: hand-rolled, no library. Draws one stroke into ctx. */
export function paintStroke(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) {
  const p = s.pts
  if (p.length < 2) return
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = s.color
  ctx.lineWidth = s.width * (Math.min(w, h) / REF)          // width scales with canvas
  ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'
  if (s.erase) ctx.lineWidth *= 3                            // eraser is chunkier
  ctx.beginPath()
  ctx.moveTo(p[0] * w, p[1] * h)
  if (p.length === 2) {                                      // a dot
    ctx.lineTo(p[0] * w + 0.01, p[1] * h + 0.01)
  } else {
    for (let i = 2; i + 3 < p.length; i += 2) {
      const mx = (p[i] + p[i + 2]) / 2
      const my = (p[i + 1] + p[i + 3]) / 2
      ctx.quadraticCurveTo(p[i] * w, p[i + 1] * h, mx * w, my * h)
    }
    const n = p.length
    ctx.lineTo(p[n - 2] * w, p[n - 1] * h)                   // final segment to the last point
  }
  ctx.stroke()
  ctx.restore()
}

/** Repaint the entire commit layer from history (used on bake + resize). */
export function bakeCommit(ctx: CanvasRenderingContext2D, store: StrokeStore, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  for (const s of store.history) if (s.done) paintStroke(ctx, s, w, h)
  store.dirtyCommit = false
}
```

### 7.3 `src/pages/Meld/Board.tsx` — canvas layers, pointer drawing, per-frame loop

Three stacked layers: **commit** canvas (baked finished strokes), **live** canvas
(in-progress strokes, repainted each frame), **cursor overlay** (DOM, §7.4). One
`addTask` tick does everything: flush outgoing cursor, flush batched stroke
points, repaint live layer if needed, glide remote cursors.

```tsx
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { addTask } from '../../lib/ticker'
import type { MeldNet, Status } from './useMeld'
import { bakeCommit, paintStroke } from './strokes'
import { Cursors } from './Cursors'
import { WaitingOverlay } from './Cursors' // co-located tiny overlay; see 7.4

type Props = {
  netRef: MutableRefObject<MeldNet | null>
  status: Status
  shareUrl: string
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

export function Board({ netRef, status, shareUrl, color, width, tool }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const commitRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // mutable drawing state kept out of React (per-frame, no re-render)
  const draw = useRef({
    drawing: false,
    sid: null as string | null,
    pending: [] as number[],          // batched stroke points this frame (normalized)
    cursor: null as { x: number; y: number } | null, // latest local cursor (normalized), flush per frame
    size: { w: 1, h: 1, dpr: 1 },
  })
  const tool$ = useRef({ color, width, tool })
  tool$.current = { color, width, tool }

  // ---- sizing (dpr-crisp) ----
  useEffect(() => {
    const wrap = wrapRef.current!
    const commit = commitRef.current!
    const live = liveRef.current!
    const resize = () => {
      const r = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(r.width))
      const h = Math.max(1, Math.round(r.height))
      for (const c of [commit, live]) {
        c.width = w * dpr
        c.height = h * dpr
        c.style.width = `${w}px`
        c.style.height = `${h}px`
        c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      draw.current.size = { w, h, dpr }
      const net = netRef.current
      if (net) { net.store.dirtyCommit = true }   // re-bake at new size next frame
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [netRef])

  // ---- the single per-frame task ----
  useEffect(() => {
    const commitCtx = commitRef.current!.getContext('2d')!
    const liveCtx = liveRef.current!.getContext('2d')!
    const stop = addTask(() => {
      const net = netRef.current
      if (!net) return false
      const { w, h } = draw.current.size

      // 1) flush batched local stroke points (one message this frame)
      if (draw.current.sid && draw.current.pending.length) {
        net.addPoints(draw.current.sid, draw.current.pending)
        draw.current.pending = []
      }
      // 2) flush local cursor (one message this frame)
      if (draw.current.cursor) {
        net.sendCursor(draw.current.cursor.x, draw.current.cursor.y)
        draw.current.cursor = null
      }
      // 3) re-bake commit layer if a stroke finished / snapshot / resize
      if (net.store.dirtyCommit) bakeCommit(commitCtx, net.store, w, h)
      // 4) repaint live layer: only in-progress strokes
      liveCtx.clearRect(0, 0, w, h)
      for (const s of net.store.live.values()) paintStroke(liveCtx, s, w, h)
      // 5) glide remote cursors toward their targets (exponential smoothing)
      for (const c of net.cursors.values()) {
        c.cx += (c.tx - c.cx) * 0.25
        c.cy += (c.ty - c.cy) * 0.25
      }
      return false // never done; unmount stops it
    })
    return stop
  }, [netRef])

  // ---- pointer drawing ----
  const norm = (e: React.PointerEvent) => {
    const r = wrapRef.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
  }
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const net = netRef.current
    if (!net) return
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const { x, y } = norm(e)
    const t = tool$.current
    const erase = t.tool === 'eraser'
    draw.current.drawing = true
    draw.current.sid = net.startStroke(erase ? '#000' : t.color, t.width, erase, x, y)
  }
  const onMove = (e: React.PointerEvent) => {
    const { x, y } = norm(e)
    draw.current.cursor = { x, y }                     // always report cursor
    if (draw.current.drawing && draw.current.sid) {
      // coalesce native queued events for smoothness
      const evs = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent]
      const r = wrapRef.current!.getBoundingClientRect()
      for (const pe of evs) draw.current.pending.push((pe.clientX - r.left) / r.width, (pe.clientY - r.top) / r.height)
    }
  }
  const onUp = () => {
    const net = netRef.current
    if (draw.current.drawing && draw.current.sid && net) {
      if (draw.current.pending.length) { net.addPoints(draw.current.sid, draw.current.pending); draw.current.pending = [] }
      net.endStroke(draw.current.sid)
    }
    draw.current.drawing = false
    draw.current.sid = null
  }

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="meld-surface relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-meld-line shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] lg:aspect-auto lg:h-[min(72vh,40rem)]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="application"
        aria-label="Shared drawing surface. Draw with a pointer; use the toolbar to change color, width, or clear."
      >
        {/* grid dots — pure CSS, decorative */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage: 'radial-gradient(var(--color-meld-surface-2) 1.2px, transparent 1.2px)',
            backgroundSize: '26px 26px',
          }}
        />
        <canvas ref={commitRef} className="pointer-events-none absolute inset-0" />
        <canvas ref={liveRef} className="pointer-events-none absolute inset-0" />
        <Cursors netRef={netRef} boxRef={wrapRef} overlayRef={overlayRef} />
        <WaitingOverlay status={status} shareUrl={shareUrl} />
      </div>
      <p className="meld-label mt-2 text-center lg:text-left">
        Peer-to-peer over WebRTC · Supabase signals, then gets out of the way
      </p>
    </div>
  )
}
```

### 7.4 `src/pages/Meld/Cursors.tsx` — remote cursor DOM layer (interpolated)

Renders one absolutely-positioned pointer + name pill per remote cursor. Positions
are written imperatively via `translate3d` from the glided `cx/cy` on the **same**
`addTask` schedule (a second tiny task here keeps DOM writes off React). Also
exports `WaitingOverlay` (the solo/room-full/error states rendered over the board).

```tsx
import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { addTask } from '../../lib/ticker'
import type { MeldNet, Status } from './useMeld'

type Props = {
  netRef: MutableRefObject<MeldNet | null>
  boxRef: MutableRefObject<HTMLDivElement | null>
  overlayRef: MutableRefObject<HTMLDivElement | null>
}

export function Cursors({ netRef, boxRef, overlayRef }: Props) {
  // We reconcile the SET of cursors in React (rare), but positions imperatively.
  const [ids, setIds] = useState<string[]>([])
  const nodeRefs = useRef(new Map<string, HTMLDivElement>())

  useEffect(() => {
    const stop = addTask(() => {
      const net = netRef.current
      const box = boxRef.current
      if (!net || !box) return false
      const cur = [...net.cursors.keys()]
      // reconcile membership only when it changes
      if (cur.length !== ids.length || cur.some((id) => !ids.includes(id))) setIds(cur)
      const r = box.getBoundingClientRect()
      for (const c of net.cursors.values()) {
        const el = nodeRefs.current.get(c.id)
        if (el) el.style.transform = `translate3d(${c.cx * r.width}px, ${c.cy * r.height}px, 0)`
      }
      return false
    })
    return stop
  }, [netRef, boxRef, ids])

  return (
    <div ref={overlayRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {ids.map((id) => {
        const c = netRef.current?.cursors.get(id)
        if (!c) return null
        return (
          <div key={id} className="meld-cursor" ref={(n) => { if (n) nodeRefs.current.set(id, n); else nodeRefs.current.delete(id) }}>
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block' }}>
              <path d="M2 1 L2 15 L6 11 L9 17 L11 16 L8 10 L14 10 Z" fill={c.color} stroke="#f7f5ef" strokeWidth="1" />
            </svg>
            <span className="meld-cursor__name" style={{ backgroundColor: c.color }}>{c.name}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Solo / connecting / room-full / error states, rendered over the board. */
export function WaitingOverlay({ status, shareUrl }: { status: Status; shareUrl: string }) {
  const [copied, setCopied] = useState(false)
  if (status === 'connected') return null
  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* noop */ }
  }
  const box = 'pointer-events-auto absolute left-1/2 top-6 -translate-x-1/2 rounded-xl border border-meld-line bg-meld-card/95 px-5 py-3 text-center shadow-lg backdrop-blur'
  if (status === 'connecting') return <div className={box}><p className="meld-label">connecting…</p></div>
  if (status === 'error')
    return <div className={box}><p className="text-sm text-meld-ink">Couldn’t reach the signaling server.</p><p className="meld-label mt-1">retrying on reconnect</p></div>
  if (status === 'room-full')
    return <div className={box}><p className="text-sm text-meld-ink">This room is full (6 peers).</p><p className="meld-label mt-1">open a fresh room to start your own</p></div>
  // solo
  return (
    <div className={box}>
      <p className="flex items-center justify-center gap-2 text-sm text-meld-ink">
        <span className="meld-wait-dot inline-block h-2 w-2 rounded-full bg-meld-accent" />
        Waiting for someone to join…
      </p>
      <p className="meld-label mt-1">open this link in a second tab</p>
      <button onClick={copy} className="springy mt-2 rounded-lg bg-meld-accent px-3 py-1.5 text-sm font-semibold text-meld-bg hover:bg-meld-accent-2">
        {copied ? 'Copied ✓' : 'Copy room link'}
      </button>
    </div>
  )
}
```

> Board imports `WaitingOverlay` from this file (shown in 7.3). Keep both exports here.

### 7.5 `src/pages/Meld/Presence.tsx` — presence list + aria-live

```tsx
import { useEffect, useRef, useState } from 'react'
import type { PeerInfo, Status } from './useMeld'

type Props = { self: PeerInfo | undefined; peers: PeerInfo[]; status: Status }

export function Presence({ self, peers, status }: Props) {
  // Announce joins/leaves politely (see §11). Diff the peer set.
  const prev = useRef<Set<string>>(new Set())
  const [announce, setAnnounce] = useState('')
  useEffect(() => {
    const now = new Set(peers.map((p) => p.id))
    const joined = peers.filter((p) => !prev.current.has(p.id)).map((p) => p.name)
    const left = [...prev.current].filter((id) => !now.has(id))
    prev.current = now
    if (joined.length) setAnnounce(`${joined.join(', ')} joined`)
    else if (left.length) setAnnounce(`a peer left`)
  }, [peers])

  const count = peers.length + (self ? 1 : 0)
  return (
    <section className="rounded-xl border border-meld-line bg-meld-card p-4">
      <div className="flex items-center justify-between">
        <span className="meld-label">In this room</span>
        <span className="font-mono text-xs text-meld-muted">{count} online</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {self && <PeerRow name={`${self.name} (you)`} color={self.color} />}
        {peers.map((p) => <PeerRow key={p.id} name={p.name} color={p.color} />)}
        {status === 'solo' && (
          <li className="pt-1 text-sm text-meld-muted">Just you so far — share the link to draw together.</li>
        )}
      </ul>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </section>
  )
}

function PeerRow({ name, color }: { name: string; color: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-meld-ink-2">
      <span className="h-3 w-3 flex-none rounded-full ring-1 ring-white/20" style={{ backgroundColor: color }} />
      {name}
    </li>
  )
}
```

### 7.6 `src/pages/Meld/palette.ts` — colors, names, assignment

```ts
/** The six accessible peer colors (idx order = assignment order). §4.4. */
export const PALETTE = ['#c33a24', '#8a5b16', '#0c7d74', '#3b52c4', '#a52f90', '#2f7d32'] as const

const ADJ = ['calm', 'wry', 'brisk', 'sly', 'keen', 'bold', 'quiet', 'lucky', 'nimble', 'sunny', 'plucky', 'sharp']
const NOUN = ['fox', 'elk', 'wren', 'lynx', 'hawk', 'otter', 'crane', 'mole', 'newt', 'vole', 'finch', 'stoat']

/** Stable 32-bit hash of a string (FNV-1a). */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}

/** Deterministic "adjective noun" from the peer id. Cosmetic; collisions fine. */
export function seededName(id: string): string {
  const h = hash(id)
  return `${ADJ[h % ADJ.length]} ${NOUN[(h >> 8) % NOUN.length]}`
}

/**
 * Pick a color for `id` avoiding `taken` (the colors already claimed by peers
 * we know about). Start at the hash-derived slot, walk forward to the first free
 * one. If all six are taken (only possible at the 6-cap) fall back to the slot.
 */
export function pickColor(id: string, taken: string[]): string {
  const start = hash(id) % PALETTE.length
  for (let i = 0; i < PALETTE.length; i++) {
    const c = PALETTE[(start + i) % PALETTE.length]
    if (!taken.includes(c)) return c
  }
  return PALETTE[start]
}
```

> **Color-uniqueness note (kept simple):** `pickColor` is called once at bootstrap
> with an empty `taken` (we don't yet know peers). In the rare case two peers hash
> to the same slot, both may pick the same color. That is cosmetically tolerable
> for a 6-person demo and never breaks correctness (ids, not colors, identify
> peers). If Sean wants strict uniqueness later, the presence exchange already
> carries every peer's color — the higher-id peer can detect a clash in
> `useMeld.handleMsg('presence')`, call `pickColor(selfId, takenColors)`, update
> `self.color`, and re-`broadcast` its presence. **This is out of scope for v1;
> do not build it unless asked.**

### 7.7 `src/pages/Meld/Toolbar.tsx` — color / width / eraser / clear / share

```tsx
import { useState } from 'react'
import type { MutableRefObject } from 'react'
import type { MeldNet } from './useMeld'
import { PALETTE } from './palette'

type Props = {
  netRef: MutableRefObject<MeldNet | null>
  shareUrl: string
  color: string
  setColor: (c: string) => void
  width: number
  setWidth: (w: number) => void
  tool: 'pen' | 'eraser'
  setTool: (t: 'pen' | 'eraser') => void
}

const WIDTHS = [2, 4, 8, 14]

export function Toolbar({ netRef, shareUrl, color, setColor, width, setWidth, tool, setTool }: Props) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* noop */ }
  }
  const doClear = () => { netRef.current?.clear(); setConfirmClear(false) }

  return (
    <section className="rounded-xl border border-meld-line bg-meld-card p-4">
      <span className="meld-label">Tools</span>

      {/* colors */}
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Pen color">
        {PALETTE.map((c) => {
          const active = tool === 'pen' && color === c
          return (
            <button
              key={c}
              role="radio"
              aria-checked={active}
              aria-label={`Pen color ${c}`}
              onClick={() => { setColor(c); setTool('pen') }}
              className={`h-7 w-7 rounded-full ring-2 transition ${active ? 'ring-meld-ink' : 'ring-transparent hover:ring-white/30'}`}
              style={{ backgroundColor: c }}
            />
          )
        })}
      </div>

      {/* width */}
      <div className="mt-4 flex items-center gap-2" role="radiogroup" aria-label="Pen width">
        {WIDTHS.map((w) => (
          <button
            key={w}
            role="radio"
            aria-checked={width === w}
            aria-label={`Width ${w}`}
            onClick={() => setWidth(w)}
            className={`grid h-9 w-9 place-items-center rounded-lg border transition ${width === w ? 'border-meld-accent bg-meld-card-2' : 'border-meld-line hover:bg-meld-card-2'}`}
          >
            <span className="rounded-full bg-meld-ink" style={{ width: w, height: w }} />
          </button>
        ))}
      </div>

      {/* eraser + clear */}
      <div className="mt-4 flex gap-2">
        <button
          aria-pressed={tool === 'eraser'}
          onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${tool === 'eraser' ? 'border-meld-accent bg-meld-card-2 text-meld-ink' : 'border-meld-line text-meld-ink-2 hover:bg-meld-card-2'}`}
        >
          Eraser
        </button>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex-1 rounded-lg border border-meld-line px-3 py-2 text-sm font-semibold text-meld-ink-2 transition hover:bg-meld-card-2"
          >
            Clear
          </button>
        ) : (
          <button
            onClick={doClear}
            onBlur={() => setConfirmClear(false)}
            autoFocus
            className="flex-1 rounded-lg bg-meld-accent px-3 py-2 text-sm font-semibold text-meld-bg hover:bg-meld-accent-2"
          >
            Clear for everyone?
          </button>
        )}
      </div>

      {/* share */}
      <button
        onClick={copy}
        className="springy mt-4 w-full rounded-lg border border-meld-accent/50 bg-meld-accent/10 px-3 py-2 text-sm font-semibold text-meld-accent hover:bg-meld-accent/20"
      >
        {copied ? 'Link copied ✓' : 'Copy room link'}
      </button>
      <p className="meld-label mt-2">open it in a second tab to test</p>
    </section>
  )
}
```

> Thread the six new props from `index.tsx` (§7.1 note) into `<Toolbar/>` and the
> three (`color`, `width`, `tool`) into `<Board/>`.

---

## 8 · Interactions & micro-interactions

- **Drawing feel.** Strokes render on the *live* layer every frame while drawing,
  so ink appears under the pointer with zero perceptible lag (local strokes never
  wait on the network). `getCoalescedEvents()` recovers the sub-frame points a
  high-rate stylus/mouse emits, so fast arcs stay smooth. Quadratic-midpoint
  smoothing (§7.2) rounds the polyline without a library.
- **Cursor glide.** Remote cursors store a *target* (`tx,ty`) updated on each
  `cursor` message and a *rendered* (`cx,cy`) eased toward it by `+= (t−c)*0.25`
  every frame — so a 40Hz update stream renders as continuous 60fps motion, never
  a jump. The pointer SVG has a paper-colored outline so it stays visible over any
  stroke color.
- **Join/leave toasts.** Presence changes drive a small toast (`.meld-toast`,
  enters up over `--t-enter`) reading "calm fox joined" / "wry elk left", plus the
  `aria-live` announcement (§11). Optional but recommended: render toasts in a
  top-center stack that auto-dismiss after 2.4s. If time-boxed, the Presence
  list + aria-live is the required minimum; the visual toast is polish.
- **Confirm-clear.** The Clear button flips in place to a red-accent
  "Clear for everyone?" that must be clicked again (and cancels on blur), because
  clear is destructive for all peers.
- **Copy feedback.** Both copy buttons swap their label to "Copied ✓" for 1.6s.
- **Reduced motion.** `.meld-toast` and `.meld-wait-dot` animations are disabled
  under `prefers-reduced-motion` (theme.css). Cursor glide is functional, not
  decorative (it prevents teleport artifacts), so it stays — but you may set the
  ease factor to `1` under reduced motion to snap cursors if desired (optional).
  `.springy`/`.plate-lift` already self-disable globally.

---

## 9 · States (real markup)

All states render **over** the board via `WaitingOverlay` (§7.4) except
"connected", which shows nothing (the board is the state). Copy is exact.

| Status | Trigger | What renders |
| --- | --- | --- |
| `connecting` | before `sig.join()` resolves | pill: `connecting…` |
| `solo` | joined, 0 open peers | "Waiting for someone to join…" + "open this link in a second tab" + **Copy room link** button + pulsing accent dot |
| `connected` | ≥1 open peer | overlay hidden; presence list shows N online |
| peer-left | an `onClose` drops last peer → back to `solo`; else count decrements | Presence list updates; aria-live "a peer left"; that cursor is removed |
| `error` | `sig.join()` rejects / channel error | "Couldn’t reach the signaling server." + "retrying on reconnect" |
| `room-full` | my sorted id rank ≥ 6 | "This room is full (6 peers)." + "open a fresh room to start your own" |

The solo overlay markup (from §7.4) is the shareable-empty state the brief asks
for. When a second tab opens the same link, presence sync fires, `connect()` runs,
the channel opens, `status → 'connected'`, and the overlay disappears.

---

## 10 · Edge cases & failure modes

| # | Case | Handling |
| --- | --- | --- |
| 1 | **No WebRTC** (`window.RTCPeerConnection` undefined) | `index.tsx` guards at mount: if `typeof RTCPeerConnection === 'undefined'`, render a static "This demo needs WebRTC; your browser doesn’t support it" card instead of `<Board/>`, and don't join signaling. (All evergreen browsers support it; this is the honest floor.) |
| 2 | **Signaling fails** (Supabase unreachable / channel error) | `sig.join()` rejects → `status='error'`, overlay explains. `oniceconnectionstatechange` still calls `restartIce()` when a flip recovers. User can reload. No crash. |
| 3 | **ICE fails / symmetric NAT** | STUN cannot punch through symmetric NAT on both ends; the pair's `connectionState` goes `failed`, we `drop()` that peer and mark presence. **Honest caveat:** with STUN-only there is *no relay fallback*, so two peers both behind symmetric NAT will not connect. A production build adds a **TURN** server (relay) — deliberately out of scope here (it needs a paid/credentialed server and would undercut the "no relay" claim). Documented on-screen implicitly via the "no relay" footer, and in §17. **Open question for Sean in the return summary.** |
| 4 | **Tab backgrounded** | rAF (and thus `addTask`) pauses when the tab is hidden → we stop sending cursor/points, which is correct (nothing to draw). The data channel stays open; on refocus, rendering resumes and any strokes that arrived while hidden are already in `store` and get baked on the next `dirtyCommit`/repaint. No special code needed. |
| 5 | **Two offers / glare** | Prevented by design: only the greater id offers (§6.2). The perfect-negotiation guard (polite rollback / impolite ignore) covers ICE-restart re-offers so a collision can never deadlock. |
| 6 | **Rapid draw flooding the channel** | Points are **batched once per rAF** (Board buffers `pending`, flushes one `stroke-point` message/frame) and cursors likewise — so message rate is bounded by frame rate (~60/s/peer max), independent of pointer event rate. `ordered:true` reliable channel preserves stroke integrity. |
| 7 | **Peer with huge stroke history joins** | Snapshot is sent by exactly **one** peer (smallest established id) as a single `snapshot` message of finished strokes. For very large boards this could be a big frame; the reliable data channel chunks it under the hood. Mitigation available if needed: cap history length or drop erased-over strokes — **not built in v1**; note it as a scaling limit. |
| 8 | **Clear race** | `clear` wipes local `store` immediately and broadcasts. If a `stroke-point` for an old stroke arrives after a peer cleared, `addPoints` finds no such id in `byId` (it was cleared) and no-ops. A stroke started *before* a clear but ended after will re-appear on the drawer's screen only (its `start` was pre-clear on peers who then cleared) — acceptable, self-heals on next clear. Clear is last-writer-wins; good enough for an ephemeral board. |
| 9 | **Peer drops mid-stroke** | `onClose` calls `store.endLive(peerId)` to finalize the dangling live stroke so it bakes and doesn't linger on the live layer forever; the cursor is removed from the map. |
| 10 | **Duplicate room in same browser** (two tabs) | Each tab mints its own `selfId` (uuid), so they are two distinct peers and genuinely connect P2P — which is exactly how the demo is tested. |
| 11 | **Different window sizes** | Coords are normalized 0..1 independently on x and y, so a board drawn on a wide window appears stretched on a tall one. This is the intended simplest behavior; the drawing stays legible and synced. (A letterboxed fixed-aspect surface would avoid stretch — out of scope, §17.) |
| 12 | **Malformed/hostile channel frame** | `decode()` returns `null` on bad JSON or missing `t`; the message is dropped. No `eval`, no DOM injection — names/colors render as text/`backgroundColor` only. |

---

## 11 · Accessibility

- **Keyboard.** Every control is a real `<button>`: color swatches
  (`role=radio` in a `radiogroup`), widths (same), eraser (`aria-pressed`), clear
  (two-step, `autoFocus` on confirm, cancels on blur), both copy buttons. All are
  tabbable, operable with Enter/Space, and show the scoped teal focus ring
  (`.meld-root :focus-visible`). Back-to-portfolio links are buttons too.
- **Presence announcements.** `Presence.tsx` diffs the peer set and writes
  "X joined" / "a peer left" into an `aria-live="polite"` `sr-only` region, so a
  screen-reader user hears who arrives and leaves.
- **The board is `role="application"`** with an `aria-label` explaining it's a
  pointer drawing surface and that the toolbar changes color/width/clear.
- **Why drawing itself is pointer-only, and the fallback.** Freehand drawing is an
  inherently spatial, continuous-input gesture — there is no meaningful keyboard
  equivalent to "draw a curve here", and inventing arrow-key drawing would be a
  worse experience than honesty. This matches how every drawing tool ships. The
  **accessible fallback** is that *all board management is keyboard/SR-accessible*
  (tools, clear, presence, share, room state), and the presence/announcement layer
  keeps a non-visual user oriented to what's happening. This is stated plainly and
  is the accepted floor for a drawing surface (WCAG allows essential
  pointer-gesture exceptions).
- **Reduced motion.** Toast + waiting-dot animations off; scroll-reveal and
  springs already self-disable globally.
- **Contrast.** All chrome text ≥ 4.5:1 (§4.2); stroke/cursor colors ≥ 4.5:1 on
  the surface and cursor-name pills use white text ≥ 5:1 on their color (§4.4).

---

## 12 · Performance budget

- **Channel message rate.** Bounded by frame rate: ≤ ~60 `cursor` + ≤ ~60
  `stroke-point` messages/sec **per peer** while actively drawing (batched per
  rAF), **0** while idle. `presence`/`snapshot` are one-shot. At the 6-cap, worst
  case a peer sends ~120 msg/s to each of 5 peers — small JSON frames over a
  reliable ordered channel; comfortable.
- **Canvas redraw strategy.** Finished strokes are baked **once** into the commit
  bitmap (only when `dirtyCommit`), so a board with thousands of committed strokes
  costs nothing per frame. Each frame only clears + repaints the handful of
  **live** (in-progress) strokes. Resize/snapshot triggers a single re-bake.
- **Memory of stroke history.** `history` holds every stroke's normalized points
  (numbers). A dense minute of drawing is on the order of a few thousand points —
  low single-digit MB worst case. Ephemeral: the array dies with the page. No
  persistence, no leak across rooms (the hook rebuilds a fresh `StrokeStore` per
  `room`).
- **One rAF loop.** Board's tick and Cursors' tick both register via `addTask`;
  no component starts its own `requestAnimationFrame`. When the page unmounts,
  both `addTask` unsubscribe and the shared loop idles.
- **DPR clamp.** Canvas backing store scales by `min(devicePixelRatio, 2)` so a
  3× phone doesn't allocate a 9×-area bitmap.

---

## 13 · Build order (shippable phases, each with an exit criterion)

1. **Chrome + tokens + routing.** Add `@theme` tokens, `theme.css`, `index.tsx`
   shell (header/footer, body-class swap, room-id bootstrap), App + Range entries.
   *Exit:* `#/demos/meld` renders the dark shell with an empty light board and a
   `?room=xxxxxxxx` in the URL; portfolio Range shows Commission 05.
2. **Local drawing (no network).** `strokes.ts` + `Board.tsx` pointer drawing +
   two-layer render on `addTask`. Toolbar (color/width/eraser/clear) driving local
   `store`. *Exit:* you can draw smooth strokes, switch color/width, erase, and
   clear — all locally, 60fps, no console errors.
3. **2-peer sync.** `supabaseClient.ts`, `signaling.ts`, `peers.ts`, `protocol.ts`,
   `useMeld.ts` wired for the greater-id-offers handshake. Broadcast cursor +
   stroke messages. *Exit:* two tabs on the same link connect P2P (verify in
   `chrome://webrtc-internals`), and strokes + cursors sync both ways with
   Supabase Realtime showing no stroke traffic.
4. **Mesh + snapshot + cap.** Presence-driven `connect()` to all admitted members,
   single-snapshot-on-join, 6-cap admission + room-full. `Cursors.tsx` labeled
   glide, `Presence.tsx`. *Exit:* 3–4 tabs all see each other's ink and cursors; a
   late joiner receives the existing board once; the 7th tab shows room-full.
5. **Reconnect + polish.** `restartIce` on flip, drop/cleanup on close,
   `endLive` on mid-stroke drop, toasts + aria-live, confirm-clear, copy buttons,
   reduced-motion, all edge cases (§10). *Exit:* closing a tab removes its cursor
   and presence within a second; §15 smoke passes green.

---

## 14 · Backend setup (Supabase)

**No secrets, no tables, no RLS policies needed** — the demo uses only Realtime
Broadcast + Presence, which require no database rows and are governed by the
project's Realtime settings, not RLS. Steps (do via the Supabase MCP at build):

1. **Create a project** (or reuse the portfolio's existing Supabase project — the
   REX key-proxy project is fine; Realtime is per-project and independent of that
   Edge Function).
2. **Realtime is enabled by default** for Broadcast and Presence on all projects.
   No table needs "Realtime" toggled — that toggle is only for Postgres change
   streams, which we do **not** use. So there is literally nothing to configure on
   the dashboard beyond having a project.
3. **Get the project URL and the anon (publishable) key** and paste them into
   `supabaseClient.ts` (§6.0). The anon key is public by design and safe to commit.
4. **Channel authorization:** by default an anonymous client may join Realtime
   Broadcast/Presence channels. Leave the default (open) authorization — this is
   an ephemeral, low-risk signaling channel and gating it would require auth we
   deliberately avoid. (If Supabase Realtime Authorization is *on* for the project,
   add a permissive policy on `realtime.messages` for `SELECT`/`INSERT` so anon can
   read/write broadcast — but the default project has it off, so typically no-op.)

Client init is the whole backend surface. Verify: open two tabs, watch the
Realtime inspector — you'll see `presence` + a burst of `broadcast:signal` during
the handshake, then **silence** while drawing (proof the strokes are P2P).

---

## 15 · Smoke test (`portfolio/scripts/smoke-meld.mjs`)

Two browser contexts prove real sync. Add to `package.json`:
`"smoke": "node scripts/smoke-meld.mjs && node scripts/smoke-meridian.mjs && node scripts/smoke-aeroscale.mjs"`.

Checklist the script asserts (✓/✗, non-zero exit on any ✗):

1. Page A loads `#/demos/meld`, mints a `?room=` id; the light board canvas exists.
2. Page B opens **the same room URL** (reuse A's room id from A's `location.hash`).
3. Both reach `connected` (Presence shows "2 online" on each) within a timeout —
   proves the WebRTC handshake completed.
4. **Stroke sync:** A draws a stroke (synthetic pointerdown→moves→up on the board
   box). B's commit canvas changes (non-trivial pixel delta vs a pre-draw shot) —
   proves stroke data crossed the data channel, not Supabase.
5. **Cursor sync:** A moves the pointer over the board; B shows a `.meld-cursor`
   element (count ≥ 1).
6. **Presence:** each page's presence list contains the other's "adj noun" name.
7. **Clear:** A clicks Clear then "Clear for everyone?"; B's commit canvas returns
   to (near) blank.
8. **Leave:** close B; A drops back toward "1 online" / solo overlay and B's cursor
   disappears within a couple seconds.
9. **Zero page errors** across both contexts (collect `pageerror`).

Reference skeleton (paste and complete against the real DOM):

```js
#!/usr/bin/env node
/** Meld smoke — two pages prove peer-to-peer sync. Usage mirrors smoke-meridian.mjs.
 *  npm run build && npx vite preview --port 4173 & node scripts/smoke-meld.mjs
 *  Env: PW_CHROMIUM=/path/to/chromium. Needs devDeps: playwright-core, pngjs. */
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const LAUNCH = { executablePath: process.env.PW_CHROMIUM || undefined, args: ['--no-sandbox'] }
let failed = 0
const check = (n, ok, note = '') => { if (!ok) failed++; console.log(`${ok ? '  ✓' : '  ✗'} ${n}${note ? ` — ${note}` : ''}`) }
const meanDiff = (a, b) => { const A = PNG.sync.read(a), B = PNG.sync.read(b); let s = 0; const n = Math.min(A.data.length, B.data.length); for (let i = 0; i < n; i += 4) s += Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]); return s / (n / 4) }

const browser = await chromium.launch(LAUNCH)
const errs = []
const ctxA = await browser.newContext({ viewport: { width: 1200, height: 900 } })
const ctxB = await browser.newContext({ viewport: { width: 1200, height: 900 } })
const A = await ctxA.newPage(); const B = await ctxB.newPage()
for (const p of [A, B]) p.on('pageerror', (e) => errs.push(String(e)))

await A.goto(`${BASE}/#/demos/meld`, { waitUntil: 'networkidle' })
await A.waitForTimeout(1500)
const room = await A.evaluate(() => new URLSearchParams(location.hash.split('?')[1]).get('room'))
check('page A minted a room', !!room, room ?? '')
await B.goto(`${BASE}/#/demos/meld?room=${room}`, { waitUntil: 'networkidle' })

// wait for both to report 2 online (handshake complete)
const onlineTwo = async (p) => p.waitForFunction(() => /2 online/.test(document.body.textContent || ''), { timeout: 20000 }).then(() => true).catch(() => false)
check('A connected (2 online)', await onlineTwo(A))
check('B connected (2 online)', await onlineTwo(B))

// A draws; B's board changes
const boxA = await A.locator('[role="application"]').boundingBox()
const commitB = B.locator('canvas').nth(0)
const before = await commitB.screenshot()
await A.mouse.move(boxA.x + 200, boxA.y + 200); await A.mouse.down()
for (let i = 0; i < 20; i++) await A.mouse.move(boxA.x + 200 + i * 15, boxA.y + 200 + Math.sin(i) * 40)
await A.mouse.up(); await B.waitForTimeout(600)
const after = await commitB.screenshot()
check('stroke synced A→B (P2P)', meanDiff(before, after) > 1, `Δ ${meanDiff(before, after).toFixed(1)}`)

// cursor shows on B
await A.mouse.move(boxA.x + 400, boxA.y + 300); await B.waitForTimeout(400)
check('remote cursor on B', (await B.locator('.meld-cursor').count()) >= 1)

// presence names cross
check('B lists A\'s name', /\b(fox|elk|wren|lynx|hawk|otter|crane|mole|newt|vole|finch|stoat)\b/.test(await B.locator('section:has-text("In this room")').textContent() ?? ''))

// clear
await A.locator('button:has-text("Clear")').first().click()
await A.locator('button:has-text("Clear for everyone")').click()
await B.waitForTimeout(600)
const cleared = await commitB.screenshot()
check('clear synced A→B', meanDiff(after, cleared) > 1)

// leave
await ctxB.close(); await A.waitForTimeout(2500)
check('A sees peer leave', /1 online|Waiting for someone/.test(await A.locator('body').textContent() ?? ''))

check('zero page errors', errs.length === 0, errs.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
```

> Note: `chrome://webrtc-internals` can't be scripted, so the smoke proves P2P
> *indirectly* — strokes appear on B even though the smoke never asserts Supabase
> traffic. The "no relay" claim is verified by hand once in DevTools during build.

---

## 16 · Definition of done

- [ ] `#/demos/meld` renders the scoped dark chrome + light board; `?room=` in URL.
- [ ] Range shows Commission '05' with the Meld thumb; App has the lazy entry.
- [ ] Local drawing: smooth strokes, 6 colors, 4 widths, eraser, confirm-clear —
      all 60fps with no console errors, no second rAF loop.
- [ ] Two tabs connect **peer-to-peer** (verified in webrtc-internals); strokes +
      cursors sync over the data channel; Supabase shows only handshake traffic.
- [ ] Mesh of 3–4 works; late joiner gets one snapshot of the board; 7th is room-full.
- [ ] Presence list + aria-live announce joins/leaves; a dropped peer's cursor
      disappears and the room recovers to solo when empty.
- [ ] Perfect-negotiation: no glare/double-offer deadlock; `restartIce` on flip.
- [ ] All controls keyboard-operable with the scoped focus ring; reduced-motion honored.
- [ ] All chrome text ≥ 4.5:1; peer colors legible on the surface (§4 ratios hold).
- [ ] `npm run smoke` (Meld two-page suite) passes green; zero page errors.
- [ ] On-screen claim present: "Peer-to-peer over WebRTC · Supabase signals, then
      gets out of the way."

## 17 · Later / out of scope (do not build in v1)

- **TURN relay** for symmetric-NAT traversal (needs a credentialed relay server;
  would also complicate the "no relay" story). Honest caveat lives in §10 #3.
- **Undo/redo** (needs per-peer op history + inverse ops).
- **Shapes / text tool / fill** (this is freehand only).
- **Persistence** (rooms are intentionally ephemeral; would add a DB + moderation).
- **Fixed-aspect / letterboxed surface** to avoid cross-window stretch (§10 #11).
- **Strict color uniqueness** via presence-driven reassignment (§7.6 note).
- **History compaction** for very large boards / big-snapshot joiners (§10 #7).
- **Voice/video** over the same peer connection (the plumbing would allow it).
```
