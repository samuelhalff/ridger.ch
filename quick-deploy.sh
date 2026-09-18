#!/bin/bash
# Quick deploy from existing .next/standalone (no rebuild)
set -e

# Load environment variables from .env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Check required variables
if [ -z "$DEPLOY_SSH_USER" ] || [ -z "$DEPLOY_SSH_HOST" ] || [ -z "$DEPLOY_SSH_PASSWORD" ]; then
  echo "❌ Missing SSH credentials in .env file"
  echo "Required: DEPLOY_SSH_USER, DEPLOY_SSH_HOST, DEPLOY_SSH_PASSWORD, DEPLOY_SSH_PORT"
  exit 1
fi

if [ ! -f .next/standalone/server.js ]; then
  echo "❌ No standalone build found. Run 'npm run build' first."
  exit 1
fi

echo "📦 Preparing artifact with static files..."
bash scripts/prepare-artifact.sh

echo "📦 Creating tarball..."
cd dist
tar -czf ../quick-deploy.tar.gz .
cd ..

echo "📤 Uploading..."
sshpass -p "$DEPLOY_SSH_PASSWORD" scp -P "${DEPLOY_SSH_PORT:-22}" quick-deploy.tar.gz \
  "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST:/srv/customer/sites/ark-fid.ch/artifact/manual-deploy.tar.gz"

echo "🚀 Deploying..."
sshpass -p "$DEPLOY_SSH_PASSWORD" ssh -T -p "${DEPLOY_SSH_PORT:-22}" "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST" "
  set -e
  BASE=/srv/customer/sites/ark-fid.ch
  TS=\$(date +%Y%m%d-%H%M%S)
  REL=\$BASE/releases/\$TS
  
  echo 'Creating release...'
  mkdir -p \$REL
  tar -xzf \$BASE/artifact/manual-deploy.tar.gz -C \$REL
  [ -f \$BASE/shared/.env ] && ln -sfn \$BASE/shared/.env \$REL/.env
  ln -sfn \$REL \$BASE/current
  
  echo 'Restarting server...'
  # Kill by PID file first
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
  
  sleep 3
  curl -fsS http://127.0.0.1:3000/ && echo '✅ OK' || echo '❌ Failed'
"

rm -f quick-deploy.tar.gz
echo "✅ Done!"
