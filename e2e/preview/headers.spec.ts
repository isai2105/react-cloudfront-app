import { expectedCsp, normalizeCsp } from '../support/csp'
import { expect, test } from './fixtures'

// `vite preview` is configured to send the distribution's exact policy; if
// this drifts, every other preview test is running under the wrong rules.
test('the document is served with the policy in csp.txt', async ({ request }) => {
  const response = await request.get('/')
  expect(response.status()).toBe(200)

  const header = response.headers()['content-security-policy']
  expect(header, 'content-security-policy header').toBeDefined()
  expect(normalizeCsp(header ?? '')).toBe(expectedCsp)
})

// DEPLOY_CONTRACT §3, §4.1: the build stamp lives at the root, unhashed, and
// is what the deploy compares to decide which build is live.
test('build-info.json is served at the root with a commit sha', async ({ request }) => {
  const response = await request.get('/build-info.json')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/json')

  const body: unknown = await response.json()
  expect(body).toMatchObject({
    sha: expect.stringMatching(/^[0-9a-f]{40}$/),
    builtAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
  })
})
