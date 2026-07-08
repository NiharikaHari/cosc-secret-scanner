import { test } from "node:test";
import assert from "node:assert/strict";
import { shannonEntropy, findHighEntropyTokens } from "../src/core/entropy.js";

test("shannonEntropy is 0 for a repeated character", () => {
  assert.equal(shannonEntropy("aaaaaaaa"), 0);
});

test("shannonEntropy is higher for random-looking strings", () => {
  const random = shannonEntropy("aZ9$kQ2!wP7&mX4#");
  const repeated = shannonEntropy("aaaaaaaaaaaaaaaa");
  assert.ok(random > repeated);
});

test("findHighEntropyTokens flags a long random-looking base64 blob", () => {
  const line = 'const secretBlob = "kL9x2Qz7mP4vR8tY1wN6bJ3hF5cD0aE";';
  const matches = findHighEntropyTokens(line);
  assert.ok(matches.length > 0);
});

test("findHighEntropyTokens does not flag ordinary prose", () => {
  const line = "This is just a normal sentence with regular words in it.";
  const matches = findHighEntropyTokens(line);
  assert.equal(matches.length, 0);
});
