# secret-scanner

A CLI tool that scans files, directories, GitHub repositories, and staged git
changes for accidentally exposed secrets - API keys, passwords, tokens, and
other credentials - and reports exactly where they were found.

## Install / Build

```sh
npm install
npm run build
```

This produces `dist/cli.js`, runnable as `node dist/cli.js` or, once linked
globally (`npm link`), as `secret-scanner`. During development you can run
`npm run dev -- <command>` to execute `src/cli.ts` directly via `tsx`.

## Commands

```sh
secret-scanner scan <path> [--json] [--fail-on <severity>] [--ignore <file>]
secret-scanner scan-repo <github-url|owner/repo> [--branch <name>] [--json] [--fail-on <severity>]
secret-scanner scan-staged [--json] [--fail-on <severity>]
secret-scanner install-hook [--force]
```

- `scan <path>` - scans a single file or recursively scans a directory.
- `scan-repo <github-url|owner/repo>` - shallow-clones a public GitHub repo
  into a temp directory, scans it, and cleans up afterward.
- `scan-staged` - scans only the added lines in `git diff --cached`; this is
  what the pre-commit hook runs.
- `install-hook` - installs a `.git/hooks/pre-commit` script in the current
  repo that runs `scan-staged` and blocks the commit if secrets are found.

### Flags

- `--json` - print machine-readable JSON instead of the colored terminal report.
- `--fail-on <severity>` (default `medium`) - only findings at or above this
  severity (`critical` > `high` > `medium` > `low`) cause a non-zero exit code.
  Lower-severity findings are still reported.
- `--ignore <file>` (scan only) - path to an ignore file, defaults to
  `.secretscannerignore` in the scanned directory.

### Exit codes

- `0` - clean, no findings at/above the `--fail-on` threshold.
- `1` - findings at/above the threshold.
- `2` - usage or tool error (bad path, clone failure, not a git repo, etc.).

## Using the pre-commit hook

In the repo you want to protect:

```sh
npm install --save-dev git+https://github.com/NiharikaHari/cosc-secret-scanner.git
npx secret-scanner install-hook
```

Now every `git commit` runs `scan-staged` first. If it finds anything at or
above the default `medium` severity, the commit is blocked and the findings
are printed with file, line, rule, and a redacted snippet.

If a pre-commit hook already exists and wasn't created by secret-scanner,
`install-hook` refuses to overwrite it (use `--force` to override) and instead
prints the line to add manually - this also works for a Husky
`.husky/pre-commit` file.

## Ignoring false positives

- `.secretscannerignore` - one glob pattern per line (supports `*`, `**`,
  `?` - a reduced subset, not the full gitignore spec), matched against paths
  relative to the scan root.
- Inline suppression - add `secret-scanner:ignore` anywhere on a line (e.g. as
  a trailing comment) to suppress findings on that line.
- Directories like `node_modules`, `.git`, `dist`, `build`, and common
  lockfiles/binary extensions are always excluded.

## Detection rules

Regex-based rules for common formats (AWS keys, GitHub/Slack tokens, private
key headers, Google API keys, Stripe live keys, JWTs, database connection
strings with embedded credentials) plus generic `api_key` / `secret` /
`password` / `token` assignment patterns, and a Shannon-entropy fallback that
flags long random-looking strings not caught by a specific rule. Assignment
values that reference an environment variable (`process.env.*`,
`os.environ`, etc.) are not flagged, since those are not literal secrets.

## Testing

```sh
npm test
```

Runs the `node:test` suite (rule matching, entropy thresholds, file/directory
scanning against `test/fixtures`, and unified-diff parsing).

## Limitations

- Regex/entropy-based only - no ML, so it can both miss creatively-formatted
  secrets and flag non-secrets (especially the low-severity generic/entropy
  rules).
- Only scans the current working tree or the currently staged diff, not full
  git history.
- `.secretscannerignore` supports a reduced glob subset, not the full
  gitignore spec.
- `scan-repo` shells out to `git clone`, so it needs `git` on `PATH`; private
  repos require your existing git credentials to already have access.
