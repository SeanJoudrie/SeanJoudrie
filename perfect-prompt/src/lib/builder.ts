import builderDoc from '../../PROMPT_BUILDER.md?raw'

export interface Rule {
  rule: string
  why: string
}

export interface Draft {
  ramble: string
  goal: string
  context: string
  task: string
  rules: Rule[]
  good: string
  output: string
}

export const emptyDraft: Draft = { ramble: '', goal: '', context: '', task: '', rules: [{ rule: '', why: '' }], good: '', output: '' }

/** The prompt builder itself: the text between the two `---` lines of PROMPT_BUILDER.md. */
export const builderPrompt = (() => {
  const parts = builderDoc.split(/^---\s*$/m)
  return (parts.length >= 3 ? parts[1] : builderDoc).trim()
})()

/** The builder prompt with the user's own description appended, ready to paste into Claude. */
export function withRamble(ramble: string) {
  const r = ramble.trim()
  if (!r) return builderPrompt
  return `${builderPrompt.replace(/\n*Start by asking me what I'm working on\.\s*$/, '')}\n\nHere's what I'm working on:\n\n${r}`
}

/** Assembles the form into a finished prompt. Empty sections are left out. */
export function compose(d: Draft) {
  const rules = d.rules
    .filter((r) => r.rule.trim())
    .map((r) => `- ${r.rule.trim().replace(/\.$/, '')}${r.why.trim() ? `, because ${r.why.trim().replace(/^because\s+/i, '').replace(/\.$/, '')}` : ''}.`)
  const sections: [string, string][] = [
    ['Role and goal', d.goal],
    ['Context', d.context],
    ['The task', d.task],
    ['Constraints', rules.join('\n')],
    ['What good looks like', d.good],
    ['Output', d.output],
  ]
  return sections
    .filter(([, body]) => body.trim())
    .map(([h, body]) => `# ${h}\n${body.trim()}`)
    .join('\n\n')
}
