#!/usr/bin/env bash
# Full validation gate for a pipeline-generated article, run on the exact tree
# that will be pushed. Used by .github/workflows/ai-ressources.yml before the
# first push AND again after every rebase onto a moved main.
#
#   SLUG=<slug> bash scripts/article-gate.sh
#
# Must run WITHOUT push credentials in the environment.
set -euo pipefail

: "${SLUG:?SLUG is required}"
export REQUIRE_TRANSLATIONS=1

echo "::group::Article validators ($SLUG)"
node scripts/validate-article-seo.js --slug "$SLUG"
node scripts/validate-latest-article-guardrails.js --slug "$SLUG"
node scripts/validate-reference-source-policy.js --all-locales --slug "$SLUG"
node scripts/validate-article-facts.js
node scripts/validate-article-translations.js > "${RUNNER_TEMP:-/tmp}/translations-report.txt"
node scripts/fix-article-internal-links.js --check
echo "::endgroup::"

echo "::group::npm test"
npm test
echo "::endgroup::"

echo "::group::npm run build"
npm run build
echo "::endgroup::"
