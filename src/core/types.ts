export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITY_ORDER: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export interface Rule {
  id: string;
  name: string;
  regex: RegExp;
  severity: Severity;
  /** Capture group index holding just the secret value (requires the regex to use the "d" flag). When absent, the whole match is treated as the value. */
  valueGroup?: number;
}

export interface Finding {
  filePath: string;
  line: number;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  snippet: string;
}

export interface ScanOptions {
  ignoreFile?: string;
  failOn: Severity;
}

export interface ScanSummary {
  findings: Finding[];
  counts: Record<Severity, number>;
}

const VALID_SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export function isSeverity(value: string): value is Severity {
  return (VALID_SEVERITIES as string[]).includes(value);
}

export function hasFindingAtOrAbove(findings: Finding[], failOn: Severity): boolean {
  return findings.some((f) => SEVERITY_ORDER[f.severity] >= SEVERITY_ORDER[failOn]);
}
