import { readFileSync } from 'node:fs'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The exact Content-Security-Policy the distribution serves. Source of truth is
// `local.csp` in terraform-aws-static-site/modules/static-site/policies.tf;
// this copy exists so `vite preview` serves the same header and a violation
// shows up locally instead of after a deploy.
const csp = readFileSync(new URL('./csp.txt', import.meta.url), 'utf8').trim()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    headers: { 'Content-Security-Policy': csp },
  },
  build: {
    // The distribution's CSP grants `data:` to img-src only. Vite would inline
    // any asset under 4 KiB as a data: URI, which for a small font file means
    // `font-src 'self'` refuses it after a green deploy. Emit every asset as a
    // hashed file under /assets instead.
    assetsInlineLimit: 0,
  },
  // Vitest reads this same file (`defineConfig` from vitest/config is Vite's
  // plus a `test` key), so the unit tests see the plugins and resolution the
  // app is built with and there is no second config to keep in step.
  test: {
    // Explicit `import { it, expect } from 'vitest'` in every test: no ambient
    // globals to declare in tsconfig, and a test file reads like any module.
    // The one cost is Testing Library's auto-cleanup, which needs a global
    // `afterEach`; src/test/setup.ts registers it by hand.
    globals: false,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    // Unit tests are colocated with what they test; Playwright specs under
    // e2e/ are `*.spec.ts` and run through playwright.config.ts, never here.
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'scripts/lib/**'],
      exclude: ['src/test/**', 'src/main.tsx'],
      reporter: ['text', 'html'],
    },
  },
})
