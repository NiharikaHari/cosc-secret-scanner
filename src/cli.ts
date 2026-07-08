#!/usr/bin/env node
import { parseArgs } from "./util/args.js";
import { runScan } from "./commands/scan.js";
import { runScanRepo } from "./commands/scanRepo.js";
import { runScanStaged } from "./commands/scanStaged.js";
import { runInstallHook } from "./commands/installHook.js";

const HELP = `secret-scanner - detect exposed secrets in files, repos, and staged changes

Usage:
  secret-scanner scan <path> [--json] [--fail-on <severity>] [--ignore <file>]
  secret-scanner scan-repo <github-url|owner/repo> [--branch <name>] [--json] [--fail-on <severity>]
  secret-scanner scan-staged [--json] [--fail-on <severity>]
  secret-scanner install-hook [--force]
  secret-scanner --help | --version

Severities (for --fail-on, default "medium"): critical, high, medium, low
Exit codes: 0 clean, 1 findings at/above threshold, 2 usage/tool error
`;

function main(): number {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  switch (command) {
    case "scan":
      return runScan(args);
    case "scan-repo":
      return runScanRepo(args);
    case "scan-staged":
      return runScanStaged(args);
    case "install-hook":
      return runInstallHook(args);
    case "--version":
      console.log("0.1.0");
      return 0;
    case "--help":
    case undefined:
      console.log(HELP);
      return command === undefined ? 2 : 0;
    default:
      console.error(`Unknown command "${command}"\n`);
      console.log(HELP);
      return 2;
  }
}

process.exit(main());
