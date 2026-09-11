// Asserts `dist/` against the deploy contract (DEPLOY_CONTRACT.md in
// terraform-aws-static-site) so a build that the distribution's CSP would
// refuse fails in CI, not after a green deploy. Runs after `pnpm build`.
//
// Every check runs and every failure is reported; the exit code is 1 if any
// failed. No dependencies: the HTML is small and shaped by Vite, so a tag
// scanner is enough and an HTML parser would be one more thing to trust.

import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const CSP_TEXT_TYPES = ['html', 'css', 'js']

// Vite's default `assets/[name]-[hash][extname]`: the hash is 8 base64url
// characters (rollup's default `hashCharacters: 'base64'`, length 8). Source:
// vite `build.rollupOptions.output.assetFileNames` defaults, checked against
// the emitted `dist/assets/` of this repo.
const HASHED_ASSET = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/
const COMMIT_SHA = /^[0-9a-f]{40}$/

// Every start tag in the document, with its raw attribute string.
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}(\\s[^>]*)?>`, 'gi'))].map((m) => m[1] ?? '')
}

function hasAttribute(attrs, name) {
  return new RegExp(`(^|\\s)${name}(\\s*=|\\s|$)`, 'i').test(attrs)
}

// Vite emits double quotes; single quotes are accepted so a hand-edited or
// plugin-emitted tag cannot slip past the check on a quoting detail.
function attributeValue(attrs, name) {
  const m = attrs.match(new RegExp(`(^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return m?.[2] ?? m?.[3]
}

// Same-origin means a root-relative path: no scheme, not protocol-relative.
// The one exception is the contract's own: img-src grants `data:` (§6), so an
// image element may carry a data:image URI — and only an image element.
function isAllowedOrigin(element, url) {
  if ((element === 'img' || element === 'source') && /^data:image\//i.test(url)) return true
  return url.startsWith('/') && !url.startsWith('//') && !/^[a-z][a-z0-9+.-]*:/i.test(url)
}

// srcset is a comma-separated list of `url [descriptor]` candidates.
function srcsetUrls(value) {
  return value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]).filter(Boolean)
}

// script-src 'self' / style-src 'self' (§6.1): no inline script, no <style>
// element, no style attribute. Vite emits none of these; a plugin that adds
// one would break the live site while passing every other check.
function noInlineScriptOrStyle(html) {
  const problems = []
  if (tags(html, 'script').some((attrs) => !hasAttribute(attrs, 'src'))) {
    problems.push('<script> without src (inline script)')
  }
  if (tags(html, 'style').length > 0) problems.push('<style> element')
  if (/<[a-z][^>]*\sstyle\s*=/i.test(html)) problems.push('style="…" attribute')
  return problems
}

