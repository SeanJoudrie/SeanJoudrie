# Launch Check: design prototype

A clickable prototype of Launch Check, which tells people who built an app with AI what they still need to do before they can release it. Open `index.html` by double-clicking it. There's no build step and no server.

The prototype doesn't analyze anything. Every run ends on the same labeled example: a budgeting app for students, category Finance.

Files: `index.html` (all five screens), `styles.css` (tokens and components), `app.js` (routing, form behavior, example content), `favicon.svg`.

## Design system

The direction is **careful paper**: a warm off-white page, near-black ink, one deep green, and a serif for headings. It should feel like a well-kept checklist from someone who has shipped before. The serif gives it the credibility of a document rather than a SaaS dashboard. The warm neutrals keep it from feeling clinical to a nervous first-timer. Green reads as "go" without the alarm of red or the generic feel of blue. Purple was ruled out on purpose.

- **Spacing (4px scale):** 4, 8, 12, 16, 24, 32, 48, 64, 96 (`--s-1` … `--s-24`). Every margin, padding and gap uses these.
- **Fonts:** Source Serif 4 (600) for page and section headings. Source Sans 3 (400 and 600) for everything else. They fall back to Georgia and the system sans when offline.
- **Type ramp (size/line height, px):** Display 40/48 (32/40 on phones) · H1 32/40 (28/36) · H2 24/32 · H3 20/28 sans · Lead 20/32 · Body 18/28 · Small 16/24. Nothing is under 16px.
- **Palette:**

  | Token | Light | Dark | Use |
  |---|---|---|---|
  | `--bg` | `#faf8f4` | `#151513` | Page |
  | `--surface` | `#ffffff` | `#1c1b19` | Cards, inputs |
  | `--subtle` | `#f3f0e9` | `#23221f` | Notes, example banner |
  | `--text` | `#1c1b19` | `#ece9e2` | Text, selected states, severity marks |
  | `--muted` | `#5b574f` | `#a8a297` | Secondary text (6.3:1 or better) |
  | `--border` | `#e3ded4` | `#36342f` | Card and divider lines |
  | `--control` | `#857e72` | `#858075` | Input and button borders (4:1 or better) |
  | `--accent` | `#1d5c45` | `#7cc9a5` | **Only** the main action and the focus ring |

- **Radius:** 8px on everything. The loading spinner is the one circle.
- **Shadow:** none. Cards are flat with a 1px border.
- **Container:** 720px of content, with 24px gutters (16px on phones). It's a reading-width tool, so every screen shares one column.
- **Motion:** color changes on hover (120ms) and the analyzing spinner. Both turn off under `prefers-reduced-motion`.

## Key decision per screen

- **Landing:** one heading, one sentence and one button fit on a 375×667 screen. Below it, each section does one job: how it works, what it looks for, and what it *doesn't* do, because being honest about limits earns more trust than claims.
- **Describe:** the summary path is preselected and laid out as three numbered steps: copy the prompt, paste it into your AI chat, paste the reply. The code option explains the tradeoff and needs a "someone else will have a copy" checkbox before the text box unlocks.
- **Narrow it down:** native dropdowns, from broad to specific. The third question only appears for categories with extra rules, and its wording changes by category, so a nature app answers two questions and a finance app answers three.
- **Analyzing:** a list of named checks, each marked Waiting, Checking, then Done, half a second apiece. The checks change with the answers (a finance check appears only for finance). There's no percentage. A note says plainly that nothing is being analyzed.
- **Results:** gaps are grouped under "Blocks release" and "Fix before launch" instead of a label on every card, and each has a one-sentence reason. That keeps three gaps on the first screen of a 375×667 phone. The "not legal advice" note sits once, between the gaps and the checklist. The checklist is grouped by when to do each step, and the boxes can be ticked.

## Assumptions

- **Example run.** Results are always the sample student budgeting app, whatever you enter, and the page says so at the top. Choosing "Use the example summary" also pre-fills the dropdowns, with a note, so the fast path takes well under 2 minutes.
- **Severity is shown in ink, not color.** A filled or hollow dot plus a text label. Red or amber would have been a second accent and more alarming than this audience needs.
- **The copy button** uses the Clipboard API, then the older copy command. If both are blocked, it selects the prompt so you can copy it yourself.
- **Theme:** follows the system setting by default. The footer has a Light/Dark switch so reviewers can compare, and the choice is remembered in the browser.
- **"Print or save as PDF"** is the one results action that works without a server. Accounts, saving results and sharing are left out rather than shown as fake buttons.
- **No OG image.** This is a local prototype with no public URL. Add a 1200×630 image once it's hosted.
- **Fonts load from Google Fonts.** Offline, the system fonts take over and the layout holds.
- **Checklist content is illustrative.** The steps follow well-known App Store requirements (privacy policy, account deletion, in-app purchase for digital subscriptions, privacy details, a reviewer login), but they're phrased as examples and not official rules.
