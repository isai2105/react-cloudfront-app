// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { normalizeCsp, parseCsp } from './csp.mjs'

describe('normalizeCsp', () => {
  it('leaves an already canonical policy unchanged', () => {
    const canonical = "default-src 'none'; img-src 'self' data:; script-src 'self'"
    expect(normalizeCsp(canonical)).toBe(canonical)
  })

  it('treats directive order, source order and whitespace as irrelevant', () => {
    const a = "script-src 'self';  img-src data: 'self' ;default-src 'none'"
    const b = "default-src 'none'; img-src 'self' data:; script-src 'self'"
    expect(normalizeCsp(a)).toBe(normalizeCsp(b))
  })

  it('lowercases directive names but not source expressions', () => {
    expect(normalizeCsp("Script-Src 'nonce-AbC='")).toBe("script-src 'nonce-AbC='")
  })

  it('keeps the first occurrence of a repeated directive, as browsers do', () => {
    expect(normalizeCsp("script-src 'self'; script-src 'unsafe-inline'")).toBe("script-src 'self'")
  })

  it('treats a changed source expression as a different policy', () => {
    expect(normalizeCsp("script-src 'self'")).not.toBe(normalizeCsp("script-src 'self' https:"))
  })

  it('ignores empty directives left by a trailing semicolon', () => {
    expect(normalizeCsp("frame-ancestors 'none';")).toBe("frame-ancestors 'none'")
  })
})

describe('parseCsp', () => {
  it('maps a directive with no sources to an empty list', () => {
    expect(parseCsp('upgrade-insecure-requests').get('upgrade-insecure-requests')).toEqual([])
  })
})
