import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { scanDirectory } from "../core/scanner.js";
import type { Finding, ScanOptions } from "../core/types.js";

const GITHUB_URL_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?\/?$/;
const OWNER_REPO_RE = /^([\w.-]+)\/([\w.-]+)$/;

export function normalizeGitHubUrl(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(GITHUB_URL_RE);
  if (urlMatch) {
    return `https://github.com/${urlMatch[1]}/${urlMatch[2]}.git`;
  }
  const shortMatch = trimmed.match(OWNER_REPO_RE);
  if (shortMatch) {
    return `https://github.com/${shortMatch[1]}/${shortMatch[2]}.git`;
  }
  throw new Error(
    `Could not parse "${input}" as a GitHub URL or owner/repo shorthand`,
  );
}

export function scanGitHubRepo(
  input: string,
  opts: Partial<ScanOptions> & { branch?: string } = {},
): Finding[] {
  const url = normalizeGitHubUrl(input);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "secret-scanner-"));

  try {
    const args = ["clone", "--depth", "1", "--quiet"];
    if (opts.branch) args.push("-b", opts.branch);
    args.push(url, tmpDir);
    execFileSync("git", args, { stdio: ["ignore", "ignore", "pipe"] });

    return scanDirectory(tmpDir, opts);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
