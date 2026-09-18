const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

test("loadRessourcesData reads deployed ressources JSON from process.cwd()", async () => {
  const { loadRessourcesData } = await import("../src/lib/ressources.ts");
  const originalCwd = process.cwd();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-ressources-"));

  try {
    const frDir = path.join(tmp, "src", "translations", "fr");
    fs.mkdirSync(frDir, { recursive: true });
    fs.writeFileSync(
      path.join(frDir, "ressources.json"),
      JSON.stringify({
        IntroTitle: "Ressources runtime",
        Articles: [{ slug: "runtime-json", title: "Runtime JSON" }],
      }),
    );

    process.chdir(tmp);

    const ressources = loadRessourcesData("fr");
    assert.equal(ressources.IntroTitle, "Ressources runtime");
    assert.deepEqual(ressources.Articles, [
      { slug: "runtime-json", title: "Runtime JSON" },
    ]);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("loadRessourcesData falls back to French when a locale file is missing", async () => {
  const { loadRessourcesData } = await import("../src/lib/ressources.ts");
  const originalCwd = process.cwd();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-ressources-"));

  try {
    const frDir = path.join(tmp, "src", "translations", "fr");
    fs.mkdirSync(frDir, { recursive: true });
    fs.writeFileSync(
      path.join(frDir, "ressources.json"),
      JSON.stringify({
        IntroTitle: "Fallback FR",
        Articles: [{ slug: "fallback-json", title: "Fallback JSON" }],
      }),
    );

    process.chdir(tmp);

    const ressources = loadRessourcesData("de");
    assert.equal(ressources.IntroTitle, "Fallback FR");
    assert.equal(ressources.Articles[0].slug, "fallback-json");
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
