# Perfect Prompt

One prompt that builds the right prompt for any project.

A single "mega prompt" can't be perfect for a poop tracker, a 3D model and a geography game at the same time, because what makes a prompt good is the project-specific context. So this project doesn't try to write that one prompt. It builds the thing that writes it: a **prompt builder** that interviews you, fills a proven structure, and checks the result for weak spots.

## Use it

1. Open [`PROMPT_BUILDER.md`](PROMPT_BUILDER.md) and copy the block between the lines.
2. Paste it into a new chat and describe what you're making, however messily.
3. Answer its questions (or reply "defaults"), and it hands back a finished prompt plus the three ways it could still go wrong.

## Why it works

Most of the gap between a weak prompt and a strong one comes down to a few things:

| Weak prompt | Strong prompt |
| --- | --- |
| "Make me a workout app" | Says who it's for, what exists already, and what done looks like |
| Rules with no reasons | Each rule has a "because", so the model handles cases you didn't list |
| "Make it good" | A concrete bar: "a new user logs a workout in 3 taps" |
| Unclear output | Says exactly what to hand back and what to do when unsure |

The builder forces every prompt through those checks, so you don't have to remember them.

## Where this goes next

- **Test set.** Save 5 to 10 real requests from past projects, run each through the builder, and compare output quality before and after every change to `PROMPT_BUILDER.md`. That's how "improving the prompt" becomes measurable instead of vibes.
- **Project files.** Anything you return to more than once should become a `CLAUDE.md` (or project instructions) so the context loads every time.
- **App.** A small page in this repo: paste your ramble, answer the questions in a form, copy the finished prompt, and keep a library of the ones that worked.
