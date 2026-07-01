export function Footer() {
  const year = 2026
  return (
    <footer className="border-t border-navy-800/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row sm:px-8">
        <p className="font-display text-sm font-semibold text-ink">
          Sean Joudrie<span className="text-accent">.</span>
        </p>
        <p className="text-sm text-faint">
          © {year} · Built from scratch — like everything here.
        </p>
        <div className="flex gap-5 text-sm text-mute">
          <a href="#work" className="hover:text-ink">
            Work
          </a>
          <a href="#contact" className="hover:text-ink">
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
