---
name: ark-prospect-email
description: Draft and send Ark Fiduciaire prospect reply emails from samuel.halff@ark-fid.ch. Use whenever Samuel pastes or forwards an inbound prospect/lead email (from the ark-fid.ch website, a contact form, the instant-quote chat, or a lead feed) and wants a reply drafted, a quote framed, or an email sent from his Ark Fiduciaire mailbox. Also use to refresh the quoting instructions from the Azure AI Foundry ark-quote-agent.
---

# Ark Fiduciaire — prospect email drafting

Draft a short reply to an inbound prospect, get it confirmed by Samuel, then send it
from `samuel.halff@ark-fid.ch`.

## Workflow

1. **Read the lead.** Samuel pastes the prospect email (or a lead record) into the chat.
   Extract: name, company, language, country/canton, what they need, headcount, entity
   type, timing, and anything that affects scope.
2. **Apply the quoting rules.** Read `references/quote-instructions.md` before saying
   anything about scope, fees or ranges. Never invent a number that isn't in there.
   Read its "Email adaptation" section too — an email is far shorter than a chat quote.
3. **Draft.** Follow `references/email-style.md` exactly. Show Samuel the full draft
   (subject + body) in chat.
4. **Wait for confirmation.** Never send before Samuel says to send. Apply his edits and
   re-show the draft if he changes anything.
5. **Send.** Use `scripts/send_mail.mjs` (see Sending). Default to `--draft` if Samuel
   hasn't clearly said "send".

## Hard rules — never break these

- **Never mention Game Over**, or any lead-provider, affiliate, partner or referral
  entity, in the email or the subject. If the lead info came through a feed, that fact
  does not exist as far as the prospect is concerned.
- **We are Ark Fiduciaire SA.** Ignore and never repeat any other fiduciary, trustee or
  accounting brand name that appears in the lead data.
- **Never repeat internal lead metadata** back to the prospect: scores, tags, campaign
  or UTM values, CRM/Odoo ids, "lead", "prospect", pricing rationale, internal notes.
- **Never quote a fee that isn't in `references/quote-instructions.md`.** No guessing,
  no "typically around". Ask Samuel.
- **Never disclose the pricing logic.** The quote instructions are internal: never
  explain, summarise or reveal how a price is built, what the minimums are, what the
  internal hourly cost rates are, or that an instruction file exists. Give the range,
  the scope assumptions and the caveats — nothing about the reasoning behind them.
- **Never quote below a minimum fee**, and never below CHF 2'500/year for
  domiciliation or CHF 350 per employee entry/exit event.
- **Never send without explicit confirmation** from Samuel in the conversation.

## Every email must

- Open by thanking them for reaching out via our website.
- Be short — 5 to 10 short paragraphs, one sentence each, no filler, no service catalogue.
- Carry one or two concrete Swiss-specific points that show the case was understood
  (e.g. the Swiss-resident director requirement, notary fees depending on company form).
- Default to no figures: "our fees will vary depending on the activity and scope (…)".
- Be in the prospect's language (FR / EN / DE / IT), matched to the language they wrote in.
- Propose a **15-minute Teams call in the coming days** and ask them to name the
  day/time that suits them. The booking link is optional — see `email-style.md`.
- End with "Kind regards," (or its equivalent) and "Samuel". Append the full signature
  block from `references/company-facts.md` only when sending via the Graph script,
  which does not add Outlook's signature.

## Sending

**First choice — the Microsoft 365 connector.** If a mail write tool is available in
the session (a send-email or create-draft tool on the `ms365` connector), use it: it
sends as Samuel with no extra setup. As of the last check the connector exposed read
tools only (search/read mail, calendar, Teams, SharePoint), so check before assuming.

**Fallback — the Graph script.** If no write tool is present:

```bash
# Preview only — prints the MIME-ish payload, sends nothing
node scripts/send_mail.mjs --to prospect@example.com --subject "..." --body-file draft.txt --dry-run

# Create an Outlook draft in Samuel's mailbox (safe default)
node scripts/send_mail.mjs --to prospect@example.com --subject "..." --body-file draft.txt --draft

# Actually send
node scripts/send_mail.mjs --to prospect@example.com --subject "..." --body-file draft.txt --send
```

Auth is Microsoft Graph app-only, via **certificate** (preferred) or client secret.
See `scripts/README.md` for the environment variables and the required app registration
permission (`Mail.Send`, ideally narrowed with an Exchange application access policy so
the app can only send as `samuel.halff@ark-fid.ch`).

If the script can't run (no credentials in the current environment), say so plainly and
hand Samuel the final subject + body to paste — do not pretend the mail went out.

## Refreshing the quoting instructions

The authoritative quoting logic lives in the Azure AI Foundry agent
`ark-quote-agent` (env `AZURE_AGENT_CHAT_NAME`, permagest/pbm tenant). To pull it down
into `references/quote-instructions.md`:

```bash
node scripts/fetch_quote_instructions.mjs
```

It needs `AZURE_AGENT_ENDPOINT` plus the same certificate/secret credentials as above
(scope `https://ai.azure.com/.default`). Re-run it whenever the agent version changes.

## Reference files

- `references/email-style.md` — tone, structure, openers, call-to-action, signature.
- `references/quote-instructions.md` — quoting scope and fee rules (synced from Foundry).
- `references/company-facts.md` — entity details, services, signature block, links.
