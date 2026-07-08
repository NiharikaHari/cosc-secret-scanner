import fs from "node:fs";
import path from "node:path";
import { matchRulesOnLine } from "./matcher.js";
import type { Finding, ScanOptions } from "./types.js";
import {
  isDefaultExcludedDir,
  isDefaultExcludedFile,
  isIgnoredByPatterns,
  isProbablyBinary,
  isTooLarge,
  loadIgnorePatterns,
} from "./ignore.js";
import { isInsideGitRepo, listGitFiles } from "../git/fileList.js";

export function scanFile(
  filePath: string,
  relativePath: string,
  ignorePatterns: RegExp[] = [],
): Finding[] {
  if (isDefaultExcludedFile(path.basename(filePath))) return [];
  if (isIgnoredByPatterns(relativePath, ignorePatterns)) return [];
  if (isTooLarge(filePath) || isProbablyBinary(filePath)) return [];

  const findings: Finding[] = [];
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    const matches = matchRulesOnLine(line);
    for (const match of matches) {
      findings.push({
        filePath: relativePath,
        line: idx + 1,
        ruleId: match.ruleId,
        ruleName: match.ruleName,
        severity: match.severity,
        snippet: match.snippet,
      });
    }
  });
  return findings;
}

function walkDirectory(root: string, ignorePatterns: RegExp[]): string[] {
  const results: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const relativePath = path.relative(root, fullPath);
      if (entry.isDirectory()) {
        if (isDefaultExcludedDir(entry.name)) continue;
        if (isIgnoredByPatterns(relativePath, ignorePatterns)) continue;
        stack.push(fullPath);
      } else if (entry.isFile()) {
        results.push(relativePath);
      }
    }
  }
  return results;
}

export function scanDirectory(root: string, opts: Partial<ScanOptions> = {}): Finding[] {
  const ignoreFilePath = opts.ignoreFile ?? path.join(root, ".secretscannerignore");
  const ignorePatterns = loadIgnorePatterns(ignoreFilePath);

  const relativeFiles = isInsideGitRepo(root)
    ? listGitFiles(root)
    : walkDirectory(root, ignorePatterns);

  const findings: Finding[] = [];
  for (const relativePath of relativeFiles) {
    const fullPath = path.join(root, relativePath);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) continue;
    findings.push(...scanFile(fullPath, relativePath, ignorePatterns));
  }
  return findings;
}
