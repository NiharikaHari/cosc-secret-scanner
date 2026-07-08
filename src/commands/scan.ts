import path from "node:path";
import { scanDirectory, scanFile } from "../core/scanner.js";
import { hasFindingAtOrAbove, isSeverity } from "../core/types.js";
import type { Severity } from "../core/types.js";
import { printTerminalReport } from "../report/terminal.js";
import { printJsonReport } from "../report/json.js";
import type { ParsedArgs } from "../util/args.js";
import fs from "node:fs";

export function runScan(args: ParsedArgs): number {
  const target = args.positional[0];
  if (!target) {
    console.error("Usage: secret-scanner scan <path> [--json] [--fail-on <severity>] [--ignore <file>]");
    return 2;
  }

  const failOnRaw = typeof args.flags["fail-on"] === "string" ? args.flags["fail-on"] : "medium";
  if (!isSeverity(failOnRaw)) {
    console.error(`Invalid --fail-on value "${failOnRaw}". Expected critical|high|medium|low.`);
    return 2;
  }
  const failOn: Severity = failOnRaw;
  const ignoreFile = typeof args.flags.ignore === "string" ? args.flags.ignore : undefined;

  const resolvedTarget = path.resolve(target);
  if (!fs.existsSync(resolvedTarget)) {
    console.error(`Path not found: ${target}`);
    return 2;
  }

  const stat = fs.statSync(resolvedTarget);
  const findings = stat.isDirectory()
    ? scanDirectory(resolvedTarget, { ignoreFile, failOn })
    : scanFile(resolvedTarget, path.relative(process.cwd(), resolvedTarget) || path.basename(resolvedTarget));

  if (args.flags.json) {
    printJsonReport(findings);
  } else {
    printTerminalReport(findings);
  }

  return hasFindingAtOrAbove(findings, failOn) ? 1 : 0;
}
