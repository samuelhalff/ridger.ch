"use strict";

/**
 * All-or-nothing replacement of several JSON files.
 *
 * 1. Serialize every entry and parse it back (and run the optional validate
 *    hook on the parsed copy) — nothing touches the disk until all pass.
 * 2. Write each serialization to a temp file next to its target (same
 *    filesystem, so rename is atomic) and fsync it.
 * 3. Back up the current targets, then rename the temp files into place.
 *    If any rename fails, every already-replaced target is restored from its
 *    backup, so the tree is left exactly as it was.
 * Temp files and backups are always removed.
 */

const fs = require("fs");
const path = require("path");

function serialize(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/**
 * @param {{file: string, data: unknown}[]} entries
 * @param {{validate?: (parsed: unknown, file: string) => void, fsImpl?: typeof fs}} [opts]
 */
function writeJsonFilesAtomically(entries, { validate, fsImpl = fs } = {}) {
  const tag = `${process.pid}-${Date.now()}`;

  // 1. Serialize + validate everything in memory.
  const prepared = entries.map(({ file, data }) => {
    const text = serialize(data);
    const parsed = JSON.parse(text);
    if (typeof validate === "function") validate(parsed, file);
    return { file, text, tmp: path.join(path.dirname(file), `.${path.basename(file)}.${tag}.tmp`), bak: null };
  });

  const cleanup = () => {
    for (const p of prepared) {
      for (const f of [p.tmp, p.bak]) {
        if (!f) continue;
        try {
          fsImpl.rmSync(f, { force: true });
        } catch {
          // best effort
        }
      }
    }
  };

  try {
    // 2. Temp files, fsynced and read back.
    for (const p of prepared) {
      const fd = fsImpl.openSync(p.tmp, "w");
      try {
        fsImpl.writeSync(fd, p.text);
        fsImpl.fsyncSync(fd);
      } finally {
        fsImpl.closeSync(fd);
      }
      if (fsImpl.readFileSync(p.tmp, "utf8") !== p.text) throw new Error(`temp write mismatch for ${p.file}`);
    }

    // 3. Backups of the current targets.
    for (const p of prepared) {
      if (fsImpl.existsSync(p.file)) {
        p.bak = path.join(path.dirname(p.file), `.${path.basename(p.file)}.${tag}.bak`);
        fsImpl.copyFileSync(p.file, p.bak);
      }
    }

    // 4. Swap in; roll back on any failure.
    const done = [];
    try {
      for (const p of prepared) {
        fsImpl.renameSync(p.tmp, p.file);
        done.push(p);
      }
    } catch (error) {
      for (const p of done.reverse()) {
        try {
          if (p.bak) fsImpl.copyFileSync(p.bak, p.file);
          else fsImpl.rmSync(p.file, { force: true });
        } catch {
          // keep restoring the others
        }
      }
      throw error;
    }
  } finally {
    cleanup();
  }
}

module.exports = { writeJsonFilesAtomically, serialize };
