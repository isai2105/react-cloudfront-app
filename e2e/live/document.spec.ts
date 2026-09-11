import { expectedCsp, normalizeCsp } from '../support/csp'
import { expect, test } from './fixtures'

// DEPLOY_CONTRACT §4.2: the document and every rewritten deep link come back
// under the document behaviour's headers — never cached, always the policy.

test('the root document is served fresh, under the policy in csp.txt', async ({ request }) => {
  const response = await request.get('/')
  expect(response.status()).toBe(200)

  const headers = response.headers()
  expect(headers['content-type']).toContain('text/html')
  expect(headers['cache-control']).toContain('no-cache')
  expect(normalizeCsp(headers['content-security-policy'] ?? '')).toBe(expectedCsp)
})

test('a deep link is rewritten to the document with the same headers', async ({ request }) => {
  // No router exists yet, so the path is synthetic: the assertion is about
  // the edge rewrite, which does not know or care what routes the app has.
  const response = await request.get('/e2e/deep-link')
  expect(response.status()).toBe(200)

  const headers = response.headers()
  expect(headers['content-type']).toContain('text/html')
  expect(headers['cache-control']).toContain('no-cache')
  expect(normalizeCsp(headers['content-security-policy'] ?? '')).toBe(expectedCsp)
})

test('a route whose last segment contains a dot is not rewritten', async ({ request }) => {
  // The residual §4.2 leaves to this repository: the edge reads `jane.doe`
  // as a file name, so such a route reaches the viewer as the origin's 403.
  // Routes must never end in a dotted segment; this pins the reason.
  const response = await request.get('/users/jane.doe')
  expect(response.status()).toBe(403)
})

test('renders the application, not the placeholder', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Most state bugs are placement bugs.',
  )
})
