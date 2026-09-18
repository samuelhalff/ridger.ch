# Deployment Fixes - October 2025

## Summary

This document tracks the deployment issues encountered and resolved in October 2025, including the root causes, solutions implemented, and lessons learned.

## Issues Encountered

### 1. **Deployments Not Updating Site Content**
- **Symptom**: After CI/CD deployments, the website showed old content despite new builds being created
- **Root Cause**: Old Node.js processes were not being killed properly before starting new ones
- **Port Conflict**: Port 3000 was still in use by previous process, preventing new server from binding

### 2. **CSS Breakage After Cache Clearing**
- **Symptom**: Site came back with broken CSS after attempting cache-clearing fix
- **Root Cause**: Next.js `.next/cache` directory removal affected static asset serving
- **Solution**: Reverted cache clearing; relied on process management instead

### 3. **CI/CD SSH Exit Code 255**
- **Symptom**: GitHub Actions deploy step failed with SSH exit code 255
- **Root Cause**: `start-server.sh` script not detaching process properly, causing SSH session to hang
- **Contributing Factors**: 
  - Process not killed completely before starting new one
  - Insufficient wait time for port to be released
  - Missing `disown` command after `nohup`

### 4. **Site Downtime During Deployments**
- **Symptom**: Website became unavailable during or after deployments
- **Root Cause**: Old and new processes conflicting for port 3000
- **Recovery**: Manual SSH and script execution required

## Solutions Implemented

### 1. **Aggressive Process Management in `start-server.sh`**

```bash
# Kill all node processes more aggressively
pkill -9 -f 'node.*server.js' 2>/dev/null || true
pkill -9 -f next-server 2>/dev/null || true
pkill -9 node 2>/dev/null || true
echo "[start-server] Waiting for port to be released..."
sleep 5
```

**Key Changes**:
- Kill by pattern (`node.*server.js`) and generic (`node`)
- Use `-9` (SIGKILL) for immediate termination
- Wait 5 seconds for port release
- Continue on errors (`|| true`)

### 2. **Proper Process Detachment**

```bash
nohup node server.js > "$BASE/server.out" 2>&1 </dev/null &
NEW_PID=$!
disown
echo "$NEW_PID" > "$PID_FILE"
```

**Key Changes**:
- Use `nohup` to prevent SIGHUP on SSH disconnect
- Redirect all I/O to prevent SSH session blocking
- Use `disown` to completely detach from shell
- Save PID for future reference

### 3. **Deployment Diagnostics and Logging**

```bash
# Log what we're actually running
if [ -L "$BASE/current" ]; then
  ACTUAL_RELEASE=$(basename "$(readlink -f "$BASE/current" 2>/dev/null)" 2>/dev/null || echo "UNKNOWN")
  echo "[start-server] Starting release: $ACTUAL_RELEASE"
fi
if [ -f ".next/BUILD_ID" ]; then
  BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null || echo "UNKNOWN")
  echo "[start-server] BUILD_ID: $BUILD_ID"
fi
```

**Benefits**:
- Track which release is being deployed
- Verify BUILD_ID matches expected version
- Easier troubleshooting with timestamps and context

### 4. **CI/CD Workflow Error Handling**

```bash
"bash /srv/customer/sites/ark-fid.ch/shared/start-server.sh" || {
  echo "[deploy] WARNING: start-server.sh returned non-zero exit code"
  echo "[deploy] Checking if server started anyway..."
}
```

**Benefits**:
- Don't fail workflow if script returns non-zero (but detached successfully)
- Log warnings for investigation
- Proceed to health check to verify actual status

### 5. **Health Check with Warmup**

```bash
ATTEMPTS=60; SLEEP=3; OK=0
for i in $(seq 1 $ATTEMPTS); do
  if curl -fsS "http://127.0.0.1:$PORT_VAL/" >/dev/null 2>&1; then OK=1; break; fi
  sleep $SLEEP
done
[ "$OK" -eq 1 ] || { tail -n 200 "$BASE/server.out" >&2 || true; exit 1; }
```

**Key Features**:
- Wait up to 3 minutes for server to respond
- Tail server logs on failure for debugging
- Warmup key pages after successful health check

## Lessons Learned

### 1. **Process Management is Critical**
- Node.js processes must be completely killed before starting new ones
- Port conflicts are a primary cause of deployment failures
- `pkill -9` is more reliable than PID-based killing alone

