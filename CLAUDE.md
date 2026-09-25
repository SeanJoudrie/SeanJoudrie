# Working in this repo

## Sharing work

- Never publish a claude.ai Artifact. To share a page or prototype, deploy it to this repo's GitHub Pages site (`.github/workflows/deploy.yml`, served at https://seanjoudrie.github.io/SeanJoudrie/) and give the GitHub Pages link.

## Design standard: nothing that looks vibe coded

Check every page against `docs/vibe-coded-websites-report.md` before shipping, and fix anything that fails.

- **Visuals:**
  - No purple gradients, neon or glows.
  - No sparkles, and no emoji used as icons or bullets.
  - No fake testimonials, user counts or logos.
  - No social icons that go nowhere.
  - No huge icons next to small text.
  - No semi-transparent or blurred headers.
- **System:**
  - One spacing scale (4px), used for every margin, padding and gap.
  - One font pair with a fixed type ramp.
  - A small palette.
  - Standard radiuses from tokens, not one-off values.
  - One elevation style.
  - One container width, so left edges line up from section to section.
- **Motion:** hover effects stay subtle (color or border only; no lifting, tilting or bouncing). Animation happens only when it's tied to what the person did, and none runs under `prefers-reduced-motion`.
- **Behavior:**
  - Every button, link, toggle and form works.
  - Anything that takes time shows a loading state.
  - Anything that isn't built yet is hidden or clearly labeled, never a dead control.
- **Copy:**
  - A specific promise, no generic taglines ("Launch faster", "Build your dreams").
  - Correct footer text.
  - Example content labeled as an example.
- **Technical:**
  - A page title, meta description, OpenGraph image and favicon.
  - A layout that works at 375px before desktop is polished.
