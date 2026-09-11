import { readFileSync } from 'node:fs'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
})
