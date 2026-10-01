# Deploy / CI matrix (houle.ai · ridger.ch · ark-fid.ch · switzerlandresidency.ch)

Same file in all three Node repos (houle-ai-website, ridger.ch, ark-fid.ch). Last reviewed 2026-10-01.

## Hosts

| Site | Host | Runtime |
| --- | --- | --- |
| houle.ai | Infomaniak managed Node site 57-105000 (ContainerSSH) | tenant router `current/server.js` on :3000 → houle `server-app.js` :5010 + ridger :5001 |
| ridger.ch | same site as houle (alias), `/srv/customer/sites/ridger.ch` | child of houle's router, :5001 |
| ark-fid.ch | Infomaniak managed 57-101943 | supervisor loop → `current/server.js` |
| switzerlandresidency.ch | Infomaniak web hosting (FTPS, static export) | Apache |

**houle.ai's deploy ships the router that serves ridger.ch: a broken houle release can take both sites down.**

## Matrix

| | houle.ai | ridger.ch | ark-fid.ch | switzerlandresidency.ch |
| --- | --- | --- | --- | --- |
| Triggers | push main (app/src/public/scripts/config paths), PR build-only, dispatch | same | same | push main, dispatch, daily 05:15 cron |
| Build | Node 20, `next build` standalone → `prepare-artifact.sh` (ships router) | Node 20, standalone + `tenant-entry.js` | Node 20, standalone | Node 20, static export |
| Gates before deploy (all blocking) | typecheck, structured-data test, markdown-link check | article guardrails, markdown links, `seo:check` (offline source check), Turnstile key present; `next build` type-checks | article guardrails, markdown links, Turnstile key present; `next build` type-checks | lint, typecheck, tests, deploy-script tests, content validator |
| Transport | rsync ×3 retry, `--partial --checksum` | same | same | FTPS, sha256 manifest, incremental |
| Env/secrets to server | GitHub secrets → `shared/.env` over **SFTP** (whole file, `chmod 600`, mode logged) | same (SFTP, whole file, `chmod 600`, mode logged) | GitHub secrets merged into `shared/.env` over **SFTP** (fetch, merge, upload, read back; see below) | build-time vars only |
| Activation | one ssh exec: extract to `releases/.staging-TS`, atomic `mv`, `ln -sfn current`; router notices BUILD_ID and cycles houle | same script; router cycles ridger | same script + HTTPS kill endpoint → supervisor respawn (ssh restart script as fallback) | per-file tmp + rename |
| Atomicity | release dir + symlink swap | same | same | per file (not whole-site) |
| Post-deploy gate | **blocking**: houle `/api/health` buildId = new build, houle.ai `/` 200, ridger.ch `/` 200 + health JSON, 2 consecutive passes, 8 min | **blocking**: ridger `/api/health` buildId = new build and `/fr/` 200, 2 consecutive passes, 8 min. houle.ai `/fr/` is logged on every check and raised as a **warning only** | **blocking**: restart step waits for buildId = new build, then buildId = new build and `/fr/` 200, 2 consecutive passes, 5 min | **blocking** smoke: 3 locales 200, protected paths 403, redirects |
| Outcome read-back | SFTP reads `current/.next/BUILD_ID` + `deploy_state` (ssh exit codes are not trusted) | same | same | FTPS |
| Rollback | **automatic**: on failed gate, SFTP atomic swap `current` → previous release (from `deploy_state`), read back, wait for the router to cycle, then job fails | same steps (waits for ridger's previous buildId) | **automatic**, same swap; then kill endpoint → supervisor respawn into the previous release (managed restart over ssh as fallback); also runs when the restart step fails | manual (redeploy previous commit) |
| Retention | 4 releases (previous never pruned) | 3 (previous never pruned) | 4 (previous never pruned) | n/a |
| Concurrency | `production-deploy`, not cancellable; PRs own cancellable group | same | same | `deploy-production`, not cancellable |
| Timeouts | job 30 min; verify 8, rollback 8 | job 30 min; verify 8, rollback 8 | job 30 min; restart 3, verify 5, rollback 12 | job 15 min |

## Automatic rollback (houle.ai · ridger.ch · ark-fid.ch)

The extract script writes `<site>/deploy_state` (new and previous release dir + BUILD_ID) before it switches `current`. CI then reads `deploy_state` and `current/.next/BUILD_ID` back over SFTP: a release that was not promoted fails the job with production unchanged, whatever the ssh exit code said. After the switch the live gate must see the new BUILD_ID on the site's own `/api/health/`. If it does not, the rollback step points `current` back to the previous release over SFTP (fresh symlink + atomic rename), reads the BUILD_ID back, waits for the previous build to answer and ends the job red. A red job with "rolled back to …" means the site is on the previous release; "ROLLBACK FAILED" or "did not recover" means someone has to look now.

The previous release is never pruned. If the extract step's read-back failed, the rollback step fetches `deploy_state` again and uses it when it describes the build being deployed. No automatic rollback is possible when no previous release is recorded for that build (first deploy, or SFTP down for the whole run): the step says so and the manual steps below apply.

## Manual rollback

Only SFTP is dependable on these hosts (ssh exec can drop output and exit codes). houle.ai and ridger.ch: creds in `houle-ai-website/.env.deploy`. ark-fid.ch: creds in `ark-fid.ch/.env`, base `/srv/customer/sites/ark-fid.ch`.

```
sftp> ls -l /srv/customer/sites/houle.ai/releases           # pick the previous TS
sftp> symlink /srv/customer/sites/houle.ai/releases/<TS> /srv/customer/sites/houle.ai/current.rollback
sftp> rename /srv/customer/sites/houle.ai/current.rollback /srv/customer/sites/houle.ai/current
sftp> get /srv/customer/sites/houle.ai/current/.next/BUILD_ID /tmp/current_build_id
```

The `rename` is atomic (posix-rename). The router cycles the tenant within about a minute; check `https://houle.ai/api/health/` (buildId) and `/router-status.log`. The same steps work for ridger.ch under `/srv/customer/sites/ridger.ch`. On ark-fid.ch there is no router: after the swap, restart the process with `curl -X POST https://ark-fid.ch/api/kill/ -H "Authorization: Bearer $RESTART_SECRET_TOKEN"` (the supervisor loop respawns from `current/`), then check `https://ark-fid.ch/api/health/`. Re-running the last green deploy (`gh run rerun <id>`) also works.

## Env sync on ark-fid.ch

ark's `shared/.env` also holds keys CI does not own (restart token, IndexNow, Odoo, …), so it is merged, not replaced: CI fetches the file over SFTP, updates the keys it owns, appends missing ones, leaves every other line alone, uploads the result beside the target (`0600`), renames it over `shared/.env` and reads it back byte for byte. The previous content stays in `shared/.env.prev` (`0600`). If the current file cannot be read, the step fails before the release switch instead of overwriting. The log lists changed and added key names, never values; nothing is written when nothing changed. The former ssh-exec loop silently skipped the last key of the list (`FORMSPARK_ACTION_URL`, payload without a trailing newline); the SFTP merge syncs it like the others.

## Monitor Maintenance (houle.ai · ridger.ch · ark-fid.ch)

`monitor-maintenance.yml` runs on a schedule (and on manual dispatch) and looks for Infomaniak's maintenance page on the site root. A normal run is two HTTP requests. When the page shows and no deploy is queued or in progress, the job re-checks 5 times, 120 s apart (about 10 min):

- the page clears: notice annotation, no redeploy (the site came back by itself);
- still shown and the deploy host's ssh/SFTP port answers (`nc -z`, 3 tries): a redeploy is dispatched, unless a deploy is queued or running by then (a rejected dispatch fails the run);
- still shown and the port is closed (host maintenance window): **warning annotation, no redeploy**; the next run checks again.

Runs share the concurrency group `monitor-maintenance`, so a waiting run is never doubled. The host and port come from the deploy secrets and are never printed.

## Incident 2026-09-25 → 30: houle "Extract" step red while releases went live

The cleanup loop `ls -1t | tail -n +5 | while …; [ -d "$rel" ] && … rm …; done` ran under `set -euo pipefail`. A stray file (`releases/router-status.log`, written by router v5 on 2026-09-20) became the oldest entry once the older release dirs were pruned. Its failed `[ -d ]` test was the loop's last status, so the pipeline returned 1 after the symlink had already switched. `deploy.extract.log` shows "Cleaned up old release" with no "Cleanup completed" line on every red run. The verify steps were skipped as a result. They had also never worked for houle: houle's `/api/health` did not expose `buildId`, so the continue-on-error "router swap" wait spent 5 min on every green run. Fixed: the loop only counts directories and is best-effort in all three repos, houle's health exposes `buildId`, and houle's job is gated on live verification with rollback.

## Applied 2026-10-01

- houle: `typecheck` and `test:structured-data` are blocking gates.
- ark: `shared/.env` is synced over SFTP (merge, see above).
- ridger/ark: SFTP read-back of `current/.next/BUILD_ID`, blocking live gate and automatic rollback; the ssh "probe" session is gone.
- ridger: houle.ai status is logged during the gate and raised as a warning (never blocking).
- ridger: `seo:check` follows Ridger's real routes and is a blocking gate (offline, instant).
- all three: a failed SFTP read-back no longer aborts the extract step before the live gate.
- ridger/houle: `shared/.env` is `chmod 600` in the SFTP upload (was `0644` on ridger); the step logs the `ls -l` line and warns when the mode is not confirmed.
- all three: Monitor Maintenance waits about 10 min and only redeploys when the site is still down and ssh/SFTP is reachable (see above). The host maintenance window of 2026-10-01 05:57 UTC had produced failed redeploys on both hosts.
- switzerlandresidency: `actions/checkout` and `actions/setup-node` on v6, like the other repos.

## Recommendations (not applied)

- switzerlandresidency: consider a per-deploy snapshot for whole-site rollback.
- Router code (`current/server.js`) only takes effect when the router process itself restarts (panel restart or crash). Deploying a router change needs a planned restart.
