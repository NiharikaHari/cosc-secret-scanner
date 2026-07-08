export function shannonEntropy(value: string): number {
  if (value.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const ch of value) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

const HEX_RE = /^[0-9a-fA-F]+$/;
const BASE64ISH_RE = /^[A-Za-z0-9+/_=-]+$/;

// Candidate quoted/bare tokens of length >= 20 that look like base64/hex blobs.
const TOKEN_CANDIDATE_RE = /['"]([A-Za-z0-9+/_=-]{20,})['"]|(?<![\w.-])([A-Za-z0-9+/_=-]{20,})(?![\w.-])/g;

export interface EntropyMatch {
  value: string;
  index: number;
}

export function findHighEntropyTokens(line: string): EntropyMatch[] {
  const matches: EntropyMatch[] = [];
  let m: RegExpExecArray | null;
  TOKEN_CANDIDATE_RE.lastIndex = 0;
  while ((m = TOKEN_CANDIDATE_RE.exec(line)) !== null) {
    const value = m[1] ?? m[2];
    if (!value) continue;
    const entropy = shannonEntropy(value);
    const threshold = HEX_RE.test(value) ? 3.0 : BASE64ISH_RE.test(value) ? 4.5 : 4.0;
    if (entropy >= threshold) {
      matches.push({ value, index: m.index });
    }
  }
  return matches;
}
