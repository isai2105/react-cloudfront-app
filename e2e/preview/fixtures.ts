import { expect, test as base } from '@playwright/test'

// Every preview test runs under the live CSP header (vite.config.ts
// `preview.headers`) and fails if the page violates it, logs an error, or
// throws. That is the check DEPLOY_CONTRACT §6.1 leaves to this repository:
// the header comparison proves what the distribution serves; this proves
// the build complies with it — before a deploy, not after.

export type CspViolation = {
  violatedDirective: string
  blockedURI: string
  sourceFile: string
  lineNumber: number
}

type Fixtures = {
  /** Every `securitypolicyviolation` the page reported, in order. */
  cspViolations: CspViolation[]
  /**
   * Opt out of the "no violations, no console errors" assertion for a test
   * that provokes a violation on purpose (csp-fixture.spec.ts uses it to
   * prove the fixture is not vacuous).
   */
  cspViolationsExpected: boolean
}

declare global {
  interface Window {
    playwrightReportCspViolation?: (violation: CspViolation) => void
  }
}

export const test = base.extend<Fixtures>({
  cspViolationsExpected: [false, { option: true }],

  cspViolations: [
    async ({ page, cspViolationsExpected }, use) => {
      const violations: CspViolation[] = []
      const consoleErrors: string[] = []
      const pageErrors: string[] = []

      // The browser side calls back into Node for each violation, so the
      // list survives navigations and needs no evaluate() at teardown.
      await page.exposeFunction('playwrightReportCspViolation', (violation: CspViolation) => {
        violations.push(violation)
      })
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          window.playwrightReportCspViolation?.({
            violatedDirective: event.violatedDirective,
            blockedURI: event.blockedURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber,
          })
        })
      })
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('pageerror', (error) => {
        pageErrors.push(error.message)
      })

      await use(violations)

      // Opting out only excuses the violations themselves (and the console
      // line Chromium logs for each refusal); an exception or any other
      // console error in that test still fails it.
      if (!cspViolationsExpected) {
        expect(violations, 'Content-Security-Policy violations').toEqual([])
      }
      const unexpectedConsoleErrors = cspViolationsExpected
        ? consoleErrors.filter((text) => !/Content Security Policy/.test(text))
        : consoleErrors
      expect(unexpectedConsoleErrors, 'console.error output').toEqual([])
      expect(pageErrors, 'uncaught exceptions').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
