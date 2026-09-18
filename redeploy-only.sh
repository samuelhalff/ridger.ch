#!/bin/bash
set -e

# Usage: ./redeploy-only.sh [--no-restart]
# This script redeploys from the artifact already on the server (no upload)
# --no-restart: Extract and validate but don't restart the server

RESTART_SERVER=true
if [ "$1" = "--no-restart" ]; then
  RESTART_SERVER=false
  echo "⚠️  Running in no-restart mode (validate only)"
fi

source .env

echo "🚀 Redeploying from server artifact..."
sshpass -p "$DEPLOY_SSH_PASSWORD" ssh -p "$DEPLOY_SSH_PORT" -o StrictHostKeyChecking=no \
  "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST" "
  set -e
  BASE=/srv/customer/sites/ark-fid.ch
  REL=\$BASE/releases/\$(date +%Y%m%d-%H%M%S)
  ARTIFACT=\$BASE/artifact/next-standalone.tar.gz
  
  # Verify artifact exists on server
  if [ ! -f \$ARTIFACT ]; then
    echo '❌ Artifact not found on server at \$ARTIFACT'
    echo 'Run ./quick-deploy.sh first to upload a build'
    exit 1
  fi
  
  echo '📦 Found artifact:' && ls -lh \$ARTIFACT
  
  # Create and extract to new release directory
  mkdir -p \$REL
  cd \$REL
  
  # Extract and verify
  tar -xzf \$ARTIFACT
  if [ ! -f server.js ]; then
    echo '❌ Extraction failed - server.js not found'
    rm -rf \$REL
    exit 1
  fi
  
  # Link .env files
  [ -f \$BASE/shared/.env ] && ln -sf \$BASE/shared/.env .env
  [ -f \$BASE/shared/.env.production ] && ln -sf \$BASE/shared/.env.production .env.production
  [ -f \$BASE/.env ] && ln -sf \$BASE/.env .env
  
  # Verify critical files exist
  if [ ! -d .next/static/css ]; then
    echo '❌ CSS files missing from release'
    rm -rf \$REL
    exit 1
  fi
  
  CSS_COUNT=\$(find .next/static/css -name '*.css' 2>/dev/null | wc -l)
  echo \"✅ Release validated (found \$CSS_COUNT CSS files)\"
  
  # Only restart server if requested
  if [ '$RESTART_SERVER' = 'true' ]; then
    echo 'Switching to new release and restarting server...'
    ln -sfn \$REL \$BASE/current
    
    # Kill by PID file
    if [ -f \$BASE/.pid ]; then
      OLD_PID=\$(cat \$BASE/.pid)
      kill -9 \$OLD_PID 2>/dev/null || true
      rm -f \$BASE/.pid
    fi
    # Kill any next-server processes
    pkill -9 -f 'next-server' 2>/dev/null || true
    # Fallback: kill all node processes
    pkill -9 node 2>/dev/null || true
    sleep 2
    
    cd \$BASE/current
    PORT=3000 nohup node server.js > \$BASE/server.out 2>&1 & echo \$! > \$BASE/.pid
    
    echo 'Waiting for server to start...'
    sleep 3
    if curl -fsS http://127.0.0.1:3000/ >/dev/null 2>&1; then
      echo '✅ Server OK'
    else
      echo '❌ Server failed to start'
      tail -50 \$BASE/server.out
      exit 1
    fi
  else
    echo '⚠️  Release ready at \$REL but not activated'
    echo '   Current release: \$(readlink -f \$BASE/current 2>/dev/null || echo none)'
    echo '   To activate manually:'
    echo '     ssh to server and run:'
    echo '     ln -sfn \$REL \$BASE/current'
    echo '     killall -9 node && cd \$BASE/current && PORT=3000 nohup node server.js > \$BASE/server.out 2>&1 & echo \$! > \$BASE/.pid'
  fi
"

echo "✅ Redeploy complete!"
    
    # Kill by PID file
    if [ -f \$BASE/.pid ]; then
      OLD_PID=\$(cat \$BASE/.pid)
      kill -9 \$OLD_PID 2>/dev/null || true
      rm -f \$BASE/.pid
    fi
    # Kill any Node.js processes (more aggressive pattern)
    pkill -9 -f 'node.*server\.js' || true
    sleep 2
    
    cd \$BASE/current
    PORT=3000 nohup node server.js > \$BASE/server.out 2>&1 & echo \$! > \$BASE/.pid
    
    sleep 3
    curl -fsS http://127.0.0.1:3000/ && echo '✅ Server OK' || echo '❌ Server failed'
  else
    echo '⚠️  Files uploaded to \$REL but not activated'
    echo '   To activate: ssh to server and run:'
    echo '   ln -sfn \$REL /srv/customer/sites/ark-fid.ch/current && systemctl restart your-service'
  fi
"

echo "✅ Deployment complete!"
