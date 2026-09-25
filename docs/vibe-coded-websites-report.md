# Vibe Coded Websites Report (Aftermark AI)

Kept here as the standard every page in this repo is checked against. `CLAUDE.md` has the short version.

## Introduction

I spent weeks combing through more than 500 vibe coded websites across Reddit, Hacker News, Indie Hackers, Twitter threads, Product Hunt launches, and small personal sites built in the middle of the night.
Patterns repeat. Mistakes repeat. Aesthetic habits repeat.
This report documents every consistent marker that signals a website was coded fast, rushed, and guided more by vibes than intention. It is not a criticism. It is a source of awareness. Shipping fast is good, but shipping fast without clarity creates a very distinct look.
Use this report to avoid that look or lean into it intentionally.

## Section 1. Visual red flags

These are the most common visual giveaways that instantly scream vibe coded.

### 1. The signature purple problem
- Random purple gradient hero sections
- Neon purple text shadows
- Purple hover fills on buttons
- Purple glow drop shadows
- Purple accents even when the brand is not purple at all
- Purple on purple so nothing stands out

Purple is the unofficial mascot of vibe coded design.

### 2. Sparkle icons everywhere
The sparkle emoji or sparkle icon shows up in hero text, buttons, pricing cards, and even footers. Example: "Launch your idea today ✨". One sparkle is (maybe) fine. Twenty sparkles is a vibe coded diagnosis.

### 3. Hover animations on every card
Hover effects are overused. The big offenders:
- Cards lifting up aggressively
- Cards rotating slightly
- Cards moving a few pixels but breaking alignment
- Hover shadows that look like a flashlight under the mouse
- Buttons that bounce

Hover animations are fine when subtle. Vibe coded sites are never subtle.

### 4. Emojis used as UI elements
Emojis instead of icons. Emojis inside headings. Emojis on buttons. Emojis in the footer. Emojis as bullets in pricing tables. Emoji overload is a key signal of rushed UI decisions.

### 5. Fake testimonials
- Avatar looks AI generated
- Name is "Sarah P."
- Quote is generic like "Helped me so much"
- No job title
- No link
- Repeated wording
- Same face used twice

The viewer can feel the lack of legitimacy instantly.

### 6. Social icons that do nothing
Especially the Instagram icon that leads to "#". Or a Twitter link that goes to twitter.com. Or a LinkedIn link that opens a 404. If a social icon is there only for decoration, it becomes a vibe coded tell.

### 7. Massive icons with tiny text
The visual hierarchy looks inverted: a huge 48px icon, and text so small it feels like an afterthought. This creates cheapness.

### 8. Generic fonts with no rhythm
Most vibe coded sites use Inter, Poppins, Montserrat or Roboto. Nothing is wrong with the fonts, but the usage becomes vibe coded when:
- Heading weight is too thick
- Body text is too light
- Line height is inconsistent
- There's no spacing rhythm

Typography reveals whether thought went into the build.

### 9. Semi-transparent headers
Often combined with blur backgrounds, thin borders and low-contrast text. It becomes a vibe coded tell when the transparency interacts poorly with scrolling content.

### 10. Bad animations
- Lottie animations that do not match the brand
- Wiggle effects
- Bounce overshoot
- Cards popping into place with no easing
- Scroll animations that stutter
- Animations triggered too early

## Section 2. Structural red flags

### 1. No loading states
When you click something and nothing happens for seconds, the whole experience feels amateur. Signs:
- The button stays the same during async actions
- No skeleton screens
- No progress indicator
- Empty white gaps while data loads

Even one loading indicator can fix this instantly.

### 2. Inconsistent component placement
Components move around from page to page:
- Button sizes change
- Padding changes
- Text alignment switches randomly
- Containers have random widths

### 3. Slow server actions
Pages hang, buttons freeze, animations lag. Not a visual issue, but users feel it.

### 4. Misaligned grids
- Cards not aligned
- Uneven spacing
- Margins collapsing
- Sticky elements drifting out of position

One pixel of misalignment can destroy the entire visual impression.

### 5. Too many different border radiuses
4px here, 12px there, 32px buttons, circular avatars, square images. Inconsistent radiuses make everything look unintentional.

## Section 3. Content and copy red flags

### 1. Slightly off copyright text
- "All right reversed"
- "Copyright 2024 YourSiteName"
- "Created by yourbrand"
- "Made by Me"

### 2. Meaningless taglines
- "Build your dreams"
- "Launch faster"
- "Create without limits"
- "Where ideas become reality"
- "The future of something"

### 3. Overloaded hero sections
Sparkle, emoji, gradient, button, second button, animated card, microcopy, background image, shadow and a Lottie animation, all in one place.

## Section 4. Technical red flags

1. **Missing meta tags:** no OpenGraph image, an HTML title that says "Home", no description.
2. **Broken responsiveness:** text overflowing, cards stacked oddly, buttons too wide, layout collapsing on mobile.
3. **Interactive elements that don't work:**
   - carousels that don't slide
   - tabs that don't switch
   - accordions that don't open
   - modals that never close
   - a dark mode toggle that does nothing

## Section 5. Vibe coded energy checklist

If you check 5 or more, your site probably looks vibe coded.

- **Brand and visuals:**
  - purple gradient
  - sparkle emoji
  - hover animations everywhere
  - emojis in headings
  - fake testimonials
  - massive icons
  - generic font combos
  - semi-transparent header
  - random border radiuses
- **UX and layout:**
  - inconsistent components
  - no loading state
  - misaligned grids
  - slow interactions
  - sticky header jitter
  - weird spacing rhythm
- **Technical:**
  - missing OG image
  - no favicon
  - buttons that don't work
  - bad mobile layout
  - placeholder text left in
- **Copy:**
  - generic taglines
  - slightly off copyright text
  - buzzword stacking
  - no value proposition

## Section 6. The fix

1. Establish a 4 or 8 point spacing system.
2. Pick one font pair and stick to it.
3. Standardize border radiuses.
4. Remove most animations.
5. Create one elevation style and reuse it.
6. Fix responsiveness before polishing desktop.
7. Add loading states everywhere.
8. Tighten your copy to a single clear promise.
9. Test every button, link, and social icon.
10. Reduce visual novelty and increase clarity.

The fastest way to make a site feel premium is consistency.
