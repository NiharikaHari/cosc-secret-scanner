import type { Finding, Severity } from "../core/types.js";
import { colors, severityColor } from "../util/colors.js";

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export function printTerminalReport(findings: Finding[]): void {
  if (findings.length === 0) {
    console.log(colors.cyan("No potential secrets found."));
    return;
  }

  const byFile = new Map<string, Finding[]>();
  for (const finding of findings) {
    const list = byFile.get(finding.filePath) ?? [];
    list.push(finding);
    byFile.set(finding.filePath, list);
  }

  for (const [filePath, fileFindings] of byFile) {
    console.log(`\n${colors.bold(filePath)}`);
    for (const f of fileFindings.sort((a, b) => a.line - b.line)) {
      const sevLabel = (severityColor[f.severity] ?? ((s: string) => s))(
        f.severity.toUpperCase().padEnd(8),
      );
      console.log(`  ${colors.gray(`line ${f.line}`.padEnd(10))} ${sevLabel} ${f.ruleName}`);
      console.log(`    ${colors.gray(f.snippet)}`);
    }
  }

  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity]++;

  const summary = SEVERITY_ORDER.filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${s}`)
    .join(", ");
  const fileCount = byFile.size;
  console.log(
    `\n${colors.bold(`${findings.length} finding(s)`)} across ${fileCount} file(s) - ${summary}`,
  );
}
