#!/usr/bin/env bash
# Best-effort: ridger and houle deploy to the same Infomaniak host but their
# `production-deploy` concurrency groups are per repository, so wait until no
# houle build-and-deploy run is queued / in progress (max 20 min) before this
# repo pushes or dispatches its own deploy. Never fails the job: when the API
# call fails (token without access to the houle repo) it warns and returns.
#
#   GH_TOKEN=<PAT> bash scripts/wait-for-houle-deploy.sh
set -uo pipefail

HOULE_REPO="${HOULE_REPO:-samuelhalff/houle-ai-website}"
WORKFLOW="${HOULE_WORKFLOW:-build-and-deploy.yml}"
MAX_WAIT="${MAX_WAIT_SECONDS:-1200}"
STEP="${POLL_SECONDS:-30}"

active() {
  local n=0 s out
  for s in queued in_progress; do
    out=$(gh api "repos/${HOULE_REPO}/actions/workflows/${WORKFLOW}/runs?status=${s}&per_page=1" --jq '.total_count' 2>&1) || { echo "api-error: $out" >&2; return 2; }
    n=$((n + out))
  done
  echo "$n"
}

waited=0
while :; do
  n=$(active)
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "::warning::Cannot read ${HOULE_REPO} deploy runs (no access?); continuing without waiting for the shared host."
    exit 0
  fi
  if [ "$n" -eq 0 ]; then
    echo "No houle deploy running; proceeding."
    exit 0
  fi
  if [ "$waited" -ge "$MAX_WAIT" ]; then
    echo "::warning::houle deploy still active after ${MAX_WAIT}s; proceeding anyway."
    exit 0
  fi
  echo "houle deploy active (${n}); waiting ${STEP}s (${waited}/${MAX_WAIT}s)"
  sleep "$STEP"
  waited=$((waited + STEP))
done