### 2. **SSH Session Management**
- Proper process detachment is essential for CI/CD via SSH
- Use both `nohup` and `disown` to prevent SSH-related issues
- Redirect all I/O (`>/dev/null 2>&1 </dev/null`) to prevent blocking

### 3. **Minimal Changes Philosophy**
- Avoid unnecessary changes to stable deployments
- Cache clearing can have unintended side effects
- Test changes incrementally and revert quickly if issues arise

### 4. **Diagnostics are Essential**
- Log release timestamps and BUILD_IDs for traceability
- Include timestamps in all log messages
- Make logs easy to parse and understand

### 5. **Error Handling in Scripts**
- Use `set -euo pipefail` for strict error handling
- But allow non-critical commands to fail (`|| true`)
- Balance between failing fast and recovering gracefully

## File Changes Summary

### Modified Files

1. **`scripts/start-server.sh`** (multiple revisions)
   - Added aggressive process killing
   - Added proper detachment with `disown`
   - Added diagnostic logging
   - Added error handling

2. **`.github/workflows/build-and-deploy.yml`** (updated)
   - Restart step now kills any existing loop/Node processes before starting
   - Supervisor loop cd's into `current` on every iteration to honor new releases
   - Health checks and warmup now prefetch service detail pages and next/image variants

### Created Files (Temporary/Diagnostic)

1. **`scripts/check-version.sh`** (created and removed)
   - Used for manual diagnostics
   - Integrated into `start-server.sh`

2. **`scripts/diagnose-deployment.sh`** (created and removed)
   - One-time diagnostic tool
   - Findings integrated into main scripts

## Current Status

### ✅ Working
- Aggressive process killing before new deploys
- Proper SSH session detachment
- Diagnostic logging for release tracking
- Health checks with warmup
- Automatic cleanup of old releases (keep 4)

### ⚠️ Monitoring
- CI/CD reliability when triggered by AI resource updates
- SSH exit codes during deploy step
- Server startup time and consistency

### 📋 Pending (If Issues Persist)
- Consider using a process manager (PM2, systemd)
- Implement zero-downtime deployments (blue-green or rolling)
- Add pre-deployment health checks
- Implement rollback mechanism

## Testing Checklist

After any deployment script changes:

- [ ] Manual run of `start-server.sh` succeeds
- [ ] Server starts and binds to port 3000
- [ ] Old processes are killed properly
- [ ] No port conflicts occur
- [ ] SSH session detaches correctly (no hanging)
- [ ] CI/CD deployment succeeds
- [ ] Health check passes within timeout
- [ ] Site is accessible and shows new version
- [ ] No CSS or static asset issues
- [ ] Logs are clear and contain diagnostic info

## Quick Reference Commands

### Check Server Status
```bash
ssh user@host "ps aux | grep node"
ssh user@host "lsof -i :3000"
ssh user@host "cat /srv/customer/sites/ark-fid.ch/last_release_ts"
ssh user@host "cat /srv/customer/sites/ark-fid.ch/current/.next/BUILD_ID"
```

### Manual Deployment
```bash
ssh user@host "bash /srv/customer/sites/ark-fid.ch/shared/start-server.sh"
```

### View Logs
```bash
ssh user@host "tail -f /srv/customer/sites/ark-fid.ch/server.out"
ssh user@host "tail -f /srv/customer/sites/ark-fid.ch/deploy.extract.log"
```

### Emergency Process Kill
```bash
ssh user@host "pkill -9 node"
ssh user@host "rm -f /srv/customer/sites/ark-fid.ch/ark-fid.pid"
```

## Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Main deployment documentation
- [CI Validation Guarantees](./ci-validation-guarantees.md) - CI/CD pipeline docs
- GitHub Actions Workflow: `.github/workflows/build-and-deploy.yml`

## Timeline

- **Oct 1, 2025**: Initial deployment issues discovered
- **Oct 1, 2025**: Attempted cache clearing (caused CSS breakage, reverted)
- **Oct 2, 2025**: Implemented aggressive process killing
- **Oct 2, 2025**: Added `disown` for proper detachment
- **Oct 2, 2025**: Added diagnostic logging for release tracking
- **Oct 2, 2025**: Manual recovery after site downtime
- **Oct 2, 2025**: Monitoring CI/CD for continued reliability

## Contact

For questions or issues related to these fixes, refer to this document and the commit history:
- Commits: `bec87908`, `07e26dc3`, `b82efce0`, `e9823673`, `12d4ad6e`
