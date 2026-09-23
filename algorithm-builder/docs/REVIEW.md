# Algorithm Builder — Product, Feature & Brand Review

The master review prompt, applied to the product spec. As of 2026-09-23.

**How to read this.** Scores use the prompt's weights (value 25%, feasibility 15%, ease 10%, UX 15%, differentiation 15%, growth 10%, risk 5%, cost 5%) and its letter scale (8.0 = B-). "Now" grades the feature as the spec describes it; "After fixes" grades it with the listed improvements. Platform facts are marked **VERIFIED** (checked against the official page on 2026-09-23) or **UNVERIFIED**.

**Assumptions** (the prompt allows proceeding without the clarifying round when told to build; correct any of these and the grades shift):

1. Solo founder who designs and builds (React/TypeScript), roughly 15–25 hours a week.
2. Budget under $50/month until there is traction.
3. Launch audience: English-speaking, US, 18–35, mostly on phones.
4. YouTube is the launch platform; the others are education-only.
5. The goal for year one is usage and proof, not revenue.

---

## 1. Executive summary

**Overall product grade: 7.8 (C+) as specced → 8.3 (B-) with the fixes below. For the MVP subset alone: 8.6 (B).** The idea is strong; the spec is too wide. The features that fix feeds (checklist, turn-down list, time capsule, matched tips) score highest. The features that make it a "platform" (Pro tier, trending, creator deals, sign-in) score lowest and should wait.

**Go / no-go: GO**, as a narrow YouTube-first MVP, gated by the validation plan in section 9. If the founder's own three accounts don't show a measurable mix-match improvement within 7 days, stop and rethink before building more.

**Top 5 strengths**

1. A real, near-universal problem with a vivid story (20 Game of Thrones videos in a row) that sells itself in a 15-second video.
2. "Remove first, then add" is correct and underused. The cleanup checklist (F-14, A after fixes) is the most valuable feature, and it's cheap.
3. No login and no data needed. Trust is the product's moat against scammy "algorithm fixer" apps.
4. Time capsule (F-11) is a genuine differentiator YouTube itself won't build.
5. Nearly free to run: static front end, one small serverless function.

**Top 5 problems**

1. **Quota.** VERIFIED: YouTube gives a default project **100 search calls per day**, which is about 10–15 full playlists a day. The playlist (F-15) needs caching, a fallback and a quota-increase request before launch.
2. **Proof is slow and fuzzy.** The feed changes over days, and users can't easily see it. Without the mix-match self-check (G-02, new), the product can't show that it works.
3. **Scope creep.** 40 features for a solo builder; 15 of them should wait or be cut, and several MVP ones ship in a reduced form.
4. **Platform dependency.** YouTube, Instagram and TikTok keep adding their own controls; our tips can go stale and our API access can be limited.
5. **Weak revenue.** A tip jar won't pay for much; the value is audience and brand, which takes consistent content work.

---

## 2. Facts checked

