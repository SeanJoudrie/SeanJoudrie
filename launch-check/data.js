/* Launch Check: the master checklist.

   Every item says what to do, why, and how, and links to the rule or guide
   it comes from. Sources were opened and checked on the date in `checked`.
   Store rules change: re-check the sources before relying on them.

   when(c)   decides whether the item applies. `c` is built in app.js from the
             person's answers (c.ios, c.android, c.web, c.accounts, c.digital…).
   sev       'blocker' | 'before' | 'recommended' | 'after', or a function of c.
   gap       shown at the top of the results when the item blocks release and
             isn't done yet. Lower rank shows first.
   have      the "What do you already have?" answer that marks it done. */
(function () {
  'use strict';

  function link(label, url) {
    return '<a href="' + url + '" target="_blank" rel="noopener">' + label + '<span class="sr-only"> (opens in a new tab)</span></a>';
  }

  var SRC = {
    appleGuidelines: { label: 'Apple: App Review Guidelines', url: 'https://developer.apple.com/app-store/review/guidelines/' },
    appleCommon: { label: 'Apple: Avoiding common App Review issues', url: 'https://developer.apple.com/distribute/app-review/' },
    supaRls: { label: 'Supabase: Row Level Security', url: 'https://supabase.com/docs/guides/database/postgres/row-level-security' },
    supaProd: { label: 'Supabase: Production checklist', url: 'https://supabase.com/docs/guides/deployment/going-into-prod' },
    supaKeys: { label: 'Supabase: API keys', url: 'https://supabase.com/docs/guides/api/api-keys' },
    supaAdvisor: { label: 'Supabase: Security Advisor', url: 'https://supabase.com/docs/guides/database/database-advisors' },
    lovableCve: { label: 'Matt Palmer: 170 Lovable apps with open databases (CVE-2025-48757)', url: 'https://mattpalmer.io/posts/statement-on-CVE-2025-48757/' },
    escape: { label: 'Escape: 2,000+ vulnerabilities in 5,600 vibe-coded apps', url: 'https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/' },
    fbRules: { label: 'Firebase: Security Rules basics', url: 'https://firebase.google.com/docs/rules/basics' },
    fbKeys: { label: 'Firebase: API keys', url: 'https://firebase.google.com/docs/projects/api-keys' },
    fbAppCheck: { label: 'Firebase: App Check', url: 'https://firebase.google.com/docs/app-check' },
    vite: { label: 'Vite: environment variables', url: 'https://vite.dev/guide/env-and-mode' },
    nextEnv: { label: 'Next.js: environment variables', url: 'https://nextjs.org/docs/app/guides/environment-variables' },
    ghRemove: { label: 'GitHub: Removing sensitive data from a repository', url: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository' },
    ghPush: { label: 'GitHub: About push protection', url: 'https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection' },
    ghScan: { label: 'GitHub: About secret scanning', url: 'https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning' },
    ghVisibility: { label: 'GitHub: Setting repository visibility', url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility' },
    gh2fa: { label: 'GitHub: Configuring two-factor authentication', url: 'https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication' },
    ghDependabot: { label: 'GitHub: Dependabot security updates', url: 'https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates' },
    gitguardian: { label: 'GitGuardian: State of Secrets Sprawl 2026', url: 'https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/' },
    supaBackups: { label: 'Supabase: Database backups', url: 'https://supabase.com/docs/guides/platform/backups' },
    fbBackups: { label: 'Firebase: Firestore backups', url: 'https://firebase.google.com/docs/firestore/backups' },
    supaRate: { label: 'Supabase: Auth rate limits', url: 'https://supabase.com/docs/guides/auth/rate-limits' },
    supaCaptcha: { label: 'Supabase: Auth CAPTCHA', url: 'https://supabase.com/docs/guides/auth/auth-captcha' },
    supaSecurity: { label: 'Supabase: Security (encryption at rest)', url: 'https://supabase.com/security' },
    webHttps: { label: 'web.dev: Why HTTPS matters', url: 'https://web.dev/articles/why-https-matters' },
    netlifyHttps: { label: 'Netlify: HTTPS (free, automatic)', url: 'https://docs.netlify.com/domains-https/https-ssl/' },
    ghPagesHttps: { label: 'GitHub Pages: Securing your site with HTTPS', url: 'https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https' },
    ghPagesLimits: { label: 'GitHub Pages: Limits (not for running a business)', url: 'https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits' },
    vercelDomain: { label: 'Vercel: Adding a domain', url: 'https://vercel.com/docs/domains/add-a-domain' },
    cfRegistrar: { label: 'Cloudflare Registrar', url: 'https://developers.cloudflare.com/registrar/' },
    caloppa: { label: 'California law (CalOPPA), §22575', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22575' },
    gdprNotice: { label: 'GDPR.eu: What a privacy notice must include', url: 'https://gdpr.eu/privacy-notice/' },
    ccpa: { label: 'California AG: Who the CCPA applies to', url: 'https://oag.ca.gov/privacy/ccpa' },
    termly: { label: 'Termly: Privacy policy generator', url: 'https://termly.io/products/privacy-policy-generator/' },
    iubenda: { label: 'iubenda: Privacy and cookie policy generator', url: 'https://www.iubenda.com/en/privacy-and-cookie-policy-generator' },
    termlyTerms: { label: 'Termly: Terms and conditions generator', url: 'https://termly.io/products/terms-and-conditions-generator/' },
    euCookies: { label: 'Your Europe: Cookies and consent', url: 'https://europa.eu/youreurope/business/dealing-with-customers/data-protection/online-privacy/index_en.htm' },
    icoCookies: { label: 'UK ICO: Exceptions to cookie consent', url: 'https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/' },
    coppa: { label: 'FTC: Complying with COPPA (FAQ)', url: 'https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions' },
    hbnr: { label: 'FTC: Health Breach Notification Rule', url: 'https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0' },
    playAccount: { label: 'Google Play: Create a developer account', url: 'https://support.google.com/googleplay/android-developer/answer/6112435' },
    playOrg: { label: 'Google Play: Choosing an account type', url: 'https://support.google.com/googleplay/android-developer/answer/13634885' },
    playPublic: { label: 'Google Play: What your developer page shows', url: 'https://support.google.com/googleplay/android-developer/answer/13628312' },
    playTesting: { label: 'Google Play: Testing requirements for new personal accounts', url: 'https://support.google.com/googleplay/android-developer/answer/14151465' },
    playTracks: { label: 'Google Play: Set up a closed test', url: 'https://support.google.com/googleplay/android-developer/answer/9845334' },
    androidVerify: { label: 'Android: Developer verification', url: 'https://developer.android.com/developer-verification' },
    targetSdk: { label: 'Android: Target API level requirements', url: 'https://developer.android.com/google/play/requirements/target-sdk' },
    aab: { label: 'Android: About Android App Bundles', url: 'https://developer.android.com/guide/app-bundle' },
    playSize: { label: 'Google Play: App size limits', url: 'https://support.google.com/googleplay/android-developer/answer/9859152' },
    playDataSafety: { label: 'Google Play: Data safety form', url: 'https://support.google.com/googleplay/android-developer/answer/10787469' },
    playUserData: { label: 'Google Play: User data policy', url: 'https://support.google.com/googleplay/android-developer/answer/9888076' },
    playDeletion: { label: 'Google Play: Account deletion requirements', url: 'https://support.google.com/googleplay/android-developer/answer/13327111' },
    playListing: { label: 'Google Play: Store listing graphics', url: 'https://support.google.com/googleplay/android-developer/answer/9866151' },
    playRating: { label: 'Google Play: Content ratings', url: 'https://support.google.com/googleplay/android-developer/answer/9859655' },
    playAudience: { label: 'Google Play: Target audience and content', url: 'https://support.google.com/googleplay/android-developer/answer/9867159' },
    playPrepare: { label: 'Google Play: Prepare your app for review', url: 'https://support.google.com/googleplay/android-developer/answer/9859455' },
    playHealthDecl: { label: 'Google Play: Health apps declaration', url: 'https://support.google.com/googleplay/android-developer/answer/14738291' },
    playHealthPolicy: { label: 'Google Play: Health content and services policy', url: 'https://support.google.com/googleplay/android-developer/answer/16679511' },
    playFinance: { label: 'Google Play: Financial features declaration', url: 'https://support.google.com/googleplay/android-developer/answer/13849271' },
    playFamilies: { label: 'Google Play: Families policy', url: 'https://support.google.com/googleplay/android-developer/answer/9893335' },
    playBilling: { label: 'Google Play: Payments policy', url: 'https://support.google.com/googleplay/android-developer/answer/10281818' },
    playBillingUS: { label: 'Google Play: US billing changes (Oct 2025)', url: 'https://support.google.com/googleplay/android-developer/answer/15582165' },
    playReview: { label: 'Google Play: Review times', url: 'https://support.google.com/googleplay/android-developer/answer/9859751' },
    lcp: { label: 'web.dev: Optimize Largest Contentful Paint', url: 'https://web.dev/articles/optimize-lcp' },
    vitals: { label: 'web.dev: Core Web Vitals', url: 'https://web.dev/articles/vitals' },
    lighthouse: { label: 'Chrome: Lighthouse', url: 'https://developer.chrome.com/docs/lighthouse/overview' },
    appleEnroll: { label: 'Apple: Enroll in the Apple Developer Program', url: 'https://developer.apple.com/programs/enroll/' },
    appleEnrollSupport: { label: 'Apple: Enrollment help', url: 'https://developer.apple.com/support/enrollment/' },
    appleDuns: { label: 'Apple: D-U-N-S Number', url: 'https://developer.apple.com/support/D-U-N-S/' },
    appleUpcoming: { label: 'Apple: Upcoming requirements (Xcode and SDK minimums)', url: 'https://developer.apple.com/news/upcoming-requirements/' },
    appleUpload: { label: 'Apple: Upload builds', url: 'https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds' },
    appleNewApp: { label: 'Apple: Add a new app', url: 'https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app' },
    expoSubmit: { label: 'Expo: Submit to the Apple App Store (works without a Mac)', url: 'https://docs.expo.dev/submit/ios/' },
    appleAgreements: { label: 'Apple: Sign and update agreements', url: 'https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements' },
    applePrivacyDetails: { label: 'Apple: App privacy details', url: 'https://developer.apple.com/app-store/app-privacy-details/' },
    appleReasonApi: { label: 'Apple: Describing use of required reason API', url: 'https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api' },
    appleSdkReqs: { label: 'Apple: Third-party SDK requirements', url: 'https://developer.apple.com/support/third-party-SDK-requirements/' },
    appleAiNews: { label: 'Apple: Guideline update, Nov 13 2025 (third-party AI)', url: 'https://developer.apple.com/news/?id=ey6d8onl' },
    appleDeletion: { label: 'Apple: Offering account deletion in your app', url: 'https://developer.apple.com/support/offering-account-deletion-in-your-app/' },
    appleIap: { label: 'Apple: In-App Purchase', url: 'https://developer.apple.com/in-app-purchase/' },
    appleUsLinks: { label: 'Apple: US storefront guideline update, May 2025', url: 'https://developer.apple.com/news/?id=9txfddzf' },
    appleEuTerms: { label: 'Apple: New EU terms from Oct 1 2026', url: 'https://developer.apple.com/news/?id=gmws0jgp' },
    appleSubs: { label: 'Apple: Auto-renewable subscriptions', url: 'https://developer.apple.com/app-store/subscriptions/' },
    appleVersionInfo: { label: 'Apple: Platform version information (support URL, review notes)', url: 'https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information' },
    appleAppInfo: { label: 'Apple: App information fields', url: 'https://developer.apple.com/help/app-store-connect/reference/app-information/app-information' },
    appleScreens: { label: 'Apple: Screenshot specifications', url: 'https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications' },
    appleIcons: { label: 'Apple: App icons', url: 'https://developer.apple.com/design/human-interface-guidelines/app-icons' },
    appleAgeNews: { label: 'Apple: New age ratings (July 2025)', url: 'https://developer.apple.com/news/?id=ks775ehf' },
    appleAgeSocial: { label: 'Apple: Social media age rating questions (July 2026)', url: 'https://developer.apple.com/news/?id=tlur8uvi' },
    appleAgeHow: { label: 'Apple: Set an app age rating', url: 'https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating' },
    appleExport: { label: 'Apple: Export compliance', url: 'https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance' },
    appleDsa: { label: 'Apple: EU Digital Services Act trader requirements', url: 'https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements' },
    appleTestflight: { label: 'Apple: TestFlight overview', url: 'https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview' },
    appleSize: { label: 'Apple: Maximum build file sizes', url: 'https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes' },
    cellularLimit: { label: 'MacRumors: The 200 MB mobile-data download prompt', url: 'https://www.macrumors.com/how-to/download-large-apps-over-cellular-iphone-ipad/' },
    appleMedDevice: { label: 'Apple: Regulated medical device status (Mar 2026)', url: 'https://developer.apple.com/news/?id=nyqbfz1y' },
    appleMindful: { label: 'Apple: HealthKit mindful session', url: 'https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier/mindfulsession' },
    appleBgModes: { label: 'Apple: Background modes', url: 'https://developer.apple.com/documentation/bundleresources/information-property-list/uibackgroundmodes' },
    appleJune2026: { label: 'Apple: Guideline update, June 8 2026', url: 'https://developer.apple.com/news/?id=a233fmpw' },
    appleTransparency: { label: 'Apple: App Store Transparency Report 2025', url: 'https://www.apple.com/legal/app-store/transparency/2025/' },
    wcag: { label: 'W3C: WCAG 2.2', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/' },
    androidA11y: { label: 'Android: Accessibility', url: 'https://developer.android.com/guide/topics/ui/accessibility' }
  };

  var PHASES = [
    { id: 'accounts', title: '1. Set up your accounts', intro: 'Some of these take days to approve, so start them first.' },
    { id: 'secure', title: '2. Lock down your data', intro: 'Before real people sign up. These are the gaps AI-built apps most often ship with.' },
    { id: 'legal', title: '3. Write your legal pages', intro: 'Stores and privacy laws require these. Generators are fine to start with.' },
    { id: 'inapp', title: '4. Add what the stores require inside the app', intro: 'Features reviewers look for. Ask your AI to build each one.' },
    { id: 'build', title: '5. Build and test', intro: 'Get a real build onto real phones and fix what breaks.' },
    { id: 'listing', title: '6. Fill in your store listing', intro: 'The forms, pictures and answers the store needs before you can submit.' },
    { id: 'submit', title: '7. Submit for review', intro: '' },
    { id: 'after', title: '8. After launch', intro: '' }
  ];

  var always = function () {
    return true;
  };

  var ITEMS = [
    // ---------------- 1. Accounts ----------------
    {
      id: 'apple-developer',
      phase: 'accounts',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      have: 'apple',
      gap: { rank: 3, title: 'Get an Apple developer account', why: 'You can’t publish without it, and approval can take a few days.' },
      title: 'Join the Apple Developer Program',
      why: 'It’s the only way to publish on the App Store, and it costs $99 a year.',
      steps: [
        'Sign in at ' + link('developer.apple.com/programs/enroll', 'https://developer.apple.com/programs/enroll/') + ' with an Apple Account that has two-factor authentication turned on.',
        'Choose <strong>Individual</strong> or <strong>Organization</strong>. As an individual, your legal name is shown as the seller, so enroll under it exactly (nicknames cause delays).',
        'An organization must be a real legal entity with a public website, and needs a free D-U-N-S number. Allow up to 5 business days to get one, plus 2 for Apple to receive it.',
        'Enroll in the Apple Developer app (it scans your photo ID) or on the website, and pay the $99 yearly fee.',
        'Apple says to contact them if you haven’t heard back within 24 hours. Once you’re in, sign in to App Store Connect.'
      ],
      sources: [SRC.appleEnroll, SRC.appleEnrollSupport, SRC.appleDuns]
    },
    {
      id: 'play-developer',
      phase: 'accounts',
      when: function (c) { return c.android; },
      sev: 'blocker',
      have: 'google',
      gap: { rank: 3, title: 'Get a Google Play account', why: 'You can’t publish on Google Play without one, and ID checks take time.' },
      title: 'Create a Google Play developer account',
      why: 'It’s the only way to publish on Google Play. It costs a one-time $25.',
      steps: [
        'Go to ' + link('play.google.com/console', 'https://play.google.com/console') + ' and sign in with a Google account you’ll keep for years, not a throwaway.',
        'Choose <strong>Personal</strong> or <strong>Organization</strong>. Finance and health apps may need an Organization account, which needs a free D-U-N-S number.',
        'Pay the $25 fee and verify your identity with a government ID and a card in your legal name.',
        'Verify an Android phone using the Play Console app. New personal accounts must do this.',
        'Know what’s public: Google shows your legal name, country and developer email on your store page.'
      ],
      sources: [SRC.playAccount, SRC.playOrg, SRC.playPublic]
    },
    {
      id: 'regulated-entity',
      phase: 'accounts',
      when: function (c) { return c.store && c.finance && c.moneyMoving; },
      sev: 'blocker',
      gap: { rank: 3, title: 'Publish as a licensed company', why: 'Apple and Google require apps like this to come from a licensed company.' },
      title: 'Publish under the licensed company, not your personal account',
      why: 'Apple’s guideline 5.1.1(ix) and Google’s account rules require finance apps like these to come from an organization.',
      steps: [
        'Enroll with Apple and Google as an <strong>Organization</strong>, using the company that holds any required licences.',
        'Get a D-U-N-S number for that company first.',
        'Have your licences ready: reviewers may ask for them.',
        'Loan apps on the App Store can’t charge more than 36% APR or require full repayment in 60 days or less.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleAiNews, SRC.playOrg]
    },
    {
      id: 'website',
      phase: 'accounts',
      when: always,
      sev: function (c) { return c.store ? 'blocker' : 'before'; },
      have: 'website',
      gap: { rank: 6, title: 'Get a simple website', why: 'Stores need working web links to your privacy policy and support page.' },
      title: 'Get a simple website on your own domain',
      why: 'Your privacy policy, terms, support page and account-deletion page all need a public web address.',
      steps: [
        'Buy a domain name (about $10–15 a year) from a registrar such as ' + link('Cloudflare Registrar', 'https://developers.cloudflare.com/registrar/') + ', or through your host. Turn on auto-renew.',
        'Create a free account on Netlify or Vercel, connect your GitHub repo or drag in a folder, and deploy. You get a working address straight away.',
        'Add your domain in the host’s Domains settings and copy the DNS records it shows into your registrar.',
        'Make four pages: home, privacy policy, terms, and support (with your email). Ask your AI to write them as plain HTML.',
        'GitHub Pages also works for a simple info page, but its rules don’t allow running a business on it.'
      ],
      sources: [SRC.vercelDomain, SRC.netlifyHttps, SRC.cfRegistrar, SRC.ghPagesLimits]
    },
    {
      id: 'support-email',
      phase: 'accounts',
      when: always,
      sev: 'before',
      have: 'support',
      title: 'Set up a support email address',
      why: 'Stores publish a contact for your app, and privacy and deletion requests need somewhere to go.',
      steps: [
        'Create an address just for the app, like support@yourdomain (most registrars offer free forwarding) or a separate Gmail account.',
        'Put it on your support page, in your privacy policy and inside the app.',
        'Check it every few days. Reviewers and users will write to it.'
      ],
      sources: [SRC.playPublic, { label: 'Apple: App information (support URL)', url: 'https://developer.apple.com/help/app-store-connect/reference/app-information/app-information' }]
    },
    {
      id: 'two-factor',
      phase: 'accounts',
      when: always,
      sev: 'before',
      title: 'Turn on two-factor login for every account behind the app',
      why: 'Anyone who gets into your GitHub, database, hosting or domain account gets your app.',
      steps: [
        'Turn on two-factor authentication for GitHub, your database (Supabase or Firebase), your host, your domain registrar, your payment provider and your AI builder.',
        'Use an authenticator app or a passkey rather than text messages.',
        'Save the recovery codes somewhere safe, like a password manager.'
      ],
      sources: [SRC.gh2fa, SRC.supaProd]
    },

    // ---------------- 2. Secure ----------------
    {
      id: 'find-data',
      phase: 'secure',
      when: function (c) { return c.a.data === 'unsure'; },
      sev: 'blocker',
      gap: { rank: 1, title: 'Find out where data is kept', why: 'You can’t protect data or write a privacy policy until you know where it is.' },
      title: 'Find out where your app stores data',
      why: 'Every later step, from security to the store’s privacy forms, depends on this answer.',
      steps: [
        'Ask the AI you built with: “Where does this app store user data? Name the service, and list every table or collection and what’s in it.”',
        'Ask it: “Which API keys does this app use, and are any of them in code that runs in the browser or on the phone?”',
        'Write the answers down. Come back and run Launch Check again with them.'
      ],
      sources: [SRC.escape, SRC.lovableCve]
    },
    {
      id: 'supabase-rls',
      phase: 'secure',
      when: function (c) { return c.a.data === 'supabase'; },
      sev: 'blocker',
      gap: { rank: 1, title: 'Lock down your database', why: 'In 2025, 170 of 1,645 Lovable apps checked had databases anyone could read.' },
      title: 'Turn on Row Level Security for every Supabase table',
      why: 'With it off, anyone who has your project address can read, change or delete everything in that table.',
      steps: [
        'In the Supabase dashboard, open <strong>Table Editor</strong>. Any table marked as unrestricted or without RLS needs fixing.',
        'Turn on RLS for every table. Tables made through AI tools or the SQL editor often have it off.',
        'Add policies so people can only see and change their own rows. Ask your AI: “Write Supabase RLS policies so each user can only access their own rows in each table.”',
        'Open <strong>Advisors → Security Advisor</strong> and fix everything marked as an error. Run it again until it’s clean.',
        'Check <strong>Storage</strong>: a “public” bucket can be read by anyone.'
      ],
      sources: [SRC.supaRls, SRC.supaAdvisor, SRC.supaProd, SRC.lovableCve]
    },
    {
      id: 'firebase-rules',
      phase: 'secure',
      when: function (c) { return c.a.data === 'firebase'; },
      sev: 'blocker',
      gap: { rank: 1, title: 'Replace Firebase’s test rules', why: 'Firebase’s rules are the only thing stopping strangers reading your data.' },
      title: 'Replace Firebase “test mode” rules before launch',
      why: 'Firebase says its Security Rules are the only thing stopping someone else reading or changing your data.',
      steps: [
        'In the Firebase console, open <strong>Rules</strong> for Firestore, Realtime Database and Storage.',
        'Remove any rule that lets everyone read or write, including the “test mode” rule with an end date.',
        'Allow access only to signed-in users, and only to their own data. Ask your AI to write these rules for your collections.',
        'Turn on App Check so only your real app can reach your backend.'
      ],
      sources: [SRC.fbRules, SRC.fbAppCheck, SRC.fbKeys]
    },
    {
      id: 'backend-access',
      phase: 'secure',
      when: function (c) { return c.a.data === 'other'; },
      sev: 'blocker',
      gap: { rank: 1, title: 'Lock down your database', why: 'A scan of 5,600 vibe-coded apps found personal data exposed in 175 of them.' },
      title: 'Check that each person can only reach their own data',
      why: 'Open databases and unprotected endpoints are the most common serious gap in apps built quickly.',
      steps: [
        'Ask your AI: “List every endpoint or database query in this app. For each one, who is allowed to call it, and how does the code check that?”',
        'Anything that returns other people’s data without checking who’s asking must be fixed before launch.',
        'Make sure the database itself isn’t reachable from the internet with a password in the app’s code.'
      ],
      sources: [SRC.escape]
    },
    {
      id: 'secret-keys',
      phase: 'secure',
      when: function (c) { return c.cloud || c.ai || c.a.money !== 'none'; },
      sev: 'blocker',
      gap: { rank: 2, title: 'Move secret keys to a server', why: 'Anything inside an app can be copied, and a secret key can run up your bill.' },
      title: 'Move secret keys out of the app and into a server',
      why: 'Keys for OpenAI, Stripe or Supabase’s service role give full access. Anything shipped in an app or page can be copied.',
      steps: [
        'Ask your AI: “List every API key and secret this app uses, and say whether each one ends up in browser or phone code.”',
        'Public keys are fine in the app: Supabase’s publishable (anon) key and Firebase’s config are designed for that.',
        'Move every secret key (OpenAI, Stripe secret, Supabase secret or service_role) into a server function, such as Supabase Edge Functions or Firebase Functions.',
        'Never put a secret in a variable starting with <code>VITE_</code>, <code>NEXT_PUBLIC_</code> or <code>EXPO_PUBLIC_</code>: those are copied into the app.',
        'Store secrets in your host’s Environment Variables or Secrets settings, not in files in your repo.'
      ],
      sources: [SRC.supaKeys, SRC.vite, SRC.nextEnv, SRC.fbKeys]
    },
    {
      id: 'rotate-keys',
      phase: 'secure',
      when: always,
      sev: 'before',
      title: 'Replace any key that was ever in your code or chat',
      why: 'Deleting a key from a file doesn’t stop anyone who already copied it, and it stays in your GitHub history.',
      steps: [
        'Think about every key that was ever pasted into your code, a commit, a screenshot or an AI chat.',
        'In each provider’s dashboard, create a new key and put it in your secrets settings.',
        'Check the app still works, then delete the old key.',
        'Look at your billing and usage pages for anything you don’t recognise.'
      ],
      sources: [SRC.supaKeys, SRC.ghRemove, SRC.gitguardian]
    },
    {
      id: 'github-protection',
      phase: 'secure',
      when: always,
      sev: 'recommended',
      title: 'Turn on GitHub secret scanning and push protection',
      why: 'GitHub can stop you pushing a key by accident, and warn you about keys already in your repo.',
      steps: [
        'Open your repo’s <strong>Settings → Code security</strong>.',
        'Turn on push protection and secret scanning where they’re offered.',
        'Treat any alert as a leaked key: replace it, as in the step above.',
        'Turn on Dependabot alerts too, so you hear about security fixes for the packages your app uses.'
      ],
      sources: [SRC.ghPush, SRC.ghScan, SRC.ghDependabot]
    },
    {
      id: 'private-repo',
      phase: 'secure',
      when: always,
      sev: 'recommended',
      title: 'Keep your code repository private unless you mean to share it',
      why: 'Anyone can read a public repo, including every old commit and any key that was ever in it.',
      steps: [
        'On GitHub, open <strong>Settings → General → Danger Zone → Change visibility</strong> and make it private.',
        'Public forks stay public, so if a key was ever in a public repo, replace it anyway.',
        'If you host your site with GitHub Pages on a free plan, making the repo private unpublishes the site. Move hosting first.'
      ],
      sources: [SRC.ghVisibility]
    },
    {
      id: 'backups',
      phase: 'secure',
      when: function (c) { return c.cloud && c.a.data !== 'unsure'; },
      sev: 'before',
      title: 'Make sure you can restore your data if something goes wrong',
      why: 'Free database plans don’t keep automatic backups, so one bad change can erase your users’ data.',
      steps: [
        'Check your plan. Supabase Pro keeps 7 days of daily backups; the free plan doesn’t, so export your data regularly.',
        'Files you store (images, uploads) aren’t in database backups. Back them up separately.',
        'On Firebase, set up a Firestore backup schedule. None is set up by default.'
      ],
      sources: [SRC.supaBackups, SRC.fbBackups]
    },
    {
      id: 'abuse-limits',
      phase: 'secure',
      when: function (c) { return c.accounts || c.ai; },
      sev: 'before',
      title: 'Protect sign-up and paid AI calls from abuse',
      why: 'Bots can create fake accounts, flood your emails or use up your AI credits overnight.',
      steps: [
        'Add a CAPTCHA to sign-up, login and password reset. Supabase supports hCaptcha and Cloudflare Turnstile.',
        'Set up your own email sender (custom SMTP) before launch. Supabase’s built-in one only sends a few emails an hour.',
        'Set a monthly spending limit and alerts with your AI provider.',
        'Limit how often one person can call your AI features.'
      ],
      sources: [SRC.supaRate, SRC.supaCaptcha, SRC.supaProd]
    },
    {
      id: 'https',
      phase: 'secure',
      when: function (c) { return c.web || c.extension; },
      sev: 'blocker',
      title: 'Serve your site only over HTTPS',
      why: 'Browsers warn visitors away from sites without it, and passwords sent without it can be read.',
      steps: [
        'On Netlify or Vercel, HTTPS is automatic once your domain is connected.',
        'On GitHub Pages, tick <strong>Enforce HTTPS</strong> in Settings → Pages.',
        'Check that typing http:// takes you to https://, and that the app’s own API calls use https.'
      ],
      sources: [SRC.webHttps, SRC.netlifyHttps, SRC.ghPagesHttps]
    },

    // ---------------- 3. Legal ----------------
    {
      id: 'privacy-policy',
      phase: 'legal',
      when: always,
      sev: 'blocker',
      have: 'privacy',
      gap: { rank: 4, title: 'Write a privacy policy', why: 'Both app stores reject apps without one, and privacy laws require it.' },
      title: 'Write and publish a privacy policy',
      why: 'Stores require a working link to one, and it must match what your app actually does.',
      steps: [
        'Make a list: what data you collect (emails, analytics, crash logs count), why, which services receive it (Supabase, Firebase, Stripe, analytics, AI providers), how long you keep it, and how people can delete it.',
        'Use a generator such as ' + link('Termly', 'https://termly.io/products/privacy-policy-generator/') + ' or ' + link('iubenda', 'https://www.iubenda.com/en/privacy-and-cookie-policy-generator') + ' and answer from your list. Both have free tiers.',
        'Publish it as a normal web page on your site (not a PDF or a Google Doc).',
        'Link it inside the app where people can find it easily (for example in Settings), and on your website’s home page. Apple requires both the in-app link and the store link.',
        'Paste the link into App Store Connect and/or Play Console when you set up the listing.'
      ],
      sources: [SRC.caloppa, SRC.gdprNotice, SRC.playUserData, SRC.appleGuidelines, SRC.termly]
    },
    {
      id: 'terms',
      phase: 'legal',
      when: always,
      sev: function (c) { return c.ios && c.digital ? 'blocker' : 'before'; },
      have: 'terms',
      gap: { rank: 7, title: 'Write terms of service', why: 'Apple requires a terms of use link for apps that sell subscriptions.' },
      title: 'Write and publish terms of service',
      why: 'They set the rules for using your app, limit what you can be blamed for, and let you ban people who abuse it.',
      steps: [
        'Use a generator such as ' + link('Termly', 'https://termly.io/products/terms-and-conditions-generator/') + ' or iubenda.',
        'Make sure it covers: acceptable use, closing accounts, who owns what users create, payments and refunds, disclaimers, and how to contact you.',
        'If you charge money, make the refund and cancellation wording match the store’s rules.',
        'Publish it next to your privacy policy and link it on the sign-up screen and in the app.'
      ],
      sources: [SRC.termlyTerms, SRC.appleSubs, SRC.appleGuidelines]
    },
    {
      id: 'cookie-consent',
      phase: 'legal',
      when: function (c) { return (c.web || c.extension) && c.tracking; },
      sev: 'before',
      title: 'Ask before using analytics or ad cookies (EU and UK visitors)',
      why: 'EU law requires opt-in consent before any cookie that isn’t strictly needed, like analytics.',
      steps: [
        'List your trackers, such as Google Analytics or a Meta pixel. Login cookies don’t need consent.',
        'Add a consent banner (iubenda and Termly both offer one) that blocks trackers until someone accepts.',
        'Make “Reject” as easy as “Accept”, and add a “Cookie settings” link in your footer.',
        'Or switch to cookie-free analytics, which avoids most of this.'
      ],
      sources: [SRC.euCookies, SRC.icoCookies]
    },
    {
      id: 'coppa',
      phase: 'legal',
      when: function (c) { return c.kids; },
      sev: 'blocker',
      gap: { rank: 2, title: 'Get parental consent for kids', why: 'US law forbids collecting children’s data without a parent’s consent.' },
      title: 'Follow children’s privacy law (COPPA)',
      why: 'The FTC enforces it, and the rules were tightened in 2025.',
      steps: [
        'Decide honestly whether your app is aimed at, or likely to attract, children under 13.',
        'If it is: get verifiable parental consent before collecting any personal data, and publish a children’s privacy notice.',
        'Let parents see and delete their child’s data. Collect as little as possible.',
        'Don’t use ad or analytics tools that track children.',
        'This one is worth paying a lawyer or a COPPA Safe Harbor program to check.'
      ],
      sources: [SRC.coppa, SRC.playFamilies, SRC.appleGuidelines]
    },
    {
      id: 'health-breach',
      phase: 'legal',
      when: function (c) { return c.health && c.cloud; },
      sev: 'before',
      title: 'Know the FTC’s health data breach rule',
      why: 'Since 2024, health and wellness apps not covered by HIPAA must tell users and the FTC after a breach, including sharing health data with advertisers without permission.',
      steps: [
        'Write down where health-related data goes, such as mood check-ins, sleep or session history.',
        'Don’t send it to analytics or ad tools without clear, explicit permission.',
        'Write a short plan for what you’d do if it leaked: who you’d notify, and how, within 60 days.',
        'Mention health data plainly in your privacy policy.'
      ],
      sources: [SRC.hbnr]
    },

    // ---------------- 4. In-app requirements ----------------
    {
      id: 'account-deletion',
      phase: 'inapp',
      when: function (c) { return c.accounts && (c.store || c.web); },
      sev: function (c) { return c.store ? 'blocker' : 'before'; },
      gap: { rank: 5, title: 'Add account deletion', why: 'Apple and Google require it for any app with sign-up.' },
      title: 'Add a “Delete account” option inside the app',
      why: 'Apple and Google require an in-app way to delete an account and its data. Google also requires a web page for it.',
      steps: [
        'Add a clear “Delete account” button, for example in Settings → Account. Ask your AI to build it so it deletes the person’s data from your database too. Apple says only deactivating the account isn’t enough.',
        'Make a page on your website that names your app and explains how to request deletion (an email address is fine).',
        'If people pay through a subscription, tell them how to cancel it too. Deleting the account doesn’t cancel billing.',
        'Test it with a real account and check the data is gone.'
      ],
      sources: [SRC.appleDeletion, SRC.appleGuidelines, SRC.playDeletion]
    },
    {
      id: 'sign-in-with-apple',
      phase: 'inapp',
      when: function (c) { return c.ios && c.accounts; },
      sev: 'before',
      title: 'If you offer Google or Facebook login, add Sign in with Apple too',
      why: 'Guideline 4.8 requires a private login option alongside social logins. Email-and-password only doesn’t need it.',
      steps: [
        'Check how people log in. If it’s only your own email and password, skip this step.',
        'If you offer Google, Facebook or another social login, add Sign in with Apple as an equal option.',
        'Turn on the Sign in with Apple capability for your app ID, then ask your AI to add the button.',
        'When someone deletes their account, revoke their Sign in with Apple token too.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleDeletion]
    },
    {
      id: 'ai-consent',
      phase: 'inapp',
      when: function (c) { return c.ai && c.store; },
      sev: 'blocker',
      gap: { rank: 5, title: 'Ask before sending data to AI', why: 'Apple requires telling people and getting their permission first.' },
      title: 'Ask permission before sending personal data to an AI service',
      why: 'Apple’s guideline 5.1.2(i) requires you to disclose it and get explicit permission first.',
      steps: [
        'Before the first time the AI feature runs, show a short screen: which AI company receives what, and why.',
        'Give a clear “Allow” and “Not now”. The rest of the app should still work if they say no.',
        'Name the AI provider in your privacy policy and in the store’s privacy forms.',
        'Don’t send more than the feature needs, like a whole profile when a sentence would do.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleAiNews, SRC.playUserData]
    },
    {
      id: 'apple-iap',
      phase: 'inapp',
      when: function (c) { return c.ios && c.digital; },
      sev: 'blocker',
      gap: { rank: 5, title: 'Use Apple’s in-app purchase', why: 'Outside the US, Apple rejects features unlocked through Stripe.' },
      title: 'Use Apple’s in-app purchase for subscriptions and unlocks',
      why: 'Guideline 3.1.1 requires it for digital features and content sold inside an iPhone app.',
      steps: [
        'In App Store Connect, go to your app’s <strong>Subscriptions</strong> (or In-App Purchases) and create your products and prices.',
        'First, sign the Paid Apps Agreement and add bank and tax details under <strong>Business → Agreements</strong>. You can’t create purchases until you do.',
        'Connect the app to StoreKit. A service like RevenueCat makes this easier. Ask your AI to set it up.',
        'Add a “Restore purchases” button.',
        'Keep Stripe for physical goods or real-world services, which must not use in-app purchase.',
        'US only: since May 2025 you may also link to your own web checkout. What Apple can charge for that is still in court. EU: new terms from October 1, 2026 allow other payment options alongside in-app purchase. Read the current rules before relying on either.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleIap, SRC.appleAgreements, SRC.appleUsLinks, SRC.appleEuTerms]
    },
    {
      id: 'subscription-screen',
      phase: 'inapp',
      when: function (c) { return c.store && c.digital; },
      sev: 'before',
      title: 'Show the price, length and renewal clearly on your subscription screen',
      why: 'Apple’s guideline 3.1.2 lists what a subscription screen must say, and unclear ones get rejected.',
      steps: [
        'On the screen where people subscribe, show the subscription name, how long it lasts, what they get and the full renewal price.',
        'Make the amount they’ll actually be billed the biggest price on the screen. Don’t make a “per week” breakdown bigger than the yearly total.',
        'For a free trial, say how long it lasts and what it costs afterwards.',
        'Link your terms of use and privacy policy on that screen, and in the App Store description or the custom license agreement field.',
        'Add a “Restore purchases” button, and don’t hide the close button.'
      ],
      sources: [SRC.appleSubs, SRC.appleGuidelines]
    },
    {
      id: 'play-billing',
      phase: 'inapp',
      when: function (c) { return c.android && c.digital; },
      sev: 'blocker',
      gap: { rank: 5, title: 'Use Google Play Billing', why: 'Google requires Play Billing for digital items, with narrow US exceptions.' },
      title: 'Use Google Play Billing for subscriptions and unlocks',
      why: 'Google’s payments policy requires it for digital goods, with US exceptions that need enrolment.',
      steps: [
        'Create a payments profile in Play Console.',
        'Create your subscriptions or products under <strong>Monetize</strong>.',
        'Connect the app with the Play Billing Library, or a service like RevenueCat.',
        'Physical goods and services keep using Stripe or similar.',
        'US developers: alternative billing is allowed since October 2025, but you must enrol in Google’s program and pay its fees.'
      ],
      sources: [SRC.playBilling, SRC.playBillingUS]
    },
    {
      id: 'ugc',
      phase: 'inapp',
      when: function (c) { return c.a.ugc === 'yes'; },
      sev: function (c) { return c.store ? 'blocker' : 'before'; },
      gap: { rank: 6, title: 'Add report and block', why: 'Apple requires reporting and blocking in apps where people post.' },
      title: 'Add report, block and moderation tools',
      why: 'Guideline 1.2 requires them for any app where people can see what others post or send.',
      steps: [
        'Add a “Report” option on every post, comment or message.',
        'Let people block other users.',
        'Filter obviously objectionable content, and decide who reviews reports and how fast.',
        'Show a way to contact you inside the app, and publish community rules in your terms.',
        'Since June 2026, Apple says removing content that breaks the rules is your responsibility.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleJune2026]
    },
    {
      id: 'health-claims',
      phase: 'inapp',
      when: function (c) { return c.health; },
      sev: 'before',
      title: 'Don’t make medical claims, and say what the app isn’t',
      why: 'Stores look harder at health apps. Promising to treat or diagnose anything can get the app rejected.',
      steps: [
        'Remove words like “treats”, “cures”, “diagnoses” or “clinically proven” unless you can back them up.',
        'Add a short line in the app and the store description, such as: “Not a medical device. It doesn’t diagnose or treat any condition. Talk to a professional about your health.”',
        'If you show crisis or mental-health content, include a way to reach real help.',
        'On Google Play, fill in the Health apps declaration (every app has to, even to say “none”).'
      ],
      sources: [SRC.appleGuidelines, SRC.playHealthPolicy, SRC.playHealthDecl]
    },
    {
      id: 'audio-rights',
      phase: 'inapp',
      when: function (c) { return c.health && (c.a.detail === 'mindfulness' || c.a.detail === 'mental'); },
      sev: 'before',
      title: 'Make sure you have the rights to every sound and recording',
      why: 'Apple rejects apps that use music, voices or sounds without permission, including audio pulled from YouTube or Spotify.',
      steps: [
        'List every piece of audio: music, ambient sounds, guided voices.',
        'Keep only what you made yourself or have a licence for, and save the licence.',
        'If audio keeps playing when the screen locks, turn on the “Audio” background mode, and use it only for that.',
        'Make the app clearly more than a timer or a sound player. Apple says it won’t accept new “simple timers” or “sound effects” apps that don’t offer something meaningfully different.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleBgModes, SRC.appleJune2026]
    },
    {
      id: 'healthkit',
      phase: 'inapp',
      when: function (c) { return c.ios && c.health; },
      sev: 'recommended',
      title: 'If you save to Apple Health, follow HealthKit’s rules',
      why: 'Guideline 5.1.3 strictly limits what you can do with health data.',
      steps: [
        'Only connect to Apple Health if it helps people, for example logging meditation as Mindful Minutes.',
        'Only write data that’s accurate, like the minutes someone actually meditated.',
        'Never use health data for ads, and never share it with other companies.',
        'Mention the Apple Health connection in your description and privacy policy.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleMindful]
    },

    // ---------------- 5. Build and test ----------------
    {
      id: 'ios-build',
      phase: 'build',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Make an iPhone build and upload it',
      why: 'Since April 28, 2026, Apple only accepts builds made with Xcode 26 or later, and since September 2026 they must support iOS 13 or later.',
      steps: [
        'You need either a Mac with the latest Xcode, or a cloud build service. Expo’s EAS Build and Submit work from Windows or Linux if your app uses Expo or React Native.',
        'Pick a bundle ID in reverse-domain form, like com.yourname.appname. It can’t change once you upload a build.',
        'In App Store Connect, go to <strong>Apps → + → New App</strong> and enter the name, language, bundle ID and a SKU (any internal code).',
        'Build and upload. Ask your AI for the exact commands for your setup.',
        'Note for later: from April 2027, uploads must use the iOS 27 SDK.'
      ],
      sources: [SRC.appleUpcoming, SRC.appleNewApp, SRC.appleUpload, SRC.expoSubmit]
    },
    {
      id: 'privacy-manifest',
      phase: 'build',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Include a privacy manifest in your iPhone build',
      why: 'Since May 2024, App Store Connect refuses uploads that use certain system features without declaring why.',
      steps: [
        'Ask your AI: “Add a PrivacyInfo.xcprivacy privacy manifest to this app and declare a reason for every required-reason API it or its packages use.” Expo can generate it from app.json.',
        'Update packages like Firebase, Google Sign-In and OneSignal to versions that include their own privacy manifests.',
        'After uploading, read Apple’s email. It names anything still missing.'
      ],
      sources: [SRC.appleReasonApi, SRC.appleSdkReqs]
    },
    {
      id: 'testflight',
      phase: 'build',
      when: function (c) { return c.ios; },
      sev: 'before',
      title: 'Test on real iPhones with TestFlight',
      why: 'Crashes and broken screens are the most common reason Apple sends apps back.',
      steps: [
        'In App Store Connect, open <strong>TestFlight</strong> and add yourself and a few friends. Up to 100 internal testers need no review; outside testers need a quick Beta App Review.',
        'Install the app with the TestFlight app and use every screen, including sign-up, payments and deleting an account.',
        'Try it on an older iPhone and on a slow connection if you can.',
        'Fix what breaks, upload a new build and test again.'
      ],
      sources: [SRC.appleTestflight, SRC.appleCommon]
    },
    {
      id: 'android-build',
      phase: 'build',
      when: function (c) { return c.android; },
      sev: 'blocker',
      title: 'Build an Android App Bundle that targets Android 16',
      why: 'Google Play only accepts .aab files, and since August 31, 2026 new apps must target API level 36.',
      steps: [
        'Ask your AI to set the target SDK to 36 (Android 16) or higher.',
        'Build a signed release App Bundle (.aab), for example with Android Studio or Expo’s EAS Build.',
        'Let Play App Signing manage your signing key (it’s the default).',
        'Keep the download under 200 MB. Move big videos or audio to a download after install.',
        'Missed the deadline? Play Console lets you request an extension until November 1, 2026.'
      ],
      sources: [SRC.targetSdk, SRC.aab, SRC.playSize]
    },
    {
      id: 'closed-test',
      phase: 'build',
      when: function (c) { return c.android; },
      sev: 'blocker',
      gap: { rank: 4, title: 'Run Google’s 14-day test', why: 'New personal accounts need 12 testers for 14 days before publishing.' },
      title: 'Run a closed test with 12 testers for 14 days',
      why: 'Google requires it for personal developer accounts made after November 2023, before you can ask for production access.',
      steps: [
        'In Play Console, go to <strong>Testing → Closed testing</strong>, create a release and upload your .aab.',
        'Add testers by email, or with a Google Group they join first.',
        'Send the opt-in link to at least 12 real people, and invite a few extra in case some drop out.',
        'Keep 12 or more opted in for 14 days straight. People who leave early don’t count.',
        'Then apply for production access from the Dashboard. Plan on about three weeks in total.'
      ],
      sources: [SRC.playTesting, SRC.playTracks]
    },
    {
      id: 'android-verification',
      phase: 'build',
      when: function (c) { return c.android; },
      sev: 'before',
      title: 'Check your app is registered for Android developer verification',
      why: 'Android is starting to block installs from unverified developers: in some countries from September 2026, everywhere in 2027.',
      steps: [
        'Finish identity verification in Play Console.',
        'Check that your app shows as registered. Google Play registers most apps automatically.',
        'If you also hand out the app outside Play, register it there too.'
      ],
      sources: [SRC.androidVerify]
    },
    {
      id: 'completeness',
      phase: 'build',
      when: function (c) { return c.store; },
      sev: 'blocker',
      gap: { rank: 8, title: 'Fix crashes and placeholders', why: 'Apple says over 40% of unresolved review issues are incomplete apps.' },
      title: 'Remove placeholders and fix every crash and dead button',
      why: 'Apple says App Completeness (guideline 2.1) causes over 40% of unresolved review issues.',
      steps: [
        'Go through every screen and button. Anything that does nothing, says “Coming soon” or shows lorem ipsum must go.',
        'Replace sample data, test accounts and AI-written placeholder text with real content.',
        'Check every link, including your privacy policy and support links.',
        'Keep your backend running during review, and make sure paid features are visible to the reviewer.'
      ],
      sources: [SRC.appleCommon, SRC.appleGuidelines]
    },
    {
      id: 'more-than-a-website',
      phase: 'build',
      when: function (c) { return c.store; },
      sev: 'before',
      title: 'Make sure the app is more than a website or a copy of another app',
      why: 'Apple rejects apps that are a website in a frame (4.2) or too similar to what already exists (4.3). Design problems like these caused 415,532 rejections in 2025.',
      steps: [
        'If the app mostly shows web pages, add real app features: offline use, notifications, native screens.',
        'Don’t submit several near-identical versions of the same app.',
        'If your idea is common (Apple names dating, flashlight, sound effects, wallpaper, simple timers and fortune telling), make it obvious in the app and description what yours does differently.',
        'Don’t copy another app’s name, icon or look.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleJune2026, SRC.appleTransparency]
    },
    {
      id: 'size',
      phase: 'build',
      when: function (c) { return c.store; },
      sev: 'recommended',
      title: 'Keep the download small',
      why: 'By default iPhones ask before downloading apps over 200 MB on mobile data, and Google Play caps downloads at 200 MB per device.',
      steps: [
        'Check the app size in App Store Connect or TestFlight, and in Play Console.',
        'Compress images and convert them to WebP. Delete images and sounds the app no longer uses.',
        'Download large audio or video after install instead of bundling it. If the app needs a big download on first launch, Apple requires you to say how big and ask first.'
      ],
      sources: [SRC.appleSize, SRC.cellularLimit, SRC.playSize, SRC.appleGuidelines]
    },
    {
      id: 'web-speed',
      phase: 'build',
      when: function (c) { return c.web || c.extension; },
      sev: 'recommended',
      title: 'Check your site’s speed on a phone',
      why: 'Slow sites lose visitors, and large images are the usual cause.',
      steps: [
        'Run your live address through ' + link('PageSpeed Insights', 'https://pagespeed.web.dev/') + ', which uses Lighthouse.',
        'Aim for a main content load (LCP) under 2.5 seconds on mobile.',
        'Resize images to the size they’re shown at, and convert them to WebP or AVIF.'
      ],
      sources: [SRC.lighthouse, SRC.vitals, SRC.lcp]
    },
    {
      id: 'accessibility',
      phase: 'build',
      when: always,
      sev: 'recommended',
      title: 'Check basic accessibility',
      why: 'About 15% of people have a disability, and some EU rules now require it for consumer services.',
      steps: [
        'Make sure text is readable and has enough contrast.',
        'Give every button and image a label that a screen reader can read.',
        'Try your app with VoiceOver (iPhone), TalkBack (Android) or Lighthouse (web).'
      ],
      sources: [SRC.wcag, SRC.androidA11y]
    },

    // ---------------- 6. Store listing ----------------
    {
      id: 'apple-listing',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Fill in your App Store listing',
      why: 'You can’t submit until the name, description, screenshots and links are filled in, and they must match the app.',
      steps: [
        'Write the text: name and subtitle (up to 30 characters each), keywords (100 characters, commas between), description (up to 4,000 characters), and a category.',
        'Screenshots: 1 to 10 from the real app in use, not just the login or splash screen. iPhone needs the 6.9-inch size (for example 1290 × 2796). If the app runs on iPad, iPad screenshots are required too, or turn iPad support off.',
        'App icon: 1024 × 1024 pixels, set in your project.',
        'Support URL (required, and must lead to real contact details) and privacy policy URL.',
        'Keep it accurate: no prices, competitor names or features that aren’t there (guideline 2.3).'
      ],
      sources: [SRC.appleScreens, SRC.appleAppInfo, SRC.appleVersionInfo, SRC.appleIcons, SRC.appleGuidelines]
    },
    {
      id: 'apple-privacy-labels',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Fill in the App Store privacy details',
      why: 'Apple shows these on your listing, and they must match your privacy policy, including what analytics and AI services collect.',
      steps: [
        'In App Store Connect, open <strong>App Privacy</strong>.',
        'For each kind of data (contact info, health, usage data…), say whether you collect it, why, and whether it’s linked to the person.',
        'Include what your tools collect: analytics, crash reporting, Supabase or Firebase, AI providers.',
        'If you track people across other companies’ apps (common with ad tools), you must ask permission with Apple’s tracking prompt.'
      ],
      sources: [SRC.applePrivacyDetails, { label: 'Apple: User privacy and data use', url: 'https://developer.apple.com/app-store/user-privacy-and-data-use/' }]
    },
    {
      id: 'apple-age-rating',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Answer the age rating questions',
      why: 'Every app needs a rating before it can be submitted, and wrong answers can get it pulled later.',
      steps: [
        'In App Store Connect, open <strong>Age Rating</strong> and answer each question honestly.',
        'Apple’s ratings are now 4+, 9+, 13+, 16+ and 18+. The questions cover messaging, user content, AI chatbots, medical or wellness topics and, since September 2026, social media features. Answer them all.',
        'If your terms require an older minimum age, choose the higher rating.'
      ],
      sources: [SRC.appleAgeHow, SRC.appleAgeNews, SRC.appleAgeSocial]
    },
    {
      id: 'medical-device',
      phase: 'listing',
      when: function (c) { return c.ios && c.health; },
      sev: 'blocker',
      title: 'Declare whether your app is a regulated medical device',
      why: 'Since March 2026, new apps in Health & Fitness or Medical must declare this before they can be distributed in the US, UK and EU.',
      steps: [
        'In App Store Connect, open <strong>App Information → Regulated Medical Device</strong>.',
        'Unless you have FDA, CE or UKCA clearance, declare that it isn’t a regulated medical device.',
        'Make sure nothing in your listing or app suggests otherwise.'
      ],
      sources: [SRC.appleMedDevice]
    },
    {
      id: 'kids-category',
      phase: 'listing',
      when: function (c) { return c.ios && c.kids; },
      sev: 'blocker',
      title: 'Decide carefully whether to list in the Kids Category',
      why: 'Kids Category apps can’t use third-party analytics or ads, and once approved the choice can’t be changed.',
      steps: [
        'Only choose “Made for Kids” if the app really is for children.',
        'Remove third-party ads and analytics, and don’t send any personal or device information to other companies.',
        'Put links out of the app and any purchases behind a parental gate.'
      ],
      sources: [SRC.appleGuidelines, SRC.appleAppInfo]
    },
    {
      id: 'apple-other-forms',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'before',
      title: 'Answer the encryption and EU trader questions',
      why: 'App Store Connect asks both before release, and they’re easy to get stuck on.',
      steps: [
        '<strong>Encryption:</strong> if the app only uses HTTPS or Apple’s built-in encryption, answer that it uses exempt encryption. Ask your AI to set <code>ITSAppUsesNonExemptEncryption</code> to NO so you aren’t asked every time.',
        '<strong>EU trader status:</strong> go to <strong>Business → Agreements → Compliance</strong>. You must answer even if you don’t sell in the EU.',
        'If you earn money from the app, you’re probably a trader, and your phone, email and address will be shown to EU users. Only choose “non-trader” if it’s true. If you don’t want your details shown, leave EU countries out of your availability.'
      ],
      sources: [SRC.appleExport, SRC.appleDsa]
    },
    {
      id: 'play-listing',
      phase: 'listing',
      when: function (c) { return c.android; },
      sev: 'blocker',
      title: 'Prepare your Google Play store listing',
      why: 'Play won’t publish without an icon, a feature graphic, screenshots and descriptions.',
      steps: [
        'Icon: 512 × 512 PNG, up to 1 MB.',
        'Feature graphic: 1024 × 500, no transparency.',
        'At least 2 phone screenshots from the real app. Four or more is better.',
        'App name, short description, full description and a contact email.'
      ],
      sources: [SRC.playListing]
    },
    {
      id: 'play-data-safety',
      phase: 'listing',
      when: function (c) { return c.android; },
      sev: 'blocker',
      title: 'Fill in Google Play’s Data safety form',
      why: 'Every app must complete it, even ones that collect nothing, and Google checks it against what the app actually does.',
      steps: [
        'In Play Console, open <strong>App content → Data safety</strong>.',
        'List every kind of data the app or its tools collect, including analytics, crash reporting and AI services.',
        'Say why it’s collected, whether it’s shared, and whether it’s encrypted in transit.',
        'Add the link to your account deletion page.',
        'Make sure it matches your privacy policy.'
      ],
      sources: [SRC.playDataSafety, SRC.playDeletion]
    },
    {
      id: 'play-app-content',
      phase: 'listing',
      when: function (c) { return c.android; },
      sev: 'blocker',
      title: 'Complete Play Console’s App content declarations',
      why: 'Play blocks a release until every item is done: content rating, audience, ads, health and financial features.',
      steps: [
        'Content rating: answer the questionnaire honestly.',
        'Target audience: if any age group includes children, the Families policy applies.',
        'Ads: say whether the app shows ads, including ads from any SDK.',
        'Health apps and Financial features: every app must fill these in, even to say “none”.',
        'App access: if features are behind a login, give reviewers a test account.'
      ],
      sources: [SRC.playRating, SRC.playAudience, SRC.playPrepare, SRC.playHealthDecl, SRC.playFinance]
    },

    // ---------------- 7. Submit ----------------
    {
      id: 'demo-account',
      phase: 'submit',
      when: function (c) { return c.store && c.accounts; },
      sev: 'blocker',
      gap: { rank: 9, title: 'Give reviewers a test login', why: 'If a reviewer can’t get past your login, the app is sent back.' },
      title: 'Give reviewers a working test account',
      why: 'Apple and Google can’t review features behind a login without one, and will reject the build.',
      steps: [
        'Create an account just for reviewers, with some realistic sample data in it.',
        'Put the email and password in App Store Connect’s <strong>App Review Information</strong> (turn on “Sign-in required”) and in Play Console’s <strong>App access</strong>. Apple says the account must not expire.',
        'If there are paid features, explain in the notes how reviewers can see them.',
        'Check the login still works the day you submit.'
      ],
      sources: [SRC.appleCommon, SRC.appleVersionInfo, SRC.playPrepare]
    },
    {
      id: 'review-notes',
      phase: 'submit',
      when: function (c) { return c.store; },
      sev: 'before',
      title: 'Write short notes for the reviewer, then submit',
      why: 'A few sentences explaining anything unusual prevent a lot of back-and-forth.',
      steps: [
        'In the review notes, say what the app does, where to find its main features, and anything that needs setup (like a microphone or a subscription).',
        'Submit. Apple says 90% of submissions are reviewed in under 24 hours. Google says new apps can take up to 7 days or longer.',
        'If you’re rejected, read the message in the Resolution Center (Apple) or your email (Google). It names the guideline. Fix that one thing and resubmit, or reply if you think they got it wrong.'
      ],
      sources: [SRC.appleCommon, SRC.playReview]
    },
    {
      id: 'web-launch',
      phase: 'submit',
      when: function (c) { return c.web || c.extension; },
      sev: 'before',
      title: 'Put the finished site live on your domain',
      why: 'Your site needs to work at its real address, with its legal pages linked, before you tell people about it.',
      steps: [
        'Deploy the final version to your host and connect your domain.',
        'Link your privacy policy, terms and support email in the footer.',
        'Sign up as a brand-new user and go through the whole app once on a phone.',
        'For a browser extension, submit it to the Chrome Web Store and fill in its privacy form.'
      ],
      sources: [SRC.vercelDomain, SRC.netlifyHttps, { label: 'Chrome Web Store: Publish your extension', url: 'https://developer.chrome.com/docs/webstore/publish' }]
    },

    // ---------------- 8. After launch ----------------
    {
      id: 'keep-in-sync',
      phase: 'after',
      when: always,
      sev: 'after',
      title: 'Update your privacy policy and store forms whenever the app collects something new',
      why: 'A mismatch between what the app does and what you’ve declared can get later updates rejected or the app pulled.',
      steps: [
        'Before adding a feature, ask: does it collect new data or send it somewhere new?',
        'If so, update the privacy policy, App Privacy details and Data safety form in the same release.'
      ],
      sources: [SRC.playDataSafety, SRC.applePrivacyDetails]
    },
    {
      id: 'stay-updated',
      phase: 'after',
      when: always,
      sev: 'after',
      title: 'Keep the app’s building blocks up to date',
      why: 'Security fixes arrive through updates, and stores raise their minimum requirements every year.',
      steps: [
        'Merge Dependabot’s security pull requests, then test the app again.',
        'Each year, check Apple’s minimum Xcode version and Google’s target API level before your next update.',
        'Watch your email for policy notices from Apple and Google. They give deadlines.'
      ],
      sources: [SRC.ghDependabot, SRC.targetSdk, SRC.appleUpcoming]
    }
  ];

  window.LC_DATA = {
    checked: 'September 2026',
    phases: PHASES,
    items: ITEMS
  };
})();
