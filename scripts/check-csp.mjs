// The pre-deploy CSP gate (DEPLOY_CONTRACT.md §6.3): fetch the live
// `content-security-policy` header from SITE_URL and refuse to deploy unless
// it matches csp.txt. Runs in deploy.yml after discovery and before the first
// upload, so a policy edited in terraform-aws-static-site that has not been
// mirrored here stops the deploy with the directive named — rather than
// letting a build tested against one policy go live under another.
//
// Both sides are normalised per CSP3 §2.2.1 (scripts/lib/csp.mjs): a
// reordering in policies.tf is not drift, a changed source expression is.
//
// The header is read off `GET /`. Both response headers policies are rendered
// from one map in the module, so the document's header describes `/assets/*`
// too (§6.3 records the one way that could silently stop being true).
//
// Usage: SITE_URL=https://example.cloudfront.net node scripts/check-csp.mjs

import { readFile } from 'node:fs/promises'

import { diffCsp, normalizeCsp } from './lib/csp.mjs'

const CSP_FILE = new URL('../csp.txt', import.meta.url)
const TIMEOUT_MS = 15_000

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`check-csp: ${message}`)
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

const url = siteUrl()
const expected = normalizeCsp(await readFile(CSP_FILE, 'utf8'))

/** @type {Response} */
let response
try {
  // No redirect following: §4.2 says `/` answers 200 itself, and a redirect's
  // headers are the redirect's, not the document's. Nothing is done about
  // caching, because nothing needs to be: the header comes from a response
  // headers policy that CloudFront applies to every response, cached or not
  // (§6), so a stale edge cannot serve a stale policy.
  response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
} catch (error) {
  fail(`GET ${url.href} failed: ${error instanceof Error ? error.message : String(error)}`)
}

if (response.status !== 200) {
  fail(`GET ${url.href} returned ${response.status}, expected 200`)
}

const header = response.headers.get('content-security-policy')
if (header === null) fail(`GET ${url.href} carried no content-security-policy header`)

const live = normalizeCsp(header)
if (live === expected) {
  console.log(`check-csp: live policy at ${url.origin} matches csp.txt`)
  process.exit(0)
}

console.error(`check-csp: live policy at ${url.origin} does not match csp.txt`)
console.error('')
for (const line of diffCsp(expected, live)) console.error(`  ${line}`)
console.error('')
console.error(`  expected: ${expected}`)
console.error(`  live:     ${live}`)
console.error('')
console.error('The policy is owned by terraform-aws-static-site (modules/static-site/policies.tf);')
console.error('csp.txt here must match it before anything is uploaded (DEPLOY_CONTRACT §6.3).')
process.exit(1)
