const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "translations");

function parseArgs(argv) {
  return {
    apply: argv.includes("--apply"),
    check: argv.includes("--check") || argv.includes("--ci"),
  };
}

function listLocales() {
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !name.startsWith("."));
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, json) {
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf8");
}

function fixMalformedInternalMarkdownLinks(text) {
  if (typeof text !== "string" || text.length === 0) return text;

  let out = text;
  let safety = 0;
  const before = out;

  // Fix patterns like:
  // - [Team](/[team](/team)) -> [Team](/team)
  // - [Contact](/services/[taxes](/services/taxes)) -> [Contact](/services/taxes)
  // We run these in a loop because multiple malformed links can be nested.
  while (safety++ < 10) {
    const prev = out;

    // Case A: link target is "/[...](...)", keep the inner path.
    out = out.replace(
      /\]\(\/(?:[^\s\]\/]+)?\[[^\]]+\]\((\/[^\s)]+)\)\)/g,
      "]($1)"
    );

    // Case B: link target is "/[...](...))" (extra closing paren), keep the inner path.
    out = out.replace(
      /\]\(\/(?:[^\s\]\/]+)?\[[^\]]+\]\((\/[^\s)]+)\)\)\)/g,
      "]($1)"
    );

    // Case C: link target is "(/[x](...))" without the leading slash before bracket.
    out = out.replace(
      /\]\(\[([^\]]+)\]\((\/[^\s)]+)\)\)/g,
      "]($2)"
    );

    if (out === prev) break;
  }

  // Fix common bracketed path fragments that might appear without a full markdown link.
  // Example: /services/[taxes](/services/taxes) -> /services/taxes
  out = out.replace(
    /\/services\/\[[^\]]+\]\((\/services\/[^\s)]+)\)/g,
    "$1"
  );
  out = out.replace(/\/\[[^\]]+\]\((\/[^\s)]+)\)/g, "$1");

  return out === before ? text : out;
}

function fixRessourcesJson(json) {
  if (!json || !Array.isArray(json.Articles)) return { json, changes: 0 };
  let changes = 0;

  for (const article of json.Articles) {
    for (const key of ["title", "description", "content"]) {
      if (typeof article[key] !== "string") continue;
      const fixed = fixMalformedInternalMarkdownLinks(article[key]);
      if (fixed !== article[key]) {
        article[key] = fixed;
        changes++;
      }
    }
  }

  return { json, changes };
}

function main() {
  const { apply, check } = parseArgs(process.argv.slice(2));
  if (apply && check) {
    console.error("Use either --apply or --check, not both.");
    process.exit(2);
  }

  const locales = listLocales();
  let totalChanges = 0;
  const changedFiles = [];

  for (const locale of locales) {
    const filePath = path.join(ROOT, locale, "ressources.json");
    if (!fs.existsSync(filePath)) continue;
    const json = loadJson(filePath);
    const { json: fixedJson, changes } = fixRessourcesJson(json);
    if (changes > 0) {
      totalChanges += changes;
      changedFiles.push(`src/translations/${locale}/ressources.json`);
      if (apply) writeJson(filePath, fixedJson);
    }
  }

  if (totalChanges === 0) {
    console.log("✅ No malformed internal markdown links found.");
    return;
  }

  if (apply) {
    console.log(
      `✅ Fixed ${totalChanges} malformed internal markdown link(s) in ${changedFiles.length} file(s).`
    );
    return;
  }

  console.error(
    `❌ Found ${totalChanges} malformed internal markdown link(s) in ${changedFiles.length} file(s).`
  );
  for (const f of changedFiles) console.error(` - ${f}`);
  if (check) process.exit(1);
}

main();
