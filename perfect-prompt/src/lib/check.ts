// Prompt check: fast, local heuristics for the things that most often separate
// a weak prompt from a strong one. It can't judge whether a prompt is *right*
// for the job, only whether it's missing the parts every good prompt has.

export type Severity = 'good' | 'warn' | 'bad'

export interface Finding {
  id: string
  label: string
  severity: Severity
  detail: string
  fix?: string
  /** Up to 5 short quotes from the prompt that triggered the finding. */
  quotes?: string[]
}

export interface CheckResult {
  score: number
  words: number
  findings: Finding[]
}

const VAGUE = [
  'good', 'nice', 'modern', 'clean', 'premium', 'sleek', 'beautiful', 'amazing', 'stunning',
  'high quality', 'high-quality', 'best', 'polished', 'professional', 'intuitive', 'engaging',
  'seamless', 'robust', 'awesome', 'perfect', 'world-class', 'cutting-edge',
]
const SHOUT_WORDS = ['CRITICAL', 'IMPORTANT', 'MUST', 'NEVER', 'ALWAYS', 'ONLY', 'DO NOT', 'MANDATORY']
// Short all-caps tokens that are names, not shouting.
const ACRONYMS = new Set(['HTML', 'CSS', 'JSON', 'API', 'URL', 'UI', 'UX', 'SEO', 'PDF', 'SQL', 'CLI', 'OG', 'README', 'TODO', 'MVP', 'CTA', 'AI', 'LLM', 'USA', 'RGB', 'SVG', 'PNG', 'HTTP', 'HTTPS', 'CLAUDE'])

