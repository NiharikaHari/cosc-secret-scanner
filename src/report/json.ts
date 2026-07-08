import type { Finding, Severity } from "../core/types.js";

export function printJsonReport(findings: Finding[]): void {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity]++;

  console.log(
    JSON.stringify(
      {
        findings,
        summary: {
          total: findings.length,
          files: new Set(findings.map((f) => f.filePath)).size,
          counts,
        },
      },
      null,
      2,
    ),
  );
}
