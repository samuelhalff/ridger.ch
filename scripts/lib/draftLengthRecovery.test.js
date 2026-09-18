const test = require("node:test");
const assert = require("node:assert/strict");

const { buildLengthRecoveryPlan } = require("./draftLengthRecovery");

test("buildLengthRecoveryPlan strengthens append targets above the missing words", () => {
  assert.deepEqual(
    buildLengthRecoveryPlan({
      currentWords: 1256,
      minWords: 1500,
      maxTokens: 6144,
      attempt: 1,
    }),
    {
      currentWords: 1256,
      targetMinWords: 1500,
      missingWords: 244,
      addAtLeastWords: 644,
      requestedMaxTokens: 3072,
    },
  );
});

test("buildLengthRecoveryPlan escalates buffer on repeated shortfalls", () => {
  assert.deepEqual(
    buildLengthRecoveryPlan({
      currentWords: 1256,
      minWords: 1500,
      maxTokens: 6144,
      attempt: 2,
    }),
    {
      currentWords: 1256,
      targetMinWords: 1500,
      missingWords: 244,
      addAtLeastWords: 794,
      requestedMaxTokens: 3072,
    },
  );
});

test("buildLengthRecoveryPlan caps the requested append tokens at the overall limit", () => {
  assert.deepEqual(
    buildLengthRecoveryPlan({
      currentWords: 100,
      minWords: 1500,
      maxTokens: 2500,
      attempt: 3,
    }),
    {
      currentWords: 100,
      targetMinWords: 1500,
      missingWords: 1400,
      addAtLeastWords: 2100,
      requestedMaxTokens: 2500,
    },
  );
});
