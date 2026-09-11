import { defineConfig } from '@playwright/test'

import { isCI, shared } from './e2e/support/playwright.shared'

// The live suite (plan §5.2): a deployed distribution, addressed by
// PLAYWRIGHT_BASE_URL — run after a deploy (e2e-live.yml), never on a PR.
// No webServer and no build: this file must work in a checkout that has
// never run `pnpm build`.

export default defineConfig({
  ...shared,
  testDir: 'e2e/live',
  // One retry against a CDN edge, and only in CI: a cold edge or a
  // still-propagating invalidation is transient; a wrong header is not,
  // and fails twice.
  retries: isCI ? 1 : 0,
  use: { ...shared.use, baseURL: process.env.PLAYWRIGHT_BASE_URL },
})
