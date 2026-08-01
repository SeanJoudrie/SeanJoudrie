import { build } from 'esbuild'
import type { Plugin } from 'vite'
import type { Project } from '../src/data/projects'

type Site = (typeof import('../src/data/site'))['site']

/**
 * Bakes a static, readable version of the site into the shipped index.html.
 *
 * The portfolio is a client-rendered SPA: the served HTML is `<div id="root">`
 * and a script tag, so anything that only fetches HTML — link previews, search
 * crawlers, AI assistants like Claude, Reader modes, a browser with JS off —
 * sees an empty page with a title and nothing else. Pre-rendering the real app
 * isn't an option here (three.js scenes, canvas demos, hash routing), so
 * instead the plugin reads the same data the app renders from and writes a
 * plain-HTML summary of it inside #root.
 *
 * That markup is the container's initial content; main.tsx clears it right
 * before React takes over, so it costs nothing at runtime and can't drift from
 * the app — it is generated from src/data/site.ts and src/data/projects.ts on
 * every build.
 */
export function staticFallback(): Plugin {
  let root = ''

  return {
    name: 'static-fallback',

    configResolved(config) {
      root = config.root
    },

    async transformIndexHtml(html) {
      const { site, projects } = await loadSiteData(root)
      const marker = '<div id="root"></div>'

      if (!html.includes(marker)) {
        console.warn(
          '[static-fallback] index.html no longer contains `<div id="root"></div>` — ' +
            'nothing was injected, so the built page is unreadable without JS.',
        )
        return html
      }

      return {
        html: html.replace(marker, `<div id="root">${render(site, projects)}</div>`),
        tags: [{ tag: 'style', children: STYLE, injectTo: 'head' }],
      }
    },
  }
}

/**
 * Loads the TypeScript data modules in Node. esbuild (already a Vite
 * dependency) bundles them to a self-contained ES module, which is imported
 * from a data: URL so nothing is written to disk.
 */
async function loadSiteData(root: string): Promise<{ site: Site; projects: Project[] }> {
  const bundled = await build({
    stdin: {
      contents: [
        "export { site } from './src/data/site'",
        "export { projects } from './src/data/projects'",
      ].join('\n'),
      resolveDir: root,
      sourcefile: 'static-fallback-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node20',
  })

  const code = bundled.outputFiles[0].text
  return await import(`data:text/javascript,${encodeURIComponent(code)}`)
}

const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** github.com/SeanJoudrie/Curio — a URL a person can read out loud. */
const urlLabel = (url: string) => esc(url.replace(/^https?:\/\//, '').replace(/\/$/, ''))

const link = (href: string, label: string) => `<a href="${esc(href)}">${label}</a>`

function render(site: Site, projects: Project[]) {
  const profile = [
    link(`mailto:${site.email}`, esc(site.email)),
    site.hasResume ? link(site.resumeUrl, 'Résumé (PDF)') : '',
    link(site.github, 'GitHub'),
    site.linkedin ? link(site.linkedin, 'LinkedIn') : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return `
<div class="sf" data-static-fallback>
  <noscript>
    <p class="sf-note">This portfolio is an interactive app and needs JavaScript. Below is the same site in plain text.</p>
  </noscript>

  <header>
    <p class="sf-kicker">${esc(site.tagline)} · ${esc(site.location)} · ${esc(site.availability)}</p>
    <h1>${esc(site.name)}</h1>
    <p class="sf-lead">${esc(site.headline)}</p>
    <p>${esc(site.intro)}</p>
    <p class="sf-meta">${esc(site.seeking)}</p>
    <p class="sf-links">${profile}</p>
  </header>

  <h2>Selected work</h2>
  ${projects.map(renderProject).join('\n  ')}

  <h2>About</h2>
  ${site.bio.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('\n  ')}

  <h2>Contact</h2>
  <p>${esc(site.contactBlurb)}</p>
  <p class="sf-links">${profile}</p>
  <p class="sf-meta">${esc(site.location)} · ${esc(site.availability)}</p>

  <p class="sf-note">${esc(site.name)} — ${esc(site.tagline)}. The interactive version of this site requires JavaScript.</p>
</div>`
}

function renderProject(project: Project) {
  const links = [
    project.liveUrl ? link(project.liveUrl, `Live: ${urlLabel(project.liveUrl)}`) : '',
    project.repoUrl ? link(project.repoUrl, `Source: ${urlLabel(project.repoUrl)}`) : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const facts = project.facts?.length
    ? `<ul class="sf-facts">${project.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
    : ''

  return `<article class="sf-project">
    <h3>${esc(project.name)} <span class="sf-status">${esc(project.status)}</span></h3>
    <p class="sf-hook">${esc(project.hook)}</p>
    <p>${esc(project.description)}</p>
    ${facts}
    <p class="sf-meta">${esc(project.role)} · ${esc(project.stack.join(', '))}</p>
    ${links ? `<p class="sf-links">${links}</p>` : ''}
    <p class="sf-case"><strong>Problem</strong> ${esc(project.caseStudy.problem)}</p>
    <p class="sf-case"><strong>Built</strong> ${esc(project.caseStudy.built)}</p>
    <p class="sf-case"><strong>Outcome</strong> ${esc(project.caseStudy.outcome)}</p>
  </article>`
}

/**
 * Self-contained styles, inlined so the fallback is legible before (or
 * without) the CSS bundle. Theme variables are used where they exist so the
 * fallback reads as this site loading rather than as a broken page.
 */
const STYLE = `
.sf{max-width:44rem;margin:0 auto;padding:3.5rem 1.25rem 4rem;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:1rem;line-height:1.65;color:var(--color-ink-2,#5c5340)}
.sf h1,.sf h2,.sf h3{font-family:Fraunces,"Iowan Old Style",Georgia,serif;font-weight:600;color:var(--color-ink,#211b12);letter-spacing:-.015em}
.sf h1{margin:.6rem 0 0;font-size:clamp(2.4rem,9vw,3.4rem);line-height:1.05}
.sf h2{margin:3.5rem 0 0;padding-top:1.25rem;border-top:1px solid var(--color-line,#d7ccb4);font-size:1.5rem}
.sf h3{margin:2.5rem 0 .35rem;font-size:1.2rem}
.sf p{margin:.7rem 0}
.sf a{color:inherit;text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--color-line,#d7ccb4)}
.sf-kicker{margin:0;font-size:.72rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--color-faint,#857b63)}
.sf-lead{margin-top:1.25rem;font-size:1.3rem;line-height:1.4;color:var(--color-ink,#211b12)}
.sf-hook{color:var(--color-ink,#211b12)}
.sf-meta,.sf-note{font-size:.85rem;color:var(--color-faint,#857b63)}
.sf-note{margin-top:3rem}
.sf-links{font-size:.9rem}
.sf-status{font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--color-faint,#857b63);font-family:Inter,ui-sans-serif,system-ui,sans-serif}
.sf-facts{display:flex;flex-wrap:wrap;gap:.4rem;margin:.7rem 0;padding:0;list-style:none;font-size:.78rem;color:var(--color-faint,#857b63)}
.sf-facts li{padding:.1rem .6rem;border:1px solid var(--color-line,#d7ccb4);border-radius:999px}
.sf-case{font-size:.92rem}
.sf-case strong{display:block;font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--color-faint,#857b63)}
`
