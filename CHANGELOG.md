# Changelog

All notable changes to this repository are recorded here, in the format of
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This file carries **interface** changes — the things the infrastructure repository, or a person
operating a deploy, builds against and breaks on. What this repository reads from
[`terraform-aws-static-site`](https://github.com/isai2105/terraform-aws-static-site) (the policy
string, the SSM parameter names, the role), what it produces for it (the `dist` artifact and the
stamp inside it) and what a dispatch needs to know (workflow inputs, repository variables) are
all interface. Lint rules, hook mechanics, test layout and comment accuracy are not, and are left
to git history.

## [Unreleased]

### Added

- **The interface this repository implements**, as fixed by
  [`docs/DEPLOY_CONTRACT.md`](https://github.com/isai2105/terraform-aws-static-site/blob/main/docs/DEPLOY_CONTRACT.md)
  in the infrastructure repository:
  - **Content-Security-Policy.** [`csp.txt`](csp.txt) holds the distribution's policy, byte-exact
    to `local.csp` in `modules/static-site/policies.tf` (§6). It is served by `vite preview`,
    asserted by both Playwright suites, and compared — normalised per CSP3 §2.2.1 — against the
    live header before every deploy; a mismatch refuses the deploy (§6.3). Changing the policy is
    a two-repository change.
  - **`build-info.json`** at the root of `dist/`, on every build: `{ "sha", "builtAt", "dirty" }`.
    `sha` and `builtAt` are the contract's fields (§3); `dirty` is this repository's addition and
    is `false` for every CI build. The post-deploy verification compares the live file's `sha`
    with the promoted artifact's.
  - **The `dist` artifact.** `ci.yml` uploads `dist/` as the workflow artifact named `dist`, from
    pushes to `main` only, with `retention-days: 90`. It is the only input to a deploy (§3); a
    rollback is a redeploy of an older run's artifact within that window.
  - **SSM parameters read at deploy time**, one `get-parameter` call each, every run (§2):
    `/static-site/<env>/bucket_name`, `/static-site/<env>/cloudfront_distribution_id`,
    `/static-site/<env>/site_url`.
  - **The deploy identity.** `deploy.yml` assumes
    `arn:aws:iam::<account_id>:role/react-cloudfront-app-deploy-<env>` over OIDC from `main`
    only, declares no GitHub Environment, and asks for exactly `id-token: write`,
    `contents: read` and `actions: read` (§1).
  - **Workflow inputs.** `deploy.yml` is `workflow_dispatch` only, with `environment`
    (`stage` | `prod`) and `run_id` (a green `ci` push run on `main`). `e2e-live.yml` takes
    `site_url`, from `deploy.yml` as a called workflow or by hand, and an optional
    `expected_sha`: `deploy.yml` passes the promoted commit and the live suite asserts the served
    `build-info.json` names it; a dispatch may leave it empty for the shape check only.
  - **Repository variables** the deploy reads: `AWS_ACCOUNT_ID` and `AWS_REGION`. Both must be
    set before the first dispatch.

### Not recorded here

Everything else that landed in the scaffold — the toolchain pins, the two linters, Prettier, the
git hooks and commit convention, the Vitest and Playwright suites, `check-dist.mjs`, Dependabot,
the CI job layout and the repository settings (the ruleset on `main`, squash-only merges,
`sha_pinning_required`, CodeQL default setup; README "Repository settings") — is internal: it
changes how this repository is worked on, not what the other repository or an operator can
observe.
