import { scanGitHubRepo } from "../git/repoClone.js";
import { hasFindingAtOrAbove, isSeverity } from "../core/types.js";
import type { Severity } from "../core/types.js";
import { printTerminalReport } from "../report/terminal.js";
import { printJsonReport } from "../report/json.js";
import type { ParsedArgs } from "../util/args.js";

export function runScanRepo(args: ParsedArgs): number {
  const target = args.positional[0];
  if (!target) {
    console.error("Usage: secret-scanner scan-repo <github-url|owner/repo> [--branch <name>] [--json] [--fail-on <severity>]");
    return 2;
  }

  const failOnRaw = typeof args.flags["fail-on"] === "string" ? args.flags["fail-on"] : "medium";
  if (!isSeverity(failOnRaw)) {
    console.error(`Invalid --fail-on value "${failOnRaw}". Expected critical|high|medium|low.`);
    return 2;
  }
  const failOn: Severity = failOnRaw;
  const branch = typeof args.flags.branch === "string" ? args.flags.branch : undefined;

  let findings;
  try {
    findings = scanGitHubRepo(target, { branch, failOn });
  } catch (err) {
    console.error(`Failed to scan repo: ${(err as Error).message}`);
    return 2;
  }

  if (args.flags.json) {
    printJsonReport(findings);
  } else {
    printTerminalReport(findings);
  }

  return hasFindingAtOrAbove(findings, failOn) ? 1 : 0;
}
