# react-cloudfront-app

**This repository builds and deploys a site; it owns no infrastructure and has no deploy target
of its own.** It is the companion to
[`terraform-aws-static-site`](https://github.com/isai2105/terraform-aws-static-site), which
provisions a private S3 bucket behind CloudFront, creates an OIDC identity for this repository
and destroys both with the environment. The interface between the two —
[`docs/DEPLOY_CONTRACT.md`](https://github.com/isai2105/terraform-aws-static-site/blob/main/docs/DEPLOY_CONTRACT.md)
in that repository — is the authority: role name, trust subject, SSM parameter names, the exact
four-command sync sequence and the Content-Security-Policy are all fixed there, and everything
in this tree is arranged to satisfy them. Nothing here can widen a permission, relax a header or
rename a role.

The direction is one-way. That repository names this one and never reads it; this one holds a
copy of its policy ([`csp.txt`](csp.txt)) and refuses to deploy when the live header drifts
from it.

The application itself is a single page — a React 19 walkthrough of where state belongs — and is
deliberately small: the point of the repository is the pipeline around it, which is what a
production front-end team would run day to day, with the same six workflow-hardening rules the
infrastructure repository holds itself to.

---

## Local development

**Prerequisites.** Node 24 — [`.nvmrc`](.nvmrc) picks it, `engines` in
[`package.json`](package.json) declares it and [`.npmrc`](.npmrc) makes pnpm refuse anything
older — and pnpm 10. `packageManager` pins the exact pnpm version; any pnpm 10 reads that field
and runs the pinned version itself, and `corepack enable` does the same from a bare Node install.

```bash
nvm use            # reads .nvmrc
pnpm install       # --frozen-lockfile in CI; also installs the git hooks (`prepare`)
pnpm dev           # Vite dev server with HMR
pnpm build         # tsc -b && vite build; `prebuild` stamps build-info.json first
pnpm preview       # serves dist/ on :4173 under the live CSP header
```

`pnpm preview` is not a convenience: [`vite.config.ts`](vite.config.ts) sets the
`Content-Security-Policy` response header to the string in `csp.txt`, so the built bundle is
exercised under the distribution's policy on your machine and a violation surfaces before a
deploy rather than after one.

| Script                                       | What it runs                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint` / `lint:fix`                     | oxlint, then ESLint's type-aware rules; warnings fail                                                                                                                                                   |
| `pnpm format` / `format:check`               | Prettier over the tree, with the Tailwind class-order plugin                                                                                                                                            |
| `pnpm typecheck`                             | `tsc -b --noEmit` over the app, node and e2e projects                                                                                                                                                   |
| `pnpm test` / `test:watch` / `test:coverage` | Vitest: unit and component tests under jsdom, plus the pure helpers in `scripts/lib/`                                                                                                                   |
| `pnpm e2e:preview`                           | Playwright against `vite preview` under the live CSP; needs a prior `pnpm build`                                                                                                                        |
| `pnpm e2e:live`                              | Playwright against a deployed site named by `PLAYWRIGHT_BASE_URL`; skips without it                                                                                                                     |
| `pnpm check:dist`                            | Asserts `dist/` against the deploy contract ([`scripts/check-dist.mjs`](scripts/check-dist.mjs))                                                                                                        |
| `pnpm check:csp`                             | Compares the live `content-security-policy` at `SITE_URL` with `csp.txt` ([`scripts/check-csp.mjs`](scripts/check-csp.mjs))                                                                             |
| `pnpm verify:deploy`                         | Proves the site at `SITE_URL` serves the build in `DIST_DIR` ([`scripts/verify-deploy.mjs`](scripts/verify-deploy.mjs))                                                                                 |
| `pnpm lint:workflows`                        | zizmor and actionlint over `.github/`; both are local installs (`brew install zizmor actionlint`, plus `shellcheck` for actionlint's `run:` checks) at the versions `ci.yml`'s `workflow-lint` job pins |

`check:csp` and `verify:deploy` are the two gates `deploy.yml` runs against a real distribution.
Both work against `pnpm preview` too — `SITE_URL=http://localhost:4173` — which is how they were
tested before any environment existed.

---

## What the deploy contract fixes about this app

The stack is not a preference. Each choice below is the one that satisfies a constraint in
DEPLOY_CONTRACT.md, and the constraint is named beside it.

- **Vite** (§6.1). The distribution serves a strict, hash-free CSP. Vite's production build
  extracts every stylesheet to a file and loads even async-chunk CSS through a JS-created
  `<link>`, never a `<style>` element, so the policy costs nothing. The constraint is the
  bundler's behaviour and the absence of a style runtime, not the framework.
- **`build.assetsInlineLimit: 0`** in [`vite.config.ts`](vite.config.ts). Vite's default inlines
  any asset under 4 KiB as a `data:` URI, and the live policy grants `data:` to `img-src` only —
  a small `.woff2` would ship as `data:font/woff2` and be refused by `font-src 'self'` after a
  green deploy. With `0`, every asset is a hashed file under `/assets/`, served from `'self'`.
  **The contract's `img-src 'self' data:` grant is therefore unused by this app.** It is the
  infrastructure repository's to keep or drop; this line records that nothing here relies on it,
  so nobody later "fixes" a build to depend on it.
- **Tailwind CSS v4 through `@tailwindcss/vite`**, CSS-first, with no `tailwind.config.*` and no
  `postcss.config.*`. No SCSS or Less: v4 is its own preprocessor and is not designed to sit
  behind one. Never the Play CDN and never a CSS-in-JS runtime — both inject `<style>` elements,
  which `style-src 'self'` refuses.
- **`build-info.json` at the root of `dist/`, on every build** (§3, §4.1).
  [`scripts/write-build-info.mjs`](scripts/write-build-info.mjs) runs as the `prebuild` script
  and writes `{ "sha", "builtAt", "dirty" }` to `public/`, which Vite copies verbatim. `sha` is
  `GITHUB_SHA` in CI and `git rev-parse HEAD` otherwise; the two contract fields are `sha` and
  `builtAt`. `dirty` is an addition for humans: a local build from a modified tree is stamped
  with the commit it started from, and the flag says so. A CI build is never dirty. The file is
  git-ignored — it is build output that happens to be staged in `public/`.
- **The dependencies the demo UI brings** — `motion`, `@phosphor-icons/react` and the
  `@fontsource-variable` Geist fonts — were kept because each satisfies the policy on paper
  ([`src/main.tsx`](src/main.tsx) says how) and the preview suite proves it on every pull
  request.

### Not allowed, and what forbids it

| Not allowed                                                         | Directive that refuses it                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@vitejs/plugin-legacy`                                             | `script-src 'self'` — it needs inline scripts and per-version hashes                         |
| CSS-in-JS runtimes, Tailwind Play CDN or dev-server mode            | `style-src 'self'`                                                                           |
| `fetch` / XHR / WebSocket / EventSource / beacons to another origin | `connect-src 'self'`                                                                         |
| Remote fonts, images, frames                                        | `font-src 'self'`, `img-src 'self' data:`; `frame-src` falls back to `default-src 'none'`    |
| This site inside someone else's frame                               | `frame-ancestors 'none'`                                                                     |
| A web-app manifest / PWA                                            | `manifest-src` falls back to `default-src 'none'`                                            |
| `<audio>`, `<video>`, `<object>`, `<embed>` — even same-origin      | `media-src` and `object-src` fall back to `default-src 'none'`                               |
| `<meta http-equiv="Content-Security-Policy">`                       | Policies intersect, never override (§6.2); a `<meta>` policy can only tighten                |
| A route whose last path segment contains a dot                      | Not the CSP: the edge rewrite reads `/users/jane.doe` as a file and returns the origin's 403 |

Same-origin web workers are fine — `worker-src` falls back to `script-src 'self'`.

Two things hold these rules rather than prose. [`scripts/check-dist.mjs`](scripts/check-dist.mjs)
runs after every build, in CI and locally, and fails on an inline script or style, an `/assets/`
reference without a content hash, a `data:` font, stylesheet or script, a manifest, media, object,
embed, iframe, `<meta http-equiv>` or `<base>` tag, any remote origin, or a `build-info.json`
that is missing or unstamped. The [preview suite](#tests) then runs the bundle under the header
and fails on any `securitypolicyviolation`.

### `csp.txt`

One line, byte-exact to the policy in the infrastructure repository's
[`modules/static-site/policies.tf`](https://github.com/isai2105/terraform-aws-static-site/blob/main/modules/static-site/policies.tf)
(`local.csp`), which is the source of truth. Three consumers read it: `vite.config.ts` for the
preview header, `scripts/check-csp.mjs` for the pre-deploy gate, and the Playwright suites for
their header assertions ([`e2e/support/csp.ts`](e2e/support/csp.ts)). Comparisons normalise both
sides per CSP3 §2.2.1 — names lowercased, whitespace collapsed, duplicates dropped first-wins,
directives and sources sorted — so a reordering is not drift and a changed source expression is.

Editing the policy is a two-repository change with an unavoidable window: apply it there first
and the next deploy here is refused until this file follows; land it here first and it is
refused until the apply. The window is the point — a build that was not tested against the new
policy should not reach a distribution serving it.

---

## Quality gates

**Two linters, and why.** [oxlint](.oxlintrc.json) is the fast syntactic linter — its `react`,
`typescript`, `oxc`, `import` and `jsx-a11y` plugins, with the `correctness`, `suspicious` and
`perf` categories as errors (hooks rules included). [ESLint 10](eslint.config.js) exists for the
type-aware layer only: `typescript-eslint`'s `strictTypeChecked` and `eslint-plugin-react-hooks`
(React Compiler rules on), the rules that need a `Program`. Not present on purpose:
`eslint-plugin-react`, `eslint-plugin-jsx-a11y` and `eslint-plugin-import`, whose peer ranges stop
at ESLint 9; oxlint covers those rule sets without type information. `no-explicit-any` is an
error on both sides so the rule holds whichever linter runs first, and `pnpm lint` fails on
warnings.

**Prettier** with `prettier-plugin-tailwindcss`, configured the v4 way (`tailwindStylesheet`,
plugin last). **TypeScript** with `strict`, `noUncheckedIndexedAccess` and `noImplicitOverride`
written explicitly in [`tsconfig.app.json`](tsconfig.app.json) so a future default cannot relax
them silently; the scripts under `scripts/` are type-checked as JavaScript through
[`tsconfig.node.json`](tsconfig.node.json).

**Git hooks** (Husky, installed by `pnpm install`):

| Hook         | Runs                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | [`lint-staged`](lint-staged.config.js): the same oxlint, ESLint and Prettier flags as `pnpm lint`, narrowed to the staged files |
| `commit-msg` | [`commitlint`](commitlint.config.js): Conventional Commits, `type` from the eleven below                                        |
| `pre-push`   | `pnpm typecheck && pnpm test`                                                                                                   |

**Commit convention.** Types are exactly `feat`, `fix`, `docs`, `style`, `refactor`, `test`,
`build`, `ci`, `chore`, `perf` and `revert` — the same list the `pr-title` check in
[`ci.yml`](.github/workflows/ci.yml) enforces on pull-request titles. The intended path onto
`main` is a squash merge whose subject is the PR title, so the title check is the gate and
commitlint is its shift-left copy for the subject. The repository settings that make squash the
only merge method and put a ruleset on `main` are the last step of the scaffold and are not yet
applied; until they are, the checks run but nothing requires them.

---

## Tests

- **Unit and component** — Vitest under jsdom with Testing Library, colocated with the code
  (`src/**/*.test.{ts,tsx}`); the pure helpers in [`scripts/lib/`](scripts/lib) (CSP
  normalisation and diff, asset-reference extraction) have their own tests, which is what keeps
  the deploy scripts testable without a deployment.
- **Preview suite** ([`e2e/preview/`](e2e/preview), `pnpm e2e:preview`) — Playwright starts
  `vite preview` and drives the built bundle under the live CSP header. A fixture subscribes to
  `securitypolicyviolation` and to the console; any violation or console error fails the test,
  and one spec provokes a violation on purpose to prove the fixture is not vacuous. Interaction
  smoke tests live here. This is the check the header comparison cannot make: that
  proves what the distribution serves; this proves the build complies with it.
- **Live suite** ([`e2e/live/`](e2e/live), `pnpm e2e:live`) — the wider set DEPLOY_CONTRACT §4.2
  delegates to this repository, against `PLAYWRIGHT_BASE_URL`: the document and a deep link come
  back `200` under `no-cache` and the policy; a hashed asset carries
  `public, max-age=31536000, immutable`; a missing asset is `403` exactly, never `404`; a dotted
  last segment is not rewritten; `build-info.json` names a commit. It never runs on a pull request
  — there is usually no environment standing — and touches no AWS API.

---

## CI/CD

[`ci.yml`](.github/workflows/ci.yml) runs on every pull request and on every push to `main`:

- **`ci`** — install with a frozen lockfile, lint, format check, typecheck, unit tests,
  `pnpm build`, `check:dist`, then the preview suite. On a push to `main` only, `dist/` is uploaded
  as the workflow artifact named **`dist`** with **`retention-days: 90`** — the repository default
  and, for a public repository, the maximum. That artifact is the sole input to a deploy, so 90
  days is the rollback window: inside it a rollback is never a rebuild; a target older than that is
  a rebuild from the tagged commit, treated as a new deploy rather than a rollback. A pull
  request never uploads one; `check:dist` is what guards it.
- **`pr-title`** — the Conventional Commits regex against the pull-request title, re-run when the
  title is edited.
- **`workflow-lint`** — zizmor and actionlint at pinned versions over `.github/`. The same
  command is `pnpm lint:workflows` locally.

**Hardening.** Every workflow follows the six rules argued in the header of the infrastructure
repository's
[`validate.yml`](https://github.com/isai2105/terraform-aws-static-site/blob/main/.github/workflows/validate.yml):
SHA-pinned `uses:` with the tag as a comment, `using: node24` at every pinned SHA,
`permissions: {}` at workflow level and the minimum per job, `runs-on: ubuntu-24.04`,
`timeout-minutes` on every job, `persist-credentials: false` on every checkout. `ci.yml`'s
header records which of the six zizmor holds here and which are held by review.

**Dependabot** ([`.github/dependabot.yml`](.github/dependabot.yml)) proposes npm and
GitHub Actions bumps weekly, after a seven-day cooldown, in groups: `vitest` and `@vitest/*`
move together because the coverage provider pins `vitest` exactly, `react` with its types, the
ESLint family with `typescript`, then everything else by dependency type. Every title it
produces passes `pr-title`. **One obligation is a person's, not a tool's:** on an actions bump,
check that the new SHA still declares `using: node24` in its `action.yml` — no linter holds that
rule.

---

## Deploying

**A deploy only ever happens by dispatching
[`deploy.yml`](.github/workflows/deploy.yml)**, against an environment that the infrastructure
repository currently has applied. There is no push trigger and there will not be one: environments
there are applied, exercised and torn down, and a push-triggered deploy would be red whenever no
environment stands — the normal state — carrying no information (§8).

Inputs: `environment` (`stage` or `prod`) and `run_id`, the id of a green `ci` run on `main`
whose `dist` artifact to promote. Rollback is the same dispatch with an older `run_id`, within
the 90-day retention. The job:

1. refuses any dispatching ref but `main` — the OIDC trust subject is byte-exact
   `…:ref:refs/heads/main` (§1.3), and a feature-branch dispatch would otherwise fail at STS with
   an opaque `Not authorized`;
2. checks the run's provenance with `gh run view` — workflow `ci`, event `push`, branch `main`,
   conclusion `success` — before downloading anything, then that the artifact's
   `build-info.json` is stamped with that run's commit;
3. assumes `arn:aws:iam::<account>:role/react-cloudfront-app-deploy-<env>` over OIDC (§1), with
   no `environment:` key on the job (§1.4) and exactly `id-token: write`, `contents: read`,
   `actions: read` (§1.5);
4. reads `/static-site/<env>/bucket_name`, `cloudfront_distribution_id` and `site_url` from SSM,
   one `get-parameter` call each, every run, nothing cached (§2);
5. runs `check:csp` against the live site and stops before the first upload if the header has
   drifted from `csp.txt` (§6.3);
6. runs the four §4.1 commands in order — assets, then the rest, then `index.html`, then the
   invalidation of `/`, `/index.html` and `/build-info.json` — with no `--delete` and no `--acl`,
   and waits for the invalidation;
7. runs `verify:deploy`: `/` is `200`, every referenced asset is `200`, and the live
   `build-info.json` carries the promoted artifact's `sha` — the artifact's, never the deploying
   commit's.

A second job then runs the live suite through [`e2e-live.yml`](.github/workflows/e2e-live.yml)
with `contents: read` and nothing else; the OIDC grant stops at the first job. `e2e-live.yml` is
also dispatchable by hand with a `site_url`, for an environment that is already standing.

**Repository variables** the deploy reads and which must be set before the first dispatch:
`AWS_ACCOUNT_ID` and `AWS_REGION` (`us-east-2`, the environment's `aws_region`). They are
identifiers, not credentials — the contract's own instruction is that stable values live in
variables and the per-cycle ones in SSM. Neither is set today.

### Not yet verified

`deploy.yml` and `e2e-live.yml` have never run against a real environment: none has been applied
since this pipeline was written, and the deploy role cannot be assumed by hand (§1.2). The
provenance and artifact-stamp checks were reproduced against a real `main` run; `check:csp` and
`verify:deploy` were exercised against `pnpm preview` and against tampered copies. What the
first `stage` deploy will verify, in order: the OIDC exchange, the three parameter reads, the
CSP gate against a real header, the five IAM actions the role holds, the invalidation wait and
the live suite. DEPLOY_CONTRACT §9 carries the same placeholder from the other side, and closes
it with that run's link.

---

## The design skills ship no code

[`.claude/skills/`](.claude/skills) holds three markdown skills from
[`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill), committed as copies and
pinned by hash in [`skills-lock.json`](skills-lock.json). They shape what an AI agent writes
during development and nothing else: no runtime code, no bearing on `dist/`, bundle size or the
CSP. UI they help generate still has to pass `check-dist.mjs` and the preview suite like any
other change.

---

## Licence

MIT. See [`LICENSE`](LICENSE).
