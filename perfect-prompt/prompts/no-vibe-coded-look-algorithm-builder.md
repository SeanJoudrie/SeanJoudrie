# Role and goal
You are a senior product designer who also writes production front-end code. Your goal is to redesign the front page of Algorithm Builder so that someone who lands on it cold, on a phone, understands what it does and taps "Fix my feed" within 10 seconds. The page should look like a mature product team made it, while staying warm and friendly rather than corporate.

# Context
**The product.** Algorithm Builder is a free web tool that fixes a social media feed that has got stuck on one topic. The user answers three quick questions, then gets a short list of "Do these 3 things today" steps and videos to watch. There is no login and nothing is stored on a server. The front page has one job: get people to start.

**Who it's for.** Everyone, including older and non-technical people. The team holds the whole product to "grandma rules":
- Copy at a 6th-grade reading level.
- Body text 18px; no text anywhere smaller than 16px.
- Tap targets at least 48px tall and wide.
- Fully usable by keyboard and by screen reader.
- Supports dark mode.

**Brand.**
- Color: a warm off-white "paper" background, dark "asphalt" ink for text, and one safety-orange accent (it comes from the mascot's hard hat). That's the whole palette, plus tints and shades of those three.
- Type: headings in Bricolage Grotesque, body in Public Sans. Both are in the snapshot's `fonts/` folder.
- Mascot: Gus, a calm, slightly dry mechanic in an orange hard hat.
- Voice: plain and calm, never hype. "Give it a few days", not "Guaranteed results!"
- Motion: 200 to 400ms eases. Nothing loops except Gus's idle blink. All motion is turned off under `prefers-reduced-motion`.
- Spacing: a 4px grid.

**What you're given.** A static snapshot of the current front page, as a folder containing `index.html`, `style.css` (compiled Tailwind output), `fonts/`, and `favicon.svg`. The meta tags, OG image, favicon, and accessibility work on the current page are already done and correct.

**Why this matters.** The current page reads as "vibe coded": the look you get when a page is generated quickly with no design system behind it. For an audience that includes wary, non-technical visitors, that look costs trust. A page that feels considered and calm tells them the tool is safe to try.

# The task
1. Copy the snapshot folder to the output folder you're given (or a new sibling folder if none is named) and make all edits in the copy. The original stays untouched so the two can be compared.
2. Read the whole of `index.html` and `style.css` before changing anything. Note what the page currently says, which elements exist (including Gus, if he appears), and which accessibility features are already in place (landmarks, labels, alt text, focus styles, skip link, color-scheme handling, and so on), so you can keep all of them.
3. Plan before you edit. Write down, briefly:
   - The spacing scale you'll use (4px steps, for example 4, 8, 12, 16, 24, 32, 48, 64, 96).
   - The type ramp: each size and line height, with body at 18px and nothing under 16px.
   - The color tokens for light and dark mode, with the text/background pairs you'll use.
   - One border radius and one shadow style that every component will share.
   - The container width and grid you'll align content to.
   - What a phone visitor sees before they scroll.
4. Redesign the page against that plan, working through the checklist below.
5. Check the result against "What good looks like" and fix whatever falls short before you hand it back.

**The vibe-coded checklist.** Find each of these and remove or correct it. A page with any of them left in reads as unfinished.
- **Spacing off the grid.** Every margin, padding, and gap should come from your 4px scale. Uneven rhythm is one of the clearest tells.
- **Type without a system.** Use one heading font and one body font, a fixed ramp, and a clear heading hierarchy (one `h1`, then `h2`s in order). Body text should be regular weight, neither heavy nor thin. Keep the space between text blocks consistent.
- **Color used for novelty.** No gradients, neon, glows, or purple. Use the orange accent to point at what matters most, mainly the "Fix my feed" button, rather than scattering it around.
- **Components that don't match.** Buttons, cards, and any other components share the same radius, shadow, and padding logic, so they look like they belong together.
- **Stray decoration.** Sparkles, random emoji, decorative blobs, shadows nobody chose on purpose.
- **Generic or inflated copy.** Hero lines like "Take control of your digital life" say nothing. Say plainly what the tool does: it helps fix a feed that's stuck on one topic, in three questions.
- **Wobbly layout.** Content aligns to one grid, containers have predictable widths, sections get even breathing room, and not everything is centered. Left-aligned body text is easier to read.
- **Motion for its own sake.** Hover and focus effects are subtle and don't shift the layout. Anything that moves does so in response to the user, except Gus's blink.
- **Broken small screens.** The layout works from 320px wide up to desktop, with no horizontal scrolling.

# Constraints
- **Keep it a static page with no build step.** `style.css` is compiled Tailwind output, and nothing will recompile it. Any Tailwind class that isn't already in that file will do nothing. Put new styles in a hand-written stylesheet (for example `site.css`, linked after `style.css`) [default], and only use Tailwind classes you have confirmed exist in `style.css`.
- **"Fix my feed" is the one call to action.** Make it the most prominent thing on the page and don't add competing buttons. More choices slow people down, and the 10-second goal depends on there being only one obvious next step. A repeat of the same button lower on the page is fine.
- **Leave the button inert.** In the real app "Fix my feed" starts the questions. In the snapshot it does nothing, and that's expected. Don't wire it up, point it at a fake URL, or give it a pretend loading state; the real app handles that.
- **Keep the content honest.** You may rewrite copy to make it clearer, shorter, or easier to read, but every claim has to come from the existing page. Don't invent testimonials, statistics, user counts, logos, or features. Fake social proof is itself one of the tells of vibe-coded work, and it would mislead the audience this tool is meant to protect.
- **Don't break what already works.** Leave the meta tags, OG image, and favicon exactly as they are, since they're already correct. Keep every existing accessibility feature, and make sure nothing you add goes backwards: visible focus styles, text alternatives, and semantic landmarks all stay.
- **Meet grandma rules everywhere, in light and dark mode.** Text contrast of at least 4.5:1, and 3:1 for large text and UI boundaries [default]. Safety orange is usually too light to carry small text on off-white, so use it for fills and large shapes, and check the contrast of the button label against the orange.
- **Use the local fonts.** Load them from `fonts/` with `@font-face` and `font-display: swap`, not from a CDN, so the page stays self-contained.
- **Follow the motion rules.** Use 200 to 400ms eases, allow no loops other than Gus's blink, and turn all motion off under `prefers-reduced-motion: reduce`.
- **Keep Gus as he is.** If he's in the page, keep him and give him a sensible place in the layout. Don't draw a new mascot or change his character [default]. If he's not in the snapshot, don't create one; mention it in your notes instead.
- **Stay in scope.** Redesign this front page only. Other pages, the question flow, and the rest of the app are out of scope.

# What good looks like
- **On a 375×667 phone screen [default], before any scrolling:** a visitor can read what the tool does in one short heading and one sentence, and sees the "Fix my feed" button. A cold visitor could understand it and tap within 10 seconds.
- **Every spacing value** is a multiple of 4px. Every text size is 16px or larger, with body text at 18px. Every tap target is at least 48px.
- **One radius and one shadow style** are used across all components.
- **The page reads well in both light and dark mode,** and all text passes the contrast ratios above.
- **Keyboard use works:** tabbing through the page reaches everything interactive in a sensible order with a visible focus ring, and a screen reader gets a clean heading outline.
- **Motion:** with reduced motion turned on, nothing moves.
- **Unchanged pieces:** the meta tags, OG image, and favicon are identical to the original.
- **Honest content:** every claim on the page can be traced back to the original page.
- **The overall feel is calm, warm, and deliberate:** a product that a careful team clearly cares about, and one that nobody's grandmother would find confusing or pushy.

If you can open the page in a browser, check it at 375px and 1280px wide, in light and dark mode, with reduced motion on, and by tabbing through it with the keyboard. If you can't, say which checks you did by reading the code instead.

# Output
1. The edited output folder, a complete static page that opens straight from `index.html`.
2. A short list of what changed and why, with one line per change. Group it by spacing, type, color, components, layout, copy, and motion, and skip any group where nothing changed. For copy changes, show the old and new wording.
3. A short list of what you deliberately left alone, and why.
4. Any assumptions you made. When something is unclear, choose the option that best fits the brand and the grandma rules, keep going, and note the choice here rather than stopping to ask.
