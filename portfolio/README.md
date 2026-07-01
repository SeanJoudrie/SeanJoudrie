# Sean Joudrie — Portfolio

A fast, single-page personal site built as the front door for two audiences:
**defense/contractor hiring managers** (analyst, operations, project-management
roles) and **founders/recruiters** evaluating shipped product work. The spine is
*human-systems design* — psychology + military leadership + product engineering.

Built with **React 19 + Vite 6 + TypeScript + Tailwind CSS v4**. Static deploy,
Netlify-ready. No backend.

## Run it

```bash
npm install
npm run dev      # local dev server (http://localhost:5173)
npm run build    # type-check + production build → dist/
npm run preview  # serve the production build locally
```

## Deploy (Netlify)

- **Drag-and-drop:** run `npm run build`, then drop the `dist/` folder onto
  https://app.netlify.com/drop.
- **Git-connected:** point Netlify at the repo. `netlify.toml` already sets
  `build = npm run build` and `publish = dist`, with an SPA redirect.

Add a custom domain (e.g. `seanjoudrie.com`) in Netlify → Domain settings, and
update the two URLs in `index.html` (`og:url`) once it's live.

## Where to drop in your real content — search for `[FILL]`

Everything you need to personalize is marked `[FILL]` in the code:

| What | File |
|---|---|
| **Résumé PDF** | Drop your file at `public/resume.pdf`. Every "Download résumé" button already points to `/resume.pdf`. |
| **Project screenshots** | Add images to `public/shots/` (e.g. `public/shots/rex.webp`), then set the `screenshot:` field on that project in `src/data/projects.ts`. WebP/AVIF preferred. |
| **Flexyn / REX live links** | `src/data/projects.ts` — uncomment/replace the `liveUrl` fields. |
| **Experience timeline** | `src/data/experience.ts` — replace `[FILL]` org names, dates, and bullets with your real history. |
| **LinkedIn URL** | `src/components/Contact.tsx` — `LINKEDIN` constant. |
| **Social preview image** | Add `public/og.png` (1200×630). Meta tags in `index.html` already reference `/og.png`. |
| **Email** | Already set to `sjoudrie@gmail.com` in `Contact.tsx` (and the `mailto:` links). Change there if needed. |

## Structure

```
src/
  App.tsx                  # section composition + skip link
  index.css                # Tailwind v4 @theme tokens (navy + amber), reveal styles
  data/
    projects.ts            # the four projects + case studies  ← edit copy here
    experience.ts          # timeline (military / education / work)  ← edit here
  hooks/
    useReveal.ts           # scroll-reveal (reduced-motion safe)
    useScrollSpy.ts        # active-section highlighting in the nav
  components/
    Nav, Hero, About, Work, ProjectCard, Experience, Contact, Footer, Reveal
```

## Design notes

- **Palette:** deep navy (`--color-navy-*`) with a sharp amber accent
  (`--color-accent`), defined as Tailwind v4 theme tokens in `src/index.css`.
- **Type:** Space Grotesk (display) + Inter (body), loaded via Google Fonts in
  `index.html`.
- **Motion:** IntersectionObserver scroll reveals + micro-interactions, all
  gated behind `prefers-reduced-motion`.
- **A11y:** semantic landmarks, skip link, focus-visible rings, labeled controls,
  `aria-expanded` on the nav toggle and case-study expanders.
- **SEO:** Open Graph + Twitter cards, descriptive title/description, SVG favicon.

## Suggested next adds

- Real screenshots/GIFs per project (biggest visual upgrade).
- A 1200×630 `og.png` so shared links unfurl nicely.
- 2–3 testimonials once you have them (add a section after `Work`).
