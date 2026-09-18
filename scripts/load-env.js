const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const lockedKeys = new Set(Object.keys(process.env));

const parseEnvLine = (line) => {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return null;
  const key = match[1];
  let value = match[2] ?? "";
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  } else if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  }
  return { key, value };
};

const loadEnvFile = (filename, allowOverride) => {
  if (!fs.existsSync(filename)) return;
  const content = fs.readFileSync(filename, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (lockedKeys.has(parsed.key)) continue;
    if (!allowOverride && Object.prototype.hasOwnProperty.call(process.env, parsed.key)) {
      continue;
    }
    process.env[parsed.key] = parsed.value;
  }
};

loadEnvFile(path.join(projectRoot, ".env"), false);
loadEnvFile(path.join(projectRoot, ".env.local"), true);
