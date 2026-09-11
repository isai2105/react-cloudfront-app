// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { assetReferences } from './assets.mjs'

describe('assetReferences', () => {
  it('reads both src and href, in document order, deduplicated', () => {
    const html = `
      <script type="module" crossorigin src="/assets/index-BqZ7x1Yk.js"></script>
      <link rel="modulepreload" crossorigin href="/assets/vendor-Cd3fGh9J.js">
      <link rel="stylesheet" crossorigin href="/assets/index-DkL2mN0p.css">
      <link rel="modulepreload" crossorigin href="/assets/vendor-Cd3fGh9J.js">`
    expect(assetReferences(html)).toEqual([
      '/assets/index-BqZ7x1Yk.js',
      '/assets/vendor-Cd3fGh9J.js',
      '/assets/index-DkL2mN0p.css',
    ])
  })

  it('ignores references outside /assets/ and accepts single quotes', () => {
    const html = `<link rel="icon" href="/favicon.svg"><script src='/assets/a-12345678.js'></script>`
    expect(assetReferences(html)).toEqual(['/assets/a-12345678.js'])
  })

  it('is empty for a document with no assets', () => {
    expect(assetReferences('<html><body></body></html>')).toEqual([])
  })
})
