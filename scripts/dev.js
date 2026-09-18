#!/usr/bin/env node

const { spawn } = require("node:child_process");

const child = spawn("npx", ["next", "dev", "-p", "5000"], {
  stdio: "inherit",
  cwd: process.cwd()
});

child.on("exit", (code) => {
  process.exit(code);
});
