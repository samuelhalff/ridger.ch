import test from "node:test";
import assert from "node:assert/strict";

import {
  isFreshCacheEntry,
  runWithTimeout,
} from "../../src/lib/agent/resilience.ts";

test("isFreshCacheEntry expires entries at the configured ttl", () => {
  const entry = { checkedAt: 1_000 };

  assert.equal(isFreshCacheEntry(entry, 1_999, 1_000), true);
  assert.equal(isFreshCacheEntry(entry, 2_000, 1_000), false);
});

test("runWithTimeout aborts slow operations", async () => {
  await assert.rejects(
    runWithTimeout(
      (signal) =>
        new Promise((_, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        }),
      10,
      "slow_task",
    ),
    /slow_task_timeout/,
  );
});
