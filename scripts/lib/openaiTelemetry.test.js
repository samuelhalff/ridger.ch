const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractOpenAIMetrics,
  formatOpenAIMetricsLog,
  formatWordProgressLog,
} = require("./openaiTelemetry");

test("extractOpenAIMetrics returns finish reason and token usage", () => {
  const rawResponse = {
    model: "gpt-4o",
    choices: [
      {
        finish_reason: "length",
        message: {
          content: '{"newArticle":{"content":"..."}}',
        },
      },
    ],
    usage: {
      prompt_tokens: 1820,
      completion_tokens: 940,
      total_tokens: 2760,
    },
  };

  assert.deepEqual(
    extractOpenAIMetrics(rawResponse, { requestedMaxTokens: 6144 }),
    {
      model: "gpt-4o",
      finishReason: "length",
      requestedMaxTokens: 6144,
      promptTokens: 1820,
      completionTokens: 940,
      totalTokens: 2760,
    },
  );
});

test("formatOpenAIMetricsLog includes requested max tokens and finish reason", () => {
  const line = formatOpenAIMetricsLog("draft attempt 1/3", {
    model: "gpt-4o",
    finishReason: "stop",
    requestedMaxTokens: 6144,
    promptTokens: 1810,
    completionTokens: 2210,
    totalTokens: 4020,
  });

  assert.equal(
    line,
    "[openai] draft attempt 1/3 model=gpt-4o finish_reason=stop prompt_tokens=1810 completion_tokens=2210 total_tokens=4020 requested_max_tokens=6144",
  );
});

test("formatWordProgressLog shows growth against the minimum", () => {
  const line = formatWordProgressLog("append", {
    beforeWords: 1256,
    afterWords: 1714,
    minWords: 1500,
  });

  assert.equal(
    line,
    "[draft] append words 1256 -> 1714 (delta +458, min 1500)",
  );
});
