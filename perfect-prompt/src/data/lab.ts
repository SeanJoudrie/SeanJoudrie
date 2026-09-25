// Lab tests. Each specimen lives in public/lab/<slug>/: before/ is a frozen
// copy of a real page, every other folder is one prompt's result.
// `npm run shoot` takes the screenshots and `npm run audit -- <slug>` writes
// the measurements (audit.json) that the score tables below come from.

export interface LabVersion {
  key: string
  label: string
  byline: string
  promptId?: string
  notes: string[]
}

export interface LabTest {
  slug: string
  title: string
  date: string
  question: string
  verdict: string
  versions: LabVersion[]
  scoreCaption: string
  scores: { criterion: string; values: Record<string, string> }[]
  lessons: string[]
}

export const labTests: LabTest[] = [
  {
    slug: 'algorithm-builder-home',
    title: 'The “No vibe-coded look” prompt on Algorithm Builder’s front page',
    date: 'September 25, 2026',
    question:
      'Does the prompt from Aftermark AI’s vibe-coded websites report improve a real page, and does running it through the Prompt Builder first make it better? Each version was made by a separate run that saw only its prompt and the frozen page.',
    verdict:
      'Both prompts made the page cleaner, but the tailored version did better on what matters for this app. It kept the “Fix my feed” button highest on a phone, kept the copy at the simple reading level the app is built for, kept Gus’s blink, and added nothing that isn’t true of the product. The original prompt’s design rules are sound, but it knows nothing about the project, so it guessed. Some guesses went against the brand and the audience. The hero copy more than doubled in length and went from about grade 0 to grade 6, the top of the app’s limit. Gus’s blink was removed, and a made-up loading spinner was added. Meeting its “every button must work” rule also led it to read files outside the page it was given, which it had been told not to do.',
    versions: [
      {
        key: 'before',
        label: 'Before',
        byline: 'The live front page, frozen',
        notes: ['Already calm and on-brand: a one-color accent, a 4px grid, and 18px body text.', 'Pill button next to rounded cards: two shape styles.', 'Everything centered.'],
      },
      {
        key: 'original-prompt',
        label: 'Original prompt',
        byline: 'Aftermark AI’s prompt, as written',
        promptId: 'no-vibe-coded-look',
        notes: [
          'One 12px radius, one 960px grid, left-aligned, two-column hero on desktop.',
          'Rewrote the hero from the meta description: 35 words naming four platforms, up from 9.',
          'Relabeled the causes as “Step 1, 2, 3”, which reads like instructions to the user.',
          'Wired “Fix my feed” to the live app with an “Opening…” spinner the real app doesn’t have.',
          'Removed Gus’s blink, the one loop the brand allows.',
          'Added Twitter meta tags to a <head> that was already correct.',
        ],
      },
      {
        key: 'improved-prompt',
        label: 'Tailored prompt',
        byline: 'Same prompt after the Prompt Builder',
        promptId: 'no-vibe-coded-look-algorithm-builder',
        notes: [
          'One 12px radius and one shadow, one 960px grid, left-aligned, two-column hero on desktop.',
          'Gus sits beside the heading on phones, so the button moves up.',
          'Hero: “Answer three quick questions. Gus will show you what to tap to fix it.” This is true of the product but wasn’t on the page.',
          'Added a second “Fix my feed” after “Why this happens”.',
          'Kept the <head>, the blink, the inert button, and every accessibility feature.',
        ],
      },
    ],
    scoreCaption: 'Measured by scripts/audit.mjs on a 375 × 667 phone screen with reduced motion on (public/lab/algorithm-builder-home/audit.json).',
    scores: [
      { criterion: '“Fix my feed” bottom edge (fold is 667px)', values: { before: '491px', 'original-prompt': '624px', 'improved-prompt': '389px' } },
      { criterion: 'Hero reading grade (Flesch-Kincaid)', values: { before: '≈ 0', 'original-prompt': '6.1', 'improved-prompt': '≈ 0' } },
      { criterion: 'Words in main content', values: { before: '68', 'original-prompt': '105', 'improved-prompt': '83' } },
      { criterion: 'Corner styles', values: { before: '2 (pill + 13.5px)', 'original-prompt': '1 (12px)', 'improved-prompt': '1 (12px)' } },
      { criterion: 'Spacing off the 4px grid', values: { before: 'None', 'original-prompt': 'None', 'improved-prompt': 'None' } },
      { criterion: 'Smallest text', values: { before: '18px', 'original-prompt': '16px', 'improved-prompt': '16px' } },
      { criterion: 'Smallest tap target', values: { before: '48px', 'original-prompt': '46px (Terms link)', 'improved-prompt': '48px' } },
      { criterion: 'Horizontal scroll at 320px', values: { before: 'No', 'original-prompt': 'No', 'improved-prompt': 'No' } },
      { criterion: 'Gus’s blink kept', values: { before: 'Yes', 'original-prompt': 'No', 'improved-prompt': 'Yes' } },
      { criterion: 'Invented behavior or content', values: { before: 'None', 'original-prompt': 'Loading spinner, live links', 'improved-prompt': '“Three quick questions” line' } },
      { criterion: 'Prompt Check score', values: { before: 'n/a', 'original-prompt': '44 (Weak)', 'improved-prompt': '84 (Decent)' } },
    ],
    lessons: [
      'A general prompt applies its rules everywhere, even where they don’t fit. “Every button must work” became a fake spinner on a static page. Say what’s out of scope and why.',
      'Context beats adjectives. “Premium” and “mature product team” pushed the original toward longer, more corporate copy. “Grandma rules: 6th-grade reading, 18px, 48px targets” kept the tailored version simple.',
      'Say what to leave alone. The tailored prompt listed what was already correct (head tags, accessibility, Gus), and none of it changed.',
      'Next: the brand and audience facts apply to every Algorithm Builder task, so they belong in a standing CLAUDE.md for that app. Each prompt after that only needs the job itself.',
    ],
  },
]
