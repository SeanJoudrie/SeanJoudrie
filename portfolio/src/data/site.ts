// Central site configuration. Flip these on as real assets/links land so the
// UI never renders a broken link or a literal "[FILL]" placeholder.

export const site = {
  name: 'Sean Joudrie',
  email: 'sjoudrie@gmail.com',
  github: 'https://github.com/SeanJoudrie',

  // Set to a real URL once the LinkedIn profile is ready, e.g.
  // 'https://www.linkedin.com/in/sean-joudrie'. Null hides the link.
  linkedin: null as string | null,

  // Drop the file at public/resume.pdf, then set this to true. While false,
  // every "Download résumé" CTA is hidden instead of pointing at a 404.
  hasResume: false,
  resumeUrl: '/resume.pdf',

  // Shown in the "Now" section so it reads as intentionally current.
  nowUpdated: 'July 2026',
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
