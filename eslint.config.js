// ESLint is here for the type-aware layer only: the typescript-eslint rules
// that need a TypeScript `Program` (floating promises, unsafe `any` flow,
// unnecessary conditions, …), which oxlint cannot run. oxlint
// (.oxlintrc.json) stays the fast, syntactic linter for everything else.
// `strictTypeChecked` also carries syntactic rules that overlap oxlint's;
// the overlap is accepted rather than pruned — a hand-trimmed list is one
// more thing to keep in step with two upstreams.
//
// Not here on purpose: eslint-plugin-react, eslint-plugin-jsx-a11y and
// eslint-plugin-import. Their peer ranges stop at ESLint 9
// (jsx-eslint/eslint-plugin-react#4027); oxlint covers those rule sets
// without type information. Revisit when they declare ESLint 10.
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      '.claude',
      'public/build-info.json',
      // Generated reports (vitest --coverage, playwright) carry their own JS.
      'coverage',
      'test-results',
      'playwright-report',
    ],
  },
  {
    // Type-aware rules apply to every file a tsconfig project knows about
    // (src/ via tsconfig.app.json; vite.config.ts and scripts/ via
    // tsconfig.node.json). This config file itself is outside every
    // project and left to oxlint.
    files: ['**/*.{ts,tsx,mjs}'],
    extends: [tseslint.configs.strictTypeChecked, reactHooks.configs.flat.recommended],
    // A disable directive that no longer suppresses anything is a lie in the
    // source; fail on it rather than let it rot.
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Enforced on both linters so the rule holds whichever one a
      // contributor runs first (.oxlintrc.json has the same two).
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Two narrowings of `strictTypeChecked`, each an option rather than an
      // off switch. Numbers stringify unambiguously (`${count}`); the rule's
      // target is objects and nullish values, which stay forbidden.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // `onClick={() => setCount(c => c + 1)}` is idiomatic React; the rule's
      // target — a void expression mistaken for a value — is still caught in
      // every position other than an arrow-function body.
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    },
  },
)
