import { test } from "node:test";
import assert from "node:assert/strict";
import { matchRulesOnLine } from "../src/core/matcher.js";

test("detects an AWS access key id", () => {
  const results = matchRulesOnLine('const key = "AKIAABCDEFGHIJKLMNOP";');
  assert.ok(results.some((r) => r.ruleId === "aws-access-key-id"));
});

test("detects a GitHub token", () => {
  const results = matchRulesOnLine(
    'const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz12";',
  );
  assert.ok(results.some((r) => r.ruleId === "github-token"));
});

test("detects a private key header", () => {
  const results = matchRulesOnLine("-----BEGIN RSA PRIVATE KEY-----");
  assert.ok(results.some((r) => r.ruleId === "private-key-header"));
});

test("detects a database connection string with credentials", () => {
  const results = matchRulesOnLine(
    'const url = "postgres://admin:sup3rSecretPW@db.example.com:5432/prod";',
  );
  assert.ok(results.some((r) => r.ruleId === "db-conn-string"));
});

test("does not flag a placeholder password", () => {
  const results = matchRulesOnLine('password: "changeme",');
  assert.ok(!results.some((r) => r.ruleId === "generic-password"));
});

test("does not flag a value read from an environment variable", () => {
  const results = matchRulesOnLine("const password = process.env.DB_PASSWORD;");
  assert.equal(results.length, 0);
});

test("respects the inline ignore marker", () => {
  const results = matchRulesOnLine(
    'const key = "AKIAABCDEFGHIJKLMNOP"; // secret-scanner:ignore',
  );
  assert.equal(results.length, 0);
});

test("redacts the secret value in the snippet", () => {
  const results = matchRulesOnLine('const key = "AKIAABCDEFGHIJKLMNOP";');
  const finding = results.find((r) => r.ruleId === "aws-access-key-id");
  assert.ok(finding);
  assert.ok(!finding!.snippet.includes("AKIAABCDEFGHIJKLMNOP"));
});
