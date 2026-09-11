import { expect, test } from './fixtures'

// A fixture that could never fail proves nothing. This test provokes the
// violation the others must never produce and checks it was caught, so a
// green preview suite means "no violations", not "no listener".
test.use({ cspViolationsExpected: true })

test('the fixture records an inline style the policy refuses', async ({ page, cspViolations }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const style = document.createElement('style')
    style.textContent = 'body { outline: 1px solid red }'
    document.head.append(style)
  })

  await expect
    .poll(() => cspViolations.map((v) => v.violatedDirective), {
      message: 'violatedDirective of each recorded violation',
    })
    .toEqual(['style-src-elem'])
  expect(cspViolations[0]?.blockedURI).toBe('inline')
})