const words = (s: string) => s.match(/[A-Za-z0-9'’-]+/g) ?? []
const sentences = (s: string) =>
  s.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter(Boolean)
const has = (s: string, re: RegExp) => re.test(s)
const clip = (s: string, n = 90) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

export function checkPrompt(text: string): CheckResult {
  const t = text.trim()
  const lower = t.toLowerCase()
  const count = words(t).length
  const sents = sentences(t)
  const findings: Finding[] = []

  if (count === 0) return { score: 0, words: 0, findings: [] }

  // 1. Goal: does the model know what it's working toward?
  const goal = has(lower, /\b(your (job|goal|task|role) is|the goal is|you are (a|an|my)|i want you to|help me|we're building|we are building|outcome)\b/)
  findings.push(goal
    ? { id: 'goal', label: 'States a goal', severity: 'good', detail: 'The model knows what it is working toward.' }
    : { id: 'goal', label: 'No clear goal', severity: 'bad', detail: 'Nothing says what the result is for.', fix: 'Open with one sentence: what the model is and the single outcome it should produce.' })

  // 2. Context: project facts the model can't guess.
  const contextSignals = [
    /\b(for|audience|users?|customers?|people who)\b/, /\b(context|background|project|app|site|codebase|repo)\b/,
    /\b(already|currently|existing|we have|it has|built with|stack)\b/, /\b(because|so that|why)\b/,
  ].filter((re) => has(lower, re)).length
  findings.push(contextSignals >= 3
    ? { id: 'context', label: 'Gives context', severity: 'good', detail: 'Mentions who it is for and what already exists.' }
    : { id: 'context', label: contextSignals === 2 ? 'Thin context' : 'No project context', severity: contextSignals === 2 ? 'warn' : 'bad',
        detail: 'A generic prompt gets a generic result. The model can’t guess your audience, stack, or what exists already.',
        fix: 'Add a Context section: what the project is, who it is for, what exists, and what you care about most.' })

  // 3. Success criteria: how will the result be judged?
  const success = has(lower, /\b(good looks like|done when|success(ful)? (is|means|looks)|we'?ll know|measure|acceptance|criteria|so that (a|the|someone)|within \d|under \d|at least \d|no more than \d)\b/)
  findings.push(success
    ? { id: 'success', label: 'Defines success', severity: 'good', detail: 'There is a concrete bar to check the result against.' }
    : { id: 'success', label: 'No definition of done', severity: 'bad', detail: 'The model has no concrete bar, so it stops when it feels finished.',
        fix: 'Add “What good looks like”: something checkable, like “a new user finds the main button in under 10 seconds on a phone”.' })

  // 4. Output: what comes back?
  const output = has(lower, /\b(output|return|reply with|respond with|hand back|deliver|format|write (it|them|the result) to|save (it|to)|as a (list|table|file)|end with)\b/)
  findings.push(output
    ? { id: 'output', label: 'Says what to hand back', severity: 'good', detail: 'The model knows the shape of the answer.' }
    : { id: 'output', label: 'Output not specified', severity: 'warn', detail: 'Nothing says what the answer should look like: files, format, length.',
        fix: 'Add an Output section: exactly what to return, and what to do when unsure (ask, or pick a default and say so).' })

  // 5. Rules explained: do "must/never" rules carry a reason?
  const ruleSents = sents.filter((s) => /\b(must|never|always|do not|don't|avoid|should not|shouldn't|mandatory|required)\b/i.test(s))
  const reasoned = ruleSents.filter((s) => /\b(because|so that|so the|so it|since|otherwise|which (means|makes)|this (keeps|helps|makes|lets)|signals?)\b/i.test(s))
  if (ruleSents.length >= 3) {
    const ratio = reasoned.length / ruleSents.length
    const unexplained = ruleSents.filter((s) => !reasoned.includes(s))
    findings.push(ratio >= 0.4
      ? { id: 'reasons', label: 'Rules come with reasons', severity: 'good', detail: `${reasoned.length} of ${ruleSents.length} rules say why, so the model can handle cases you didn’t list.` }
      : { id: 'reasons', label: 'Rules without reasons', severity: 'warn',
          detail: `${ruleSents.length - reasoned.length} of ${ruleSents.length} rules don’t say why. A model that knows the reason generalizes; one that doesn’t follows the letter and misses the point.`,
          fix: 'Add a short “because…” to the rules that matter most.', quotes: unexplained.slice(0, 5).map((s) => clip(s)) })
  }

  // 6. Absolutes: too many "every/always/never/must" and nothing stands out.
  const absolutes = (lower.match(/\b(always|never|every|must|mandatory|at all times|guarantee)\b/g) ?? []).length
  const absPer100 = (absolutes / count) * 100
  if (absPer100 > 2.5 && absolutes >= 6) {
    findings.push({ id: 'absolutes', label: 'Everything is a hard rule', severity: 'warn',
      detail: `${absolutes} absolutes (always, never, every, must). When everything is mandatory, the model can’t tell what matters most and may over-apply rules where they don’t fit.`,
      fix: 'Keep “must” for true hard limits. For the rest, say what you prefer and why, or rank priorities.' })
  }

  // 7. Shouting.
  const shout = (t.match(/\b[A-Z][A-Z'’]{3,}(?:\s+[A-Z]{2,})*\b/g) ?? []).filter((w) => !ACRONYMS.has(w) && (SHOUT_WORDS.some((s) => w.includes(s)) || w.length >= 5))
  const bangs = (t.match(/!{2,}/g) ?? []).length
  if (shout.length + bangs > 0) {
    findings.push({ id: 'shout', label: 'Shouting', severity: shout.length + bangs >= 3 ? 'bad' : 'warn',
      detail: 'ALL CAPS and “CRITICAL” don’t add clarity. Current models follow instructions closely, so shouting makes them over-apply the rule.',
      fix: 'Say it once, calmly, with the reason.', quotes: [...new Set(shout)].slice(0, 5) })
  }

  // 8. Vague quality words standing in for criteria.
  const vagueHits = VAGUE.filter((v) => new RegExp(`\\b${v}\\b`, 'i').test(t))
  if (vagueHits.length >= 3) {
    findings.push({ id: 'vague', label: 'Vague quality words', severity: 'warn',
      detail: `“${vagueHits.slice(0, 6).join('”, “')}” mean different things to different people, and to the model.`,
      fix: 'Replace each with what you’d actually check: a size, a number, a comparison, or an example.' })
  }

  // 9. Mostly "don't".
  const neg = (lower.match(/\b(don't|do not|never|avoid|no )\b/g) ?? []).length
  const pos = (lower.match(/\b(use|write|add|make|keep|choose|start|include|show|give|put|create|build|define|select)\b/g) ?? []).length
  if (neg >= 5 && neg > pos) {
    findings.push({ id: 'negative', label: 'Mostly “don’t”', severity: 'warn',
      detail: `${neg} don’ts vs ${pos} do’s. Telling the model what to avoid doesn’t tell it what to do instead.`,
      fix: 'Turn the main don’ts into do’s: “avoid generic taglines” → “say what the product does in one sentence”.' })
  }

  // 10. When unsure.
  const unsure = has(lower, /\b((if|when) (you'?re |you are )?(unsure|not sure|unclear|in doubt)|(if|when) (something|anything)( important)? is (unclear|ambiguous|missing)|ask (me|first|before)|clarifying question|pick a (sensible )?default|(state|note) (your |any )?assumptions?|say so)\b/)
  if (count > 60) {
    findings.push(unsure
      ? { id: 'unsure', label: 'Handles uncertainty', severity: 'good', detail: 'Says what to do when something is unclear.' }
      : { id: 'unsure', label: 'No plan for “unsure”', severity: 'warn', detail: 'When something is ambiguous the model will guess silently.',
          fix: 'Add one line: “If something important is unclear, ask; otherwise pick a sensible default and say which.”' })
  }

  // 11. Leftover placeholders.
  const placeholders = t.match(/\[(todo|insert|tbd|your [^\]]+|xxx)[^\]]*\]|\{\{[^}]+\}\}|<insert[^>]*>|lorem ipsum/gi) ?? []
  if (placeholders.length) {
    findings.push({ id: 'placeholders', label: 'Placeholders left in', severity: 'bad', detail: 'The model will fill these in with a guess.', fix: 'Replace them with the real details.', quotes: placeholders.slice(0, 5) })
  }

  // 12. Length.
  if (count < 40) {
    findings.push({ id: 'length', label: 'Very short', severity: 'warn', detail: `${count} words. Short is fine for small asks, but anything bigger needs context and a definition of done.` })
  }

  const weights: Record<Severity, number> = { good: 0, warn: 8, bad: 16 }
  const penalty = findings.reduce((s, f) => s + weights[f.severity], 0)
  return { score: Math.max(0, Math.min(100, 100 - penalty)), words: count, findings }
}

export const scoreLabel = (score: number) =>
  score >= 85 ? 'Strong' : score >= 65 ? 'Decent' : score >= 45 ? 'Needs work' : 'Weak'
