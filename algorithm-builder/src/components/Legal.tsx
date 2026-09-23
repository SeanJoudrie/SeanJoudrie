import { BRAND } from '../data/brand'
import { Card } from './ui'

/** Privacy policy and terms (G-10). Plain language, and accurate to what the app does. */

const UPDATED = 'September 23, 2026'

export function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        {BRAND.name} has no accounts and no tracking. This page explains the little data that moves when you use it.
      </p>
      <h2>What stays on your device</h2>
      <p>
        Your answers (the topics you like, what you’re tired of, and your guesses about your home screen) are saved in your browser and inside your personal link. We don’t
        receive or store them. Anyone you send your link to can see what’s in it.
      </p>
      <h2>What we send to YouTube</h2>
      <p>
        To find videos, the app sends only the search words for each topic (for example “math explained visually”) and an optional “older than” year to our search
        server, which asks the YouTube Data API. Our server keeps these results in memory for up to 24 hours so repeated searches don’t use up our quota, and it keeps a short-lived
        count of requests per connection to stop abuse. Nothing is linked to you.
      </p>
      <p>
        Video titles, channels and thumbnails come from YouTube API Services. By using the playlist you also agree to the{' '}
        <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
          YouTube Terms of Service
        </a>
        , and Google’s handling of that request is covered by the{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google Privacy Policy
        </a>
        .
      </p>
      <h2>Fonts and hosting</h2>
      <p>
        Fonts load from Google Fonts, and the site is hosted on GitHub Pages. Like any website host, they see standard request information such as your IP address. We don’t add
        analytics, ads or cookies.
      </p>
      <h2>Deleting your data</h2>
      <p>“Start over” on the results page deletes everything this site saved in your browser. Clearing your browser’s site data does the same.</p>
      <h2>Questions</h2>
      <p>
        Open an issue on{' '}
        <a href="https://github.com/SeanJoudrie/SeanJoudrie/issues" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>{BRAND.name} is a free tool that suggests settings to change and videos to watch. By using it you agree to these terms.</p>
      <h2>No guarantees</h2>
      <p>
        Recommendation systems are run by the platforms, not by us. Your new feed is a goal, not a promise, and results vary. The tool is provided as is, without warranties of any
        kind, and we aren’t liable for anything that results from using it.
      </p>
      <h2>We never touch your accounts</h2>
      <p>The app doesn’t sign in to, change or read any of your accounts. Every change is one you make yourself, in the app you’re fixing.</p>
      <h2>Third-party content</h2>
      <p>
        Videos and links point to YouTube and other sites we don’t control. Their content and terms are their own. {BRAND.name} isn’t affiliated with or endorsed by YouTube,
        Google, Instagram, Meta, TikTok or X. Their names are trademarks of their owners and are used only to describe what the tool works with.
      </p>
      <h2>Use it fairly</h2>
      <p>Don’t use automated tools to call our search server or try to exhaust its quota.</p>
      <h2>Changes</h2>
      <p>If these terms change, the date below changes with them.</p>
    </LegalPage>
  )
}

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="anim-rise mx-auto w-full max-w-[680px]">
      <h1 tabIndex={-1} className="font-display m-0 text-3xl font-bold leading-tight">
        {title}
      </h1>
      <p className="m-0 mt-2 text-sm text-muted">Last updated {UPDATED}</p>
      <Card className="mt-6">
        <div className="legal space-y-4 text-base leading-relaxed text-ink-2">{children}</div>
      </Card>
    </div>
  )
}
