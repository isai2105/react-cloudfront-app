import { expect, test } from './fixtures'

// DEPLOY_CONTRACT §4.3: `GET / → 200` proves the distribution works, not
// that this build is the one live. The stamp is what proves that.
test('build-info.json names the commit that is live', async ({ request }) => {
  const response = await request.get('/build-info.json')
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toContain('no-cache')

  const body: unknown = await response.json()
  expect(body).toMatchObject({ sha: expect.stringMatching(/^[0-9a-f]{40}$/) })

  // Set by deploy.yml from the artefact it just promoted; a person running
  // the suite by hand may leave it unset and gets the shape check only.
  const expected = process.env.EXPECTED_SHA
  if (expected !== undefined) {
    expect(body).toMatchObject({ sha: expected })
  }
})
