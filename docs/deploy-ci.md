# Deploy / CI matrix (houle.ai · ridger.ch · ark-fid.ch · switzerlandresidency.ch)

Same file in all three Node repos (houle-ai-website, ridger.ch, ark-fid.ch). Last reviewed 2026-09-30.

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
| Gates before deploy | markdown-link check (blocking); typecheck **non-blocking** | article guardrails, markdown links, Turnstile key present; `next build` type-checks | same as ridger | lint, typecheck, tests, deploy-script tests, content validator |
| Transport | rsync ×3 retry, `--partial --checksum` | same | same | FTPS, sha256 manifest, incremental |
| Env/secrets to server | GitHub secrets → `shared/.env` over **SFTP** | same (SFTP) | GitHub secrets → `shared/.env` over **ssh exec** | build-time vars only |
| Activation | one ssh exec: extract to `releases/.staging-TS`, atomic `mv`, `ln -sfn current`; router notices BUILD_ID and cycles houle | same script; router cycles ridger | same script + HTTPS kill endpoint → supervisor respawn (ssh restart script as fallback) | per-file tmp + rename |
| Atomicity | release dir + symlink swap | same | same | per file (not whole-site) |
| Post-deploy gate | **blocking**: houle `/api/health` buildId = new build, houle.ai `/` 200, ridger.ch `/` 200 + health JSON, 2 consecutive passes, 8 min | **blocking**: ridger health buildId = new build (5 min) | **blocking**: buildId = new build, then `/fr/` 200 | **blocking** smoke: 3 locales 200, protected paths 403, redirects |
| Outcome read-back | SFTP reads `current/.next/BUILD_ID` + `deploy_state` (ssh exit codes are not trusted) | ssh exit code | ssh exit code | FTPS |
| Rollback | **automatic**: on failed gate, SFTP atomic swap `current` → previous release (from `deploy_state`), read back, then job fails | manual | manual | manual (redeploy previous commit) |
| Retention | 4 releases (previous never pruned) | 3 | 4 | n/a |
| Concurrency | `production-deploy`, not cancellable; PRs own cancellable group | same | same | `deploy-production`, not cancellable |
| Timeouts | job 30 min; verify 8, rollback 8 | job 30 min; health 5 | job 30 min; restart 3, health 5 | job 15 min |

## Manual rollback (houle.ai / ridger.ch)

Only SFTP is dependable on 57-105000 (ssh exec can drop output and exit codes). With the creds from `houle-ai-website/.env.deploy`:

```
sftp> ls -l /srv/customer/sites/houle.ai/releases           # pick the previous TS
sftp> symlink /srv/customer/sites/houle.ai/releases/<TS> /srv/customer/sites/houle.ai/current.rollback
sftp> rename /srv/customer/sites/houle.ai/current.rollback /srv/customer/sites/houle.ai/current
sftp> get /srv/customer/sites/houle.ai/current/.next/BUILD_ID /tmp/current_build_id
```

The `rename` is atomic (posix-rename). The router cycles the tenant within about a minute; check `https://houle.ai/api/health/` (buildId) and `/router-status.log`. The same steps work for ridger.ch under `/srv/customer/sites/ridger.ch`. Re-running the last green deploy (`gh run rerun <id>`) also works.

## Incident 2026-09-25 → 30: houle "Extract" step red while releases went live

The cleanup loop `ls -1t | tail -n +5 | while …; [ -d "$rel" ] && … rm …; done` ran under `set -euo pipefail`. A stray file (`releases/router-status.log`, written by router v5 on 2026-09-20) became the oldest entry once the older release dirs were pruned. Its failed `[ -d ]` test was the loop's last status, so the pipeline returned 1 after the symlink had already switched. `deploy.extract.log` shows "Cleaned up old release" with no "Cleanup completed" line on every red run. The verify steps were skipped as a result. They had also never worked for houle: houle's `/api/health` did not expose `buildId`, so the continue-on-error "router swap" wait spent 5 min on every green run. Fixed: the loop only counts directories and is best-effort in all three repos, houle's health exposes `buildId`, and houle's job is gated on live verification with rollback.

## Recommendations (not applied)

- houle: make `typecheck` blocking and run `test:guardrails` like ridger/ark, once the typecheck is green on a fresh checkout.
- ark: sync `shared/.env` over SFTP instead of ssh exec (silent-failure class seen on 57-105000).
- ridger/ark: adopt houle's SFTP read-back of `current/.next/BUILD_ID` and automatic rollback. ridger's rollback would reuse houle's steps as they are.
- ridger/ark: drop the ssh "probe" session. It never gates anything and adds to the host's exec-session throttle.
- ridger: add a non-blocking houle.ai smoke check after deploy (shared router host).
- switzerlandresidency: pin actions to v6/v5 like the others; consider a per-deploy snapshot for whole-site rollback.
- Router code (`current/server.js`) only takes effect when the router process itself restarts (panel restart or crash). Deploying a router change needs a planned restart.
