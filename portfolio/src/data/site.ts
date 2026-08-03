// Central site configuration. Flip these on as real assets/links land so the
// UI never renders a broken link or a literal "[FILL]" placeholder.

export const site = {
  name: 'Sean Joudrie',
  tagline: 'Designer-builder',
  email: 'sjoudrie@gmail.com',
  github: 'https://github.com/SeanJoudrie',

  linkedin: 'https://www.linkedin.com/in/seanjoudrie' as string | null,
  location: 'Wakefield, MA',
  availability: 'Boston · Remote · Open to work',

  // Portrait for the About section. null shows a monogram.
  photo: 'sean-uniform.webp' as string | null,

  // Résumé lives at public/resume.pdf.
  hasResume: true,
  resumeUrl: 'resume.pdf',

  /* ---- Prose ------------------------------------------------------------
     The page is a client-rendered SPA, so anything that only exists inside
     JSX is invisible to crawlers, link previews, and AI assistants — they
     fetch the HTML and never run React. Copy lives here instead so the
     no-JavaScript summary baked into index.html at build time
     (plugins/static-fallback.ts) and the React UI always say the same thing.
     ---------------------------------------------------------------------- */

  // Plain-text twin of the Hero's stylized <h1>; keep the two in step.
  headline: 'I design interfaces you can play.',
  intro:
    'Self-taught, from first sketch to shipped code. Most recently: a geography game with 50+ ways to play and a 4,000-entry codex — designed, built, and live in a week.',
  seeking:
    'Looking for: product / UI design & design-engineer roles — full-time or contract.',
  bio: [
    "I'm a self-taught designer-builder with a psychology degree — I design for how people actually behave, then measure whether it worked. Everything in the index above I conceived, designed, and shipped myself, from the first sketch to the deployed build.",
    'I build with AI agents deliberately, and the leverage is real — it is why this index runs a dozen entries deep instead of two. What they do not do is decide. Baking 80,000 anatomical points into a single 548 KB binary instead of shipping 100 MB of models; hinging a jaw on its real temporomandibular axis inside a vertex shader so 60,000 other points never touch the CPU; hand-rolling row virtualization for 10,000 rows rather than reaching for a grid library — those are architecture calls, and they are mine. Working this way took Globalio from an empty repo to a live game with 50+ modes in a week.',
    "The standard comes from the Army — I'm a National Guard officer candidate, and “good enough” isn't a phrase that survives there.",
  ],
  contactBlurb:
    'Design, front-end, and product-build roles or freelance work. One email reaches me — I reply within 24–48 hours.',
}

/**
 * Returns the trimmed string, or undefined if it is empty or still an
 * unfilled "[FILL ...]" placeholder — so callers can conditionally render.
 */
export function real(value: string | undefined | null): string | undefined {
  if (!value) return undefined
  const v = value.trim()
  if (!v || v.includes('[FILL')) return undefined
  return v
}
