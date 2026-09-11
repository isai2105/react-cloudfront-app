// Runs from .husky/pre-commit. Each glob is the same tool chain `pnpm lint`
// and `pnpm format:check` run repo-wide, narrowed to the staged files; the
// flags match so a commit cannot pass here and fail in CI on the same file.
//
// Globs are disjoint on purpose: lint-staged runs the task lists of different
// globs concurrently, so a file matching two globs could be rewritten by two
// tools at once.

/** @type {import('lint-staged').Configuration} */
export default {
  // Everything ESLint's type-aware layer covers (`files` in eslint.config.js).
  '*.{ts,tsx,mjs}': [
    'oxlint --fix --deny-warnings',
    'eslint --fix --max-warnings 0',
    'prettier --write',
  ],
  // Root config files: outside every tsconfig project, so oxlint only.
  '*.js': ['oxlint --fix --deny-warnings', 'prettier --write'],
  '*.{css,html,json,md,yml,yaml}': 'prettier --write',
}
