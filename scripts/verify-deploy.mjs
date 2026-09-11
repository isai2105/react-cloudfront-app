// The post-deploy verification (DEPLOY_CONTRACT.md §4.2 and §4.3): after the
// sync and the invalidation, prove that what the distribution serves is the
// build that was just promoted. Runs in deploy.yml as the last step of the
// deploy job; the job is not allowed to pass without it.
//
// Three assertions, against SITE_URL:
//
//   1. `GET /` returns 200 — the minimum in §4.2;
//   2. every `/assets/…` the returned document references returns 200 — the
//      assertion that falsifies "the sync landed in the wrong prefix" and
//      "the document references a chunk that was never uploaded";
//   3. `/build-info.json` returns 200 and its `sha` equals the one in the
//      artifact that was uploaded — §4.3's point that `GET / → 200` proves
//      the distribution works, not that this build is live, because the
//      module seeds a placeholder document.
//
// The comparison is against DIST_DIR/build-info.json — the downloaded
// artifact — and never against the deploying commit: a deploy promotes an
// older `main` build on purpose (a rollback is a redeploy by `run_id`), and
// the stamp inside the artifact is the only statement of what was promoted.
//
// Usage: SITE_URL=https://example.cloudfront.net DIST_DIR=dist node scripts/verify-deploy.mjs

import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { assetReferences } from './lib/assets.mjs'

const TIMEOUT_MS = 15_000
const COMMIT_SHA = /^[0-9a-f]{40}$/

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`verify-deploy: ${message}`)
  process.exit(1)
}

/** @returns {URL} */
function siteUrl() {
  const raw = process.env.SITE_URL
  if (raw === undefined || raw === '') return fail('SITE_URL is not set')
  try {
    return new URL('/', raw)
  } catch {
    return fail(`SITE_URL is not a URL: "${raw}"`)
  }
}

/**
 * One request, no redirect following (a 3xx is a failure here — §4.2 wants
 * the document at `/`, not somewhere it points). Nothing is done about
 * caching: CloudFront ignores a viewer's cache-control, and freshness is the
 * deploy's job, not this script's — it runs after
 * `aws cloudfront wait invalidation-completed` (§4.1), which is what makes
 * "the edge still holds the old document" a deploy bug rather than a race.
 *
 * @param {URL} url
 * @returns {Promise<Response>}
 */
async function get(url) {
  try {
    return await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    return fail(`GET ${url.href} failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * The `sha` of a build-info.json, from the artifact on disk or from the site.
 *
 * @param {string} text
 * @param {string} source
 * @returns {string}
 */
function stampedSha(text, source) {
  /** @type {unknown} */
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return fail(`${source} is not JSON`)
  }
  const sha =
    typeof parsed === 'object' && parsed !== null
      ? /** @type {Record<string, unknown>} */ (parsed).sha
      : undefined
  if (typeof sha !== 'string' || !COMMIT_SHA.test(sha)) {
    return fail(`${source} has no 40-hex sha: ${JSON.stringify(sha)}`)
  }
  return sha
}

const site = siteUrl()
const distDir = resolve(process.env.DIST_DIR ?? 'dist')

/** @type {string} */
let promoted
try {
  promoted = stampedSha(
    await readFile(join(distDir, 'build-info.json'), 'utf8'),
    `${distDir}/build-info.json`,
  )
} catch (error) {
  fail(
    `cannot read the promoted artifact: ${error instanceof Error ? error.message : String(error)}`,
  )
}

// 1. The document.
const document = await get(site)
if (document.status !== 200) fail(`GET / returned ${document.status}, expected 200`)
console.log('ok   GET / → 200')

// 2. Every asset it references.
const assets = assetReferences(await document.text())
if (assets.length === 0) {
  // A Vite build always references at least its entry module; a document
  // with no assets is the module's placeholder, not this app.
  fail('GET / returned a document that references no /assets/ — the placeholder is still live')
}
const statuses = await Promise.all(assets.map((asset) => get(new URL(asset, site))))
/** @type {string[]} */
const missing = []
assets.forEach((asset, i) => {
  const status = statuses[i]?.status
  if (status === 200) {
    console.log(`ok   GET ${asset} → 200`)
  } else {
    console.log(`FAIL GET ${asset} → ${String(status)}`)
    missing.push(asset)
  }
})
if (missing.length > 0) {
  fail(`${missing.length} of ${assets.length} referenced assets did not return 200`)
}

// 3. The stamp.
const stamp = await get(new URL('/build-info.json', site))
if (stamp.status !== 200) fail(`GET /build-info.json returned ${stamp.status}, expected 200`)
const live = stampedSha(await stamp.text(), 'live /build-info.json')
if (live !== promoted) {
  fail(`live build-info.json sha ${live} is not the promoted artifact's ${promoted}`)
}
console.log(`ok   GET /build-info.json → 200, sha ${live} is the promoted build`)
console.log(`\nverify-deploy: ${site.origin} is serving the promoted build`)
