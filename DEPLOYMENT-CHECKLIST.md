# Deployment Pipeline Verification Checklist

## ✅ VERIFIED: Complete Deployment Flow

### 1. Source Code ✅
- [x] `app/api/restart/route.ts` - Restart endpoint (2.5KB)
- [x] `scripts/trigger-restart.sh` - Manual restart script (2.1KB)
- [x] `.env.example` - Updated with RESTART_SECRET_TOKEN
- [x] `.github/workflows/build-and-deploy.yml` - Updated workflow

### 2. Build Process ✅
- [x] Next.js configured for standalone output (`output: 'standalone'`)
- [x] Build successfully compiles `/api/restart` endpoint
- [x] Build output shows: `ƒ /api/restart` (dynamic route)

### 3. Artifact Preparation ✅
- [x] `scripts/prepare-artifact.sh` copies standalone build
- [x] Restart endpoint included in artifact at:
  - `dist/.next/server/app/api/restart/route.js`
  - `dist/.next/server/app/api/restart/route.js.nft.json`

### 4. GitHub Actions Workflow ✅
```
Build Job:
  ├─ Checkout code
  ├─ Setup Node.js 20
  ├─ Install dependencies (npm ci)
  ├─ Restore Next.js cache
  ├─ Build (npm run build) ← Compiles /api/restart
  ├─ Prepare artifact (scripts/prepare-artifact.sh) ← Includes route
  ├─ Archive (tar -czf next-standalone.tar.gz)
  └─ Upload artifact to GitHub

Deploy Job:
  ├─ Download artifact
  ├─ Upload to server via rsync
  ├─ Extract on server to releases/TIMESTAMP
  ├─ Update current symlink → releases/TIMESTAMP
  ├─ Cleanup old releases (keep 4)
  ├─ Trigger restart via /api/restart endpoint ← NEW!
  │   └─ POST https://ark-fid.ch/api/restart
  │       with Authorization: Bearer <RESTART_SECRET_TOKEN>
  └─ Health check (wait for server, warmup pages)
```

### 5. Restart Mechanism ✅
**How it works:**
1. GitHub Actions calls `POST /api/restart` with secret token
2. Endpoint validates token from `RESTART_SECRET_TOKEN` env var
3. Endpoint calls `process.exit(0)` after 500ms delay
4. Infomaniak's orchestrator detects process exit
5. Orchestrator automatically restarts app from `current` symlink
6. App now serves new BUILD_ID from latest release

**Tested locally:** ✅
- Without auth → 401 Unauthorized
- Wrong token → 401 Unauthorized  
- Correct token → Success + process.exit(0)

### 6. What Gets Deployed ✅

**Included in artifact:**
- ✅ All compiled Next.js code (`.next/server/`)
- ✅ API routes including `/api/restart`
- ✅ Static assets (`.next/static/`)
- ✅ Public files (`public/`)
- ✅ Server entry point (`server.js`)
- ✅ Required manifests (build, routes, prerender, etc.)
- ✅ Node modules (standalone minimal set)
- ✅ Environment files (`.env*`)

**NOT needed on server:**
- ❌ `scripts/robust-restart.sh` (old approach, no longer used)
- ❌ Manual SSH restart scripts
- ❌ Source TypeScript files (compiled to JS)

### 7. Required Configuration 🔧

**GitHub Secrets (already set):**
- ✅ `DEPLOY_SSH_HOST`
- ✅ `DEPLOY_SSH_USER`
- ✅ `DEPLOY_SSH_PASSWORD`
- ✅ `DEPLOY_SSH_PORT`
- 🔧 `RESTART_SECRET_TOKEN` ← **MUST ADD!**
- 🔧 (AI agent chat) `AZURE_AGENT_ENDPOINT`, `AZURE_AGENT_CHAT_NAME` (set to `ark-quote-agent:21`), and either `AZURE_CREDENTIALS` (JSON) or `AZURE_TENANT_ID`/`AZURE_CLIENT_ID`/`AZURE_CLIENT_SECRET` ← **ADD IF YOU WANT CI SMOKE CHECKS**

**Server Environment (/.env):**
- ✅ All existing environment variables
- 🔧 `RESTART_SECRET_TOKEN=<same-as-github-secret>` ← **MUST ADD!**
- 🔧 (AI agent chat) `AZURE_AGENT_ENDPOINT`, `AZURE_AGENT_CHAT_NAME` (set to `ark-quote-agent:21`), and Entra ID credentials (managed identity, Azure CLI for dev, or service principal) ← **MUST ADD FOR /agent**

### 8. Deployment Flow Verification

```bash
# What happens when you push to main:

1. GitHub Actions builds app
   → Includes /api/restart endpoint in .next/server/

2. Creates tarball of standalone build
   → next-standalone.tar.gz contains everything

3. Uploads to server
   → /srv/customer/sites/ark-fid.ch/artifact/

4. Extracts to new release directory
   → /srv/customer/sites/ark-fid.ch/releases/TIMESTAMP/
   → Contains: server.js, .next/, public/, node_modules/

5. Updates symlink
   → current → releases/TIMESTAMP

6. Calls /api/restart endpoint
   → curl -X POST https://ark-fid.ch/api/restart \
        -H "Authorization: Bearer $RESTART_SECRET_TOKEN"
   → Endpoint triggers process.exit(0)

7. Infomaniak detects exit
   → Automatically restarts Node.js process
   → Reads from 'current' symlink
   → Now serves NEW BUILD_ID! ✨

8. Health check
   → Verifies site is responding
   → Warms up all locale pages
```

## 🎯 READY TO DEPLOY

**Remaining steps:**

1. **Add RESTART_SECRET_TOKEN:**
   ```bash
   # On server:
   ssh K83cyp5GeC2_samhalff@57-101943.ssh.hosting-ik.com
   cd /srv/customer/sites/ark-fid.ch
   echo 'RESTART_SECRET_TOKEN=<generate-strong-secret>' >> .env
   
   # On GitHub:
   Settings → Secrets → Actions → New repository secret
   Name: RESTART_SECRET_TOKEN
   Value: <same-strong-secret>
   ```

2. **Commit and push:**
   ```bash
   git add app/api/restart/
   git add scripts/trigger-restart.sh
   git add .env.example
   git add .github/workflows/build-and-deploy.yml
   git commit -m "Add automated restart via /api/restart endpoint"
   git push origin main
   ```

3. **Monitor deployment:**
   - Watch GitHub Actions: https://github.com/samuelhalff/ark-fid.ch/actions
   - Check logs for "Trigger restart via /api/restart endpoint"
   - Verify BUILD_ID changed: `curl https://ark-fid.ch/_next/static/<NEW_BUILD_ID>/_buildManifest.js`

4. **Verify success:**
   - Site serves new BUILD_ID
   - No EADDRINUSE errors
   - Clean restart logs

## 📋 Summary

✅ **Everything is ready!** The complete deployment pipeline:
- Builds the restart endpoint
- Includes it in the artifact
- Deploys to the server
- Triggers restart via API call
- Infomaniak auto-restarts the app
- Site serves the new code

🔧 **Only need to:**
1. Set RESTART_SECRET_TOKEN (server + GitHub)
2. Commit and push
3. Watch it work! 🚀
