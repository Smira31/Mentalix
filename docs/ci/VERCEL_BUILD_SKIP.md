# Vercel build skip policy

Vercel runs `node scripts/vercel-ignore-build.mjs` as the `ignoreCommand` before a deployment build. The script compares `VERCEL_GIT_PREVIOUS_SHA` with `VERCEL_GIT_COMMIT_SHA` and uses the exit status expected by Vercel: **0 skips the deployment**, while **1 continues with the build**.

A deployment is skipped only when every changed path is clearly outside the frontend bundle:

- `docs/**`;
- `.github/**`;
- `.claude/**`, `audit-artifacts/**`, and `qa-evidence/**`, which are repository process or evidence files;
- a Markdown file at the repository root, such as `README.md` or another root-level `*.md` file.

The rule is deliberately conservative. It continues the build for source, public assets, package manifests, lockfiles, configuration, and any path not explicitly listed above. `vercel.json` is always treated as build-relevant, even if a future broad safe-path rule could otherwise match it. Markdown files below source or other nested application directories are also treated as build-relevant because they could be imported into the bundle.

If either SHA is missing, the repository cannot be diffed, or the diff fails, the script returns 1 so that a potentially necessary deployment is not suppressed. An empty diff also returns 1 because there is no safe changed-file classification to make.

## Dependabot branches

Dependabot branches are **not** skipped by branch name. A dependency update can change the installed dependency graph even when the visible diff looks small, so disabling its preview deployment would be an unsafe shortcut. Dependency PRs remain covered by the normal Vercel and GitHub checks.

## Verification

The script can be tested locally without a Vercel deployment by supplying two commit SHAs from the repository. A documentation-only comparison must return 0, while a comparison containing a source, asset, manifest, lockfile, or `vercel.json` change must return 1. The test cases should use real commits whenever possible so the result reflects Git's actual path list.
