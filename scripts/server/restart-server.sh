#!/bin/bash
# Managed restart for ridger.ch. Installed to $BASE/shared/ by the deploy
# pipeline (shipped inside the release artifact, copied by the extract step).
#
# Invoked over ssh as a single command string — the only reliable exec channel
# on this host (stdin-fed sessions drop; see repo deploy notes). Replaces the
# old flow of kill-endpoint + fixed sleeps: stops the supervisor by pidfile,
# frees the port, starts exactly one new supervisor, and waits until the local
# port answers before returning.
set -u

BASE="/srv/customer/sites/ridger.ch"
PIDFILE="$BASE/shared/supervisor.pid"
LOG="$BASE/deploy.restart.log"
# ridger.ch binds 5001 on this host (houle.ai holds 5000); the node process
# itself reads PORT from shared/.env via load-env.js — this value is only for
# the port-free/answer checks below and must match it.
PORT=5001

log() { echo "[restart] $(date '+%F %T') $*" >> "$LOG"; }
log "begin (pid $$)"

# 1. Stop the tracked supervisor so it cannot resurrect the old node process.
if [ -f "$PIDFILE" ]; then
  OLD_SUP=$(cat "$PIDFILE" 2>/dev/null || true)
  if [ -n "${OLD_SUP:-}" ] && kill -0 "$OLD_SUP" 2>/dev/null; then
    kill "$OLD_SUP" 2>/dev/null && log "stopped supervisor $OLD_SUP"
  fi
  rm -f "$PIDFILE"
fi
# Legacy/stray supervisors from the pre-pidfile era: their command line
# contains the full path (this script's own does not, so no self-match).
pkill -f "ridger.ch/current && node server.js" 2>/dev/null && log "stopped legacy supervisor(s)"

# 2. Free the port: fuser targets exactly the process holding it (safer than
# pkill on "node server.js", which could match unrelated same-user processes).
# Fallback for hosts without fuser: kill processes whose cwd is inside a
# release dir (the node process runs with cwd $BASE/releases/<ts>).
if command -v fuser >/dev/null 2>&1; then
  fuser -k "$PORT/tcp" 2>/dev/null && log "killed port $PORT holder (fuser)"
else
  for pid in $(ls /proc 2>/dev/null | grep -E '^[0-9]+$'); do
    [ "$pid" = "$$" ] && continue
    cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || true)
    case "$cwd" in
      "$BASE/releases/"*|"$BASE/current")
        kill "$pid" 2>/dev/null && log "killed release-cwd process $pid"
        ;;
    esac
  done
fi
for i in $(seq 1 15); do
  curl -s -o /dev/null --max-time 1 "http://127.0.0.1:$PORT/" || break
  sleep 1
done
log "port wait done after checks"

# 3. Start exactly one new supervisor, recording its PID.
nohup bash -c "echo \$\$ > '$PIDFILE'; while true; do cd '$BASE/current' && node server.js >> '$BASE/server.out' 2>&1; echo 'Node exited, restarting...' >> '$BASE/server.out'; sleep 1; done" >/dev/null 2>&1 </dev/null &
log "started supervisor $(cat "$PIDFILE" 2>/dev/null || echo '?')"

# 4. Wait until the new process answers locally (supervisor retries binding
# every second if the port was still briefly held).
for i in $(seq 1 60); do
  if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/"; then
    log "server answering after ${i}s"
    echo "restart-ok"
    exit 0
  fi
  sleep 1
done

log "ERROR: server did not answer within 60s"
echo "restart-failed"
exit 1
