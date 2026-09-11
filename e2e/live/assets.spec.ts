import { expect, test } from './fixtures'

test('a hashed asset is served immutable for a year', async ({ request }) => {
  // Discover a real asset from the served document rather than the local
  // build: the suite may run against a deploy of any commit.
  const html = await (await request.get('/')).text()
  const asset = /(?:src|href)="(\/assets\/[^"]+)"/.exec(html)?.[1]
  expect(asset, 'an /assets/ reference in the served index.html').toBeDefined()

  const response = await request.get(asset ?? '')
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toBe('public, max-age=31536000, immutable')
})

test('a missing asset is refused with 403, never 404', async ({ request }) => {
  // DEPLOY_CONTRACT §4.2: the origin may not enumerate the bucket, so a
  // missing key is a 403. A 404 would mean it has started disclosing key
  // existence; a 200 would mean the old 403→index.html mapping is back and
  // a missing chunk is being served as HTML. Only the status is asserted —
  // whether headers survive the forwarded 403 is an open question in the
  // contract, in both directions.
  const response = await request.get('/assets/does-not-exist-00000000.js')
  expect(response.status()).toBe(403)
})
