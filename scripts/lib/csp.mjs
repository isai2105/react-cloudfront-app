// Content-Security-Policy normalisation, shared by the Playwright suites
// (e2e/) and the pre-deploy header check (scripts/check-csp.mjs).
//
// Two serialisations of the same policy can differ in directive order, source
// order, whitespace and directive-name case without meaning anything
// different (CSP3 §2.2.1: names are ASCII case-insensitive; a repeated
// directive is ignored after its first occurrence). Comparing the normalised
// forms means a reordering in policies.tf is not a failure and a changed
// source expression is — which is what DEPLOY_CONTRACT §6.3 asks for.
//
// Source expressions are deliberately *not* lowercased: keywords and hosts are
// case-insensitive, but nonce and hash values are base64 and are not.

/**
 * Parse a serialised policy into a map of directive name → source list,
 * keeping the first occurrence of a repeated directive.
 *
 * @param {string} policy
 * @returns {Map<string, string[]>}
 */
export function parseCsp(policy) {
  /** @type {Map<string, string[]>} */
  const directives = new Map()
  for (const token of policy.split(';')) {
    const [name, ...sources] = token.trim().split(/\s+/).filter(Boolean)
    if (name === undefined) continue
    const key = name.toLowerCase()
    if (!directives.has(key)) directives.set(key, [...sources].sort())
  }
  return directives
}

/**
 * Canonical serialisation: directives sorted by name, sources sorted, single
 * spaces, `; ` between directives. Equal policies normalise to equal strings.
 *
 * @param {string} policy
 * @returns {string}
 */
export function normalizeCsp(policy) {
  return [...parseCsp(policy)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, sources]) => [name, ...sources].join(' '))
    .join('; ')
}
