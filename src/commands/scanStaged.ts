import { scanStagedChanges } from "../git/diffScanner.js";
import { hasFindingAtOrAbove, isSeverity } from "../core/types.js";
import type { Severity } from "../core/types.js";
import { printTerminalReport } from "../report/terminal.js";
import { printJsonReport } from "../report/json.js";
import type { ParsedArgs } from "../util/args.js";

export function runScanStaged(args: ParsedArgs): number {
  const failOnRaw = typeof args.flags["fail-on"] === "string" ? args.flags["fail-on"] : "medium";
  if (!isSeverity(failOnRaw)) {
    console.error(`Invalid --fail-on value "${failOnRaw}". Expected critical|high|medium|low.`);
    return 2;
  }
  const failOn: Severity = failOnRaw;

  let findings;
  try {
    findings = scanStagedChanges(process.cwd());
  } catch (err) {
    console.error(`Failed to read staged changes: ${(err as Error).message}`);
    return 2;
  }

  if (args.flags.json) {
    printJsonReport(findings);
  } else {
    printTerminalReport(findings);
  }

  return hasFindingAtOrAbove(findings, failOn) ? 1 : 0;
}
