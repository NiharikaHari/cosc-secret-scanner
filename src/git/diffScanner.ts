import { execFileSync } from "node:child_process";
import path from "node:path";
import { matchRulesOnLine } from "../core/matcher.js";
import type { Finding } from "../core/types.js";
import {
  isDefaultExcludedFile,
  isIgnoredByPatterns,
  loadIgnorePatterns,
} from "../core/ignore.js";

interface DiffLine {
  filePath: string;
  lineNumber: number;
  content: string;
}

export function parseUnifiedDiff(diff: string): DiffLine[] {
  const results: DiffLine[] = [];
  const fileSections = diff.split(/^diff --git .*$/m).slice(1);

  for (const section of fileSections) {
    const targetMatch = section.match(/^\+\+\+ b\/(.+)$/m);
    if (!targetMatch || targetMatch[1] === "/dev/null") continue;
    const filePath = targetMatch[1];
    if (/^Binary files .* differ$/m.test(section)) continue;

    const hunkRe = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@.*$/gm;
    let hunkMatch: RegExpExecArray | null;
    const hunkStarts: { index: number; startLine: number }[] = [];
    while ((hunkMatch = hunkRe.exec(section)) !== null) {
      hunkStarts.push({ index: hunkMatch.index + hunkMatch[0].length, startLine: parseInt(hunkMatch[1], 10) });
    }

    for (let i = 0; i < hunkStarts.length; i++) {
      const { index, startLine } = hunkStarts[i];
      const end = i + 1 < hunkStarts.length ? hunkStarts[i + 1].index : section.length;
      const hunkBody = section.slice(index, end);
      const lines = hunkBody.split("\n").filter((l) => l.length > 0 || l === "");
      let lineNumber = startLine;
      for (const line of lines) {
        if (line.startsWith("+") && !line.startsWith("+++")) {
          results.push({ filePath, lineNumber, content: line.slice(1) });
          lineNumber++;
        } else if (line.startsWith("@@")) {
          break;
        }
      }
    }
  }
  return results;
}

export function getStagedDiff(cwd: string): string {
  return execFileSync("git", ["diff", "--cached", "-U0", "--no-color"], {
    cwd,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
}

export function scanDiffText(diff: string, ignorePatterns: RegExp[] = []): Finding[] {
  const diffLines = parseUnifiedDiff(diff);

  const findings: Finding[] = [];
  for (const { filePath, lineNumber, content } of diffLines) {
    if (isDefaultExcludedFile(path.basename(filePath))) continue;
    if (isIgnoredByPatterns(filePath, ignorePatterns)) continue;

    const matches = matchRulesOnLine(content);
    for (const match of matches) {
      findings.push({
        filePath,
        line: lineNumber,
        ruleId: match.ruleId,
        ruleName: match.ruleName,
        severity: match.severity,
        snippet: match.snippet,
      });
    }
  }
  return findings;
}

export function scanStagedChanges(cwd: string): Finding[] {
  const ignorePatterns = loadIgnorePatterns(path.join(cwd, ".secretscannerignore"));
  return scanDiffText(getStagedDiff(cwd), ignorePatterns);
}
