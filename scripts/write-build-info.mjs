// Stamps the commit under build into `public/build-info.json`. Runs as the
// `prebuild` script, so every build — CI, local, PR — carries a stamp.
//
// Why `public/`: Vite copies that directory into `dist/` verbatim, so the file
// lands at `dist/build-info.json` — unhashed, at the root — which is where the
// deploy contract expects it (DEPLOY_CONTRACT.md §3: "the commit SHA stamped
// inside the artefact"; §4.1 syncs and invalidates `/build-info.json` as a
// mutable object alongside `index.html`). It is git-ignored because it is
// build output that merely happens to be staged in `public/`.
//
// Why every build: `scripts/check-dist.mjs` asserts the stamp unconditionally,
// and the stamp is what proves *which* build is live (§4.3) — this repo's
// deploy compares the live `/build-info.json` to the one in the promoted
// artefact, so a build without a stamp is not deployable.
//
// The two contract fields are `sha` and `builtAt`, exactly. `dirty` is an
// addition for humans: a local build from a modified tree is stamped with the
// commit it *started from*, and the flag says so. Untracked files count as
// dirty (that is `git status --porcelain`'s reading, and the intended one).
// In CI it is always `false`.

import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'

const SHA_PATTERN = /^[0-9a-f]{40}$/
const OUTPUT = new URL('../public/build-info.json', import.meta.url)

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

// CI sets GITHUB_SHA. A value that is set but malformed is a pipeline bug and
// must fail rather than silently fall back to whatever HEAD the runner has.
function resolveSha() {
  const fromEnv = process.env.GITHUB_SHA
  if (fromEnv !== undefined) {
    if (!SHA_PATTERN.test(fromEnv)) {
      throw new Error(`GITHUB_SHA is set but is not a 40-hex commit id: "${fromEnv}"`)
    }
    return { sha: fromEnv, dirty: false }
  }
  const sha = git('rev-parse', 'HEAD')
  if (!SHA_PATTERN.test(sha)) {
    throw new Error(`git rev-parse HEAD did not return a 40-hex commit id: "${sha}"`)
  }
  return { sha, dirty: git('status', '--porcelain') !== '' }
}

try {
  const { sha, dirty } = resolveSha()
  const info = { sha, builtAt: new Date().toISOString(), dirty }
  await writeFile(OUTPUT, `${JSON.stringify(info, null, 2)}\n`)
  console.log(`build-info: ${sha}${dirty ? ' (dirty working tree)' : ''}`)
} catch (error) {
  console.error(`write-build-info: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
