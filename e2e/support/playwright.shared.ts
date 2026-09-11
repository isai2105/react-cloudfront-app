import type { PlaywrightTestConfig } from '@playwright/test'

// Options common to both Playwright configs (playwright.config.ts for the
// preview suite, playwright.live.config.ts for the live one). Two files
// rather than two projects in one because `webServer` is global to a config:
// the live suite must run with no build present and must not start a
// server, and a config that starts one conditionally has to sniff argv,
// which Playwright's worker processes do not preserve.
//
// Chromium only: what these suites assert — CSP compliance, response
// headers, the demos behaving — is not browser-specific, so a wider matrix
// would cost minutes without adding signal.

export const isCI = process.env.CI !== undefined

export const shared = {
  fullyParallel: true,
  // A leftover `test.only` would silently shrink the suite in CI.
  forbidOnly: isCI,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    browserName: 'chromium',
    trace: 'on-first-retry',
  },
} satisfies PlaywrightTestConfig
