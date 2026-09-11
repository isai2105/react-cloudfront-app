// Runs from .husky/commit-msg on every local commit.
//
// Stance: main takes squash merges only, with the PR title as the commit
// subject (repository merge settings), so local subjects never reach main.
// The subject gate is the CI `pr-title` check (.github/workflows/ci.yml);
// commitlint is its shift-left copy for the subject, seen at commit time
// instead of at PR time. The rest of config-conventional (header length,
// subject case, blank line before the body, …) applies on top and is local
// hygiene the PR check does not look at.
//
// `type-enum` is pinned even though config-conventional's default is the
// same eleven types today: the list here must read as, and stay, identical to
// the PR-title regex the CI check uses —
//   ^(feat|fix|docs|style|refactor|test|build|ci|chore|perf|revert)(\([^()]+\))?!?: .+$
// — and an upstream change to the default must not move one gate without
// the other.

// @commitlint/types is a devDependency for this annotation alone (editor
// hover on the config shape); no tsconfig project checks this file.
/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'build',
        'ci',
        'chore',
        'perf',
        'revert',
      ],
    ],
    // Bodies and footers carry URLs (issue links, `Claude-Session:` trailers)
    // that cannot be wrapped; a hard line limit there rejects legitimate
    // commits. The header limit stays: a subject is prose and fits in 100.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
}
