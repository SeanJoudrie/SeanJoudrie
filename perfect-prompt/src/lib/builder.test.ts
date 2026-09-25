import { describe, expect, it } from 'vitest'
import { builderPrompt, compose, emptyDraft, withRamble } from './builder'

describe('builder', () => {
  it('extracts only the prompt from PROMPT_BUILDER.md', () => {
    expect(builderPrompt.startsWith('You are my prompt engineer.')).toBe(true)
    expect(builderPrompt).not.toContain('Paste everything between')
  })

  it('appends the ramble in place of the opening question', () => {
    const p = withRamble('a poop tracker for my dog')
    expect(p).not.toContain("Start by asking me what I'm working on.")
    expect(p.endsWith('a poop tracker for my dog')).toBe(true)
  })

  it('leaves out empty sections and joins each rule with its reason', () => {
    const out = compose({ ...emptyDraft, goal: 'Build a tracker.', rules: [{ rule: 'Keep text at 18px.', why: 'Because older users read it' }, { rule: '', why: 'ignored' }] })
    expect(out).toBe('# Role and goal\nBuild a tracker.\n\n# Constraints\n- Keep text at 18px, because older users read it.')
  })
})
