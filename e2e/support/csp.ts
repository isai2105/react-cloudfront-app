import { readFileSync } from 'node:fs'

import { normalizeCsp } from '../../scripts/lib/csp.mjs'

// The policy this app is built against: csp.txt at the repo root, the same
// file vite.config.ts serves from `vite preview` and scripts/check-csp.mjs
// compares against the live header before a deploy.
export const expectedCsp = normalizeCsp(
  readFileSync(new URL('../../csp.txt', import.meta.url), 'utf8'),
)

export { normalizeCsp }
