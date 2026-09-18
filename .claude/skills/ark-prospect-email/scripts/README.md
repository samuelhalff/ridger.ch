# Scripts — setup

Both scripts are plain Node (>= 20), zero dependencies. They authenticate to Microsoft
Entra ID app-only, preferring a **certificate** over a client secret.

## Credentials

```bash
export AZURE_TENANT_ID=...
export AZURE_CLIENT_ID=...            # the app registration

# Certificate (preferred)
export AZURE_CLIENT_CERTIFICATE_PATH=/path/to/ark-mail.pem   # private key (+ certificate)
export AZURE_CLIENT_CERTIFICATE_PASSWORD=...                 # only if the key is encrypted
# export AZURE_CLIENT_CERTIFICATE_THUMBPRINT=ABCD...         # only if the PEM has no cert block

# Or a secret, as a fallback
export AZURE_CLIENT_SECRET=...
# or: export AZURE_CREDENTIALS='{"tenantId":"...","clientId":"...","clientSecret":"..."}'
```

Generating a certificate and registering it:

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 730 -nodes \
  -subj "/CN=ark-prospect-email"
cat key.pem cert.pem > ark-mail.pem      # this combined file is AZURE_CLIENT_CERTIFICATE_PATH
```

Upload `cert.pem` under the app registration → *Certificates & secrets* → *Certificates*.
Keep `ark-mail.pem` outside the repository.

## send_mail.mjs

Needs Microsoft Graph **application** permission `Mail.Send` with admin consent, on the
ark-fid.ch tenant.

`Mail.Send` as an application permission grants send-as for *every* mailbox in the tenant.
Narrow it with an Exchange application access policy so the app can only act on Samuel's
mailbox:

```powershell
New-ApplicationAccessPolicy -AppId <AZURE_CLIENT_ID> `
  -PolicyScopeGroupId samuel.halff@ark-fid.ch `
  -AccessRight RestrictAccess `
  -Description "ark-prospect-email skill"
```

Add `Mail.ReadWrite` as well if you want `--draft` to work (drafts are created with
`POST /users/{upn}/messages`).

Override the sender with `ARK_MAIL_FROM` or `--from`.

## fetch_quote_instructions.mjs

Reads the Foundry agent definition. Needs, on the **permagest/pbm** tenant:

- `AZURE_AGENT_ENDPOINT` — the Foundry project endpoint
- `AZURE_AGENT_CHAT_NAME` — e.g. `ark-quote-agent:21`
- the app registration granted a read role on the Foundry project (`Azure AI User`
  or `Reader` at the project scope)

Note this is a **different tenant** from the mail tenant. If the two use different app
registrations, run each script with its own environment — e.g. keep two files,
`.env.mail` and `.env.foundry`, and source the right one.

Run `node fetch_quote_instructions.mjs --print` to inspect the instructions without
overwriting `references/quote-instructions.md`.
