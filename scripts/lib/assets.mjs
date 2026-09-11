// The `/assets/` references a built index.html makes, shared by the dist
// audit (scripts/check-dist.mjs) and the post-deploy check
// (scripts/verify-deploy.mjs), so the two agree on what "every asset the
// document references" means.
//
// Both `src` and `href` are read: Vite emits `<script type="module" src>`,
// `<link rel="modulepreload" href>` and `<link rel="stylesheet" href>`, and
// DEPLOY_CONTRACT §4.2 asks that each of them is fetched after a deploy. No
// HTML parser, for the reason check-dist.mjs gives: the document is small
// and Vite-shaped, and a tag scanner is one fewer thing to trust.

/**
 * Every distinct `/assets/…` URL referenced by a `src` or `href` attribute,
 * in document order. Single quotes are accepted alongside Vite's double
 * quotes so a hand-edited or plugin-emitted tag is still seen.
 *
 * @param {string} html
 * @returns {string[]}
 */
export function assetReferences(html) {
  const refs = [
    ...html.matchAll(/\s(?:src|href)\s*=\s*(?:"(\/assets\/[^"]*)"|'(\/assets\/[^']*)')/gi),
  ].map((m) => m[1] ?? m[2] ?? '')
  return [...new Set(refs)]
}
