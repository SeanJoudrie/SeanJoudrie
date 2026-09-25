# Perfect Prompt

**Live:** https://seanjoudrie.github.io/SeanJoudrie/perfect-prompt/ (after the next deploy from `main`)

One place to build the right prompt for any project, check any prompt for gaps, keep the ones that worked, and test prompts against real pages.

No single mega prompt can be right for a poop tracker, a 3D model and a geography game at once, because most of what makes a prompt good is context about that one project. So this doesn't try to write one perfect prompt. It builds the thing that writes it, and it measures whether the result is actually better.

## The four tabs

| Tab | What it does |
| --- | --- |
| **Build** | Describe what you're making, however messily. Either copy the [Prompt Builder](PROMPT_BUILDER.md) with your description attached and paste it into Claude, or fill in the six sections yourself (role and goal, context, task, constraints with reasons, what good looks like, output) and watch the prompt assemble. |
| **Check** | Paste any prompt. It flags what's missing: no goal, no context, no definition of done, rules without reasons, everything marked "must", shouting, vague words like "premium", mostly "don't", no plan for when the model is unsure, leftover placeholders. Rules in `src/lib/check.ts`. |
| **Library** | Saved prompts, with prompts rated "Worked great" at the top. Rate a prompt after you use it. The starter prompts live in `/prompts` and `src/data/seeds.ts`. Your own prompts are saved in this browser; use Export and Import to back them up or move them. |
| **Lab** | Side-by-side tests of prompts on frozen copies of real pages, with measurements. The live apps are never touched. |

## Lab test 1: the "No vibe-coded look" prompt

The prompt from Aftermark AI's vibe-coded websites report was tested on a frozen copy of Algorithm Builder's front page. The same prompt was also run through the Prompt Builder with the app's brand and audience, and tested the same way. Each version was made by a separate run that saw only its own prompt and the page.

Both versions came out cleaner than the original page. The tailored prompt did better on what this app needs:
- **Button on a phone:** "Fix my feed" ended at 389px down the screen, compared with 624px for the original prompt.
- **Copy:** stayed simple. The original prompt's hero reads at grade 6.1 and is twice as long.
- **Brand:** Gus's blink stayed.
- **Honesty:** it added nothing untrue. The original prompt added a fake loading spinner.

The full write-up is in the Lab tab. The files are in `public/lab/algorithm-builder-home/`.

**Run a new test:**
1. Put a frozen copy of the page in `public/lab/<slug>/before/`.
2. Have a separate run apply each prompt to a copy in `public/lab/<slug>/<version>/`.
3. Run `npm run shoot -- <slug>` for the screenshots and `npm run audit -- <slug>` for the measurements.
4. Add the write-up to `src/data/lab.ts`.

The audit's page checks (the "Fix my feed" button, the hero text) are written for Algorithm Builder. Change them in `scripts/audit.mjs` for a different page.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # checker and builder tests
```
