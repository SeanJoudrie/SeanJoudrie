// Central site configuration. Flip these on as real assets/links land so the
// UI never renders a broken link or a literal "[FILL]" placeholder.

export const site = {
  name: 'Sean Joudrie',
  email: 'sjoudrie@gmail.com',
  github: 'https://github.com/SeanJoudrie',

  linkedin: 'https://www.linkedin.com/in/seanjoudrie' as string | null,
  location: 'Wakefield, MA',

  // Résumé lives at public/resume.pdf.
  hasResume: true,
  resumeUrl: 'resume.pdf',

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
