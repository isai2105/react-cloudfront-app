import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Everything this app ships has to satisfy the distribution's CSP (csp.txt)
// with no inline script or style: Geist is bundled from @fontsource as local
// .woff2 files served from 'self'; `motion` animates via CSSOM property
// assignment and the Web Animations API, neither of which `style-src` governs
// (unlike a <style> element or a `style=""` attribute); there is no CSS-in-JS
// runtime and no remote asset.
// The e2e/preview suite runs the built bundle under that header to prove it.

const root = document.getElementById('root')
if (root === null) {
  throw new Error('index.html has no #root element to mount into')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
