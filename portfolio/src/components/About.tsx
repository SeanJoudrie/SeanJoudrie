import { Reveal } from './Reveal'

export function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <Reveal>
          <p className="eyebrow mb-4">About</p>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            People first. <br className="hidden sm:block" />
            Systems that survive them.
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="space-y-5 text-lg leading-relaxed text-mute">
            <p>
              I work at the seam between people and the systems they use. A
              psychology degree taught me to start from how humans actually
              behave — not how a process diagram wishes they would — and to
              measure whether a system is really working.
            </p>
            <p>
              The military taught me the other half: leadership under pressure.
              As a U.S. Army National Guard officer candidate I lead peers as a
              platoon guide, where plans meet friction and someone has to keep a
              team accountable, calm, and moving. Operational rigor isn&apos;t a
              buzzword to me — it&apos;s a standard I&apos;ve been held to.
            </p>
            <p>
              And I build. Across fitness, social, games, and entertainment
              I&apos;ve conceived, designed, and shipped real products — owning
              the whole stack from the psychology of the user down to the
              database. That combination — understand people, build the system,
              lead the execution — is what I bring to a team.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
