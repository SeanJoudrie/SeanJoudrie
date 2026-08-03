import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initAnalytics } from './lib/analytics'
import './index.css'

const container = document.getElementById('root')!

// #root ships with a static, crawlable text version of the site inside it
// (see plugins/static-fallback.ts) so the page is readable without JavaScript.
// Drop it before React takes over the container.
container.replaceChildren()

// No-op until site.analyticsId is set, and never reports from localhost.
initAnalytics()

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
