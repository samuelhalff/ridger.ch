import assert from "node:assert/strict";
import test from "node:test";

import {
  AGENT_CHAT_MESSAGE_MAX_LENGTH,
  parseAgentChatRequest,
} from "./request-validation.ts";

const validBasePayload = {
  email: "client@example.com",
  leadId: "lead-1",
  leadToken: "t".repeat(64),
};

test("parseAgentChatRequest reports oversized last user message as payload_too_large", () => {
  const result = parseAgentChatRequest({
    ...validBasePayload,
    messages: [
      { role: "user", content: "hello" },
      {
        role: "user",
        content: "x".repeat(AGENT_CHAT_MESSAGE_MAX_LENGTH + 1),
      },
    ],
  });

  assert.equal(result.success, false);
  assert.equal(result.error, "payload_too_large");
  assert.equal(result.status, 413);
});

test("parseAgentChatRequest accepts oversized assistant messages in history", () => {
  const result = parseAgentChatRequest({
    ...validBasePayload,
    messages: [
      {
        role: "assistant",
        content: "x".repeat(AGENT_CHAT_MESSAGE_MAX_LENGTH * 2),
      },
      { role: "user", content: "short reply" },
    ],
  });

  assert.equal(result.success, true);
});

test("parseAgentChatRequest accepts messages up to the configured chat limit", () => {
  const result = parseAgentChatRequest({
    ...validBasePayload,
    messages: [
      {
        role: "user",
        content: "x".repeat(AGENT_CHAT_MESSAGE_MAX_LENGTH),
      },
    ],
  });

  assert.equal(result.success, true);
});

test("parseAgentChatRequest reports missing lead credentials as lead_required", () => {
  const result = parseAgentChatRequest({
    email: "client@example.com",
    messages: [{ role: "user", content: "hello" }],
  });

  assert.equal(result.success, false);
  assert.equal(result.error, "lead_required");
  assert.equal(result.status, 401);
});
