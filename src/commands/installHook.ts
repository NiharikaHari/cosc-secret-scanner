import fs from "node:fs";
import path from "node:path";
import { getRepoRoot, isInsideGitRepo } from "../git/fileList.js";
import type { ParsedArgs } from "../util/args.js";

const HOOK_MARKER = "# secret-scanner-hook";

const HOOK_SCRIPT = `#!/usr/bin/env sh
${HOOK_MARKER} (generated - reinstall with \`secret-scanner install-hook --force\`)
npx --no-install secret-scanner scan-staged
status=$?
if [ $status -ne 0 ]; then
  echo ""
  echo "Commit blocked: secret-scanner found potential secrets in staged changes."
  echo "Fix them, or suppress a false positive via .secretscannerignore / 'secret-scanner:ignore'."
  exit 1
fi
exit 0
`;

export function runInstallHook(args: ParsedArgs): number {
  const cwd = process.cwd();
  if (!isInsideGitRepo(cwd)) {
    console.error("Not inside a git repository.");
    return 2;
  }

  const repoRoot = getRepoRoot(cwd);
  const hookPath = path.join(repoRoot, ".git", "hooks", "pre-commit");

  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf8");
    const isOurs = existing.includes(HOOK_MARKER);
    if (!isOurs && !args.flags.force) {
      console.error(
        `A pre-commit hook already exists at ${hookPath} and was not created by secret-scanner.\n` +
          "Add this line to it manually (or to your Husky pre-commit hook), or re-run with --force to overwrite it:\n\n" +
          "  npx --no-install secret-scanner scan-staged\n",
      );
      return 2;
    }
    if (isOurs && !args.flags.force) {
      console.log("secret-scanner pre-commit hook is already installed.");
      return 0;
    }
  }

  fs.writeFileSync(hookPath, HOOK_SCRIPT, { mode: 0o755 });
  fs.chmodSync(hookPath, 0o755);
  console.log(`Installed pre-commit hook at ${hookPath}`);
  return 0;
}
