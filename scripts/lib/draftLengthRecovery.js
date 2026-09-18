"use strict";

function buildLengthRecoveryPlan(options = {}) {
  const currentWords = Math.max(0, parseInt(options.currentWords || "0", 10) || 0);
  const targetMinWords = Math.max(
    1500,
    parseInt(options.minWords || "1500", 10) || 1500,
  );
  const attempt = Math.max(1, parseInt(options.attempt || "1", 10) || 1);
  const missingWords = Math.max(0, targetMinWords - currentWords);
  const safetyBuffer = 400 + (attempt - 1) * 150;
  const addAtLeastWords = Math.max(600, missingWords + safetyBuffer);
  const uncappedMaxTokens = Math.max(
    3072,
    Math.ceil(addAtLeastWords * 2.2),
  );
  const requestedMaxTokens =
    Number.isFinite(options.maxTokens) && options.maxTokens > 0
      ? Math.min(options.maxTokens, uncappedMaxTokens)
      : uncappedMaxTokens;

  return {
    currentWords,
    targetMinWords,
    missingWords,
    addAtLeastWords,
    requestedMaxTokens,
  };
}

module.exports = {
  buildLengthRecoveryPlan,
};
