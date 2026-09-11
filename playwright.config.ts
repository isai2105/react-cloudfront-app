import { existsSync } from 'node:fs'

import { defineConfig } from '@playwright/test'

import { isCI, shared } from './e2e/support/playwright.shared'

// The preview suite (plan §5.1): the built bundle served by `vite preview`
// under the live CSP header, on every PR, with no infrastructure at all.
// The live suite has its own config, playwright.live.config.ts.

const previewUrl = 'http://localhost:4173'

// `vite preview` serves dist/ as-is; a missing build would otherwise surface
// as Playwright's generic "webServer was not able to start".
if (!existsSync('dist/index.html')) {
  throw new Error('dist/index.html is missing: run `pnpm build` before the preview suite')
}

export default defineConfig({
  ...shared,
  testDir: 'e2e/preview',
  // Deterministic target: a retry here would only hide a real failure.
  retries: 0,
  use: { ...shared.use, baseURL: previewUrl },
  webServer: {
    command: 'pnpm preview --port 4173 --strictPort',
    url: previewUrl,
    reuseExistingServer: !isCI,
  },
})
