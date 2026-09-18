// Production entrypoint for the Ridger tenant (shipped by prepare-artifact.sh).
// The Next standalone server reads only process.env — it never sources the
// linked .env, which once made it default to :3000 and crash-loop against the
// houle app (2026-09-18). Load the env file, pin the tenant port, then boot.
"use strict";
const fs = require("fs");
const path = require("path");
try {
  const envFile = path.join(__dirname, ".env");
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {}
if (!process.env.PORT || process.env.PORT === "3000") process.env.PORT = "5001";
process.env.HOSTNAME = "127.0.0.1";
require("./server-app.js");
