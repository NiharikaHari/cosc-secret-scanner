import type { Rule } from "./types.js";

// Placeholder/dummy values that commonly trigger generic rules but aren't real secrets.
export const PLACEHOLDER_DENYLIST = [
  "changeme",
  "change_me",
  "password",
  "your_password",
  "yourpassword",
  "xxxx",
  "xxxxxx",
  "placeholder",
  "example",
  "secret",
  "todo",
  "<password>",
  "<secret>",
  "<token>",
  "insert_key_here",
  "null",
  "undefined",
  "test",
  "123456",
];

export function isPlaceholder(value: string): boolean {
  const normalized = value
    .trim()
    .replace(/^['"<]+|['">]+$/g, "")
    .toLowerCase();
  return PLACEHOLDER_DENYLIST.includes(normalized);
}

// Markers indicating the "value" is actually a reference to an environment
// variable / secret manager lookup rather than a literal secret.
const ENV_REFERENCE_MARKERS = [
  "process.env",
  "os.environ",
  "getenv(",
  "import.meta.env",
  "env[",
];

export function isEnvReference(matchedText: string): boolean {
  const lower = matchedText.toLowerCase();
  return ENV_REFERENCE_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

export const RULES: Rule[] = [
  {
    id: "aws-access-key-id",
    name: "AWS Access Key ID",
    regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
    severity: "critical",
  },
  {
    id: "aws-secret-key",
    name: "AWS Secret Access Key",
    regex:
      /aws_secret_access_key\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gid,
    severity: "critical",
    valueGroup: 1,
  },
  {
    id: "github-token",
    name: "GitHub Token",
    regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
    severity: "critical",
  },
  {
    id: "github-fine-pat",
    name: "GitHub Fine-Grained Personal Access Token",
    regex: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g,
    severity: "critical",
  },
  {
    id: "slack-token",
    name: "Slack Token",
    regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
    severity: "critical",
  },
  {
    id: "slack-webhook",
    name: "Slack Webhook URL",
    regex: /hooks\.slack\.com\/services\/T\w+\/B\w+\/\w+/g,
    severity: "high",
  },
  {
    id: "private-key-header",
    name: "Private Key",
    regex: /-----BEGIN\s?(RSA|EC|DSA|OPENSSH)?\s?PRIVATE KEY-----/g,
    severity: "critical",
  },
  {
    id: "google-api-key",
    name: "Google API Key",
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    severity: "high",
  },
  {
    id: "stripe-live-key",
    name: "Stripe Live Key",
    regex: /\b[sr]k_live_[0-9a-zA-Z]{24,}\b/g,
    severity: "critical",
  },
  {
    id: "jwt",
    name: "JSON Web Token",
    regex: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    severity: "medium",
  },
  {
    id: "db-conn-string",
    name: "Database Connection String with Credentials",
    regex:
      /\b(postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^:\s/]+:[^@\s/]+@\S+/gi,
    severity: "high",
  },
  {
    id: "generic-api-key",
    name: "Generic API Key",
    regex: /\bapi[_-]?key\s*[:=]\s*['"]?([A-Za-z0-9_\-]{16,})['"]?/gid,
    severity: "medium",
    valueGroup: 1,
  },
  {
    id: "generic-secret",
    name: "Generic Secret",
    regex: /\b(?:client[_-]?)?secret\s*[:=]\s*['"]?([\w\-/+=]{8,})['"]?/gid,
    severity: "medium",
    valueGroup: 1,
  },
  {
    id: "generic-password",
    name: "Generic Password",
    regex: /\b(?:password|passwd|pwd)\s*[:=]\s*['"]?([^\s'";]{6,})['"]?/gid,
    severity: "low",
    valueGroup: 1,
  },
  {
    id: "generic-token",
    name: "Generic Token",
    regex:
      /\b(?:access[_-]?token|auth[_-]?token|token)\s*[:=]\s*['"]?([\w\-.=]{16,})['"]?/gid,
    severity: "medium",
    valueGroup: 1,
  },
];
