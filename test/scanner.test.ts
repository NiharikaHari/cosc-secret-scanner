import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanFile } from "../src/core/scanner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "fixtures");

test("scanFile finds secrets in a leaky file", () => {
  const filePath = path.join(fixturesDir, "leaky.js");
  const findings = scanFile(filePath, "leaky.js");
  assert.ok(findings.length > 0);
  assert.ok(findings.some((f) => f.ruleId === "aws-access-key-id"));
  assert.ok(findings.some((f) => f.ruleId === "github-token"));
  assert.ok(findings.some((f) => f.ruleId === "db-conn-string"));
});

test("scanFile reports no findings for clean code", () => {
  const filePath = path.join(fixturesDir, "clean.js");
  const findings = scanFile(filePath, "clean.js");
  assert.equal(findings.length, 0);
});
