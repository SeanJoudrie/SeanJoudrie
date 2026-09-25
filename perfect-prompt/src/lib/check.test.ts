import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { checkPrompt } from './check'

const ids = (text: string) => Object.fromEntries(checkPrompt(text).findings.map((f) => [f.id, f.severity]))

describe('checkPrompt', () => {
  it('scores an empty prompt as zero with no findings', () => {
    expect(checkPrompt('   ')).toEqual({ score: 0, words: 0, findings: [] })
  })

  it('flags a bare one-liner', () => {
    const r = ids('Make me a website for my bakery. Make it look modern and clean and good.')
    expect(r.goal).toBe('bad')
    expect(r.success).toBe('bad')
    expect(r.length).toBe('warn')
  })

  it('rewards a prompt with every section', () => {
    const r = checkPrompt(`You are a front-end engineer. Your goal is a landing page for Crumb, a bakery app for people who pre-order bread.
Context: the project already has a React app built with Vite; the audience is older customers, so text is large.
Keep body text at 18px because many customers read on small phones.
Good looks like: a first-time visitor finds "Order" within 10 seconds on a phone.
If something is unclear, ask first. Output: the edited files and a short list of what changed.`)
    expect(r.findings.filter((f) => f.severity !== 'good')).toEqual([])
    expect(r.score).toBe(100)
  })

  it('catches shouting and placeholders', () => {
    const r = ids('You are my assistant. NEVER use emojis. This is CRITICAL. Write about [insert topic] for {{audience}}.')
    expect(r.shout).toBe('warn')
    expect(r.placeholders).toBe('bad')
  })

  it('does not treat acronyms as shouting', () => {
    expect(ids('You are my assistant. Return valid JSON for the API, and plain HTML and CSS.').shout).toBeUndefined()
  })

  it('finds the known gaps in the vibe-coded report prompt', () => {
    const text = readFileSync(new URL('../../prompts/no-vibe-coded-look.md', import.meta.url), 'utf8')
    const r = ids(text)
    expect(r.goal).toBe('good')
    expect(r.success).toBe('bad')
    expect(r.absolutes).toBe('warn')
    expect(r.vague).toBe('warn')
  })
})

describe('uncertainty handling', () => {
  it('accepts "when something is unclear" phrasing', () => {
    const filler = ' Keep the page fast and readable for people on phones.'.repeat(8)
    expect(ids(`You are my designer.${filler} When something is unclear, choose the option that best fits and note the choice.`).unsure).toBe('good')
  })
})
