import { RULES, isEnvReference, isPlaceholder } from "./rules.js";
import { findHighEntropyTokens } from "./entropy.js";
import type { Rule, Severity } from "./types.js";

export interface MatchResult {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  snippet: string;
}

const INLINE_IGNORE_MARKER = "secret-scanner:ignore";

function redactValue(value: string): string {
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}${"*".repeat(Math.min(value.length - 8, 20))}${value.slice(-4)}`;
}

function redactLine(line: string, matchStart: number, matchEnd: number): string {
  const raw = line.slice(matchStart, matchEnd);
  const redacted = redactValue(raw);
  const snippet = line.slice(0, matchStart) + redacted + line.slice(matchEnd);
  const trimmed = snippet.trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}...` : trimmed;
}

interface Span {
  start: number;
  end: number;
}

function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

export function matchRulesOnLine(line: string, rules: Rule[] = RULES): MatchResult[] {
  if (line.includes(INLINE_IGNORE_MARKER)) return [];

  const results: MatchResult[] = [];
  const matchedSpans: Span[] = [];

  for (const rule of rules) {
    rule.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.regex.exec(line)) !== null) {
      let span = { start: m.index, end: m.index + m[0].length };
      if (rule.valueGroup !== undefined) {
        const value = m[rule.valueGroup] ?? "";
        if (isPlaceholder(value) || isEnvReference(m[0])) {
          if (m[0].length === 0) rule.regex.lastIndex++;
          continue;
        }
        const indices = (m as RegExpExecArray & { indices?: Array<[number, number]> }).indices;
        const groupIndices = indices?.[rule.valueGroup];
        if (groupIndices) {
          span = { start: groupIndices[0], end: groupIndices[1] };
        }
      }
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        snippet: redactLine(line, span.start, span.end),
      });
      matchedSpans.push(span);
      if (m[0].length === 0) rule.regex.lastIndex++;
    }
  }

  for (const token of findHighEntropyTokens(line)) {
    const span = { start: token.index, end: token.index + token.value.length };
    if (matchedSpans.some((s) => overlaps(s, span))) continue;
    results.push({
      ruleId: "high-entropy-fallback",
      ruleName: "High-Entropy String",
      severity: "low",
      snippet: redactLine(line, span.start, span.end),
    });
  }

  return results;
}
