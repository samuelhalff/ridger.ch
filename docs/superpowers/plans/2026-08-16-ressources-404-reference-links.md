# Resources 404 Reference Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace confirmed dead Zefix links in all localized resource article JSON files with a verified official Zefix landing page.

**Architecture:** Keep the existing `ressources.json` schema unchanged. Perform a deterministic URL-value replacement across the five locale files, then validate the resulting JSON and URLs with existing project checks.

**Tech Stack:** Next.js repository, JSON locale content, Node.js 20 scripts, npm lint/test/build, Git.

---

### Task 1: Replace confirmed dead references

**Files:**
- Modify: `src/translations/de/ressources.json`
- Modify: `src/translations/en/ressources.json`
- Modify: `src/translations/es/ressources.json`
- Modify: `src/translations/fr/ressources.json`
- Modify: `src/translations/pt/ressources.json`

- [ ] Replace each confirmed dead URL with `https://zefix.ch/fr/search/entity/welcome`:
  - `https://www.zefix.ch/fr/search/entity/welcome`
  - `https://www.zefix.admin.ch/fr/search/entity/list/firm/1232284`
  - `https://www.zefix.ch/fr/search`
- [ ] Preserve all article titles, prose, labels, reference counts, and JSON formatting.

### Task 2: Verify content and repository behavior

**Files:**
- Test: `src/translations/*/ressources.json`

- [ ] Confirm the three old URLs occur zero times and the replacement occurs in all five locale files.
- [ ] Fetch the replacement URL and confirm HTTP 200.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Attempt `npm run build` and record any environment blocker.

### Task 3: Commit and publish

**Files:**
- Commit the modified locale JSON files and validation documentation.

- [ ] Review `git diff` and `git status` for only intended changes.
- [ ] Commit with `fix(ressources): replace dead article references`.
- [ ] Push `main` to `origin`.
- [ ] Verify the pushed commit and clean working tree.
