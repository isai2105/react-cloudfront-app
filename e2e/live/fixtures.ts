import { expect, test as base } from '@playwright/test'

// The live suite addresses a deployed distribution and nothing else: no
// server is started, no credentials are read. Without PLAYWRIGHT_BASE_URL
// there is nothing to test, so every test skips with the reason rather than
// failing — `pnpm exec playwright test` on a laptop with no environment
// applied stays green and says why.
export const test = base.extend<{ siteUrl: string }>({
  siteUrl: [
    async ({ baseURL }, use, testInfo) => {
      testInfo.skip(
        baseURL === undefined,
        'PLAYWRIGHT_BASE_URL is not set: the live suite needs a deployed environment',
      )
      await use(baseURL ?? '')
    },
    { auto: true },
  ],
})

export { expect }
