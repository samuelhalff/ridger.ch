"use strict";

function extractOpenAIMetrics(rawResponse, options = {}) {
  const { requestedMaxTokens = null } = options;
  const choice = Array.isArray(rawResponse?.choices)
    ? rawResponse.choices[0]
    : null;
  const usage = rawResponse?.usage || {};

  return {
    model:
      typeof rawResponse?.model === "string" ? rawResponse.model : "unknown",
    finishReason:
      typeof choice?.finish_reason === "string" ? choice.finish_reason : "unknown",
    requestedMaxTokens:
      Number.isFinite(requestedMaxTokens) && requestedMaxTokens > 0
        ? requestedMaxTokens
        : null,
    promptTokens: Number.isFinite(usage.prompt_tokens) ? usage.prompt_tokens : null,
    completionTokens: Number.isFinite(usage.completion_tokens)
      ? usage.completion_tokens
      : null,
    totalTokens: Number.isFinite(usage.total_tokens) ? usage.total_tokens : null,
  };
}

function formatOpenAIMetricsLog(label, metrics) {
  const parts = ["[openai]"];
  if (label) parts.push(label);
  parts.push(`model=${metrics?.model || "unknown"}`);
  parts.push(`finish_reason=${metrics?.finishReason || "unknown"}`);

  if (Number.isFinite(metrics?.promptTokens)) {
    parts.push(`prompt_tokens=${metrics.promptTokens}`);
  }
  if (Number.isFinite(metrics?.completionTokens)) {
    parts.push(`completion_tokens=${metrics.completionTokens}`);
  }
  if (Number.isFinite(metrics?.totalTokens)) {
    parts.push(`total_tokens=${metrics.totalTokens}`);
  }
  if (Number.isFinite(metrics?.requestedMaxTokens)) {
    parts.push(`requested_max_tokens=${metrics.requestedMaxTokens}`);
  }

  return parts.join(" ");
}

function formatWordProgressLog(label, options = {}) {
  const { beforeWords = 0, afterWords = 0, minWords = null } = options;
  const delta = afterWords - beforeWords;
  const parts = [
    "[draft]",
    label || "words",
    "words",
    `${beforeWords} -> ${afterWords}`,
    `(delta ${delta >= 0 ? "+" : ""}${delta}`,
  ];

  if (Number.isFinite(minWords) && minWords > 0) {
    parts[parts.length - 1] += `, min ${minWords}`;
  }
  parts[parts.length - 1] += ")";
  return parts.join(" ");
}

module.exports = {
  extractOpenAIMetrics,
  formatOpenAIMetricsLog,
  formatWordProgressLog,
};
