// portfolio/src/data/commands.ts
import { navigate } from '../lib/router'
import { site } from './site'
import { toggleSurveyGrid } from '../lib/surveyGrid'

export type CommandGroup = 'Pages' | 'Demos' | 'Actions'

/** Passed to every command's perform() so the command decides whether to
 *  close the palette and/or surface a toast — the component stays dumb. */
export type CommandContext = {
  /** Play the exit animation and close, restoring focus to the trigger. */
  close: () => void
  /** Show a transient line in the footer + announce it to screen readers. */
  toast: (message: string) => void
}

export type Command = {
  id: string
  title: string
  group: CommandGroup
  keywords: string[]
  /** Right-aligned meta shown in `.coord` style (e.g. "#work", ".pdf"). */
  hint?: string
  perform: (ctx: CommandContext) => void
}

/** Jump to an on-page section the same way Nav's <a href="#id"> does: set the
 *  hash and let the browser smooth-scroll. Works from case-study routes too —
 *  changing the hash re-renders home, then App's effect scrolls to the id. */
function goSection(id: string) {
  window.location.hash = id
}

function downloadResume() {
  const a = document.createElement('a')
  a.href = `${import.meta.env.BASE_URL}${site.resumeUrl}` // /SeanJoudrie/resume.pdf
  a.download = 'Sean-Joudrie-Resume.pdf'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function copyEmail(ctx: CommandContext) {
  try {
    await navigator.clipboard.writeText(site.email)
    ctx.toast(`Copied ${site.email} ✓`)
  } catch {
    // Clipboard blocked (insecure context / permissions) — fall back to mailto.
    window.location.href = `mailto:${site.email}`
    ctx.close()
  }
}

export const commands: Command[] = [
  // ---- Pages ----
  {
    id: 'home', title: 'Go to top', group: 'Pages', hint: 'top',
    keywords: ['home', 'top', 'intro', 'hero', 'start'],
    perform: (ctx) => {
      ctx.close()
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    },
  },
  {
    id: 'work', title: 'Work', group: 'Pages', hint: '#work',
    keywords: ['projects', 'portfolio', 'case studies', 'builds', 'ships'],
    perform: (ctx) => { ctx.close(); goSection('#work') },
  },
  {
    id: 'about', title: 'About', group: 'Pages', hint: '#about',
    keywords: ['bio', 'sean', 'who', 'background', 'story'],
    perform: (ctx) => { ctx.close(); goSection('#about') },
  },
  {
    id: 'lab', title: 'Lab', group: 'Pages', hint: '#skills',
    keywords: ['experiments', 'playground', 'skills', 'sandbox', 'lab'],
    perform: (ctx) => { ctx.close(); goSection('#skills') },
  },
  {
    id: 'range', title: 'Range', group: 'Pages', hint: '#range',
    keywords: ['demos', 'shelf', 'showcase', 'gallery'],
    perform: (ctx) => { ctx.close(); goSection('#range') },
  },
  {
    id: 'now', title: 'Now', group: 'Pages', hint: '#now',
    keywords: ['current', 'today', 'status', 'up to'],
    perform: (ctx) => { ctx.close(); goSection('#now') },
  },
  {
    id: 'contact', title: 'Contact', group: 'Pages', hint: '#contact',
    keywords: ['hire', 'reach', 'get in touch', 'message', 'hello'],
    perform: (ctx) => { ctx.close(); goSection('#contact') },
  },
  {
    id: 'cs-globalio', title: 'Globalio case study', group: 'Pages', hint: 'case study',
    keywords: ['geography', 'game', 'globe', 'daily challenge', 'prng', 'read'],
    perform: (ctx) => { ctx.close(); navigate('#/work/globalio') },
  },
  {
    id: 'cs-rex', title: 'REX case study', group: 'Pages', hint: 'case study',
    keywords: ['movies', 'tv', 'swipe', 'recommendation', 'tmdb', 'read'],
    perform: (ctx) => { ctx.close(); navigate('#/work/rex') },
  },
  {
    id: 'cs-flexyn', title: 'Flexyn case study', group: 'Pages', hint: 'case study',
    keywords: ['fitness', 'workout', 'social', 'supabase', 'xp', 'read'],
    perform: (ctx) => { ctx.close(); navigate('#/work/flexyn') },
  },

  // ---- Demos ----
  {
    id: 'demo-aeroscale', title: 'Open AeroScale dashboard', group: 'Demos', hint: 'demo',
    keywords: ['dashboard', 'analytics', 'charts', 'saas', 'metrics', 'ui'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/aeroscale') },
  },
  {
    id: 'demo-meridian', title: 'Open Meridian configurator', group: 'Demos', hint: 'demo',
    keywords: ['watch', 'configurator', 'product', 'customizer', '3d', 'meridian'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/meridian') },
  },
  {
    id: 'demo-ledger', title: 'Open Ledger Lens extractor', group: 'Demos', hint: 'demo',
    keywords: ['receipt', 'invoice', 'ai', 'extraction', 'claude', 'ocr', 'scan'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/ledger-lens') },
  },
  {
    id: 'demo-palisade', title: 'Open Palisade data grid', group: 'Demos', hint: 'demo',
    keywords: ['table', 'spreadsheet', 'rows', 'virtualization', 'freight', 'excel'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/palisade') },
  },
  {
    id: 'demo-terra', title: 'Open Terra particle Earth', group: 'Demos', hint: 'demo',
    keywords: ['globe', 'earth', 'particles', 'webgl', 'shader', '3d', 'planet', 'terra'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/terra') },
  },
  {
    id: 'demo-cortex', title: 'Open Cortex particle brain', group: 'Demos', hint: 'demo',
    keywords: ['brain', 'cortex', 'anatomy', 'hippocampus', 'neuro', 'particles', 'webgl', '3d'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/cortex') },
  },
  {
    id: 'demo-skull', title: 'Open Skull particle demo', group: 'Demos', hint: 'demo',
    keywords: ['skull', 'bones', 'anatomy', 'jaw', 'mandible', 'cranium', 'particles', 'webgl', '3d'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/skull') },
  },
  {
    id: 'demo-bloom', title: 'Open Bloom voxel rose', group: 'Demos', hint: 'demo',
    keywords: ['rose', 'flower', 'voxel', 'cubes', 'lod', 'detail', 'minecraft', 'webgl', '3d'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/bloom') },
  },
  {
    id: 'demo-riff', title: 'Open Riff playable guitar', group: 'Demos', hint: 'demo',
    keywords: ['guitar', 'amp', 'music', 'audio', 'sound', 'play', 'web audio', 'riff', 'electric'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/riff') },
  },
  {
    id: 'demo-spine', title: 'Open Spine particle vertebral column', group: 'Demos', hint: 'demo',
    keywords: ['spine', 'spinal cord', 'vertebra', 'vertebrae', 'backbone', 'anatomy', 'cervical', 'lumbar', 'particles', 'webgl', '3d'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/spine') },
  },

  // ---- Actions ----
  {
    id: 'copy-email', title: 'Copy email address', group: 'Actions', hint: site.email,
    keywords: ['email', 'mail', 'contact', 'address', 'sjoudrie', 'clipboard'],
    perform: (ctx) => { void copyEmail(ctx) }, // stays open to show the toast
  },
  {
    id: 'download-resume', title: 'Download résumé', group: 'Actions', hint: '.pdf',
    keywords: ['cv', 'resume', 'résumé', 'pdf', 'hire', 'download'],
    perform: (ctx) => { downloadResume(); ctx.close() },
  },
  {
    id: 'open-github', title: 'Open GitHub', group: 'Actions', hint: 'github.com',
    keywords: ['code', 'repos', 'source', 'git', 'profile'],
    perform: (ctx) => {
      ctx.close()
      window.open(site.github, '_blank', 'noopener,noreferrer')
    },
  },
  {
    id: 'survey-grid', title: 'Toggle survey grid', group: 'Actions', hint: 'easter egg',
    keywords: ['grid', 'graticule', 'map', 'overlay', 'coordinates', 'secret', 'cartography'],
    perform: (ctx) => {
      const on = toggleSurveyGrid()
      ctx.toast(on ? 'Survey grid on — press esc to clear' : 'Survey grid off')
      // Keep the palette open only briefly is unnecessary; close and let the
      // overlay stand on its own.
      ctx.close()
    },
  },
]

// ---- Scoring a command against a query (title + keyword aliases) ----------
import { fuzzyMatch } from '../lib/fuzzy'

export type ScoredCommand = { cmd: Command; score: number; positions: number[] }

/** Best fuzzy score across the title and every keyword. Highlight positions
 *  come from the title match only (keywords aren't shown, so nothing to mark).
 *  A keyword-only hit is nudged down slightly so a title hit always wins. */
export function scoreCommand(query: string, cmd: Command): ScoredCommand | null {
  const q = query.trim()
  if (q.length === 0) return { cmd, score: 0, positions: [] }

  const title = fuzzyMatch(q, cmd.title)
  let best = title.matched ? title.score : -Infinity
  let positions = title.matched ? title.positions : []

  for (const kw of cmd.keywords) {
    const r = fuzzyMatch(q, kw)
    if (r.matched && r.score - 3 > best) {
      best = r.score - 3
      if (!title.matched) positions = [] // no title chars to highlight
    }
  }

  if (best === -Infinity) return null
  return { cmd, score: best, positions }
}