| Claim | Status | Source / note |
| --- | --- | --- |
| `search.list` supports `publishedBefore` / `publishedAfter` (RFC 3339) | VERIFIED | [search.list docs](https://developers.google.com/youtube/v3/docs/search/list). Docs warn that non-relevance `order` combined with date filters can return incomplete results, so keep `order=relevance`. |
| Default quota: **100 search.list calls/day** plus 10,000 units/day for other endpoints; resets at midnight Pacific | VERIFIED | [Quota costs](https://developers.google.com/youtube/v3/determine_quota_cost). Our spec's "about 100 searches/day" was right in practice; the cap is now a flat call count. |
| `videos.list` with `chart=mostPopular` returns popular videos by region and category | VERIFIED | [videos.list docs](https://developers.google.com/youtube/v3/docs/videos/list) |
| API clients may store some data beyond 30 days but must re-verify authorization every 30 days; after revoked consent, delete within 7 days (Authorized Data) or 30 days | VERIFIED | [Developer policies](https://developers.google.com/youtube/terms/developer-policies) |
| Watch history is not readable via the Data API | UNVERIFIED (widely documented since 2016) | Check the `playlists`/`activities` docs; plan for Takeout either way. |
| Nobody can press "Not interested" or delete history for a user via API | UNVERIFIED (no such endpoint known) | No endpoint appears in the API reference. |
| YouTube search honours a `before:YYYY-MM-DD` operator in the query | VERIFIED (2026-09-23) | A `math before:2015-01-01` search returned only videos 11+ years old. Used by the search-link fallback. |
| `youtube.com/watch_videos?video_ids=a,b,c` opens an unnamed playlist | UNVERIFIED (undocumented) | Couldn't be checked from the build machine (YouTube served a captcha). Check it by hand once the API key is live; every video is also linked individually. |
| Instagram "Reset suggested content", TikTok "Refresh your For You feed", X muted words | UNVERIFIED as of today | Check in each app before launch; date-stamp tip cards. |
| Instagram has said sends/shares are among the strongest Reels signals | UNVERIFIED | Check Instagram head's public statements before quoting. |

---

## 3. Summary scorecard

Sorted by projected score. 25 MVP (some partially, e.g. tips now and lists later), 8 V2, 5 Later, 2 Cut.

| ID | Feature | Now | Letter | After fixes | Letter | Priority |
|---|---|---|---|---|---|---|
| F-14 | Personalized cleanup checklist | 8.8 | B+ | 9.4 | A | MVP |
| F-25 | Anonymous, browser-saved state | 8.8 | B+ | 9.1 | A- | MVP |
| F-09 | "Turn down" list | 8.7 | B+ | 9.1 | A- | MVP |
| F-11 | Time capsule filter | 8.6 | B | 9.1 | A- | MVP |
| F-24 | Problem-matched tips | 8.6 | B | 9.0 | A- | MVP |
| F-04 | "Too much of what?" search | 8.3 | B- | 9.0 | A- | MVP |
| F-08 | Auto-balance to 100% | 8.3 | B- | 9.0 | A- | MVP |
| F-34 | Shared curated video pool | 8.3 | B- | 9.0 | A- | V2 (cache in MVP) |
| F-06 | Two-level mix (categories → sub-topics) | 8.3 | B- | 8.9 | B+ | MVP |
| F-29 | Algorithm report card | 8.1 | B- | 8.9 | B+ | V2 |
| F-18 | Recipe link | 8.5 | B | 8.8 | B+ | MVP |
| F-20 | YouTube playbook | 8.3 | B- | 8.7 | B+ | MVP |
| F-15 | Rehab playlist (real videos) | 8.0 | B- | 8.7 | B+ | MVP |
| F-19 | Universal more/less signals guide | 8.5 | B | 8.6 | B | MVP |
| F-07 | Three animated views (sunburst / bars / numbers) | 8.2 | B- | 8.6 | B | MVP |
| F-35 | Mechanic mascot and voice | 8.2 | B- | 8.6 | B | MVP |
| F-38 | Mascot short-video content | 8.2 | B- | 8.6 | B | MVP (launch) |
| F-05 | One-week tune-up check-in | 8.0 | B- | 8.6 | B | MVP (calendar) / V2 (email) |
| F-27 | Takeout watch-history upload | 7.7 | C+ | 8.5 | B | V2 |
| F-03 | "What's wrong?" presets + AI free text | 7.5 | C | 8.5 | B | MVP (presets) / V2 (AI) |
| F-39 | Education content | 8.2 | B- | 8.4 | B | V2 |
| F-02 | "What do you like?" chips | 8.0 | B- | 8.4 | B | MVP |
| F-12 | Hidden gems dial | 7.6 | C | 8.4 | B | V2 |
| F-10 | Wildcard % dial | 7.6 | C | 8.2 | B- | MVP |
| F-17 | Cheat sheet card / wallpaper | 8.0 | B- | 8.1 | B- | V2 |
| F-22 | TikTok playbook | 7.9 | C+ | 8.0 | B- | MVP |
| F-01 | Platform picker | 7.8 | C+ | 8.0 | B- | MVP |
| F-16 | Five-minute training session | 7.8 | C+ | 8.0 | B- | MVP (merged) |
| F-21 | Instagram Reels playbook + reel lists | 7.4 | C | 8.0 | B- | MVP (tips) / V2 (lists) |
| F-28 | AI complaint parsing | 7.3 | C- | 7.8 | C+ | V2 |
| F-23 | X playbook | 7.5 | C | 7.6 | C | MVP (cheap) |
| F-30 | Video of the day | 7.4 | C | 7.6 | C | Later |
| F-36 | Tip jar | 7.4 | C | 7.6 | C | MVP |
| F-26 | Optional Google sign-in | 6.6 | D | 7.6 | C | Later |
| F-33 | Discover section | 7.4 | C | 7.5 | C | Later |
| F-13 | "Talk of the town" % | 7.2 | C- | 7.4 | C | V2 |
| F-31 | Trending by country/category | 7.0 | C- | 7.0 | C- | Cut (merge into F-13) |
| F-32 | Trending among people like you | 6.6 | D | 7.0 | C- | Later |
| F-37 | Pro tier | 6.4 | D | 6.8 | D | Later |
| F-40 | Creator partnerships | 6.0 | D | 6.2 | D | Cut |

---

## 4. Per-feature grades

Columns: Val = user value, Feas = feasibility, Ease = execution ease, UX = UX clarity, Diff = differentiation, Grow = growth/revenue, Risk and Cost inverted (10 = no risk / near free).

### F-01 Platform picker

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 6.5 | 9.5 | 9.5 | 8.5 | 6.0 | 6.5 | 9.5 | 10.0 | **7.8 C+** | **8.0 B-** | MVP |

**Biggest problem:** Picking Instagram implies the same depth as YouTube, but those platforms only get tip cards, so expectations break.

**Improvements:**
1. Label each tile honestly: "Full tune-up" (YouTube) vs "Tip guide" (Instagram, TikTok, X).
2. Default to YouTube and skip the screen entirely when arriving from a YouTube-specific link.

### F-02 "What do you like?" chips

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.0 | 9.5 | 9.0 | 8.5 | 5.5 | 6.0 | 10.0 | 10.0 | **8.0 B-** | **8.4 B** | MVP |

**Biggest problem:** Generic interest chips look like every onboarding screen and a long grid slows the 2-minute flow.

**Improvements:**
1. Cap at 12 chips; each chip pre-fills a mix slice with sensible sub-topics.
2. Let people add a custom chip inline.
3. Mascot reacts to picks so the screen feels alive, not like a form.

### F-03 "What's wrong?" presets + AI free text

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.0 | 8.0 | 7.0 | 8.0 | 6.5 | 6.0 | 8.5 | 7.5 | **7.5 C** | **8.5 B** | MVP (presets) / V2 (AI) |

**Biggest problem:** The AI free-text layer adds cost, latency and a failure mode to a step that 5 presets already cover for most people.

**Improvements:**
1. Ship presets plus an optional free-text box matched by keywords locally.
2. Add AI parsing in V2 behind a hard monthly budget cap.

### F-04 "Too much of what?" search

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 9.0 | 9.0 | 8.0 | 8.5 | 7.0 | 6.5 | 9.5 | 9.0 | **8.3 B-** | **9.0 A-** | MVP |

**Biggest problem:** Without autocomplete, typos ("breakng bad") produce bad searches and messy slices.

**Improvements:**
1. Free-text chips with suggestions from a local list of common culprits (shows, games, franchises).
2. Normalize case/spacing; show the chip exactly as it will be searched.

### F-05 One-week tune-up check-in

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5 | 9.0 | 8.0 | 8.0 | 7.0 | 8.5 | 8.5 | 9.0 | **8.0 B-** | **8.6 B** | MVP (calendar) / V2 (email) |

**Biggest problem:** Email reminders need a backend, consent handling and deliverability work before launch.

**Improvements:**
1. MVP: "Add tune-up to my calendar" (.ics download) plus the recipe link. Zero personal data.
2. V2: optional email with one-click unsubscribe.

### F-06 Two-level mix (categories → sub-topics)

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.5 | 9.5 | 7.0 | 7.0 | 8.5 | 7.5 | 10.0 | 10.0 | **8.3 B-** | **8.9 B+** | MVP |

**Biggest problem:** Two layers of percentages is heavy for a 2-minute flow.

**Improvements:**
1. Level 2 is optional: tap a category to zoom in; otherwise sub-topics split evenly.
2. Start from pre-filled defaults so nobody faces a blank chart.

### F-07 Three animated views (sunburst / bars / numbers)

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5 | 9.5 | 6.0 | 8.0 | 8.5 | 8.0 | 10.0 | 10.0 | **8.2 B-** | **8.6 B** | MVP |

**Biggest problem:** Three views triple the polish work, and a sunburst is hard to read precisely.

**Improvements:**
1. Sunburst is the hero view; bars for precise comparison; numbers doubles as the accessible table.
2. Animate the toggle; respect reduced-motion.

### F-08 Auto-balance to 100%

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 9.0 | 10.0 | 8.0 | 8.0 | 6.0 | 6.0 | 10.0 | 10.0 | **8.3 B-** | **9.0 A-** | MVP |

**Biggest problem:** Other sliders moving on their own feels like a bug if unexplained.

**Improvements:**
1. Redistribute proportionally across unlocked slices; add a lock pin per slice.
2. Show the running total and briefly highlight the slices that moved.

### F-09 "Turn down" list

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 9.0 | 10.0 | 9.0 | 8.5 | 7.5 | 6.5 | 10.0 | 10.0 | **8.7 B+** | **9.1 A-** | MVP |

**Biggest problem:** If it is visually buried under the pie, people forget it and the cleanup checklist gets thin.

**Improvements:**
1. Put it beside the chart in the alarm color with a counter.
2. Every item generates specific checklist lines.

### F-10 Wildcard % dial

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.0 | 8.0 | 7.5 | 7.5 | 8.0 | 7.0 | 9.0 | 8.5 | **7.6 C** | **8.2 B-** | MVP |

**Biggest problem:** Truly random searches return junk and make the whole playlist look bad.

**Improvements:**
1. "Random but good": pick a random topic from a curated list, then apply a quality filter.
2. Cap at 20%.

### F-11 Time capsule filter

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.5 | 9.5 | 9.0 | 8.0 | 9.0 | 7.0 | 9.5 | 9.0 | **8.6 B** | **9.1 A-** | MVP |

**Biggest problem:** "Old" is not "timeless"; a date filter alone surfaces low-quality old uploads.

**Improvements:**
1. Combine publishedBefore with view count/like ratio and the curated pool.
2. Hint copy: "Great videos from before 2020 the algorithm forgot."

### F-12 Hidden gems dial

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5 | 7.5 | 6.5 | 7.5 | 8.5 | 7.0 | 9.0 | 7.5 | **7.6 C** | **8.4 B** | V2 |

**Biggest problem:** Search cannot filter by view count, so this needs extra stats calls and quality heuristics.

**Improvements:**
1. Batch videos.list stats (1 unit per call) and filter under ~100k views with a strong like ratio.
2. Feed winners into the curated pool.

### F-13 "Talk of the town" %

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 6.5 | 8.5 | 8.0 | 8.0 | 5.0 | 6.5 | 8.5 | 9.0 | **7.2 C-** | **7.4 C** | V2 |

**Biggest problem:** Trending is exactly what the algorithm already pushes, so it adds little.

**Improvements:**
1. Merge F-31 into this as one optional dial.
2. Frame it as "stay in the loop" and cap it at 10%.

### F-14 Personalized cleanup checklist

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 9.5 | 9.5 | 8.5 | 8.5 | 8.0 | 7.0 | 10.0 | 10.0 | **8.8 B+** | **9.4 A** | MVP |

**Biggest problem:** Generic advice ("delete your history") gets skipped; people don't know where the buttons are.

**Improvements:**
1. Exact menu paths per platform and device, as checkboxes with progress.
2. Deep links to myactivity.google.com and the YouTube history page.
3. Include the "curiosity quarantine" step (G-03).

### F-15 Rehab playlist (real videos)

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 9.0 | 7.5 | 6.5 | 8.5 | 7.5 | 8.0 | 7.5 | 7.0 | **8.0 B-** | **8.7 B+** | MVP |

**Biggest problem:** YouTube caps default projects at 100 search calls per day, which is about 10–15 full playlists a day.

**Improvements:**
1. At most one search per slice, cached server-side 24h and at the CDN.
2. Fallback to YouTube search links when quota is out, so the product never breaks.
3. Apply for a quota increase before launch.

### F-16 Five-minute training session

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5 | 9.0 | 8.0 | 7.0 | 7.5 | 6.5 | 9.5 | 10.0 | **7.8 C+** | **8.0 B-** | MVP (merged) |

**Biggest problem:** As its own step it duplicates the checklist and the playlist and lengthens the flow.

**Improvements:**
1. Merge into the playlist screen as "How to watch these" (3 short rules).

### F-17 Cheat sheet card / wallpaper

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 6.5 | 9.5 | 8.0 | 9.0 | 6.5 | 8.0 | 10.0 | 10.0 | **8.0 B-** | **8.1 B-** | V2 |

**Biggest problem:** Low direct value; its worth is sharing, which needs good design.

**Improvements:**
1. MVP: short text version on the results page.
2. V2: generated image card with the mascot.

### F-18 Recipe link

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.0 | 9.5 | 8.5 | 8.0 | 8.0 | 8.5 | 9.5 | 10.0 | **8.5 B** | **8.8 B+** | MVP |

**Biggest problem:** Encoded mixes produce long, ugly URLs.

**Improvements:**
1. Compact encoding in the URL hash (nothing reaches a server).
2. V2: short links once there is a backend.

### F-19 Universal more/less signals guide

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.0 | 10.0 | 9.5 | 9.0 | 6.0 | 7.5 | 10.0 | 10.0 | **8.5 B** | **8.6 B** | MVP |

**Biggest problem:** Great content, but a wall of tips gets skimmed.

**Improvements:**
1. Two-column "More / Less" card, 5 rows max.

### F-20 YouTube playbook

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.5 | 9.5 | 9.0 | 8.5 | 6.5 | 6.5 | 9.5 | 10.0 | **8.3 B-** | **8.7 B+** | MVP |

**Biggest problem:** Menu names and settings move; stale tips erode trust.

**Improvements:**
1. Date-stamp every card; review quarterly.

### F-21 Instagram Reels playbook + reel lists

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5 | 7.0 | 7.0 | 8.0 | 7.0 | 7.0 | 8.0 | 9.0 | **7.4 C** | **8.0 B-** | MVP (tips) / V2 (lists) |

**Biggest problem:** No API to find reels means lists are manual labor.

**Improvements:**
1. Tips only at launch; hand-picked lists later, possibly user-submitted.

### F-22 TikTok playbook

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5 | 9.0 | 9.0 | 8.5 | 6.0 | 6.5 | 9.0 | 10.0 | **7.9 C+** | **8.0 B-** | MVP |

**Biggest problem:** Features vary by region and app version.

**Improvements:**
1. Date-stamp; phrase as "look for".

### F-23 X playbook

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 6.5 | 9.0 | 9.0 | 8.5 | 5.5 | 5.5 | 9.0 | 10.0 | **7.5 C** | **7.6 C** | MVP (cheap) |

**Biggest problem:** Smallest audience for this problem; low value.

**Improvements:**
1. Keep to one short card.

### F-24 Problem-matched tips

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.5 | 9.5 | 8.0 | 9.0 | 8.0 | 7.0 | 10.0 | 10.0 | **8.6 B** | **9.0 A-** | MVP |

**Biggest problem:** None beyond mapping effort.

**Improvements:**
1. Map each preset to 2–3 specific tips shown first.

### F-25 Anonymous, browser-saved state

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.5 | 10.0 | 9.5 | 9.5 | 7.5 | 6.5 | 10.0 | 10.0 | **8.8 B+** | **9.1 A-** | MVP |

**Biggest problem:** Browser storage can be wiped; people lose their mix.

**Improvements:**
1. Recipe link is the backup; say so in the UI.

### F-26 Optional Google sign-in

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.0 | 6.0 | 5.0 | 7.0 | 7.0 | 7.0 | 5.5 | 8.0 | **6.6 D** | **7.6 C** | Later |

**Biggest problem:** YouTube scopes need Google OAuth verification (weeks) and raise trust questions for little MVP value.

**Improvements:**
1. Defer until usage proves demand; then request only youtube.readonly + playlist write.

### F-27 Takeout watch-history upload

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.0 | 8.5 | 6.0 | 5.5 | 8.5 | 9.0 | 7.5 | 9.0 | **7.7 C+** | **8.5 B** | V2 |

**Biggest problem:** Takeout is a painful multi-step export, and uploaded history is sensitive.

**Improvements:**
1. Parse 100% in the browser; never upload to a server.
2. Step-by-step Takeout guide selecting only "YouTube → history".

### F-28 AI complaint parsing

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.0 | 9.0 | 7.0 | 8.0 | 6.5 | 5.5 | 8.0 | 6.5 | **7.3 C-** | **7.8 C+** | V2 |

**Biggest problem:** Presets + chips already cover most input; AI adds cost and failure modes.

**Improvements:**
1. V2 with a small, fast model, strict JSON output and a budget cap.

### F-29 Algorithm report card

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.0 | 8.0 | 6.0 | 8.0 | 8.5 | 9.5 | 8.0 | 9.0 | **8.1 B-** | **8.9 B+** | V2 |

**Biggest problem:** Depends on Takeout data (F-27) to be honest; a card made from self-reported taps would be fake precision.

**Improvements:**
1. Build on F-27; design the share image carefully (this is the growth engine).

### F-30 Video of the day

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 5.5 | 9.0 | 8.0 | 9.0 | 6.0 | 7.0 | 9.5 | 9.5 | **7.4 C** | **7.6 C** | Later |

**Biggest problem:** Nice culture feature, weak link to the core promise.

**Improvements:**
1. Pull from the curated pool; launch with the Discover section.

### F-31 Trending by country/category

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 5.5 | 9.5 | 8.5 | 8.5 | 4.0 | 5.5 | 9.5 | 9.0 | **7.0 C-** | **7.0 C-** | Cut (merge into F-13) |

**Biggest problem:** Duplicates YouTube's own trending/explore surfaces.

**Improvements:**
1. Fold into the "Talk of the town" dial.

### F-32 Trending among people like you

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 6.0 | 5.0 | 5.0 | 8.0 | 8.0 | 7.0 | 6.5 | 8.0 | **6.6 D** | **7.0 C-** | Later |

**Biggest problem:** Needs a large user base and careful anonymization.

**Improvements:**
1. Revisit after 10k monthly users.

### F-33 Discover section

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 6.5 | 9.0 | 6.5 | 8.0 | 6.5 | 7.0 | 9.5 | 9.0 | **7.4 C** | **7.5 C** | Later |

**Biggest problem:** Pulls attention away from the 2-minute flow.

**Improvements:**
1. Launch with F-30 once the pool has 500+ videos.

### F-34 Shared curated video pool

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.0 | 9.0 | 6.0 | 8.5 | 9.0 | 8.0 | 9.0 | 9.0 | **8.3 B-** | **9.0 A-** | V2 (cache in MVP) |

**Biggest problem:** Curation is labor, and YouTube policies require refreshing stored API data.

**Improvements:**
1. MVP: server cache only. V2: curated pool with a 30-day refresh job.

### F-35 Mechanic mascot and voice

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.0 | 9.5 | 7.0 | 8.5 | 8.0 | 8.5 | 9.5 | 9.5 | **8.2 B-** | **8.6 B** | MVP |

**Biggest problem:** A weak drawing makes the product look amateur.

**Improvements:**
1. Simple geometric SVG, 3 poses; commission a pro redraw once validated.

### F-36 Tip jar

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 5.0 | 10.0 | 9.5 | 9.0 | 5.0 | 6.5 | 9.5 | 10.0 | **7.4 C** | **7.6 C** | MVP |

**Biggest problem:** Near-zero revenue; purely goodwill.

**Improvements:**
1. One quiet line after success; no pop-ups.

### F-37 Pro tier

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 5.5 | 7.0 | 5.0 | 7.5 | 6.5 | 7.0 | 7.0 | 6.5 | **6.4 D** | **6.8 D** | Later |

**Biggest problem:** Nothing yet is worth paying for; billing adds complexity.

**Improvements:**
1. Revisit after retention data.

### F-38 Mascot short-video content

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.0 | 9.5 | 6.0 | 9.0 | 8.0 | 9.5 | 9.0 | 9.0 | **8.2 B-** | **8.6 B** | MVP (launch) |

**Biggest problem:** Time-intensive and needs consistency to work.

**Improvements:**
1. Batch-produce 10 at launch from the tip cards.

### F-39 Education content

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 7.5 | 10.0 | 7.5 | 8.5 | 6.5 | 8.0 | 10.0 | 10.0 | **8.2 B-** | **8.4 B** | V2 |

**Biggest problem:** Overlaps playbooks.

**Improvements:**
1. A single "healthy algorithm" guide page, linked from results.

### F-40 Creator partnerships

| Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | **Now** | **After fixes** | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 4.5 | 7.0 | 5.0 | 7.0 | 6.0 | 6.5 | 5.5 | 8.0 | **6.0 D** | **6.2 D** | Cut |

**Biggest problem:** Any money from creators undermines trust in recommendations.

**Improvements:**
1. Drop. Revisit only as non-paid "featured classic" editorials.


---

## 5. Gap analysis: what's missing

### 5.1 Missing features, graded

Same weights and scale as section 4.

| ID | Missing feature | Val | Feas | Ease | UX | Diff | Grow | Risk | Cost | Score | Letter | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G-01 | 20-second "what is the algorithm" explainer | 8.0 | 10.0 | 8.5 | 9.0 | 6.0 | 7.0 | 10.0 | 10.0 | 8.3 | B- | MVP |
| G-02 | Mix-match self-check (tally your homepage before/after) | 9.0 | 9.5 | 8.0 | 7.5 | 9.0 | 8.5 | 10.0 | 10.0 | 8.8 | B+ | MVP |
| G-03 | Curiosity quarantine (pause history before a one-off watch) | 8.5 | 9.5 | 9.5 | 8.5 | 8.5 | 7.0 | 10.0 | 10.0 | 8.8 | B+ | MVP |
| G-04 | Shorts vs long-form guidance | 7.0 | 9.5 | 9.0 | 8.5 | 6.5 | 6.0 | 10.0 | 10.0 | 7.9 | C+ | V2 |
| G-05 | Shared / family / TV account guidance | 7.0 | 9.0 | 8.5 | 8.0 | 7.0 | 6.0 | 10.0 | 10.0 | 7.8 | C+ | V2 |
| G-06 | Undo, reset and start over | 7.5 | 10.0 | 9.5 | 9.0 | 4.0 | 5.0 | 10.0 | 10.0 | 7.8 | C+ | MVP |
| G-07 | Quota-exhausted fallback to search links | 9.0 | 10.0 | 9.0 | 8.5 | 5.0 | 5.0 | 10.0 | 10.0 | 8.2 | B- | MVP |
| G-08 | Accessibility (keyboard sliders, table view, reduced motion) | 8.0 | 10.0 | 7.5 | 9.0 | 5.0 | 6.0 | 10.0 | 10.0 | 8.0 | B- | MVP |
| G-09 | Localization + region-aware search | 6.5 | 9.0 | 6.0 | 8.0 | 6.0 | 7.0 | 9.5 | 9.5 | 7.3 | C- | Later |
| G-10 | Privacy page and no-tracking pledge | 7.0 | 10.0 | 9.0 | 9.0 | 7.0 | 7.0 | 10.0 | 10.0 | 8.3 | B- | MVP |
| G-11 | Rate limiting on the search endpoint | 8.0 | 9.5 | 8.0 | 10.0 | 4.0 | 5.0 | 9.0 | 9.0 | 7.7 | C+ | MVP |
| G-12 | YouTube Music / podcasts mode | 6.0 | 7.5 | 6.0 | 8.0 | 6.5 | 6.0 | 9.0 | 9.0 | 6.9 | D | Later |
| G-13 | Spotify support | 6.5 | 5.5 | 5.0 | 7.5 | 7.0 | 7.0 | 7.0 | 8.0 | 6.6 | D | Later |
| G-14 | Health score over time (local log of mix-match tallies) | 7.5 | 9.5 | 7.5 | 8.0 | 8.0 | 8.5 | 10.0 | 10.0 | 8.3 | B- | V2 |
| G-15 | Compare recipes with a friend | 6.5 | 9.0 | 7.0 | 8.5 | 7.5 | 8.5 | 9.5 | 9.5 | 7.9 | C+ | Later |
| G-16 | Works on slow/no network (checklist is static) | 7.0 | 10.0 | 8.5 | 9.0 | 4.0 | 5.0 | 10.0 | 10.0 | 7.5 | C | MVP |
| G-17 | YouTube attribution/branding compliance on video cards | 8.0 | 10.0 | 9.0 | 9.0 | 3.0 | 4.0 | 10.0 | 10.0 | 7.6 | C | MVP |

The two most important additions:

- **G-02 Mix-match self-check.** Before the fix, the user taps a tally of the first 20 videos on their homepage (on topic / off topic / the thing I'm sick of). A week later they tally again and see the change. This is the product's proof, its retention hook and its north-star metric in one screen.
- **G-03 Curiosity quarantine.** A one-tap reminder before a one-off watch: pause history or use incognito. It prevents the exact Battle of the Bastards spiral that started this idea.

### 5.2 Why this could fail (ranked)

1. **Results are too slow or invisible**, so people don't come back. *Mitigation:* G-02 tally, lead with removal (fastest effect), set expectations ("give it 3–7 days").
2. **Nobody finds it.** A free tool with no marketing budget. *Mitigation:* mascot shorts on the same apps, the shareable recipe and (V2) report card.
3. **Quota ceiling** breaks playlists on a viral day. *Mitigation:* cache, fallback links (G-07), quota-increase request filed before launch.
4. **Platforms ship the same controls** (topic sliders already exist in some apps). *Mitigation:* be the cross-platform guide that tells people those controls exist.
5. **Stale tips** erode trust. *Mitigation:* date-stamped cards, quarterly review.
6. **Founder time.** Content plus product plus curation is a lot for one person. *Mitigation:* the MVP cut line below.

### 5.3 Cut entirely

- **F-40 Creator partnerships:** any money from creators undermines trust in every recommendation.
- **F-31 Trending by country/category:** duplicates YouTube's own surfaces; folded into the F-13 dial.
- **The auto-play "open 10 tabs and walk away" idea:** already dropped; weak signal and looks like fake engagement.

### 5.4 MVP cut line

The smallest set that delivers "fix my feed in two minutes":

| Screen | Features |
| --- | --- |
| Landing + explainer | G-01, F-35 mascot |
| Platform | F-01 (YouTube full, others "tip guide") |
| Likes | F-02 chips (max 12, custom allowed) |
| Problem | F-03 presets + optional free text (no AI) |
| Too much of | F-04 free-text chips with suggestions, F-09 turn-down list |
| Baseline tally (optional) | G-02 |
| Mix | F-06 two levels, F-07 three views, F-08 auto-balance with locks, F-10 wildcard, F-11 time capsule |
| Results | F-14 checklist + G-03, F-15 playlist (API or search-link fallback, G-07), F-16 merged "how to watch", F-19/F-20–F-24 tips, F-18 recipe link, F-05 calendar reminder, F-36 tip line |
| Always | F-25 anonymous state, G-06 reset, G-08 accessibility, G-10 privacy, G-11 rate limit, G-16 static fallback, G-17 attribution |

**Deliberately left out of the MVP:** AI parsing, sign-in, Takeout upload, report card, hidden gems, trending, video of the day, Discover, Pro tier, email reminders, Instagram reel lists.

---

## 6. Technical and operational requirements

### 6.1 API keys, accounts and costs

All prices are estimates to confirm on each provider's pricing page; "UNVERIFIED" marks limits that weren't checked today.

| Service | Purpose | How to get it | Review / approval | Cost at 1k / 10k / 100k monthly users |
| --- | --- | --- | --- | --- |
| Google Cloud project + **YouTube Data API v3 key** | Rehab playlist search (MVP) | Cloud Console → enable YouTube Data API v3 → create API key, restrict to the API and your server | None for the key; **quota increase needs an audit form** (timeline UNVERIFIED; file early) | $0 / $0 (with cache) / $0 but needs higher quota |
| Hosting with serverless functions (Netlify, matching the portfolio) | Static app + `/api/search` | Connect the repo; set `YOUTUBE_API_KEY` env var | None | Free tier likely / free–$19 / ~$19–50 (UNVERIFIED) |
| Domain | Brand URL | Any registrar | None | ~$10–20/year |
| Google OAuth client + verification | Optional sign-in (Later) | Cloud Console → OAuth consent screen | **Required for YouTube scopes**; privacy policy, demo video, weeks (UNVERIFIED) | $0 |
| LLM API key (e.g. a small, fast Claude model) | AI complaint parsing (V2) | Provider console | None | Low single dollars at 1k; cap with a monthly budget |
| Transactional email (e.g. Resend, Postmark) | Tune-up reminders (V2) | Sign up, verify domain (SPF/DKIM) | Domain verification | Free tier / ~$10–20 / ~$50–100 (UNVERIFIED) |
| Privacy-friendly analytics (e.g. Plausible, or none) | Funnel + tune-up return rate | Sign up | None | ~$9 / ~$19 / ~$69 (UNVERIFIED) |
| Tip jar (Buy Me a Coffee or Ko-fi) | Tips | Create a page | None | Free; platform fee on tips (UNVERIFIED) |
| Meta app (oEmbed) | Embedding Instagram reels (V2 lists) | Meta developer app | App review (UNVERIFIED) | $0 |

**What the MVP needs on day one: one YouTube API key and a host. Nothing else.** The app runs without the key too (search-link fallback).

### 6.2 Tech stack (as built)

| Layer | Choice | Why |
| --- | --- | --- |
| Front end | React 19 + TypeScript + Vite 6 | Matches the portfolio repo; fast, typed, no server rendering needed |
| Styling | Tailwind CSS 4 with design tokens | Same as the portfolio; tokens make theming and dark mode trivial |
| Charts | Hand-built SVG (sunburst, bars) with CSS transitions | Full control of the signature interaction; no heavy chart library |
| State | URL hash (recipe) + `localStorage` | No accounts, no database |
| Back end | One serverless function, `/api/search` | Hides the API key, caches, rate-limits |
| Tests | Vitest for the logic; Playwright smoke run for the flow | Logic (rebalance, allocation, recipe encoding) is where bugs hide |

### 6.3 Quota strategy

1. One `search.list` call per mix slice per request, `maxResults` 10, then pick the videos the slice needs.
2. Cache every search response for 24 hours: in-memory on the function plus `Cache-Control: s-maxage=86400` so the CDN serves repeats. Popular slices ("math", "science") will almost always hit cache.
3. Round time-capsule dates to the year so cache keys repeat.
4. When the quota or the key is missing, return a clear status and the UI switches to YouTube search links. The product never shows a broken state.
5. File the quota-increase audit before launch.
6. V2: the curated pool (F-34) serves most requests with zero search calls; stored video data refreshed every 30 days per policy.

### 6.4 Compliance checklist

- [ ] Show YouTube attribution on API-sourced video cards and link to YouTube; don't alter titles or thumbnails (developer policies).
- [ ] Privacy policy: what we store (nothing server-side in MVP), the API key's use, and a link to Google's privacy policy; link to Google security settings once sign-in exists.
- [ ] Terms of service; agree to the YouTube API Services Terms.
- [ ] Don't store API data beyond cache windows in MVP; the V2 pool re-fetches every 30 days.
- [ ] Takeout files (V2) are parsed in the browser only and never uploaded.
- [ ] GDPR/CCPA: no personal data in MVP; email reminders (V2) need consent and one-click unsubscribe.

### 6.5 Kill switches

| Event | Response |
| --- | --- |
| API key revoked or quota cut | Search-link fallback is automatic; checklist and tips are static and unaffected |
| A platform renames a setting | Update the one tip card (content lives in one data file) |
| Platform ships its own topic sliders | Add a tip pointing to it; lean into cross-platform guidance |
| Traffic spike | CDN cache absorbs repeats; rate limit protects quota |

---

## 7. UX audit

### 7.1 Personas

| Persona | Path | Taps | Time | Main risk | Fix |
| --- | --- | --- | --- | --- | --- |
| Founder, 20s power user, 3 polluted accounts | Full flow, level-2 tweaks, baseline tally | ~20 | ~2:30 | Wants per-account mixes | Recipe link per account (bookmark 3) |
| Non-technical 45-year-old ("just want cooking back") | Chips → preset → type "politics" → keep defaults | ~9 | ~1:30 | Chart feels like homework | Defaults are good enough; "Looks good" button is primary; chart is optional to touch |
| Teen with 30 seconds | Landing → YouTube → "Too much of one thing" → type → results | ~6 | ~0:45 | Leaves before results | Every step after "too much of" is skippable; "Skip to my fix" is always visible |

### 7.2 Screen by screen (mobile first)

1. **Landing.** Mascot with hard hat, headline "Your feed's stuck on repeat. Let's fix it.", one button "Start my tune-up (2 min)". Under the fold: three-step explainer (G-01) and privacy line "No login. Nothing leaves your browser."
2. **Platform.** Four large tiles; YouTube marked "Full tune-up", others "Tip guide".
3. **Likes.** 12 chips in a wrap grid, "+ add your own".
4. **What's wrong.** 5 preset cards with icons + optional text box.
5. **Too much of.** Input with suggestion chips; entries stack as removable red chips.
6. **Mix.** Chart on top (sunburst default; segmented control for Pie / Bars / Numbers), slider list below with lock pins, dials (wildcard, time capsule) in a collapsible "Special dials" panel. Tap a category to edit its sub-topics.
7. **Your fix.** Tabs or stacked sections in order: Cleanup (checklist with progress), Rehab playlist, How to watch, Tips, Save (recipe link, calendar reminder), tip line.

Desktop: same flow in a centered 720px column; the mix screen goes two-column (chart left, sliders right).

### 7.3 Mix builder interaction

- Sliders move in 1% steps; arrow keys ±1, Shift+arrow ±5, Home/End to 0/100.
- Auto-balance: the change is absorbed proportionally by unlocked siblings; locked slices never move; if everything else is locked, the slider stops.
- Total pill always reads 100%.
- View toggle animates (arcs grow, bars slide); `prefers-reduced-motion` disables it.
- Colors: fixed categorical order from a CVD-validated palette; sub-topics use lighter/darker steps of their parent's hue; every slice is also labelled in the legend and the Numbers view, so color is never the only cue.
- Numbers view is a real table for screen readers.

### 7.4 States

- **Empty:** no likes picked → a starter mix (Comedy, Science, Something new) with "Change these anytime."
- **Loading:** mascot "tightening bolts" with a skeleton list.
- **Error / quota:** "YouTube's search is busy right now, so here are search links that do the same job." Never a dead end.
- **Offline:** checklist and tips still render.

### 7.5 Copy decisions

- Targets, not guarantees: "This is the mix we'll steer toward. Feeds shift over 3–7 days."
- Tip jar, once, after the playlist: "Feed running better? The mechanic runs on coffee." Never a pop-up, never before value is delivered.
- Tune-up: "Add a tune-up reminder for next week" (calendar file), not nagging notifications.

---

## 8. Brand and design system

### 8.1 Names (trademark and domain checks UNVERIFIED)

| # | Name | Note |
| --- | --- | --- |
| 1 | **Feed Garage** | Mechanic metaphor built in; friendly; clear |
| 2 | **Unstuck** | Names the outcome; likely crowded |
| 3 | **Feedwright** | Distinctive, ownable; less obvious meaning |
| 4 | Algorithm Builder | Current working name; descriptive, generic |
| 5 | Tune-Up | Clear; generic, hard to own |
| 6 | Rewire | Punchy; used widely |
| 7 | Feed Mechanic | Literal, clear |
| 8 | Mixwright | Emphasizes the mix builder |
| 9 | Algo Garage | Casual; "algo" is jargon |
| 10 | ReFeed | Short; ambiguous |
| 11 | Feedback Loop | Clever; confusing |
| 12 | Detour | Evocative; unclear |
| 13 | Spin Cycle | Fun; off-message |
| 14 | Recipe for Feeds | Ties to recipe links; long |
| 15 | Fresh Feed | Clear; generic |

**Top 3: Feed Garage, Feedwright, Unstuck.** Recommendation: **Feed Garage**. The mechanic, the tune-up and the check-engine light all fall out of it. **Mascot name: Gus**, a small round mechanic in an orange hard hat.

The build keeps "Algorithm Builder" as a single constant until you pick.

### 8.2 Mascot

- **Personality:** calm, unbothered, a little dry. Has seen worse feeds.
- **Backstory:** Gus used to fix jukeboxes that only played one song. Now he fixes feeds.
- **Poses:** diagnosing (clipboard, squint), celebrating (wrench raised), confused/error (scratching hat).
- **Motion:** slow idle bob, blink every few seconds, pose swap on step change; all off under reduced motion.
- **Appears:** landing, each step header (small), loading, errors, results, shorts.

### 8.3 Voice

| Do | Don't |
| --- | --- |
| "Yeah, that's a lot of Star Wars." | "Your algorithm is toxic!" |
| "Give it a few days." | "Guaranteed results!" |
| "Skip this if you're in a hurry." | "Don't leave yet!" |

Sample microcopy: "Start my tune-up (2 min)" · "Looks good, build my fix" · "Turn this down" · "Lock this slice" · "Something I'd never click" · "Time capsule: great stuff from before 2020" · "YouTube's search is busy, so here are links that do the same job" · "Checked 4 of 6, nice." · "Save my recipe" · "Feed running better? The mechanic runs on coffee."

### 8.4 Visual identity

- **Palette:** warm off-white paper surface, asphalt ink, **safety orange** as the single brand accent (hard hat), a muted "alarm" red only for the turn-down list. Dark mode: asphalt surface with the same accent stepped for contrast. Chart series use a CVD-validated categorical order, separate from brand colors.
- **Type:** a rounded, sturdy display face for headings (e.g. "Bricolage Grotesque") and a clean sans for body (e.g. "Inter").
- **Iconography:** thick-stroke, rounded line icons; tools and road signs.
- **Illustration:** flat, geometric, 2–3 colors, thick outlines.
- **Charts:** thin gaps between slices, rounded ends, direct labels on large slices, legend always.
- **Motion:** 200–400ms eases; nothing loops except the mascot idle.

### 8.5 Positioning

- **Tagline:** "Your feed's stuck on repeat. Let's fix it."
- **30-second pitch:** "One curious click and your feed is 20 videos of the same thing. Feed Garage takes two minutes: tell it what you're sick of and what you actually want, and it gives you the exact buttons to press to clean up, plus a playlist to retrain YouTube. No login, no data, free."
- **Versus YouTube's settings:** they exist but are scattered and unexplained; we tell you which ones and in what order.
- **Versus Unhook and similar extensions:** they hide recommendations; we fix them.
- **Versus Tournesol:** it's a separate recommendation site; we fix the feed you already use.

### 8.6 Launch shorts (10 ideas)

1. "One Game of Thrones video ruined my feed" (the origin story).
2. "Stop liking things. Do this instead" (save and share are private).
3. "The fastest way to kill a topic": delete it from history.
4. "Watched a whole horror clip by accident? Undo it in 1 tap."
5. "Why your TV and phone feeds are different."
6. "Arguing in the replies is why your X feed is angry."
7. "The pause-history trick for one-off curiosity watches."
8. "Great videos from 2012 the algorithm forgot" (time capsule).
9. "I fixed my feed in a week: before/after tally."
10. "Your thumb is a vote, even when you don't mean it."

---

## 9. Business, metrics and risk

**Monetization verdict:** don't try to make money in year one. Tip jar only. Estimated tips: roughly $0–50/month at 1k monthly users, a few hundred at 10k+ (rough estimate). Revisit Pro once the tune-up return rate is known.

**Growth:** first 1,000 users from the founder's own shorts (the origin story), Reddit communities about YouTube and productivity, and friends; next 10,000 from consistent shorts (3 a week) and the V2 report card. Paid spend: $0.

**North-star metric:** mix match = on-topic share of the first 20 homepage videos, day 0 vs day 7 (G-02). Targets for launch: 40% of visitors reach results (activation); 25% complete the baseline tally; 15% return for the tune-up; 10% copy the recipe link.

**Validation plan (improved):**

1. Days 1–7: the founder's three accounts. Account A: cleanup only. Account B: playlist only. Account C: both. Tally the first 20 homepage videos (phone and TV) on days 0, 1, 3, 7.
2. Same period: 10 friends run the built MVP (not a form; it now exists), with a before/after tally.
3. Success: average mix match improves by 20+ points on "both" by day 7, and 5 of 10 friends say they'd use it again.

**Kill criteria:** under 10 points of improvement on the founder's "both" account and fewer than 3 of 10 friends returning → stop building features; rework the method or pivot to pure content (the shorts channel).

**Risk register:**

| Risk | Likelihood (1–5) | Impact (1–5) | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| Results too slow to notice | 4 | 5 | Lead with removal; G-02 tally; set expectations | Founder |
| Can't get attention | 4 | 5 | Shorts cadence; shareable outputs | Founder |
| Quota exhausted | 3 | 3 | Cache, fallback, quota audit | Founder |
| Platforms ship their own controls | 3 | 3 | Guide users to them | Founder |
| Stale tips | 3 | 2 | Date stamps; quarterly review | Founder |
| Google verification delays (sign-in) | 2 | 2 | Not needed for MVP | Founder |
| Nobody pays | 5 | 2 | Costs near zero; money is not the year-one goal | Founder |

**Acquisition angle:** a buyer (digital-wellbeing apps, parental-control companies, media brands) would pay for the audience, the curated pool and the brand. Build now: the shorts audience, a clean anonymous usage dataset of which mixes people want (aggregate only), and the curated pool.

---

## 10. Seven-day scoping plan

| Day | Deliverable |
| --- | --- |
| 1 | Answer the open questions (section 12); lock assumptions; re-verify UNVERIFIED platform facts in each app |
| 2 | Review this scorecard; move any grade you disagree with; freeze the MVP cut line |
| 3 | Run the baseline tallies on your 3 accounts; start the validation week |
| 4 | Create the Google Cloud project, API key and quota-audit request; deploy the MVP to a preview URL |
| 5 | UX pass on a real phone with 3 friends; fix the top 5 confusions |
| 6 | Pick the name; commission or refine the mascot; draft 3 shorts |
| 7 | Read day-7 tallies; go/no-go against the kill criteria; write the 30/60/90 plan |

**30/60/90:** 30 days: MVP live, 10 shorts, first 1,000 users. 60 days: Takeout upload + report card (V2), email tune-ups. 90 days: curated pool with time capsule classics, hidden gems, decision on Pro.

---

## 11. Top 10 actions for next week

1. Run the baseline tally on your three accounts today (before touching anything).
2. Create the Google Cloud project and YouTube API key; file the quota increase.
3. Deploy the MVP (this repo's `algorithm-builder/`) to a Netlify preview with the key set.
4. Put the MVP in front of 10 friends with the tally.
5. Re-check every tip card in the actual apps; fix anything that's moved.
6. Pick the name (Feed Garage is the recommendation) and buy the domain.
7. Refine Gus (the mascot) or commission a redraw.
8. Record the origin-story short.
9. Write the privacy page and terms (short, plain).
10. Day 7: go/no-go against the kill criteria.

## 12. Open questions for the founder

- [ ] How many hours a week can you give this, realistically?
- [ ] Budget ceiling per month?
- [ ] Feed Garage, Feedwright, Unstuck, or keep Algorithm Builder?
- [ ] Do you want to be the face of the shorts, or only Gus?
- [ ] Should the three accounts' tallies be published as launch content?
- [ ] Is the target audience 18–35 US, or broader from day one?
- [ ] Is Instagram important enough to pull hand-picked reel lists into V2?
