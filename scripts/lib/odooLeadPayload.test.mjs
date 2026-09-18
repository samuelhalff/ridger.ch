import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOdooLeadValues,
  formatLeadDescription,
  plainTextToHtml,
} from "../../src/lib/odoo/leads.ts";

test("buildOdooLeadValues maps website lead data to existing Odoo fields", () => {
  const values = buildOdooLeadValues(
    {
      name: "Sam",
      email: "contact@ridger.ch",
      companyName: "Ridger",
      phone: "+41 22 000 00 00",
      message: "Need accounting help",
      subject: "Accounting",
      sourceDetail: "instant_quote",
      pageUrl: "https://ridger.ch/fr/agent/",
    },
    new Set(["source_id"]),
  );

  assert.equal(values.name, "Accounting - Sam");
  assert.equal(values.contact_name, "Sam");
  assert.equal(values.email_from, "contact@ridger.ch");
  assert.equal(values.partner_name, "Ridger");
  assert.equal(values.phone, "+41 22 000 00 00");
  assert.equal(values.type, "opportunity");
  assert.equal(values.source_id, undefined);
  assert.match(String(values.description), /Need accounting help/);
  assert.match(String(values.description), /https:\/\/ridger.ch\/fr\/agent\//);
});

test("buildOdooLeadValues maps the native source_id when available", () => {
  const values = buildOdooLeadValues(
    {
      name: "Sam",
      email: "contact@ridger.ch",
      sourceDetail: "contact_form",
      sourceId: 7,
    },
    new Set(["source_id"]),
  );

  assert.equal(values.source_id, 7);
});

test("buildOdooLeadValues assigns the configured Odoo user when user_id exists", () => {
  const values = buildOdooLeadValues(
    {
      name: "Sam",
      email: "prospect@example.com",
      sourceDetail: "instant_quote",
      assignedUserId: 42,
    },
    new Set(["user_id"]),
  );

  assert.equal(values.user_id, 42);
});

test("formatLeadDescription keeps the handoff readable", () => {
  const description = formatLeadDescription({
    name: "Sam",
    email: "contact@ridger.ch",
    subject: "Tax",
    message: "Question about VAT",
    transcript: [
      { role: "user", content: "Bonjour" },
      { role: "assistant", content: "Bonjour, comment aider ?" },
    ],
  });

  assert.match(description, /Source: ridger.ch/);
  assert.match(description, /Subject: Tax/);
  assert.match(description, /Conversation/);
  assert.match(description, /assistant: Bonjour, comment aider/);
});

test("plainTextToHtml escapes user content for Odoo chatter", () => {
  assert.equal(
    plainTextToHtml("<script>alert(1)</script>\nNext"),
    "&lt;script&gt;alert(1)&lt;/script&gt;<br>Next",
  );
});
