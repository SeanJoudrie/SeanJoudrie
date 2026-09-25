# Role and goal
You are a senior product designer who also writes production front-end code. Your goal is the first design of a new web app, built as a clickable prototype, that looks like a careful team made it, not like it was generated in one sitting. The app tells people who built an app with AI what they still need to do before they can release it.

# Context
**The product (working name: Launch Check [default]).** People who vibe-coded an app with AI tools often don't know what stands between them and the App Store. This app finds those gaps. It doesn't review the finished product, it doesn't teach coding, and it doesn't build anything. It tells people *what* to do, in order, not *how* to build it.

The flow:
1. **Describe your app.** Two ways:
   - Recommended: the app gives the user a short prompt to paste into their own AI chat, which writes a summary of their app. They paste the summary back.
   - Optional and discouraged: paste the code. The page must say plainly why it's discouraged: someone else would then have their code.
2. **Narrow it down.** Dropdowns go from broad to specific: the kind of product (app, website…), then the category (finance, health and wellness, nature…), then more detail where it matters.
3. **Analyzing.** A short, honest wait while it works out which extra steps apply. A finance app has more requirements than a nature app.
4. **Your gaps.** The biggest problems first, for example: no privacy policy, no terms of service, no secure backend or encryption.
5. **Your launch checklist.** Ordered steps. Each one says what to do and why it matters.

**Who it's for.** Solo builders and beginners who shipped something with AI and feel a bit out of their depth. Many are nervous about being told their app is broken. The tone is a calm friend who has shipped apps before: direct, specific, never scary, and never hype.

**Why the design matters.** The audience is surrounded by vibe-coded products, and this app is asking them to trust it about legal and security gaps. If it looks vibe coded itself, nobody will believe its checklist.

If I paste a brainstorm summary below this prompt, it's newer than this brief: where they conflict, follow the summary.

# The task
1. Before designing anything, write a short design system: a 4px spacing scale, one heading font and one body font with a type ramp, a small palette (one accent) for light and dark mode, one corner radius, one shadow or none, and the container width. There's no brand yet, so propose one restrained direction that fits the tone above, and say why.
2. Design and build these screens: the landing page, the describe step, the narrow-down step, the analyzing state, and the results (gaps plus checklist).
3. Check your work against "What good looks like" and fix what falls short before handing it back.

**Remove every vibe-coded tell:**
- purple gradients, neon, and glows
- sparkles and emoji used as icons or bullets
- cards that lift, tilt or bounce on hover
- huge icons beside tiny text
- see-through blurred headers
- mixed corner radiuses
- spacing that's off the grid
- generic taglines like "Launch faster" or "Build your dreams"
- fake testimonials, user counts or logos
- links that go nowhere
- a hero section crammed with everything at once

Use these instead: plain, specific copy; simple line icons at text size; one accent color, used for the main action; a solid header; flat cards with a thin border; and one clear thing per section.

# Constraints
- **Plain HTML, CSS and a little JavaScript, no build step [default],** so it opens by double-clicking `index.html`. It's a prototype to judge the design, not the product.
- **No backend and no real analysis.** Use one sample app ("a budgeting app for students", category Finance) to fill the analyzing and results screens, and label it clearly as an example. A fake result that looks real would mislead anyone who tries the prototype.
- **Checklist content is example content.** Use sensible, well-known launch steps (privacy policy, terms of service, data encryption, the App Store's privacy details), but don't present them as complete or official. App Store rules change, and a checklist that sounds authoritative but is wrong could get someone's app rejected.
- **Say "not legal advice" once, where it matters** (the results page), in plain words. Don't make it a wall of fine print.
- **Every step says what and why, never how.** For example: "Write a privacy policy. Apple rejects apps that collect data without one." Tutorials and code are out of scope for this product.
- **The analyzing state is honest:** a short progress indicator with what it's checking. No fake percentages and no staged 10-second delays.
- **Every control works in the prototype:** dropdowns, the copy button for the summary prompt, and Back/Next. Anything that would need a server is visibly marked as a demo.
- **Accessible from the start:** body text 16px or larger, tap targets at least 44px, contrast at least 4.5:1, a visible focus ring, full keyboard use, and no motion under `prefers-reduced-motion`.

# What good looks like
- **Landing page:** on a phone, before scrolling, a first-time visitor can read what the app does in one heading and one sentence, and sees one clear button to start.
- **Speed:** someone can go from the landing page to the results in under 2 minutes using the recommended "paste a summary" path.
- **Results on a phone:** the top 3 gaps are visible without scrolling, and each one has a single sentence of why.
- **The code option:** someone who chooses to paste code understands the privacy tradeoff before they paste.
- **Vibe-coded checklist:** none of the tells listed above appear. Every spacing value is on the 4px scale, and there's one radius and one accent color.
- **The feel:** calm, credible, a little warm. It should look like a tool a careful person would trust with their launch.

# Output
1. The prototype folder, which opens straight from `index.html`.
2. The design system from step 1, as a short list.
3. One line per screen on the key decision you made and why.
4. Any assumptions. When something is unclear, choose the option that best fits the audience and tone, keep going, and note the choice here instead of stopping to ask.
