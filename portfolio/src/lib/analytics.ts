import { site } from '../data/site'

/**
 * Portfolio analytics — GoatCounter.
 *
 * Chosen over Google Analytics deliberately: no cookies, no personal data, no
 * consent banner. A cookie wall is a bad first impression on a page a recruiter
 * has just opened, and this site's whole job is that first impression.
 *
 * Everything here is inert until `site.analyticsId` is filled in — no script,
 * no listeners, no requests. Local and preview hosts never report, so the
 * numbers only ever describe real visitors.
 *
 * What gets recorded, and why it's the useful set for a job hunt:
 *  - pageviews, including the `?src=` tag on a link sent to one specific
 *    company, so an application can be told apart from a LinkedIn click
 *  - case-study and demo opens (they're routes, so they come for free)
 *  - résumé downloads and email copies — the highest-intent signals on the site
 *  - outbound clicks to the live products
 */

type CountArgs = { path?: string; title?: string; event?: boolean }
type GoatCounter = { count: (args: CountArgs) => void }

declare global {
  interface Window {
    goatcounter?: GoatCounter
  }
}

/** Calls made before the script lands are held here, then flushed in order. */
const queue: CountArgs[] = []
let started = false

function send(args: CountArgs) {
  if (!started) return
  if (window.goatcounter) window.goatcounter.count(args)
  else queue.push(args)
}

/** A pageview for the current URL, query string and hash route included. */
export function pageview() {
  send({ path: location.pathname + location.search + location.hash })
}

/** A named event — résumé downloads, email copies, outbound clicks. */
export function track(name: string) {
  send({ path: name, title: name, event: true })
}

export function initAnalytics() {
  const code = site.analyticsId.trim()
  if (!code || started) return

  // Never report from a dev server, a local preview, or a file:// open.
  const host = location.hostname
  if (host === 'localhost' || host === '127.0.0.1' || host === '' || host.endsWith('.local')) return

  started = true

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://gc.zgo.at/count.js'
  script.setAttribute('data-goatcounter', `https://${code}.goatcounter.com/count`)
  // Pageviews are sent by hand — the site is a hash-routed SPA, so the one
  // automatic on-load count would be the only one ever recorded.
  script.setAttribute('data-goatcounter-settings', JSON.stringify({ no_onload: true }))
  script.onload = () => {
    for (const args of queue.splice(0)) window.goatcounter?.count(args)
  }
  document.head.appendChild(script)

  // One delegated listener covers every link on the site, so no component has
  // to know analytics exists.
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute('href') ?? ''
      if (href.startsWith('mailto:')) return track('email: mailto')
      if (href.endsWith('.pdf')) return track('résumé: download')

      try {
        const url = new URL(link.href)
        if (url.host && url.host !== location.host) track(`outbound: ${url.host}${url.pathname}`)
      } catch {
        /* non-URL href (in-page anchor) — nothing to report */
      }
    },
    { capture: true },
  )

  pageview()
}
