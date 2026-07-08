import { test } from "node:test";
import assert from "node:assert/strict";
import { scanDiffText, parseUnifiedDiff } from "../src/git/diffScanner.js";

const SAMPLE_DIFF = `diff --git a/config.js b/config.js
index e69de29..b6fc4c6 100644
--- a/config.js
+++ b/config.js
@@ -1,0 +2,2 @@
+const key = "AKIAABCDEFGHIJKLMNOP";
+const greeting = "hello world";
`;

test("parseUnifiedDiff extracts added lines with correct line numbers", () => {
  const lines = parseUnifiedDiff(SAMPLE_DIFF);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].filePath, "config.js");
  assert.equal(lines[0].lineNumber, 2);
  assert.equal(lines[1].lineNumber, 3);
});

test("scanDiffText finds a secret only in the added lines", () => {
  const findings = scanDiffText(SAMPLE_DIFF);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, "aws-access-key-id");
  assert.equal(findings[0].filePath, "config.js");
  assert.equal(findings[0].line, 2);
});

test("scanDiffText ignores deleted files", () => {
  const deletionDiff = `diff --git a/secret.txt b/secret.txt
deleted file mode 100644
index b6fc4c6..0000000
--- a/secret.txt
+++ /dev/null
@@ -1,1 +0,0 @@
-const key = "AKIAABCDEFGHIJKLMNOP";
`;
  const findings = scanDiffText(deletionDiff);
  assert.equal(findings.length, 0);
});
