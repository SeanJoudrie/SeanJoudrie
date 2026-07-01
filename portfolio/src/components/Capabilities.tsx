import { Reveal } from './Reveal'

/**
 * A plain, honest skills index — no bars, no percentages. Four columns that
 * mirror the claim of the site: design it, build it, structure the data,
 * direct the process.
 */
const GROUPS: { title: string; items: string[] }[] = [
  {
    title: 'Design',
    items: [
      'Interface systems & layout',
      'Typography & hierarchy',
      'Motion & micro-interaction',
      'Design-in-product branding',
    ],
  },
  {
    title: 'Build',
    items: [
      'React + TypeScript',
      'Tailwind CSS',
      'Supabase · Postgres · RLS',
      'PWA, offline & WebRTC',
    ],
  },
  {
    title: 'Data',
    items: [
      'Schema & data modeling',
      'Deterministic / seeded systems',
      '4,000-entry codex design',
      'Analytics & measurement',
    ],
  },
  {
    title: 'Direct',
    items: [
      'AI-agent build workflows',
      'Product scoping & roadmaps',
      'Shipping solo, end to end',
      'Operational discipline',
    ],
  },
]

export function Capabilities() {
  return (
    <section id="skills" className="border-b border-line bg-paper-2/40">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="annotation whitespace-nowrap">Capabilities</span>
            <span className="dim-line flex-1" />
          </div>
        </Reveal>

        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {GROUPS.map((g, i) => (
            <Reveal key={g.title} delay={i * 50}>
              <h3 className="font-display text-xl font-semibold text-ink">{g.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {g.items.map((item) => (
                  <li
                    key={item}
                    className="relative pl-4 text-[0.95rem] leading-snug text-ink-2 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-accent/70"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
