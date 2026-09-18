const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildAzureOpenAIChatBody,
  usesMaxCompletionTokens,
} = require("./azureOpenAIChatOptions");

test("uses max_completion_tokens for GPT-5 deployments", () => {
  assert.equal(usesMaxCompletionTokens("gpt-5.2"), true);

  const body = buildAzureOpenAIChatBody({
    deployment: "gpt-5.2",
    messages: [{ role: "user", content: "Draft JSON" }],
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 6144,
    responseFormat: { type: "json_object" },
  });

  assert.equal(body.max_completion_tokens, 6144);
  assert.equal("max_tokens" in body, false);
});

test("keeps max_tokens for GPT-4 style deployments", () => {
  const body = buildAzureOpenAIChatBody({
    deployment: "gpt-4.1",
    messages: [{ role: "user", content: "Translate JSON" }],
    temperature: 0.2,
    topP: 0.9,
    maxTokens: 2048,
    responseFormat: { type: "json_object" },
  });

  assert.equal(body.max_tokens, 2048);
  assert.equal("max_completion_tokens" in body, false);
});
