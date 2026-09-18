"use strict";

function usesMaxCompletionTokens(deployment) {
  const name = String(deployment || "").trim().toLowerCase();
  return /^(gpt-5|o[134])(?:[.\-_]|$)/.test(name);
}

function buildAzureOpenAIChatBody({
  messages,
  deployment,
  temperature,
  topP,
  maxTokens,
  responseFormat,
}) {
  const body = {
    messages,
    temperature,
    top_p: topP,
    ...(responseFormat ? { response_format: responseFormat } : {}),
  };

  if (maxTokens) {
    const tokenParam = usesMaxCompletionTokens(deployment)
      ? "max_completion_tokens"
      : "max_tokens";
    body[tokenParam] = maxTokens;
  }

  return body;
}

module.exports = {
  buildAzureOpenAIChatBody,
  usesMaxCompletionTokens,
};
