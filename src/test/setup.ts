// Runs before every unit-test file (vite.config.ts → test.setupFiles).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Testing Library only auto-registers this when `afterEach` is a global;
// with `globals: false` it is wired here so no test leaks DOM into the next.
afterEach(cleanup)

// jsdom has no IntersectionObserver, and `motion`'s `whileInView` throws
// without one. A no-op observer leaves every Reveal in its initial state,
// which is fine: unit tests assert content and behaviour, and the enter
// animation itself is covered by e2e/preview in a real browser.
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  },
)
