import { site } from '../data/site'

export function Footer() {
  const year = 2026
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-faint sm:flex-row sm:px-8">
        <p>
          Designed &amp; built by {site.name} — set in Fraunces &amp; Inter, no template.
        </p>
        <p className="coord">© {year} · Wakefield, MA</p>
      </div>
    </footer>
  )
}
