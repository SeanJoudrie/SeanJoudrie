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
    supaPausing: { label: 'Supabase: Project pausing on the free plan', url: 'https://supabase.com/docs/guides/platform/free-project-pausing' },
    supaRedirects: { label: 'Supabase: Redirect URLs', url: 'https://supabase.com/docs/guides/auth/redirect-urls' },
    supaSecrets: { label: 'Supabase: Edge Function secrets', url: 'https://supabase.com/docs/guides/functions/secrets' },
    supaStorage: { label: 'Supabase: Storage access control', url: 'https://supabase.com/docs/guides/storage/security/access-control' },
    expoEnv: { label: 'Expo: Environment variables', url: 'https://docs.expo.dev/guides/environment-variables/' },
    expoPrivacy: { label: 'Expo: Privacy manifests', url: 'https://docs.expo.dev/guides/apple-privacy/' },
    replitSecrets: { label: 'Replit: Secrets', url: 'https://docs.replit.com/replit-workspace/workspace-features/secrets' },
    replitDomains: { label: 'Replit: Custom domains', url: 'https://docs.replit.com/cloud-services/deployments/custom-domains' },
    lovableDomain: { label: 'Lovable: Set up a custom domain', url: 'https://docs.lovable.dev/features/custom-domain' },
    lovableSecurity: { label: 'Lovable: Security', url: 'https://docs.lovable.dev/features/security' },
    googleAudience: { label: 'Google Cloud: Manage app audience (Google login)', url: 'https://support.google.com/cloud/answer/15549945' },
    googleOauthStates: { label: 'Google: OAuth app states', url: 'https://developers.google.com/identity/protocols/oauth2/production-readiness/overview' },
    adsenseCmp: { label: 'AdSense: Consent requirements in the EEA, UK and Switzerland', url: 'https://support.google.com/adsense/answer/13554116' },
    adsTxt: { label: 'AdSense: ads.txt FAQ', url: 'https://support.google.com/adsense/answer/9785052' },
    playAds: { label: 'Google Play: Ads policy', url: 'https://support.google.com/googleplay/android-developer/answer/9857753' },
    att: { label: 'Apple: App Tracking Transparency', url: 'https://developer.apple.com/documentation/apptrackingtransparency' },
    applePrivacyUse: { label: 'Apple: User privacy and data use', url: 'https://developer.apple.com/app-store/user-privacy-and-data-use/' },
    dmca: { label: 'US Copyright Office: DMCA designated agent FAQ', url: 'https://www.copyright.gov/dmca-directory/faq.html' },
    dsa: { label: 'European Commission: Digital Services Act Q&A', url: 'https://digital-strategy.ec.europa.eu/en/faqs/digital-services-act-questions-and-answers' },
    gdprArt9: { label: 'GDPR Article 9: Special categories of data (health)', url: 'https://gdpr.eu/article-9-processing-special-categories-of-personal-data-prohibited/' },
    helplines: { label: 'Find A Helpline: free crisis lines in 130+ countries', url: 'https://findahelpline.com/' },
    seo: { label: 'Google Search Central: SEO starter guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' },
    gmailSenders: { label: 'Gmail: Email sender guidelines', url: 'https://support.google.com/a/answer/81126' },
    appleKids: { label: 'Apple: Kids apps', url: 'https://developer.apple.com/app-store/kids-apps/' },
    coppaFtc2025: { label: 'FTC: 2025 changes to the children’s privacy rule', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data' },
    appleTexas: { label: 'Apple: Update for apps distributed in Texas', url: 'https://developer.apple.com/news/?id=sg176nne' },
    playStateLaws: { label: 'Google Play: US state app store laws', url: 'https://support.google.com/googleplay/android-developer/answer/16569691' },
    appleAvailability: { label: 'Apple: Manage availability (countries)', url: 'https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store' },
    appleMedDeviceHelp: { label: 'Apple: Declare regulated medical device status', url: 'https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status' },
    sentry: { label: 'Sentry: Crash reporting for React Native', url: 'https://docs.sentry.io/platforms/react-native/' },
    appleReviewOverview: { label: 'Apple: App Review', url: 'https://developer.apple.com/distribute/app-review/' },
    appleSubmit: { label: 'Apple: Submit an app for review', url: 'https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app' },
    appleResolution: { label: 'Apple: Reply to App Review messages', url: 'https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages' },
    appleRelease: { label: 'Apple: Choose how your version is released', url: 'https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/select-an-app-store-version-release-option' },
    ascHome: { label: 'App Store Connect', url: 'https://appstoreconnect.apple.com' },
    playConsoleHome: { label: 'Google Play Console', url: 'https://play.google.com/console' },
    playCreateApp: { label: 'Google Play: Create and set up your app', url: 'https://support.google.com/googleplay/android-developer/answer/9859152' },
    playProdAccess: { label: 'Google Play: Apply for production access', url: 'https://support.google.com/googleplay/android-developer/answer/14151465' },
    playPublish: { label: 'Google Play: Prepare and roll out a release', url: 'https://support.google.com/googleplay/android-developer/answer/9859348' },
    playPolicyStatus: { label: 'Google Play: How enforcement and appeals work', url: 'https://support.google.com/googleplay/android-developer/answer/9899234' },
    tcpa: { label: 'US law: Telephone Consumer Protection Act, 47 U.S.C. §227', url: 'https://www.law.cornell.edu/uscode/text/47/227' },
    tcpaRule: { label: 'FCC rule: consent, opt-out and calling hours, 47 CFR §64.1200', url: 'https://www.law.cornell.edu/cfr/text/47/64.1200' },
    fccGuide: { label: 'FCC: Small entity compliance guide (texts and Do-Not-Call)', url: 'https://docs.fcc.gov/public/attachments/DA-24-910A1_Rcd.pdf' },
    canSpam: { label: 'FTC: CAN-SPAM Act compliance guide', url: 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business' },
    ftcPenalties: { label: 'FTC: 2025 civil penalty amounts ($53,088)', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/02/ftc-publishes-inflation-adjusted-civil-penalty-amounts-2025' },
    omb2026: { label: 'OMB: no 2026 penalty inflation adjustment (2025 amounts still apply)', url: 'https://www.whitehouse.gov/wp-content/uploads/2026/04/M-26-11-Cancellation-of-Penalty-Inflation-Adjustments-for-2026-Regarding-the-Federal-Civil-Penalties-Inflation-Adjustment-Act-Improvements-Act-of-2015.pdf' },
    dmcaSafeHarbor: { label: 'US law: DMCA safe harbor, 17 U.S.C. §512', url: 'https://www.law.cornell.edu/uscode/text/17/512' },
    copyrightDamages: { label: 'US law: Copyright statutory damages, 17 U.S.C. §504', url: 'https://www.law.cornell.edu/uscode/text/17/504' },
    ccpaPenalties: { label: 'California Privacy Protection Agency: 2025 penalty amounts', url: 'https://cppa.ca.gov/regulations/cpi_adjustment.html' },
    ccpaBreach: { label: 'California law: breach lawsuits over unencrypted data, §1798.150', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.150' },
    caBreachNotice: { label: 'California law: breach notice within 30 days, §1798.82', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.82' },
    naagBreach: { label: 'NAAG: all 50 states have breach laws', url: 'https://www.naag.org/issues/consumer-protection/consumer-protection-101/privacy/data-breaches/' },
    euAiAct50: { label: 'EU AI Act, Article 50: tell people they’re talking to an AI', url: 'https://artificialintelligenceact.eu/article/50/' },
    appleFaceId: { label: 'Apple: Face ID never shares face data with apps', url: 'https://support.apple.com/en-us/102381' },
    bipaCothron: { label: 'Illinois Supreme Court on BIPA damages (Cothron v. White Castle)', url: 'https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/e304b011-82d9-4832-9cae-d8205749a2ec/Cothron%20v.%20White%20Castle%20System,%20Inc.,%202023%20IL%20128004.pdf' },
    texasCubi: { label: 'Texas law: biometric identifiers, §503.001', url: 'https://tcss.legis.texas.gov/resources/BC/htm/BC.503.htm' },
    cipa: { label: 'California law: CIPA damages, Penal Code §637.2', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=637.2' },
    vppa: { label: 'US law: Video Privacy Protection Act, 18 U.S.C. §2710', url: 'https://www.law.cornell.edu/uscode/text/18/2710' },
    unruh: { label: 'California law: at least $4,000 per violation, Civil Code §52', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=52' },
    adaWeb: { label: 'US Justice Department: the ADA applies to websites', url: 'https://www.ada.gov/resources/web-guidance/' },
    seyfarth: { label: 'Seyfarth: 3,117 website accessibility lawsuits in 2025', url: 'https://www.adatitleiii.com/2026/03/federal-court-website-accessibility-lawsuit-filings-bounce-back-in-2025/' },
    ftcAgeStatement: { label: 'FTC: 2026 policy statement on age checks', url: 'https://www.ftc.gov/news-events/news/press-releases/2026/02/ftc-issues-coppa-policy-statement-incentivize-use-age-verification-technologies-protect-children' },
    ftcAccessibe: { label: 'FTC: accessiBe pays $1 million over AI claims', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-approves-final-order-requiring-accessibe-pay-1-million' },
    ftcDoNotPay: { label: 'FTC: DoNotPay order over “AI lawyer” claims', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/02/ftc-finalizes-order-donotpay-prohibits-deceptive-ai-lawyer-claims-imposes-monetary-relief-requires' },
    ftcWorkado: { label: 'FTC: Workado order over AI accuracy claims', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/08/ftc-approves-final-order-against-workado-llc-which-misrepresented-accuracy-its-artificial' },
    rosca: { label: 'US law: ROSCA subscription rules, 15 U.S.C. §8403', url: 'https://www.law.cornell.edu/uscode/text/15/8403' },
    caArl: { label: 'California Automatic Renewal Law, §17602 (click to cancel)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=17602' },
    wcag: { label: 'W3C: WCAG 2.2', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/' },
    androidA11y: { label: 'Android: Accessibility', url: 'https://developer.android.com/guide/topics/ui/accessibility' }
  };

  var PHASES = [
    { id: 'decide', title: 'Answer the open questions', intro: 'Your “Not sure” answers change what applies. Sort these out first, then run Launch Check again.' },
    { id: 'accounts', title: 'Set up your accounts', intro: function (c) { return c.store ? 'Some of these take days to approve, so start them first.' : 'The accounts and address your site needs.'; } },
    { id: 'kids', title: 'Decide how you’ll handle children', intro: 'This changes how the app is built, so do it before anything else below.' },
    { id: 'secure', title: 'Lock down your data', intro: 'Before real people sign up. These are the gaps AI-built apps most often ship with.' },
    { id: 'legal', title: 'Write your legal pages', intro: 'Stores and privacy laws require these. Generators are fine to start with.' },
    { id: 'inapp', title: function (c) { return c.store ? 'Add what the stores require inside the app' : 'Add what people and privacy laws expect'; }, intro: 'Features reviewers and regulators look for. Ask your AI to build each one.' },
    { id: 'build', title: function (c) { return c.store ? 'Build and test' : 'Test it'; }, intro: function (c) { return c.store ? 'Get a real build onto real phones and fix what breaks.' : 'Go through it like a new visitor would.'; } },
    { id: 'listing', title: 'Fill in your store listing', intro: 'The forms, pictures and answers the store needs before you can submit.' },
    { id: 'submit', title: function (c) { return c.store ? 'Submit for review' : 'Launch'; }, intro: '' },
    { id: 'after', title: 'After launch', intro: '' }
  ];

  var always = function () {
    return true;
  };

  var FIND_OUT = {
    kids: ['<strong>Children:</strong> decide honestly whether children under 13 will use it. If your app looks like it’s for kids (cartoons, simple games, spelling), the law treats it that way even if you didn’t mean it to be.'],
    accounts: ['<strong>Sign-up:</strong> ask your AI “Does this app save anything about a person online, like a name, email or score? Does it have login?” If it saves a name or email online, answer Yes.'],
    tracking: ['<strong>Analytics and ads:</strong> ask your AI “List every analytics, crash-reporting or advertising tool in this app, including anything Firebase adds automatically.”'],
    ai: ['<strong>AI:</strong> ask your AI “Does this app send anything a person types or uploads to an AI service like OpenAI, Anthropic or Google? Which one?”'],
    ugc: ['<strong>Content from other people:</strong> can anyone see something another person wrote, uploaded or chose as a name, like a comment, photo, message or leaderboard entry? If so, answer Yes.']
  };

  var ITEMS = [
    // ---------------- Open questions ----------------
    {
      id: 'find-out',
      phase: 'decide',
      when: function (c) { return c.unsure.length > 0; },
      sev: 'blocker',
      gap: function (c) {
        var one = c.unsure.length === 1;
        return { rank: 0, title: one ? 'Answer your “Not sure” question' : 'Answer your “Not sure” questions', why: one ? 'You said “Not sure” once. The answer can add must-fix steps, so find out first.' : 'You said “Not sure” ' + c.unsure.length + ' times. Each answer can add must-fix steps, so find out first.' };
      },
      title: 'Find out the answers you weren’t sure about',
      why: 'Each of these decides which rules apply, so the rest of your plan isn’t complete until you know.',
      steps: function (c) {
        var list = [];
        c.unsure.forEach(function (k) {
          list = list.concat(FIND_OUT[k]);
        });
        return list.concat(['Then run Launch Check again with your new answers. It takes a minute.']);
      },
      sources: [SRC.appleGuidelines, SRC.coppa]
    },
    {
      id: 'decide-money',
      phase: 'decide',
      when: function (c) { return c.a.money === 'unsure'; },
      sev: 'blocker',
      gap: { rank: 0, title: 'Decide whether you’ll charge money', why: 'Charging for features changes your store setup, legal pages and payment tools.' },
      title: 'Decide how (or whether) the app will make money',
      why: 'Selling features inside an app means using Apple’s or Google’s payment system, which needs agreements, bank details and extra screens.',
      steps: [
        'Decide: free, a one-time unlock, a subscription, ads, or selling real-world things.',
        'If it’s free for now, that’s the simplest launch. You can add payments in a later update.',
        'Run Launch Check again with your answer.'
      ],
      sources: [SRC.appleGuidelines, SRC.playBilling]
    },

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
      id: 'apple-app-record',
      phase: 'accounts',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Create your app in App Store Connect',
      why: 'App Store Connect is Apple’s website for managing your app. In-app purchases, Sign in with Apple and every upload need the app to exist there first.',
      steps: [
        'Choose a bundle ID: your app’s permanent ID, written like com.yourname.appname. In Expo it lives in app.json as <code>ios.bundleIdentifier</code>. It can’t change once you upload a build.',
        'Sign in at ' + link('appstoreconnect.apple.com', 'https://appstoreconnect.apple.com') + ', go to <strong>Apps → + → New App</strong>, and enter the name, language, bundle ID and a SKU (any code you like, such as the app’s name).',
        'Check the name is free: App Store Connect tells you if someone else already uses it.'
      ],
      sources: [SRC.appleNewApp, SRC.appleAppInfo]
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
      gap: function (c) {
        return c.store
          ? { rank: 6, title: 'Get a simple website', why: 'Stores need working web links to your privacy policy and support page.' }
          : null;
      },
      title: function (c) { return c.site ? 'Move your site to your own web address' : 'Get a simple website on your own domain'; },
      why: function (c) {
        return c.site
          ? 'A builder address like name.lovable.app looks temporary, and ad networks, Google login and search all work better on your own domain.'
          : 'Your privacy policy, terms, support page and account-deletion page all need a public web address.';
      },
      steps: function (c) {
        var buy = 'Buy a domain name (about $10–15 a year) from a registrar such as ' + link('Cloudflare Registrar', 'https://developers.cloudflare.com/registrar/') + ', or through your host. Turn on auto-renew.';
        if (c.site && c.a.host === 'lovable') return [buy + ' Lovable can also sell you one.', 'In Lovable, open <strong>Project → Settings → Domains</strong> and connect it. Custom domains need a paid Lovable plan.', 'Follow Lovable’s instructions to add the DNS records at your registrar. It can take up to a day to work.', 'Then update your login settings to the new address (see “Make sign-up emails and Google login work”).'];
        if (c.site && c.a.host === 'replit') return [buy, 'In your Replit deployment’s settings, add the custom domain and copy the DNS records it shows into your registrar.', 'Then update your login settings to the new address (see “Make sign-up emails and Google login work”).'];
        if (c.site && c.a.host === 'bolt') return [buy, 'Connect the domain wherever your Bolt site is deployed (often Netlify), using its Domains settings.', 'Then update your login settings to the new address.'];
        if (c.site) return [buy, 'In your host’s Domains settings (Vercel, Netlify or similar), add the domain and copy the DNS records it shows into your registrar.', 'Make sure your privacy policy, terms and support pages are linked in the footer.'];
        return [
          buy,
          'The easiest place for a few simple pages is Netlify or Vercel: create a free account, drag in a folder (or connect GitHub), and deploy. You get a working address straight away. If you built with Lovable or Replit, you can add pages to that project and connect the domain there instead.',
          'Add your domain in the host’s Domains settings and copy the DNS records it shows into your registrar. Allow an hour or two, and up to a day for the domain to start working.',
          'Make four pages: home, privacy policy, terms, and support (with your email). Ask your AI to write them as plain HTML.'
        ];
      },
      sources: function (c) {
        if (c.site && c.a.host === 'lovable') return [SRC.lovableDomain, SRC.cfRegistrar];
        if (c.site && c.a.host === 'replit') return [SRC.replitDomains, SRC.cfRegistrar];
        return [SRC.vercelDomain, SRC.netlifyHttps, SRC.cfRegistrar, SRC.ghPagesLimits];
      }
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
        'Turn on two-factor authentication for every account behind the app: your code (GitHub or Replit), your database (Supabase or Firebase), your host, your domain registrar, any payment provider, and your AI builder.',
        'Use an authenticator app or a passkey rather than text messages.',
        'Save the recovery codes somewhere safe, like a password manager.'
      ],
      sources: [SRC.gh2fa, SRC.supaProd]
    },

    // ---------------- Children ----------------
    {
      id: 'coppa',
      phase: 'kids',
      when: function (c) { return c.kids; },
      sev: 'blocker',
      gap: { rank: 1, title: 'Follow the rules for children’s data', why: 'US law says you need a parent’s verified permission before collecting personal information from a child under 13.' },
      risk: 'Up to $53,088 per violation (FTC, 2025 amount, still current in 2026). Check the official page.',
      title: 'Collect as little as possible from children, or get a parent’s permission',
      why: 'The US children’s privacy law (COPPA) covers apps made for, or used by, children under 13. The FTC enforces it and tightened it in 2025.',
      steps: [
        '<strong>The simplest route: don’t collect personal information.</strong> A child’s full name, email, photo, voice, location or a device ID linked to them all count. A first name or nickname on its own usually doesn’t, unless it’s tied to an ID that follows the child.',
        '<strong>Leaderboards and name screens:</strong> let children pick from preset nicknames instead of typing their name, or keep scores on the device only. Showing a child’s real name publicly counts as sharing it.',
        'If you must collect personal information: get verifiable permission from a parent first, publish a children’s section in your privacy policy, and let parents see and delete their child’s data.',
        'Since the 2025 changes, you also need <strong>separate</strong> parent permission before sharing a child’s data with other companies (like ad networks), and a written policy on how long you keep it.',
        'This is the one area worth paying a lawyer or a COPPA Safe Harbor program to review.'
      ],
      sources: [SRC.coppa, SRC.coppaFtc2025, SRC.appleGuidelines]
    },
    {
      id: 'kids-sdks',
      phase: 'kids',
      when: function (c) { return c.kids && (c.store || c.site); },
      sev: 'blocker',
      title: 'Remove analytics and ad tools that track children',
      why: 'Both stores restrict third-party analytics and ads in kids’ apps, and tools like Firebase can add Google Analytics without you noticing.',
      steps: [
        'Ask your AI: “List every analytics, crash-reporting and advertising package in this app, including anything Firebase adds automatically.”',
        'Remove anything that tracks individual users. Apple allows third-party analytics in kids’ apps only in limited cases that don’t collect identifiers.',
        'On Google Play, only use ad tools from Google’s Families self-certified list, and don’t collect the advertising ID from children.'
      ],
      sources: [SRC.appleKids, SRC.appleGuidelines, SRC.playFamilies]
    },
    {
      id: 'apple-kids',
      phase: 'kids',
      when: function (c) { return c.ios && c.kids; },
      sev: 'blocker',
      title: 'Follow Apple’s rules for kids’ apps',
      why: 'If your listing says the app is for kids, Apple requires the Kids Category and its rules (guideline 1.3 and 2.3.8).',
      steps: [
        'Choose “Made for Kids” in App Store Connect and pick an age band: 5 and under, 6–8 or 9–11. If you don’t, your listing can’t say it’s “for kids” anywhere.',
        'Put a <strong>parental gate</strong> in front of any purchase, link out of the app, or request for permission. A parental gate is a simple task an adult can do and a young child can’t, like typing a number written in words. It doesn’t replace a parent’s consent under COPPA.',
        'No third-party ads, and don’t send personal or device information to other companies.',
        'Even if you later leave the Kids Category, Apple says you must keep following these rules for existing users.'
      ],
      sources: [SRC.appleKids, SRC.appleGuidelines]
    },
    {
      id: 'play-families',
      phase: 'kids',
      when: function (c) { return c.android && c.kids; },
      sev: 'blocker',
      title: 'Follow Google Play’s Families policy',
      why: 'Any Play app whose target audience includes children must follow it, and a wrong audience declaration can get the app removed.',
      steps: [
        'In Play Console → <strong>App content → Target audience</strong>, pick the real age groups.',
        'Don’t collect the Android advertising ID or other device identifiers from children.',
        'Only use ad tools from Google’s Families self-certified ads list, and disclose any data your tools collect.',
        'Once you meet the policy, you can apply for Google’s “Teacher Approved” badge, which helps parents find the app.'
      ],
      sources: [SRC.playFamilies, SRC.playAudience]
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
      gap: { rank: 1, title: 'Lock down your database', why: 'If it’s not locked, anyone who finds your app’s Supabase address can read every table. In 2025 that was true of 170 of 1,645 Lovable apps checked.' },
      title: 'Turn on Row Level Security for every Supabase table',
      why: 'With it off, anyone who has your project address can read, change or delete everything in that table.',
      steps: [
        'In the Supabase dashboard, open <strong>Table Editor</strong>. Any table marked as unrestricted or without RLS needs fixing.',
        'RLS (Row Level Security) is the setting that decides who can read or change each row. Turn it on for every table. Tables made through AI tools or the SQL editor often have it off.',
        'Add rules (“policies”). Ask your AI: “Write Supabase RLS policies for every table. Private data, like journals or settings: only the owner can read or change it. Public content, like posts or recipes: anyone can read it, only the author can change or delete it.”',
        'Open <strong>Advisors → Security Advisor</strong> and fix everything marked as an error. Run it again until it’s clean.',
        'Check <strong>Storage</strong> (where files and photos live): a “public” bucket can be read by anyone, which is fine for public photos. Make sure only the owner can upload over or delete their files.',
        'Test it: sign in as a second test user and check you can’t see or change the first user’s private data.'
      ],
      sources: [SRC.supaRls, SRC.supaAdvisor, SRC.supaStorage, SRC.supaProd, SRC.lovableCve]
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
      when: function (c) { return c.cloud || c.ai || c.digital || c.physical; },
      sev: 'blocker',
      gap: { rank: 2, title: 'Move secret keys to a server', why: 'Anything inside an app or web page can be copied, and a secret key can run up your bill or open your data.' },
      title: 'Move secret keys out of the app and into a server',
      why: 'Keys for OpenAI, Stripe or Supabase’s service role give full access. Anything shipped in an app or page can be copied by anyone.',
      steps: function (c) {
        var list = [
          'Ask your AI: “List every API key and secret this app uses, and say whether each one ends up in code that runs in the browser or on the phone.”',
          'Public keys are fine in the app: Supabase’s publishable (anon) key and Firebase’s config are designed for that. Secret keys are not: OpenAI, Stripe’s secret key, Supabase’s secret or service_role key.',
          'Never put a secret in a variable starting with <code>VITE_</code>, <code>NEXT_PUBLIC_</code> or <code>EXPO_PUBLIC_</code>: those are copied into the app for anyone to read.'
        ];
        if (c.a.data === 'supabase') list.push('Ask your AI: “Move every call that uses a secret key into a Supabase Edge Function. Store the key with Supabase secrets, and call the function from the app.”');
        else if (c.a.data === 'firebase') list.push('Ask your AI: “Move every call that uses a secret key into a Firebase Cloud Function and store the key as a secret.”');
        else list.push('Ask your AI: “Move every call that uses a secret key onto a server or serverless function, and keep the key in its environment variables.”');
        if (c.a.host === 'lovable') list.push('In Lovable, keys belong in Supabase Edge Function secrets. Lovable also warns you when you paste a key into its chat.');
        if (c.a.host === 'replit') list.push('In Replit, keep keys in <strong>Tools → Secrets</strong>, and only use them in server code.');
        list.push('Then do the next step: replace any key that was ever in the app.');
        return list;
      },
      sources: function (c) {
        var list = [SRC.supaKeys, SRC.expoEnv, SRC.vite, SRC.nextEnv, SRC.fbKeys];
        if (c.a.data === 'supabase') list.unshift(SRC.supaSecrets);
        if (c.a.host === 'lovable') list.push(SRC.lovableSecurity);
        if (c.a.host === 'replit') list.push(SRC.replitSecrets);
        return list;
      }
    },
    {
      id: 'rotate-keys',
      phase: 'secure',
      when: always,
      sev: 'before',
      title: 'Replace any key that was ever in your app, code or chat',
      why: 'Deleting a key from a file doesn’t stop anyone who already copied it, and it stays in your project’s history.',
      steps: [
        'Think about every secret key that was ever in the app, your code, a commit, a screenshot or an AI chat. If you just moved one to a server, it counts.',
        'In each provider’s dashboard (for example OpenAI → API keys), create a new key and put it in your server’s secrets settings.',
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
      id: 'supabase-awake',
      phase: 'secure',
      when: function (c) { return c.a.data === 'supabase'; },
      sev: 'before',
      title: 'Keep your Supabase project from pausing',
      why: 'Free Supabase projects pause after a week without enough activity. A paused backend during review means the app doesn’t work and gets rejected.',
      steps: [
        'Check your plan in the Supabase dashboard. Paid projects never pause.',
        'If you stay on the free plan, open the dashboard shortly before you submit and after launch, and restore the project if it’s paused.',
        'Before launch, it’s worth moving to a paid plan so real users never hit a paused app.'
      ],
      sources: [SRC.supaPausing]
    },
    {
      id: 'auth-redirects',
      phase: 'secure',
      when: function (c) { return c.accounts && c.cloud; },
      sev: 'before',
      title: 'Make sign-up emails and Google login work outside your computer',
      why: 'AI-built apps often send confirmation and password-reset links to “localhost”, which only works on the builder’s computer, so a reviewer or new user hits a dead page.',
      steps: [
        'In Supabase, open <strong>Authentication → URL Configuration</strong>. Set the Site URL to your real address and add it to the Redirect URLs (for a phone app, your app’s link scheme).',
        'Sign up as a brand-new user on a real phone and tap the email link. It should open your app or site, not an error page.',
        'If you offer “Sign in with Google”: in Google Cloud’s OAuth consent screen, add your home page, privacy policy link and domain, then publish it. While it’s in “Testing” mode, only up to 100 listed test users can sign in.',
        'Whenever your address changes (for example a new custom domain), update these settings the same day.'
      ],
      sources: [SRC.supaRedirects, SRC.googleAudience, SRC.googleOauthStates]
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
        'Set up your own email-sending service before launch (“custom SMTP”), such as Resend or Postmark. Supabase’s built-in sender only allows a few emails an hour.',
        'Add the email records your sending service gives you (SPF, DKIM and DMARC) to your domain, so sign-up emails don’t land in spam. Gmail requires them for bulk senders.',
        'Set a monthly spending limit and alerts with your AI provider.',
        'Limit how often one person can call your AI features.'
      ],
      sources: [SRC.supaRate, SRC.supaCaptcha, SRC.supaProd, SRC.gmailSenders]
    },
    {
      id: 'https',
      phase: 'secure',
      when: function (c) { return c.web || c.extension; },
      sev: 'blocker',
      title: 'Serve your site only over HTTPS',
      why: 'Browsers warn visitors away from sites without it, and passwords sent without it can be read.',
      steps: [
        'HTTPS is what puts the padlock in the address bar and encrypts what visitors send. On Lovable, Replit, Netlify and Vercel it’s automatic once your domain is connected; just check the padlock appears.',
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
      gap: function (c) {
        return {
          rank: 4,
          title: 'Write a privacy policy',
          why: c.store
            ? 'Both app stores reject apps without one, and privacy laws require it.'
            : 'California and EU privacy law require one once you collect any personal data, and Google login and Google Analytics require it too.'
        };
      },
      title: 'Write and publish a privacy policy',
      why: function (c) {
        return c.store ? 'Stores require a working link to one, and it must match what your app actually does.' : 'Privacy laws require one, and so do Google login, Google Analytics and ad networks.';
      },
      steps: function (c) {
        var list = [
          'Make a list: what data you collect (emails, analytics and crash logs count), why, which services receive it (Supabase, Firebase, Stripe, analytics, AI providers), how long you keep it, and how people can delete it.',
          'Use a generator such as ' + link('Termly', 'https://termly.io/products/privacy-policy-generator/') + ' or ' + link('iubenda', 'https://www.iubenda.com/en/privacy-and-cookie-policy-generator') + ' and answer from your list. Both have free tiers.'
        ];
        if (c.ai) list.push('Name your AI provider and say what text or files you send it.');
        if (c.health) list.push('Say plainly that you collect health or wellness information, like mood entries or session history, and who can see it.');
        if (c.kids) list.push('Add a section for children: what you collect from them, why, and how parents can see or delete it.');
        list.push('Publish it as a normal web page on your site, not a PDF or a Google Doc.');
        list.push(c.store ? 'Link it inside the app where people can find it easily (for example in Settings), and paste the link into App Store Connect and/or Play Console. Apple requires both.' : 'Link it in your site’s footer and on the sign-up page.');
        return list;
      },
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
        'Say the minimum age to use it (usually 13, or 16 in some EU countries), unless it’s made for children.',
        'If people post content, include a licence letting you show what they post, and your rules for what’s not allowed.',
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
      id: 'ads-consent',
      phase: 'legal',
      when: function (c) { return c.site && c.ads; },
      sev: 'before',
      title: 'Get your site ready for ads',
      why: 'Google AdSense requires a Google-certified consent tool for visitors in the EU, UK and Switzerland, and approves sites on your own domain.',
      steps: [
        'Move to your own domain first. AdSense approves sites by domain, and your <code>ads.txt</code> file must sit at its root (yourdomain.com/ads.txt).',
        'Use a consent tool certified by Google (AdSense offers its own in <strong>Privacy &amp; messaging</strong>). Without one, ads to EU, UK and Swiss visitors are limited.',
        'Mention ads and the ad companies in your privacy policy.',
        'Some US states give people the right to opt out of their data being “sold or shared” for ads. Most consent tools include a US option for this.'
      ],
      sources: [SRC.adsenseCmp, SRC.adsTxt]
    },
    {
      id: 'health-consent',
      phase: 'legal',
      when: function (c) { return c.health && c.cloud; },
      sev: 'before',
      title: 'Ask clearly before collecting health data from people in the EU',
      why: 'EU privacy law treats health data, including mood and mental health notes, as a special category that usually needs explicit consent.',
      steps: [
        'Before someone first saves health information, like a mood entry, show a short screen saying what’s saved, why, and who can see it, with a clear “I agree”.',
        'Keep health data out of analytics and ad tools.',
        'Check which region your database is in (shown in your Supabase or Firebase project settings) and mention it in your privacy policy.'
      ],
      sources: [SRC.gdprArt9, SRC.gdprNotice]
    },
    {
      id: 'health-breach',
      phase: 'legal',
      when: function (c) { return c.health && c.cloud; },
      sev: 'before',
      risk: 'Up to $53,088 per violation (FTC). Check the official page.',
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
      when: function (c) { return c.accounts; },
      sev: function (c) { return c.store ? 'blocker' : 'before'; },
      gap: function (c) {
        return c.store ? { rank: 5, title: 'Add account deletion', why: 'Apple and Google require it for any app with sign-up.' } : null;
      },
      title: function (c) { return c.store ? 'Add a “Delete account” option inside the app' : 'Let people delete their account'; },
      why: function (c) {
        return c.store
          ? 'Apple and Google require an in-app way to delete an account and its data. Google also requires a web page for it.'
          : 'EU and California privacy law give people the right to have their data deleted.';
      },
      steps: [
        'Add a clear “Delete account” button, for example in Settings → Account. Ask your AI to build it so it deletes the person’s data and uploaded files too. Apple says only deactivating the account isn’t enough.',
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
      why: 'Guideline 4.8 requires a privacy-friendly login option alongside social logins, and Sign in with Apple is the simplest way to meet it. Email and password alone doesn’t need it.',
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
      id: 'ai-disclosure-web',
      phase: 'inapp',
      when: function (c) { return c.ai && !c.store; },
      sev: 'before',
      title: 'Tell people before their text goes to an AI service',
      why: 'Privacy laws require telling people who receives their data, and people trust an AI feature more when it’s clear what it sends.',
      steps: [
        'Next to the AI button, add one line such as: “Sends this recipe to OpenAI to rewrite it.”',
        'Name the AI provider in your privacy policy.',
        'Don’t send more than the feature needs.'
      ],
      sources: [SRC.gdprNotice, SRC.caloppa]
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
        'Sign the Paid Apps Agreement and add bank and tax details under <strong>Business → Agreements</strong> in App Store Connect. You can’t create purchases until you do.',
        'Go to your app’s <strong>Subscriptions</strong> (or In-App Purchases) and create your products and prices.',
        'Connect the app to Apple’s purchase system (StoreKit). RevenueCat is a popular service that makes this easier. Ask your AI to set it up.',
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
      when: function (c) { return c.ugc; },
      sev: function (c) { return c.store ? 'blocker' : 'before'; },
      gap: function (c) { return c.store ? { rank: 6, title: 'Add report and block', why: 'Apple requires reporting and blocking in apps where people post.' } : null; },
      title: 'Add report, block and moderation tools',
      why: function (c) {
        return c.store ? 'Guideline 1.2 requires them for any app where people can see what others post or send.' : 'Anything people can post will eventually include spam or abuse, and EU law requires a way to report illegal content.';
      },
      steps: [
        'Add a “Report” option on every post, comment or message.',
        'Let people block other users.',
        'Filter obviously objectionable content, and decide who reviews reports and how fast.',
        'Show a way to contact you inside the app, and publish community rules in your terms.',
        'Since June 2026, Apple says removing content that breaks the rules is your responsibility.'
      ],
      sources: function (c) { return c.store ? [SRC.appleGuidelines, SRC.appleJune2026] : [SRC.dsa]; }
    },
    {
      id: 'uploads',
      phase: 'inapp',
      when: function (c) { return c.ugc; },
      sev: 'before',
      title: 'Handle uploaded photos and files safely',
      why: 'Uploads can fill your storage, carry a person’s location, or include content you’re legally responsible for removing.',
      steps: [
        'Limit uploads to the file types and sizes you need, such as JPEG or PNG under 5 MB.',
        'Remove location data from photos before saving them. Phone photos can reveal where someone lives. Ask your AI to strip EXIF data on upload.',
        'Make sure only the owner can delete or replace their files (see the database step).',
        'Decide who checks reported images, and remove anything illegal quickly.'
      ],
      sources: [SRC.supaStorage, SRC.dsa]
    },
    {
      id: 'copyright',
      phase: 'inapp',
      when: function (c) { return c.ugc; },
      sev: 'blocker',
      gap: { rank: 6, title: 'Register a copyright agent ($6)', why: 'Without one, you lose legal protection when users post things they don’t own.' },
      risk: 'Without a registered agent you lose the DMCA safe harbor; copyright owners can then claim $750–$30,000 per work, up to $150,000 if willful. Check the official page.',
      title: 'Set up a way to handle copyright complaints',
      why: 'When people post photos or text they don’t own, a US registered agent and a takedown process protect you from being liable for it.',
      steps: [
        'Register a “designated agent” with the US Copyright Office. It costs $6 and must be renewed every three years.',
        'Add a “Report copyright” link and a short takedown process to your terms.',
        'Remove content when you get a valid complaint, and ban people who repeatedly post others’ work.',
        'For users in the EU, give a reason when you remove someone’s content and let them respond.'
      ],
      sources: [SRC.dmca, SRC.dmcaSafeHarbor, SRC.copyrightDamages, SRC.dsa]
    },
    {
      id: 'crisis-safety',
      phase: 'inapp',
      when: function (c) { return c.health && (c.mental || c.ai || c.a.detail === 'mindfulness'); },
      sev: 'before',
      title: 'Plan for someone in crisis',
      why: 'People use wellness and mood apps on bad days. Stores expect health apps to point people to real help, and AI replies to personal notes can go wrong.',
      steps: [
        'Add a visible “Need help now?” link to crisis lines, such as ' + link('findahelpline.com', 'https://findahelpline.com/') + ', which lists free lines in over 130 countries.',
        'If AI replies to journal or mood entries: tell it never to give medical advice, and when an entry mentions self-harm, show crisis resources instead of an AI reply.',
        'Say in the app and store description that it isn’t therapy or medical care, and remind people to talk to a doctor or professional.',
        'Don’t put journal text or mood details in notifications, where anyone near the phone can read them.'
      ],
      sources: [SRC.helplines, SRC.appleGuidelines, SRC.playHealthPolicy]
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
      title: 'Make an iPhone build',
      why: 'Since April 28, 2026, Apple only accepts builds made with Xcode 26 or later, and since September 2026 they must support iOS 13 or later.',
      steps: [
        'You need either a Mac with the latest Xcode, or a cloud build service. Expo’s EAS Build and Submit work from Windows or Linux if your app uses Expo or React Native.',
        'With Expo: create a free Expo account, then ask your AI to run <code>eas build</code> for iOS. Check EAS’s free-plan build limits.',
        'With a Mac: open the project in Xcode, choose Product → Archive, then upload from the Organizer.',
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
        'A privacy manifest is a small file listing which sensitive phone features the app uses and why. Ask your AI: “Add a privacy manifest and declare a reason for every required-reason API this app or its packages use.” In Expo it goes under <code>ios.privacyManifests</code> in app.json.',
        'Update packages like Firebase, Google Sign-In and OneSignal to versions that include their own privacy manifests.',
        'After uploading, read Apple’s email. It names anything still missing.'
      ],
      sources: [SRC.appleReasonApi, SRC.appleSdkReqs, SRC.expoPrivacy]
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
        'Fix what breaks, upload a new build and test again.',
        'Consider adding crash reporting, such as Sentry, so you hear about crashes you didn’t see.'
      ],
      sources: [SRC.appleTestflight, SRC.appleCommon, SRC.sentry]
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
      sev: function (c) { return c.site ? 'before' : 'recommended'; },
      title: 'Make it usable with a screen reader, starting with alt text',
      why: 'Website accessibility lawsuits are common in the US, and missing image descriptions are the easiest thing to fix.',
      risk: '3,117 federal website accessibility lawsuits were filed in 2025; in California, at least $4,000 per violation (Unruh Act). Check the official page.',
      steps: [
        'Give every meaningful image a short text description (alt text). Mark decorative images as decorative.',
        'Make sure every button and field has a label a screen reader can read.',
        'Check that everything works with a keyboard alone, and text has enough contrast.',
        'Test once with VoiceOver (iPhone), TalkBack (Android) or Lighthouse (web). Aim for WCAG 2.1 AA.',
        'Don’t rely on an “accessibility overlay” widget. The FTC fined one maker $1 million for claiming it made sites compliant.'
      ],
      sources: [SRC.adaWeb, SRC.seyfarth, SRC.unruh, SRC.wcag, SRC.ftcAccessibe]
    },

    // ---------------- 6. Store listing ----------------
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
        'Include what your tools collect: analytics, crash reporting, Supabase or Firebase, AI providers. Mood or journal entries count as health and user content, linked to the person, and shared with your AI provider if you send them there.',
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
        'If your terms require an older minimum age, choose the higher rating.',
        'Some US states now require parent consent for under-18s’ downloads and purchases (Texas since June 2026). Apple and Google handle the consent, but your app may need to respond to it, so read their notes.'
      ],
      sources: [SRC.appleAgeHow, SRC.appleAgeNews, SRC.appleAgeSocial, SRC.appleTexas, SRC.playStateLaws]
    },
    {
      id: 'tracking-permission',
      phase: 'inapp',
      when: function (c) { return c.ios && c.ads && !c.kids; },
      sev: 'blocker',
      title: 'Ask permission before tracking for ads on iPhone',
      why: 'Apple requires the App Tracking Transparency prompt before tracking people across other companies’ apps, which most ad tools do.',
      steps: [
        'Ask your AI: “Does any package in this app track users across other apps or websites for ads?”',
        'If yes, show Apple’s tracking permission prompt before that tracking starts, and explain why in one sentence.',
        'The app must still work if people say no.',
        'Declare the tracking in your App Store privacy details.'
      ],
      sources: [SRC.att, SRC.applePrivacyUse]
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
      sources: [SRC.appleMedDevice, SRC.appleMedDeviceHelp]
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
        'Ads: say whether the app shows ads, including ads from any SDK. If it does, follow Google Play’s Ads policy.',
        'Health apps and Financial features: every app must fill these in, even to say “none”.',
        'App access: if features are behind a login, give reviewers a test account.'
      ],
      sources: [SRC.playRating, SRC.playAudience, SRC.playPrepare, SRC.playHealthDecl, SRC.playFinance, SRC.playAds]
    },

    // ---------------- 7. Submit ----------------
    // ---------- Legal risks small apps get sued or fined over ----------
    {
      id: 'text-consent',
      phase: 'legal',
      when: function (c) { return c.does.texts; },
      sev: 'blocker',
      gap: { rank: 3, title: 'Get written consent before marketing texts', why: 'People can sue for $500 per unwanted marketing text, or $1,500 if it was willful.' },
      title: 'Get written consent before sending marketing texts',
      why: 'Under the US Telephone Consumer Protection Act, texts count as calls, and each unwanted marketing text can cost $500.',
      risk: 'People can sue for $500 per text, up to $1,500 if it was willful (TCPA). This amount is written into the law.',
      steps: [
        'Before sending any promotional text, get written permission: an unticked checkbox or e-signature that clearly says they agree to marketing texts at that number.',
        'Save a record of when and how each person agreed.',
        'Let people reply STOP (or opt out any reasonable way), and stop within 10 business days at most.',
        'Only send between 8am and 9pm in the person’s own time zone.',
        'Don’t text numbers on the National Do-Not-Call Registry unless they’ve agreed.'
      ],
      sources: [SRC.tcpa, SRC.tcpaRule, SRC.fccGuide]
    },
    {
      id: 'email-rules',
      phase: 'legal',
      when: function (c) { return c.does.emails; },
      sev: 'blocker',
      gap: { rank: 3, title: 'Add an unsubscribe link and address to marketing emails', why: 'The FTC can fine up to $53,088 for each email that breaks the CAN-SPAM rules.' },
      title: 'Follow the email marketing rules (CAN-SPAM)',
      why: 'You don’t need opt-in for email in the US, but every marketing email must follow a few rules, and each one that doesn’t can be fined.',
      risk: 'Up to $53,088 per email (FTC, 2025 amount, still current in 2026). Check the official page.',
      steps: [
        'Put a working unsubscribe link in every marketing email.',
        'Remove people within 10 business days of unsubscribing. Most email tools do this automatically; check it’s on.',
        'Include a real postal address (a PO box you registered is fine).',
        'Use an honest sender name and subject line, and make clear it’s an ad.',
        'If a tool or agency sends emails for you, you’re still responsible for them.'
      ],
      sources: [SRC.canSpam, SRC.ftcPenalties, SRC.omb2026]
    },
    {
      id: 'encryption-breach',
      phase: 'secure',
      when: function (c) { return c.cloud; },
      sev: 'before',
      title: 'Encrypt people’s data and write a one-page breach plan',
      why: 'Every US state requires you to tell people after a data breach, and most go easier on data that was encrypted.',
      risk: 'In California, a breach of unencrypted data can mean $107–$799 per person in lawsuits (CCPA, for larger businesses), and notice is due within 30 days. Check the official page.',
      steps: [
        'Make sure every connection uses HTTPS.',
        'Check your database encrypts stored data. Supabase and Firebase do this by default; say so in your privacy policy.',
        'Never store passwords yourself. Let your login provider (Supabase Auth, Firebase Auth) handle them.',
        'Only collect data you actually use.',
        'Write down in one page: how you’d notice a breach, who you’d tell, and by when.'
      ],
      sources: [SRC.naagBreach, SRC.caBreachNotice, SRC.ccpaBreach, SRC.ccpaPenalties, SRC.supaSecurity]
    },
    {
      id: 'ai-label',
      phase: 'legal',
      when: function (c) { return c.ai; },
      sev: 'before',
      title: 'Tell people when they’re talking to an AI',
      why: 'The EU requires it from August 2, 2026, and it builds trust everywhere else.',
      risk: 'EU AI Act fines reach millions of euros, capped at the lower amount for small businesses. Check the official page.',
      steps: [
        'Label AI replies clearly, for example “Written by AI”.',
        'If the app makes images, audio or video with AI, mark them as AI-made.',
        'Say in your privacy policy which AI company receives people’s data.',
        'Don’t let AI alone decide things like loans, housing, jobs or insurance without a lawyer’s review.'
      ],
      sources: [SRC.euAiAct50, SRC.appleGuidelines]
    },
    {
      id: 'biometrics',
      phase: 'legal',
      when: function (c) { return c.does.faces; },
      sev: 'blocker',
      gap: { rank: 3, title: 'Get written permission before scanning faces or voices', why: 'In Illinois, people can sue for $1,000 per violation, or $5,000 if it was reckless.' },
      title: 'Get written permission before scanning faces, fingerprints or voices',
      why: 'Illinois and Texas have strict biometric laws, and Illinois lets people sue directly.',
      risk: '$1,000 per violation, $5,000 if intentional or reckless (Illinois BIPA); up to $25,000 per violation (Texas, enforced by the state). Check the official page.',
      steps: [
        'If you only unlock the app with Face ID or Touch ID through Apple’s or Google’s system, you’re fine: the app never receives the face data.',
        'If the app scans faces, selfies, fingerprints or voices itself, show a notice first: what you collect, why, and how long you keep it.',
        'Get a written release, like an unticked “I agree” checkbox, before any scan.',
        'Publish when you delete the data, and actually delete it.',
        'Never sell or share it. If a vendor does ID checks for you, confirm they handle consent.'
      ],
      sources: [SRC.appleFaceId, SRC.bipaCothron, SRC.texasCubi]
    },
    {
      id: 'pixel-consent',
      phase: 'legal',
      when: function (c) { return c.does.pixel; },
      sev: 'blocker',
      gap: { rank: 4, title: 'Don’t load ad pixels before people agree', why: 'California lawsuits claim $5,000 per violation for pixels that send visitor activity to ad companies.' },
      title: 'Load ad pixels only after people agree',
      why: 'Pixels from Meta, TikTok and others send what visitors do to ad companies, and that’s the basis of a wave of California lawsuits.',
      risk: '$5,000 per violation under California’s wiretap law (CIPA); courts are split on pixels, but suits keep coming. $2,500 per person for sites with video (VPPA). Check the official page.',
      steps: [
        'Use a consent banner that actually blocks the pixel until someone taps Accept.',
        'List every pixel and the company it sends data to in your privacy policy.',
        'Never put pixels on login, checkout, health or money pages.',
        'If you show videos, don’t send video titles together with who watched them to ad platforms.'
      ],
      sources: [SRC.cipa, SRC.vppa, SRC.icoCookies]
    },
    {
      id: 'age-screen',
      phase: 'legal',
      when: function (c) { return c.accounts && !c.kids; },
      sev: 'recommended',
      title: 'Add a neutral age question at sign-up',
      why: 'An app not made for kids is only covered by children’s privacy law if you know a child signed up, and a simple age question helps you handle that.',
      risk: 'If you knowingly collect from children under 13 without a parent’s consent: up to $53,088 per violation (FTC). Check the official page.',
      steps: [
        'Ask for a birth date at sign-up, without hinting at the “right” answer.',
        'If someone is under 13, don’t create the account (or ask for a parent’s consent).',
        'If you learn a user is under 13, delete their data.',
        'The FTC said in 2026 it won’t penalize collecting age only to check age, if you delete it promptly and use it for nothing else.'
      ],
      sources: [SRC.coppa, SRC.ftcAgeStatement]
    },
    {
      id: 'ai-claims',
      phase: 'legal',
      when: function (c) { return c.does.aiclaims; },
      sev: 'blocker',
      gap: { rank: 5, title: 'Only claim what your AI can prove', why: 'The FTC made accessiBe pay $1 million and DoNotPay $193,000 over AI claims they couldn’t back up.' },
      title: 'Only make claims about your AI that you’ve tested',
      why: 'The FTC’s “Operation AI Comply” goes after apps that overstate what AI does.',
      risk: 'No fixed amount: accessiBe paid $1,000,000 and DoNotPay $193,000 in FTC cases. Check the official page.',
      steps: [
        'Read every claim on your site, store listing and ads, like “99% accurate”, “replaces a lawyer” or “fully compliant”.',
        'Keep only claims you’ve tested, and save the test results.',
        'Drop words like “guaranteed”, “fully compliant” or “as good as a doctor”.',
        'Never use AI-written fake reviews or testimonials.'
      ],
      sources: [SRC.ftcAccessibe, SRC.ftcDoNotPay, SRC.ftcWorkado]
    },
    {
      id: 'cancel-easily',
      phase: 'inapp',
      when: function (c) { return c.digital || c.a.money === 'physical'; },
      sev: 'before',
      title: 'Make subscriptions easy to understand and easy to cancel',
      why: 'US law requires clear terms and a simple way to cancel, and California requires a “click to cancel” link online.',
      risk: 'Enforced by the FTC and state attorneys general; no fixed amount. Check the official page.',
      steps: [
        'Show the price, renewal and how to cancel before asking for payment details.',
        'Get a clear “Subscribe” tap, not a pre-ticked box.',
        'If you sell through Apple or Google in-app purchase, their screens handle cancelling. If you sell on the web (for example Stripe), add a cancel button people can use online.',
        'California: send a reminder before yearly renewals, and 7–30 days’ notice before a price change.'
      ],
      sources: [SRC.rosca, SRC.caArl, SRC.appleSubs]
    },
    // ---------- Store submission, in small steps ----------
    {
      id: 'who-reviews',
      phase: 'accounts',
      when: function (c) { return c.store; },
      sev: 'before',
      title: 'Know who checks your app before it goes live',
      why: 'Every app and every update is checked by the store before anyone can download it. Knowing who and where saves a lot of confusion.',
      steps: function (c) {
        var list = [];
        if (c.ios) list.push('<strong>App Store:</strong> Apple’s App Review team checks every app and update. You talk to them only through ' + link('App Store Connect', 'https://appstoreconnect.apple.com') + ', Apple’s website for publishing.');
        if (c.android) list.push('<strong>Google Play:</strong> Google reviews every app and update. You talk to Google through ' + link('Google Play Console', 'https://play.google.com/console') + ', Google’s website for publishing.');
        list.push('You don’t send them a zip file, a GitHub link or an email. You upload a finished build through their website or tools, fill in forms there, then press a submit button.');
        list.push('Skim the store’s review rules once, so nothing later surprises you.');
        return list;
      },
      sources: function (c) {
        var l = [];
        if (c.ios) l.push(SRC.appleReviewOverview, SRC.appleGuidelines);
        if (c.android) l.push(SRC.playPrepare);
        return l;
      }
    },
    {
      id: 'asc-sign-in',
      phase: 'accounts',
      when: function (c) { return c.ios; },
      sev: 'before',
      title: 'Sign in to App Store Connect for the first time',
      why: 'It’s where everything for your app happens: uploads, forms, review messages and release.',
      steps: [
        'Go to ' + link('appstoreconnect.apple.com', 'https://appstoreconnect.apple.com') + ' and sign in with the Apple Account you enrolled with.',
        'Accept any agreements it shows you. The free-apps agreement is needed even for a free app.',
        'Look around the <strong>Apps</strong> page. You’ll come back here for almost every step below.'
      ],
      sources: [SRC.ascHome, SRC.appleAgreements]
    },
    {
      id: 'upload-build-ios',
      phase: 'submit',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Upload your iPhone build to App Store Connect',
      why: 'Apple only reviews builds uploaded through its own tools. A zip file or a GitHub link isn’t accepted.',
      steps: [
        'Build the release version of the app (see “Make an iPhone build”).',
        'Upload it with Xcode, Apple’s Transporter app (Mac), or Expo’s <code>eas submit</code> (works from Windows or Linux).',
        'Wait for Apple’s email saying the build finished processing. It usually takes minutes, sometimes longer (check the official page).',
        'If processing fails, the email says why. Fix that, bump the build number, and upload again.'
      ],
      sources: [SRC.appleUpload, SRC.expoSubmit]
    },
    {
      id: 'listing-text',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Write your App Store name, subtitle and description',
      why: 'People decide from this text, and Apple rejects listings that don’t match what the app does.',
      steps: [
        'Name: up to 30 characters. Check nobody else uses it.',
        'Subtitle: up to 30 characters, saying what it does.',
        'Description: plain words about what the app does, up to 4,000 characters. No prices or features that aren’t there.',
        'Keywords: up to 100 characters, separated by commas.',
        'Pick a primary category.'
      ],
      sources: [SRC.appleAppInfo, SRC.appleVersionInfo, SRC.appleGuidelines]
    },
    {
      id: 'listing-screenshots',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Add App Store screenshots',
      why: 'You can’t submit without them, and they must show the real app in use.',
      steps: [
        'Take 1 to 10 screenshots of real screens, not only the login or splash screen.',
        'Use the size App Store Connect asks for: iPhone 6.9-inch (for example 1290 × 2796). Sizes change, so check the official page.',
        'If the app runs on iPad, add iPad screenshots too, or ask your AI to turn iPad support off.',
        'Upload them on the version page in App Store Connect.'
      ],
      sources: [SRC.appleScreens, SRC.appleGuidelines]
    },
    {
      id: 'app-icon',
      phase: 'build',
      when: function (c) { return c.store; },
      sev: 'blocker',
      title: 'Make your app icon',
      why: 'Both stores require one, and it’s the first thing people see.',
      steps: function (c) {
        var l = ['Make a simple, square icon with no text that’s too small to read.'];
        if (c.ios) l.push('iPhone: 1024 × 1024 pixels, set in your project (Expo: the <code>icon</code> field in app.json).');
        if (c.android) l.push('Google Play: a 512 × 512 PNG, up to 1 MB, uploaded in Play Console.');
        return l;
      },
      sources: function (c) {
        var l = [];
        if (c.ios) l.push(SRC.appleIcons);
        if (c.android) l.push(SRC.playListing);
        return l;
      }
    },
    {
      id: 'listing-links',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Add your support and privacy policy links',
      why: 'Apple requires both, and a broken link gets the app sent back.',
      steps: [
        'Support URL: a page with a way to contact you. Your support page from earlier works.',
        'Privacy Policy URL: the public page with your privacy policy.',
        'Open both links on your phone before you submit, to check they load.'
      ],
      sources: [SRC.appleVersionInfo, SRC.appleAppInfo, SRC.appleCommon]
    },
    {
      id: 'pricing-availability',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Set the price and countries',
      why: 'The app can’t be released until you choose where it’s sold and for how much.',
      steps: [
        'In App Store Connect, open <strong>Pricing and Availability</strong>.',
        'Choose Free, or a price. Free apps don’t need the Paid Apps Agreement.',
        'Pick the countries. You can leave some out for now.'
      ],
      sources: [SRC.appleAvailability]
    },
    {
      id: 'encryption-question',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'before',
      title: 'Answer the encryption question',
      why: 'Apple asks for every version, and most apps only need one simple answer.',
      steps: [
        'If the app only uses HTTPS or Apple’s built-in encryption, answer that it uses exempt encryption.',
        'Ask your AI to set <code>ITSAppUsesNonExemptEncryption</code> to NO (Expo: <code>ios.config.usesNonExemptEncryption: false</code>) so you’re not asked every time.'
      ],
      sources: [SRC.appleExport]
    },
    {
      id: 'eu-trader',
      phase: 'listing',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Declare your EU trader status',
      why: 'Apple requires an answer even if you don’t sell in the EU, and apps without one are removed there.',
      steps: [
        'Go to <strong>Business → Agreements → Compliance → Digital Services Act</strong>.',
        'If you earn money from the app, you’re probably a trader: your phone, email and address will be shown to EU users.',
        'Only choose “non-trader” if it’s true. If you don’t want your details shown, leave EU countries out under Pricing and Availability.'
      ],
      sources: [SRC.appleDsa]
    },
    {
      id: 'review-notes',
      phase: 'submit',
      when: function (c) { return c.store; },
      sev: 'before',
      title: 'Write short notes for the reviewer',
      why: 'A few sentences about anything unusual prevent a lot of back-and-forth.',
      steps: [
        'Say in one or two sentences what the app does and where its main features are.',
        'Mention anything that needs setup, like a microphone, a subscription or location.',
        'Add a contact name, email and phone number reviewers can reach.'
      ],
      sources: [SRC.appleVersionInfo, SRC.playPrepare]
    },
    {
      id: 'submit-ios',
      phase: 'submit',
      when: function (c) { return c.ios; },
      sev: 'blocker',
      title: 'Send the app to Apple for review',
      why: 'Nothing is reviewed until you press submit.',
      steps: [
        'On the version page, choose the build you uploaded.',
        'Check every section shows no warnings: listing, privacy, age rating, pricing, review information.',
        'Choose how to release it: automatically when approved, or when you press a button.',
        'Press <strong>Add for Review</strong>, then <strong>Submit to App Review</strong>.'
      ],
      sources: [SRC.appleSubmit, SRC.appleRelease]
    },
    {
      id: 'after-review-ios',
      phase: 'submit',
      when: function (c) { return c.ios; },
      sev: 'before',
      title: 'Watch for Apple’s answer',
      why: 'Most apps get an answer within a day or two, and a first rejection is common and fixable.',
      steps: [
        'Apple emails you when the status changes. Apple says 90% of submissions are reviewed within 24 hours (check the official page; it varies).',
        'If it’s approved, it goes live the way you chose.',
        'If it’s rejected, open the message in App Store Connect. It names the rule and what to change.',
        'Fix that one thing, reply if something needs explaining, and submit again.'
      ],
      sources: [SRC.appleCommon, SRC.appleResolution]
    },
    {
      id: 'play-create-app',
      phase: 'accounts',
      when: function (c) { return c.android; },
      sev: 'blocker',
      title: 'Create your app in Google Play Console',
      why: 'Every upload, form and review happens under this app entry.',
      steps: [
        'In ' + link('Google Play Console', 'https://play.google.com/console') + ', press <strong>Create app</strong>.',
        'Enter the app name, language, and whether it’s free or paid (free can’t change to paid later).',
        'Accept the declarations it shows.'
      ],
      sources: [SRC.playConsoleHome, SRC.playCreateApp]
    },
    {
      id: 'upload-build-android',
      phase: 'build',
      when: function (c) { return c.android; },
      sev: 'blocker',
      title: 'Upload your Android build to a test track',
      why: 'Google only accepts builds uploaded in Play Console, as an .aab file. A zip or GitHub link isn’t accepted.',
      steps: [
        'In Play Console, go to <strong>Testing → Closed testing</strong> and create a release.',
        'Upload the .aab file from your Android build.',
        'Add a short note about what’s in this release, then save and roll it out to testers.'
      ],
      sources: [SRC.playTracks, SRC.aab]
    },
    {
      id: 'play-production',
      phase: 'submit',
      when: function (c) { return c.android; },
      sev: 'blocker',
      title: 'Apply for production access',
      why: 'New personal accounts must ask Google before releasing to everyone, after the 14-day test.',
      steps: [
        'When the 14-day test is done, open the Play Console <strong>Dashboard</strong> and choose to apply for production.',
        'Answer the questions about your test honestly: who tested, what you changed.',
        'Google replies by email. It can take several days (check the official page).'
      ],
      sources: [SRC.playProdAccess]
    },
    {
      id: 'submit-android',
      phase: 'submit',
      when: function (c) { return c.android; },
      sev: 'blocker',
      title: 'Send the app to Google for review',
      why: 'Your release only goes out after Google reviews it.',
      steps: [
        'In <strong>Production</strong>, create a release using your tested .aab.',
        'Check <strong>Publishing overview</strong> has no missing items.',
        'Send the changes for review. Google says it can take up to 7 days or longer (check the official page).'
      ],
      sources: [SRC.playPublish, SRC.playReview]
    },
    {
      id: 'after-review-android',
      phase: 'submit',
      when: function (c) { return c.android; },
      sev: 'before',
      title: 'Watch for Google’s answer',
      why: 'A first rejection is common and fixable.',
      steps: [
        'Google emails you, and Play Console shows the status.',
        'If it’s rejected, the email and the <strong>Policy status</strong> page name the policy.',
        'Fix it and send a new release, or appeal if you think it’s a mistake.'
      ],
      sources: [SRC.playPolicyStatus]
    },
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
      id: 'web-launch',
      phase: 'submit',
      when: function (c) { return c.web || c.extension; },
      sev: 'before',
      title: 'Put the finished site live on your domain',
      why: 'Your site needs to work at its real address, with its legal pages linked, before you tell people about it.',
      steps: [
        'Deploy the final version to your host and connect your domain.',
        'Link your privacy policy, terms and support email in the footer.',
        'Sign up as a brand-new user and go through the whole app once on a phone.'
      ].concat([]),
      sources: [SRC.vercelDomain, SRC.netlifyHttps, { label: 'Chrome Web Store: Publish your extension', url: 'https://developer.chrome.com/docs/webstore/publish' }]
    },

    {
      id: 'extension-store',
      phase: 'submit',
      when: function (c) { return c.extension; },
      sev: 'blocker',
      title: 'Submit your extension to the Chrome Web Store',
      why: 'Extensions are installed from the store, which reviews them and requires a privacy form.',
      steps: [
        'Register as a Chrome Web Store developer.',
        'Upload the extension and fill in its privacy practices form, matching your privacy policy.',
        'Only ask for the permissions the extension really needs. Broad permissions slow down review.'
      ],
      sources: [{ label: 'Chrome Web Store: Publish your extension', url: 'https://developer.chrome.com/docs/webstore/publish' }]
    },
    {
      id: 'seo',
      phase: 'submit',
      when: function (c) { return c.web; },
      sev: 'recommended',
      title: 'Help people find and share your site',
      why: 'Sites built as single-page apps often show up blank in search results and link previews unless you add the basics.',
      steps: [
        'Give every page a clear title and one-sentence description.',
        'Add a share image and preview tags so links look right in messages and social posts.',
        'Add your site to Google Search Console and submit a sitemap.',
        'Ask your AI whether your pages are readable without JavaScript. If not, ask about pre-rendering.'
      ],
      sources: [SRC.seo]
    },

    // ---------------- 8. After launch ----------------
    {
      id: 'before-charging',
      phase: 'after',
      when: function (c) { return c.a.money === 'later' && c.store; },
      sev: 'after',
      title: 'Before you add a subscription later',
      why: 'Charging inside an app brings a set of new store requirements you don’t need today.',
      steps: [
        'Use Apple’s in-app purchase and Google Play Billing for anything that unlocks features.',
        'Sign the Paid Apps Agreement and add bank and tax details first.',
        'Add a subscription screen with price and renewal details, and a “Restore purchases” button.',
        'Update your terms and privacy policy, then run Launch Check again.'
      ],
      sources: [SRC.appleSubs, SRC.appleAgreements, SRC.playBilling]
    },
    {
      id: 'notifications',
      phase: 'after',
      when: function (c) { return c.store; },
      sev: 'recommended',
      title: 'If you send notifications, keep them optional and private',
      why: 'Apple’s guideline 4.5.4 says the app must work without them, marketing ones need permission, and they mustn’t carry sensitive personal information.',
      steps: [
        'Make sure the app works if someone says no to notifications.',
        'Ask separately before sending promotional notifications.',
        'Keep private details, like journal text or health information, out of the notification itself.'
      ],
      sources: [SRC.appleGuidelines]
    },
    {
      id: 'keep-in-sync',
      phase: 'after',
      when: always,
      sev: 'after',
      title: function (c) { return c.store ? 'Update your privacy policy and store forms whenever the app collects something new' : 'Update your privacy policy whenever the site collects something new'; },
      why: 'A mismatch between what you do and what you’ve told people breaks privacy law, and in stores it can get updates rejected or the app pulled.',
      steps: function (c) {
        return [
          'Before adding a feature, ask: does it collect new data or send it somewhere new?',
          c.store ? 'If so, update the privacy policy, App Privacy details and Data safety form in the same release.' : 'If so, update the privacy policy, and your cookie banner if it’s a new tracking tool, in the same release.'
        ];
      },
      sources: [SRC.playDataSafety, SRC.applePrivacyDetails]
    },
    {
      id: 'stay-updated',
      phase: 'after',
      when: always,
      sev: 'after',
      title: 'Keep the app’s building blocks up to date',
      why: function (c) { return c.store ? 'Security fixes arrive through updates, and stores raise their minimum requirements every year.' : 'Security fixes arrive through updates to the packages your site uses.'; },
      steps: function (c) {
        var list = ['Merge Dependabot’s security pull requests, then test again.'];
        if (c.store) list.push('Each year, check Apple’s minimum Xcode version and Google’s target API level before your next update.', 'Watch your email for policy notices from Apple and Google. They give deadlines.');
        else list.push('Keep your builder, database and login settings up to date, and read security emails from them.');
        return list;
      },
      sources: [SRC.ghDependabot, SRC.targetSdk, SRC.appleUpcoming]
    }
  ];

  // Skill tree: which branch each task belongs to, and which tasks it waits on.
  var BRANCHES = [
    { id: 'accounts', title: 'Accounts and purchases' },
    { id: 'security', title: 'Security and data' },
    { id: 'legal', title: 'Legal' },
    { id: 'ux', title: 'User experience' },
    { id: 'store', title: 'Store submission' }
  ];

  var BRANCH_OF = {
    'find-out': 'accounts', 'decide-money': 'accounts', 'who-reviews': 'store',
    'apple-developer': 'accounts', 'play-developer': 'accounts', 'asc-sign-in': 'accounts', 'apple-app-record': 'accounts',
    'play-create-app': 'accounts', 'regulated-entity': 'accounts', website: 'accounts', 'support-email': 'accounts',
    'apple-iap': 'accounts', 'play-billing': 'accounts', 'before-charging': 'accounts',
    'two-factor': 'security', 'find-data': 'security', 'supabase-rls': 'security', 'firebase-rules': 'security',
    'backend-access': 'security', 'secret-keys': 'security', 'rotate-keys': 'security', 'github-protection': 'security',
    'private-repo': 'security', backups: 'security', 'supabase-awake': 'security', 'auth-redirects': 'security',
    'abuse-limits': 'security', https: 'security', 'kids-sdks': 'security', uploads: 'security', 'stay-updated': 'security',
    'privacy-policy': 'legal', terms: 'legal', 'cookie-consent': 'legal', 'ads-consent': 'legal', coppa: 'legal',
    'health-consent': 'legal', 'health-breach': 'legal', 'ai-consent': 'legal', 'ai-disclosure-web': 'legal',
    'health-claims': 'legal', copyright: 'legal', 'audio-rights': 'legal', 'apple-kids': 'legal', 'play-families': 'legal',
    'keep-in-sync': 'legal', 'tracking-permission': 'legal',
    'text-consent': 'legal', 'email-rules': 'legal', 'ai-label': 'legal', biometrics: 'legal', 'pixel-consent': 'legal',
    'age-screen': 'legal', 'ai-claims': 'legal', 'encryption-breach': 'security', 'cancel-easily': 'ux',
    'account-deletion': 'ux', 'sign-in-with-apple': 'ux', 'subscription-screen': 'ux', ugc: 'ux', 'crisis-safety': 'ux',
    healthkit: 'ux', 'app-icon': 'ux', accessibility: 'ux', size: 'ux', 'web-speed': 'ux', completeness: 'ux',
    'more-than-a-website': 'ux', notifications: 'ux', seo: 'ux'
  };

  var NEEDS = {
    'asc-sign-in': ['apple-developer'],
    'apple-app-record': ['asc-sign-in'],
    'play-create-app': ['play-developer'],
    'support-email': ['website'],
    'privacy-policy': ['find-data', 'website'],
    terms: ['website'],
    'apple-iap': ['apple-app-record', 'decide-money'],
    'subscription-screen': ['apple-iap'],
    'play-billing': ['play-create-app', 'decide-money'],
    'rotate-keys': ['secret-keys'],
    'supabase-rls': ['find-data'],
    'firebase-rules': ['find-data'],
    'backend-access': ['find-data'],
    backups: ['find-data'],
    'auth-redirects': ['website'],
    'ai-consent': ['privacy-policy'],
    'ai-disclosure-web': ['privacy-policy'],
    'health-consent': ['privacy-policy'],
    'cookie-consent': ['privacy-policy'],
    'ads-consent': ['website', 'privacy-policy'],
    coppa: ['find-out'],
    'kids-sdks': ['find-out'],
    'ios-build': ['apple-app-record', 'privacy-manifest'],
    'upload-build-ios': ['ios-build', 'app-icon'],
    testflight: ['upload-build-ios'],
    completeness: ['testflight'],
    'upload-build-android': ['android-build', 'play-create-app'],
    'closed-test': ['upload-build-android'],
    'listing-text': ['apple-app-record'],
    'listing-screenshots': ['apple-app-record', 'completeness'],
    'listing-links': ['apple-app-record', 'privacy-policy', 'support-email'],
    'pricing-availability': ['apple-app-record'],
    'apple-privacy-labels': ['apple-app-record', 'privacy-policy'],
    'apple-age-rating': ['apple-app-record'],
    'medical-device': ['apple-app-record'],
    'encryption-question': ['upload-build-ios'],
    'eu-trader': ['asc-sign-in'],
    'play-listing': ['play-create-app', 'app-icon'],
    'play-data-safety': ['play-create-app', 'privacy-policy'],
    'play-app-content': ['play-create-app'],
    'demo-account': ['completeness'],
    'review-notes': ['demo-account'],
    'submit-ios': ['upload-build-ios', 'listing-text', 'listing-screenshots', 'listing-links', 'pricing-availability', 'apple-privacy-labels', 'apple-age-rating', 'eu-trader', 'review-notes', 'account-deletion', 'terms'],
    'after-review-ios': ['submit-ios'],
    'play-production': ['closed-test', 'play-listing', 'play-data-safety', 'play-app-content'],
    'submit-android': ['play-production', 'review-notes'],
    'after-review-android': ['submit-android'],
    'web-launch': ['website', 'privacy-policy', 'terms', 'https'],
    'extension-store': ['privacy-policy'],
    'keep-in-sync': ['privacy-policy'],
    notifications: ['privacy-policy'],
    'before-charging': ['privacy-policy'],
    'pixel-consent': ['privacy-policy'],
    'biometrics': ['privacy-policy'],
    'ai-label': ['privacy-policy'],
    'encryption-breach': ['find-data'],
    'cancel-easily': ['terms']
  };

  ITEMS.forEach(function (it) {
    it.branch = BRANCH_OF[it.id] || 'store';
    it.needs = NEEDS[it.id] || [];
  });

  window.LC_DATA = {
    branches: BRANCHES,
    checked: 'September 2026',
    phases: PHASES,
    items: ITEMS
  };
})();
