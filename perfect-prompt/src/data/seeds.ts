// Prompts that ship with the app. Add a new one by dropping a .md file in
// /prompts and listing it here. Ratings come from real use or a Lab test,
// never from how good a prompt looks.
import type { Entry } from '../lib/library'
import { builderPrompt } from '../lib/builder'
import vibeOriginal from '../../prompts/no-vibe-coded-look.md?raw'
import vibeTailored from '../../prompts/no-vibe-coded-look-algorithm-builder.md?raw'

export const seeds: Omit<Entry, 'seeded'>[] = [
  {
    id: 'prompt-builder',
    title: 'Prompt Builder',
    body: builderPrompt,
    tags: ['meta', 'any project'],
    source: 'This repo: perfect-prompt/PROMPT_BUILDER.md',
    rating: 'great',
    notes: 'Paste into a new chat and describe what you’re making. It asks up to 5 questions, then writes the prompt and stress-tests it. Lab test 1: its version of the vibe-coded prompt beat the original.',
    created: '2026-09-25',
    uses: 0,
  },
  {
    id: 'no-vibe-coded-look',
    title: 'No vibe-coded look (original)',
    body: vibeOriginal.trim(),
    tags: ['design', 'front end', 'general'],
    source: 'Aftermark AI, “Vibe Coded Websites Report”',
    rating: 'ok',
    notes: 'Good design rules, no project context. On Algorithm Builder it cleaned up the grid and corners, but it also made the hero copy longer, removed Gus’s blink, and invented a loading spinner. Run it through the Prompt Builder first.',
    lab: 'algorithm-builder-home',
    created: '2026-09-25',
    uses: 0,
  },
  {
    id: 'no-vibe-coded-look-algorithm-builder',
    title: 'No vibe-coded look, tailored to Algorithm Builder',
    body: vibeTailored.trim(),
    tags: ['design', 'front end', 'algorithm builder'],
    source: 'The original, run through the Prompt Builder with Algorithm Builder’s brand and audience',
    rating: 'great',
    notes: 'Won Lab test 1: the button sits highest on a phone, the copy stays simple, nothing was invented, and nothing that already worked was broken.',
    lab: 'algorithm-builder-home',
    created: '2026-09-25',
    uses: 0,
  },
]
