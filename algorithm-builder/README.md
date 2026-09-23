# Algorithm Builder

**Live:** https://seanjoudrie.github.io/SeanJoudrie/algorithm-builder/

A free, two-minute web tool that fixes a stuck recommendation feed. Tell it what you're sick of and what you actually want; it gives you the exact buttons to press (remove first), a rehab playlist matched to your mix (then add), and a recipe link to come back to in a week. No login, and nothing is stored on a server.

- **Product review and roadmap:** [`docs/REVIEW.md`](docs/REVIEW.md) (every feature graded, MVP cut line, API keys and costs, brand, risks, 7-day plan).
- **Working name.** The name lives in one constant, `src/data/brand.ts`.

## What's in the MVP

| Area | Features (IDs from the review) |
| --- | --- |
| Flow | Platform picker (F-01), likes chips (F-02), problem presets + free text (F-03), "too much of what" (F-04, F-09), optional homepage tally (G-02) |
| Mix builder | Two-level mix (F-06), pie / bars / numbers views (F-07), auto-balance to 100% with locks (F-08), wildcard slice (F-10), time capsule (F-11) |
| Results | Cleanup checklist with curiosity quarantine (F-14, G-03), rehab playlist with search-link fallback (F-15, G-07), how-to-watch (F-16), signals card and platform tips matched to your problem (F-19 to F-24) |
| Come back | Recipe link (F-18), calendar tune-up reminder (F-05), before/after homepage check (G-02), browser-saved state (F-25) |
| Always | Mascot Gus (F-35), privacy note (G-10), rate-limited and cached search API (G-11), dark mode, keyboard and screen-reader support (G-08) |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Without a YouTube key the app works fully and the playlist becomes YouTube search links. To get real videos:

1. Create a Google Cloud project, enable **YouTube Data API v3**, and create an API key (restrict it to that API).
2. Put it in `.env.local` as `YOUTUBE_API_KEY=...` for local dev, or in the host's environment variables in production.

**Before sharing the Netlify link:** open it once with the key set and press **Play all on YouTube**. That queue link is undocumented by YouTube and couldn't be checked from the build machine; every video is also linked on its own either way.

The default quota is **100 search calls per day**. Each search is cached for 24 hours, so popular topics are free after the first hit. Request a quota increase before launch.

Optional: `VITE_TIP_URL=https://buymeacoffee.com/you` shows the one-line tip jar on the results page.

## Deploy

**GitHub Pages (current).** `.github/workflows/deploy.yml` builds this app alongside the portfolio on every push to `main` and serves it at `/SeanJoudrie/algorithm-builder/`. Pages can't run server code, so that build sets `VITE_SEARCH_API=off` and the playlist uses YouTube search links. Everything else works the same.

**Netlify (for real videos).**

`netlify.toml` builds the static app and serves `/api/search` from `netlify/functions/search.ts`. Set `YOUTUBE_API_KEY` in the site's environment variables. The same handler (`server/search.ts`) runs inside `vite dev`.

## Checks

```bash
npm test           # logic + API handler (Vitest)
npm run build      # typecheck + production build
npm run smoke      # clicks every button in Chromium (phone + desktop, light + dark),
                   # incl. the real /api/search handler against a fake YouTube,
                   # quota running out, tip-guide platforms and reduced motion
node scripts/og.mjs  # regenerates the share image and home-screen icon
```

## Layout

```
src/
  App.tsx                 flow + routing between steps
  components/             Steps, MixStep, MixChart, Results, Mascot, ui
  data/                   topics, problems, platform playbooks, brand
  lib/                    mix math, recipe links, checklist, playlist, calendar file
server/search.ts          YouTube search proxy: key, cache, rate limit, quota back-off
netlify/functions/        production wrapper for the proxy
docs/REVIEW.md            the full product review
```
