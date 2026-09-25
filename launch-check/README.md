# Launch Check: prototype

Launch Check tells people who built an app with AI what they still need to do before they can release it. You describe the app and answer a few questions, and it gives you the biggest gaps first, then an ordered checklist. Every step says what to do, why it matters and how, with links to the rule or guide it comes from.

Open `index.html` by double-clicking it. There's no build step and no server.

## What's real and what isn't

- **The checklist is real and sourced.** `data.js` holds 75 steps, each with the conditions it applies under, what to do, why, how, and links. The links were checked in September 2026 (see `RESEARCH.md`).
- **The plan comes from your answers.** The prototype doesn't analyze code. It guesses answers from your description with simple keyword matching, and shows each guess next to the sentence it came from so you can correct it.
- **Nothing leaves your browser.** Pasted text and code stay on the page.
- **It isn't legal advice.** The results page says so once, next to the sources.

## Files

| File | What it is |
|---|---|
| `index.html` | All screens: landing, describe, narrow it down, questions, checking, results |
| `styles.css` | Design tokens and components |
| `app.js` | Routing, answer guessing, the plan engine, copy buttons |
| `data.js` | The master checklist: phases, steps, conditions and sources |
| `RESEARCH.md` | Sourced facts, rejection statistics and marketing lines |
| `config.js` | Account sync settings (empty means projects stay in the browser) |
| `supabase.sql` | The database table and security rules for accounts |

## How a plan is built

1. **Describe:** paste a summary your AI wrote (recommended), or paste code after a privacy warning.
2. **Narrow it down:** what you built (iPhone, Android, both, website, extension), the category, and one detail for categories with extra rules.
3. **Questions:**
   - whether it's for children
   - whether it has sign-up
   - whether it charges money
   - where data lives
   - analytics and ads
   - AI
   - whether people see each other's posts
   - where a website is hosted
   - what's already done

   "Not sure" adds a step that tells you how to find out.
4. **Results:**
   - "Must fix" gaps first.
   - A cost and time table.
   - The checklist in launch order, which you can filter to "Must fix" only, tick off and copy as text.

Each item in `data.js` has `when(c)`, which decides whether it applies. Its `title`, `why`, `steps`, `gap` and `sources` can be plain values or functions of the answers, which is how web apps get web wording and Lovable users get Lovable steps.

## Design system

The direction is **pre-flight check**: ink and cool white, runway yellow for the one thing to do next, green for done and red for must-fix. Headlines are condensed and uppercase, so they take less room and read like a checklist.

- **Type:**
  - Archivo, a variable font with a width axis: condensed (68–75%) for headings, normal width for text.
  - JetBrains Mono for counters and labels.
- **Color:**
  - Yellow `#ffc700` with ink text for the main action.
  - Red `#c2302a` (dark mode `#ff6b61`) for must-fix, green `#0f7a45` (dark mode `#3dd68c`) for done.
  - The header, hero, results report and step-by-step bar stay dark in both themes.
- **Shape and spacing:** a 10px radius, 2px borders, no shadows, and a 4px spacing scale.
- **Contrast:** checked for both themes. Text is at least 4.6:1, and borders and the focus ring are at least 3:1.

## Do this now: one step at a time

Results open with the next step on its own screen. Each screen has:
- what to do, why, and the numbered actions
- sources, collapsed under the step

To move through the steps:
- **Done, next** marks the step done and moves on.
- **Skip for now** moves on without marking it done.
- On a phone, swipe left for the next step and right to go back. Arrow keys work on a keyboard.

## Projects and accounts

Each check is saved as a project in the browser (`localStorage`), with its name, answers and progress. Pasted code is never stored. **My projects** lists them with progress bars.

Sign-in is built but off until a database is chosen. To turn it on:
1. Create a Supabase project and run `supabase.sql`.
2. Under Authentication → Providers, enable Google. This needs a Google Cloud OAuth client. Email links also work.
3. Add your GitHub Pages address to the redirect URLs.
4. Put the project URL and publishable key in `config.js`.

Signed-in projects sync both ways, and the newer copy wins.

## Publishing

Pushing to `main` deploys to GitHub Pages at https://seanjoudrie.github.io/SeanJoudrie/launch-check/ through `.github/workflows/deploy.yml`.
