# Algorithm Builder

**Live:** https://seanjoudrie.github.io/SeanJoudrie/algorithm-builder/

A free tool that fixes a feed stuck on one topic, in about a minute and five taps. Three questions (what's taking over, roughly how much, what you want more of), then "Do these 3 things today", real videos to watch, and a personal link to check back in a week. No login, and nothing is stored on a server.

- **Product review and roadmap:** [`docs/REVIEW.md`](docs/REVIEW.md) (every feature graded, MVP cut line, API keys and costs, brand, risks, 7-day plan).
- **UX audit and what changed:** [`docs/UX_AUDIT.md`](docs/UX_AUDIT.md) (measured before/after, the "grandma rules", copy deck).
- **Topic library:** [`docs/ux/TAXONOMY.md`](docs/ux/TAXONOMY.md), data in `src/data/taxonomy.json` (202 topics with about 2,000 related words so "lipstick" finds Beauty & makeup, 194 "show me less of" entries). Hand-picked videos in `src/data/pool.json`.
- **Words:** every string the app shows is in `src/copy.ts`; `npm test` fails if one reads above a 6th-grade level or uses retired jargon.
- **Working name.** The name lives in one constant, `src/data/brand.ts`.

## What's in the MVP

| Area | Features (IDs from the review) |
| --- | --- |
| Flow | Q1 what's taking over, with an app picker and typo-tolerant search over 194 names (F-01, F-04, F-09); Q2 a one-tap estimate, only if something was named (G-02); Q3 what you want more of, 3 topics pre-picked from Q1, 202 topics in 20 groups (F-02); the problem is inferred, not asked (F-03) |
| Results | "Do these 3 things today" with "More ways to fix it" (F-14, G-03, F-19 to F-24); videos: hand-picked and verified first, YouTube search second, search links last (F-15, G-07); one-sentence summary of the new feed |
| Change it | Optional editor: two-level feed, pie / bars / list (F-06, F-07), always 100% with "Keep the same" (F-08), "Surprise me" (F-10), "Add great old videos" (F-11) |
| Come back | Personal link (F-18), calendar reminder (F-05), "Is your feed better?" check next week (G-02), browser-saved state (F-25) |
| Always | Gus the mascot (F-35), privacy and terms pages (G-10), rate-limited and cached search API (G-11), dark mode, 18px text, 48px targets, keyboard and screen readers (G-08) |

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
npm run smoke      # clicks every button in Chromium (phone + desktop, light + dark):
                   # real /api/search against a fake YouTube, quota running out,
                   # "just boring" path, tip-guide apps, 200% text on a 320px
                   # phone, reduced motion, and links from before this update
npm run verify:pool  # re-checks every hand-picked video with YouTube (run monthly)
node scripts/og.mjs  # regenerates the share image and home-screen icon
```

## Layout

```
src/
  App.tsx                 flow + routing between steps
  copy.ts                 every word the app shows (reading-level tested)
  components/             Flow (landing + 3 questions), Results, AdjustSheet, MixStep, MixChart, Mascot, ui
  data/                   taxonomy.json, pool.json, library (search, suggestions), playbooks, brand
  lib/                    mix math, recipe links, checklist, playlist, calendar file
server/search.ts          YouTube search proxy: key, cache, rate limit, quota back-off
netlify/functions/        production wrapper for the proxy
docs/REVIEW.md            the full product review
```
