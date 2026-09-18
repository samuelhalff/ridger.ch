#!/usr/bin/env node
// Create a draft or send an email as samuel.halff@ark-fid.ch via Microsoft Graph (app-only).
//
// Usage:
//   node send_mail.mjs --to a@b.com --subject "..." --body-file draft.txt --dry-run
//   node send_mail.mjs --to a@b.com --subject "..." --body-file draft.txt --draft
//   node send_mail.mjs --to a@b.com --subject "..." --body-file draft.txt --send
//
// --draft is the default. --send requires the flag to be passed explicitly.

import { readFileSync } from "node:fs";
import { getToken, GRAPH_SCOPE } from "./msauth.mjs";

const GRAPH = "https://graph.microsoft.com/v1.0";
const DEFAULT_FROM = process.env.ARK_MAIL_FROM || "samuel.halff@ark-fid.ch";

function parseArgs(argv) {
  const out = { to: [], cc: [], bcc: [], mode: "draft" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--to": out.to.push(...next().split(",").map((s) => s.trim()).filter(Boolean)); break;
      case "--cc": out.cc.push(...next().split(",").map((s) => s.trim()).filter(Boolean)); break;
      case "--bcc": out.bcc.push(...next().split(",").map((s) => s.trim()).filter(Boolean)); break;
      case "--subject": out.subject = next(); break;
      case "--body": out.body = next(); break;
      case "--body-file": out.body = readFileSync(next(), "utf8"); break;
      case "--from": out.from = next(); break;
      case "--html": out.html = true; break;
      case "--draft": out.mode = "draft"; break;
      case "--send": out.mode = "send"; break;
      case "--dry-run": out.mode = "dry-run"; break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

const recipients = (list) => list.map((address) => ({ emailAddress: { address } }));

async function graph(token, method, path, payload) {
  const res = await fetch(`${GRAPH}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Graph ${method} ${path} failed (${res.status}): ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const from = args.from || DEFAULT_FROM;

  if (!args.to.length) throw new Error("--to is required");
  if (!args.subject) throw new Error("--subject is required");
  if (!args.body) throw new Error("--body or --body-file is required");

  const message = {
    subject: args.subject,
    body: { contentType: args.html ? "HTML" : "Text", content: args.body },
    toRecipients: recipients(args.to),
    ...(args.cc.length ? { ccRecipients: recipients(args.cc) } : {}),
    ...(args.bcc.length ? { bccRecipients: recipients(args.bcc) } : {}),
  };

  if (args.mode === "dry-run") {
    console.log(`From:    ${from}`);
    console.log(`To:      ${args.to.join(", ")}`);
    if (args.cc.length) console.log(`Cc:      ${args.cc.join(", ")}`);
    if (args.bcc.length) console.log(`Bcc:     ${args.bcc.join(", ")}`);
    console.log(`Subject: ${args.subject}`);
    console.log("");
    console.log(args.body);
    console.log("\n[dry run — nothing was created or sent]");
    return;
  }

  const token = await getToken(GRAPH_SCOPE);
  const mailbox = `/users/${encodeURIComponent(from)}`;

  if (args.mode === "draft") {
    const created = await graph(token, "POST", `${mailbox}/messages`, message);
    console.log(`Draft created in ${from}: ${created.webLink || created.id}`);
    return;
  }

  await graph(token, "POST", `${mailbox}/sendMail`, { message, saveToSentItems: true });
  console.log(`Sent from ${from} to ${args.to.join(", ")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