// §3 / §4.1: everything under /assets/ is content-hashed and immutable; an
// unhashed name there would be cached for a year and never invalidated.
function assetsAreHashed(html) {
  const refs = [...html.matchAll(/\s(?:src|href)\s*=\s*(?:"(\/assets\/[^"]*)"|'(\/assets\/[^']*)')/gi)].map((m) => m[1] ?? m[2])
  return refs.filter((ref) => !HASHED_ASSET.test(ref)).map((ref) => `unhashed asset reference ${ref}`)
}

// §6.1 / default-src 'none': manifest-src, media-src and object-src all fall
// back to 'none', and frame-ancestors 'none' makes frames pointless. §6.2: a
// <meta> CSP can only tighten the header and silently drops frame-ancestors,
// so a stray one fights the live policy; <base> is refused by base-uri 'none'.
function noForbiddenElements(html) {
  const problems = []
  if (tags(html, 'link').some((attrs) => attributeValue(attrs, 'rel')?.toLowerCase() === 'manifest')) {
    problems.push('<link rel="manifest">')
  }
  if (tags(html, 'meta').some((attrs) => attributeValue(attrs, 'http-equiv')?.toLowerCase() === 'content-security-policy')) {
    problems.push('<meta http-equiv="Content-Security-Policy">')
  }
  for (const name of ['base', 'video', 'audio', 'object', 'embed', 'iframe']) {
    if (tags(html, name).length > 0) problems.push(`<${name}> element`)
  }
  return problems
}

// §6.1 / default-src 'none': every script, stylesheet, font, image and frame
// must come from this distribution. <a href> is navigation, not a fetch, and
// is exempt.
function noRemoteOrigins(html) {
  const problems = []
  for (const name of ['script', 'link', 'img', 'source']) {
    for (const attrs of tags(html, name)) {
      for (const attr of ['src', 'href', 'srcset']) {
        const value = attributeValue(attrs, attr)
        if (value === undefined) continue
        for (const url of attr === 'srcset' ? srcsetUrls(value) : [value]) {
          if (!isAllowedOrigin(name, url)) problems.push(`<${name} ${attr}="${url}"> is not same-origin`)
        }
      }
    }
  }
  return problems
}

// §6: `data:` is granted to img-src only. A data: font, stylesheet or script
// would pass the build and be refused by the browser. `assetsInlineLimit: 0`
// is what prevents it; this is the assertion that it still does. Scanning .js
// means a string literal "data:font/…" in app code fails the build too — that
// is intended, since such a string only exists to be used as a URL.
async function noDataUrisOutsideImages(files) {
  const problems = []
  for (const file of files) {
    const text = await readFile(file, 'utf8')
    const hits = new Set([...text.matchAll(/data:(font\/[\w+.-]+|text\/css|application\/javascript|text\/javascript)/gi)].map((m) => m[1]))
    for (const type of hits) problems.push(`${relative(DIST, file)} contains a data:${type} URI`)
  }
  return problems
}

// §3 / §4.3: the stamp is what proves *which* build is live.
async function buildInfoIsStamped() {
  let info
  try {
    info = JSON.parse(await readFile(join(DIST, 'build-info.json'), 'utf8'))
  } catch (error) {
    return [`build-info.json unreadable: ${error instanceof Error ? error.message : String(error)}`]
  }
  const problems = []
  if (!COMMIT_SHA.test(info.sha)) problems.push(`build-info.json sha is not a 40-hex commit id: ${JSON.stringify(info.sha)}`)
  if (typeof info.builtAt !== 'string' || Number.isNaN(Date.parse(info.builtAt))) {
    problems.push(`build-info.json builtAt is not an ISO-8601 date: ${JSON.stringify(info.builtAt)}`)
  }
  return problems
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])))
  return nested.flat()
}

let html
try {
  html = await readFile(join(DIST, 'index.html'), 'utf8')
} catch {
  console.error('FAIL dist/index.html is missing — run `pnpm build` first')
  process.exit(1)
}
const textFiles = (await walk(DIST)).filter((f) => CSP_TEXT_TYPES.includes(extname(f).slice(1)))

const checks = [
  ['no inline script or style', noInlineScriptOrStyle(html)],
  ['every /assets/ reference is content-hashed', assetsAreHashed(html)],
  ['no manifest, meta-CSP, base, media, object or frame elements', noForbiddenElements(html)],
  ['every script, stylesheet, font, image and frame is same-origin', noRemoteOrigins(html)],
  ['no data: URIs outside img-src', await noDataUrisOutsideImages(textFiles)],
  ['build-info.json is stamped', await buildInfoIsStamped()],
]

let failed = 0
for (const [name, problems] of checks) {
  if (problems.length === 0) {
    console.log(`ok   ${name}`)
  } else {
    failed += 1
    console.log(`FAIL ${name}`)
    for (const problem of problems) console.log(`     - ${problem}`)
  }
}
console.log(failed === 0 ? `\n${checks.length} checks passed` : `\n${failed} of ${checks.length} checks failed`)
process.exit(failed === 0 ? 0 : 1)
