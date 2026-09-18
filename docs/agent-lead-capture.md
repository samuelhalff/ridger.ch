# Website Lead Capture

Website leads are captured in Odoo first. SharePoint remains a minimal token store for the instant-quote chat retry flow.

## Systems

- **Azure AI Foundry (chat):** permagest/pbm tenant (`AZURE_*` env vars)
- **Odoo lead handoff:** ark-fid Odoo (`ODOO_*` env vars)
- **Minimal chat token storage:** ark tenant SharePoint (`MSGRAPH_*` and `SP_*` env vars)

The Odoo token must stay server-side. Contact forms submit to `/api/contact`; the browser never receives Odoo or Formspark credentials.

## Odoo Mapping

- Model: `crm.lead`
- Owner: user matched by `ODOO_LEAD_DEFAULT_USER`, default `samuel`
- Source: native Odoo `source_id`, resolved from `ODOO_LEAD_SOURCE_NAME` (`ark-fid.ch` by default) when that `utm.source` exists
- Detail: `instant_quote` or `contact_form` is included in the description
- Handoff: form/chat context in `description`
- Follow-up: successful quote-agent exchanges are appended to the Odoo lead chatter via `message_post`

## Minimal SharePoint Setup

- **Site:** `https://arkfiduciaire.sharepoint.com/sites/CRM`
- **List:** `Prospects`
- **Required columns (internal names):**
  - `Title`
  - `Email`
  - `LeadTokenHash`
  - `Messages`

The app write path now keeps SharePoint readable by writing only the core token/status fields. Older attribution columns can remain in the list, but they are no longer required by the app.

## Environment Variables

```bash
# Azure AI Foundry (permagest/pbm)
AZURE_AGENT_ENDPOINT=
AZURE_AGENT_CHAT_NAME=
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_CREDENTIALS=

# Odoo lead capture
ODOO_OWN_URL=
ODOO_OWN_DB=
ODOO_OWN_TOKEN=
ODOO_LEAD_DEFAULT_USER=samuel
ODOO_LEAD_SOURCE_NAME=ark-fid.ch
ODOO_CAPTURE_INTERNAL_LEADS=0

# SharePoint token storage (ark tenant)
MSGRAPH_TENANT_ID=
MSGRAPH_CLIENT_ID=
MSGRAPH_CLIENT_SECRET=
AGENT_LEAD_TOKEN_SECRET=<random-32+ chars>
SP_SITE_HOSTNAME=arkfiduciaire.sharepoint.com
SP_SITE_PATH=/sites/CRM
SP_LEADS_LIST_NAME=Prospects
SP_LEADS_FIELD_EMAIL=Email
SP_LEADS_FIELD_TOKEN_HASH=LeadTokenHash
SP_LEADS_FIELD_TRANSCRIPT=Messages

# Optional fallback/contact copy
FORMSPARK_ACTION_URL=
```

## SharePoint Permissions

Grant the crm-dev app Microsoft Graph permissions:

- Recommended: `Sites.Selected` with access granted to the CRM site
- Alternative: `Sites.ReadWrite.All`

Admin consent must be applied.
