# Launch Check: research notes

Checked September 25, 2026. Every figure below links to the page it came from. Store rules change: re-check before quoting any of this publicly.

## Does "90% of vibe-coded apps get rejected" hold up?

**No. There's no source for it, so don't use it.**

- No study, survey or official figure gives a rejection rate for AI-built or vibe-coded apps. A few blogs say the rate is "likely higher" than average, but they give no data.
- The only "90%" figures Apple publishes are about **speed**: "On average, 90% of submissions are reviewed in less than 24 hours" ([Apple](https://developer.apple.com/distribute/app-review/)). Apple also told The Information that 90% are processed within 48 hours.
- Apple counts rejections per **submission**, not per app. One app can be rejected several times and then approved, so these numbers can't tell you what share of apps never ship.

## Facts that are true and citable

| Fact | Source |
|---|---|
| Apple reviewed 9,100,620 submissions in 2025 and rejected 2,093,244, about **23%, or 1 in 4**. | [App Store Transparency Report 2025](https://www.apple.com/legal/app-store/transparency/2025/) |
| 2024: 7,771,599 reviewed, 1,931,400 rejected (24.9%). | [Transparency Report 2024 (PDF)](https://www.apple.com/legal/more-resources/docs/2024-App-Store-Transparency-Report.pdf) |
| 2025 rejections by guideline section: Performance 1,354,418 · Legal 495,673 · Design 415,532 · Business 283,820 · Safety 151,159. | Transparency Report 2025 |
| "Over 40% of unresolved issues are related to guideline 2.1: App Completeness": crashes, placeholder content, incomplete information. | [Apple: Avoiding common issues](https://developer.apple.com/distribute/app-review/) |
| In 2025 Apple rejected over 443,000 submissions for privacy problems, and over 371,000 as spam, copycats or misleading. | [Apple Newsroom, May 20, 2026](https://www.apple.com/newsroom/2026/05/the-app-store-stopped-over-2-point-2-billion-usd-in-fraudulent-transactions-in-2025/) |
| Q1 2026 app releases rose 60% year over year (80% on iOS). TechCrunch calls AI a "working hypothesis" for why. | [TechCrunch, Apr 18, 2026](https://techcrunch.com/2026/04/18/the-app-store-is-booming-again-and-ai-may-be-why/) |
| Google kept over 1.75 million policy-violating apps off Google Play in 2025. Google gives no total submission count, so there's no Google rejection rate. | [Google, Feb 19, 2026](https://blog.google/security/keeping-google-play-android-app-ecosystem-safe-2025/) |
| New personal Google Play accounts must run a closed test with at least 12 testers for 14 days in a row before publishing. | [Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465) |
| 170 of 1,645 Lovable apps checked (about 10%) had database tables anyone could read, exposing emails, addresses and payment details (CVE-2025-48757). | [Matt Palmer](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/) |
| A scan of 5,600 public vibe-coded apps found 2,000+ vulnerabilities, 400+ exposed secrets and 175 cases of exposed personal data. | [Escape, Oct 2025](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/) |
| 45% of AI-generated code samples failed security tests across 100+ models. | [Veracode 2025](https://www.veracode.com/blog/genai-code-security-report/) |
| 28.65 million new hardcoded secrets reached public GitHub in 2025, up 34%. | [GitGuardian 2026](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/) |

## Suggested marketing lines (each one backed by a source)

1. **"Apple sent back about 1 in 4 app submissions last year. Find out what would stop yours."** The figure is 2,093,244 of 9.1M in 2025.
2. **"Over 40% of unresolved App Review issues come down to one rule: finish the app. No crashes, no placeholder text, a working login for the reviewer."** Apple's own figure.
3. **"In 2025, 170 of 1,645 Lovable apps checked had databases anyone could read. Launch Check asks the question your AI didn't."**
4. **"Apple rejected over 443,000 submissions for privacy problems last year. Most of those fixes are forms and pages, not code."**
5. **"New to Google Play? You need 12 testers for 14 days before you can publish. Plan for it now."**

Avoid saying AI-built apps are rejected *more often*. Nobody has measured that.

## Why AI-built apps get sent back: the likely culprits

Apple doesn't break its numbers down by how an app was built. The pairing below is our reading of the guidelines, not a measured result.

| Guideline | What it catches | Why AI-built apps are prone to it |
|---|---|---|
| 2.1 App Completeness | Crashes, placeholder text, dead buttons, no demo login | AI tools leave "Coming soon" screens and untested paths |
| 5.1.1 / 5.1.2 Privacy | No privacy policy, no account deletion, data sent to AI without consent | Generated apps rarely include legal pages or deletion, and often call AI APIs with user data |
| 4.2 / 4.3 Minimum functionality, spam | Website wrappers, clones, "simple timers" and "sound effects" apps | Thin wrappers and common ideas are the easiest thing to generate |
| 3.1.1 Payments | Stripe used to unlock digital features | AI tools default to Stripe |
| 2.5.2 | Running downloaded code | Only matters if the app itself generates or runs code |

Related news: in March 2026 Apple held updates to apps that *build* apps (Replit, Vibecode, "Anything") under guideline 2.5.2 ([MacRumors](https://www.macrumors.com/2026/03/18/apple-blocks-updates-for-vibe-coding-apps/)). Apple said it has "no specific rules against vibe coding." That's about the builder tools, not about apps made with them.

## Recent rule changes the checklist reflects

- **Apple, Nov 13, 2025:** apps must disclose and get explicit permission before sharing personal data with third-party AI (5.1.2(i)).
- **Apple, since Apr 28, 2026:** uploads must be built with Xcode 26 and the iOS 26 SDK. Since Sep 9, 2026, apps must target iOS 13 or later. From April 2027, the iOS 27 SDK will be required.
- **Apple, since Mar 26, 2026:** new Health & Fitness and Medical apps in the US, UK and EU must declare whether they're a regulated medical device.
- **Apple, 2025–2026:** new age ratings (13+, 16+, 18+). Social-media questions required from September 2026.
- **Apple, US storefront since May 2025:** apps may link to outside payment. The fee question is still in court. New EU terms start Oct 1, 2026.
- **Google, since Aug 31, 2026:** new apps must target API level 36 (Android 16), with extensions available until Nov 1, 2026.
- **Google, 2026–2027:** Android developer verification starts regionally in September 2026 and goes global in 2027.
- **Google, since Oct 29, 2025:** US developers may use alternative billing after enrolling. Fees apply from Oct 1, 2026.

## Couldn't verify

- An official Apple page for the 200 MB mobile-data download prompt. The checklist cites MacRumors for it.
- Whether the Tea app breach (2025) involved AI-built code. Don't present it as a vibe-coding incident.
- Exact current Apple commission on US link-outs (still being decided in court).
