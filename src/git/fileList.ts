import { execFileSync } from "node:child_process";

export function isInsideGitRepo(cwd: string): boolean {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

// Lists cached + others files, honoring .gitignore, relative to `cwd`.
export function listGitFiles(cwd: string): string[] {
  const output = execFileSync(
    "git",
    ["ls-files", "-co", "--exclude-standard"],
    { cwd, encoding: "utf8" },
  );
  return output.split("\n").filter((line) => line.length > 0);
}

export function getRepoRoot(cwd: string): string {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  }).trim();
}
