#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SCAN_DIRS = ["app", path.join("src", "components")];
const LOCALES = new Set(["/fr/", "/en/", "/de/", "/es/", "/pt/"]);
const FILE_EXT_RE = /\.[a-zA-Z0-9]{1,8}(?:[?#].*)?$/;

function walk(dir, files = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return files;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(rel, files);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      files.push(rel);
    }
  }
  return files;
}

function shouldIgnore(href) {
  return (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href.startsWith("/_next/") ||
    href.startsWith("/assets/") ||
    href.startsWith("/api/") ||
    href.startsWith("/.well-known/") ||
    href.startsWith("/#") ||
    FILE_EXT_RE.test(href)
  );
}

function hasLocalePrefix(href) {
  if (href === "/") return false;
  return Array.from(LOCALES).some((localePrefix) => href.startsWith(localePrefix));
}

const violations = [];
const hrefPattern = /href\s*=\s*(['"])(\/[^'"]*)\1/g;

for (const file of SCAN_DIRS.flatMap((dir) => walk(dir))) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  let match;
  while ((match = hrefPattern.exec(source))) {
    const href = match[2];
    if (shouldIgnore(href)) continue;
    const pathOnly = href.split(/[?#]/, 1)[0];
    const lacksLocale = !hasLocalePrefix(pathOnly);
    const lacksTrailingSlash = pathOnly !== "/" && !pathOnly.endsWith("/");
    if (lacksLocale || lacksTrailingSlash) {
      const line = source.slice(0, match.index).split("\n").length;
      violations.push({
        file,
        line,
        href,
        reason: [
          lacksLocale ? "missing locale prefix" : null,
          lacksTrailingSlash ? "missing trailing slash" : null,
        ]
          .filter(Boolean)
          .join(", "),
      });
    }
  }
}

if (violations.length) {
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line} href="${violation.href}" (${violation.reason})`,
    );
  }
  console.error(`Internal link lint failed: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("Internal link lint: 0 violations");
