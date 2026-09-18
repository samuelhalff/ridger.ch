#!/bin/bash
set -e

# This script manually deploys from your local .next/standalone build
# Usage: ./manual-deploy.sh

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check required variables
if [ -z "$DEPLOY_SSH_USER" ] || [ -z "$DEPLOY_SSH_HOST" ] || [ -z "$DEPLOY_SSH_PASSWORD" ]; then
  echo "❌ Missing SSH credentials in .env file"
  echo "Required: DEPLOY_SSH_USER, DEPLOY_SSH_HOST, DEPLOY_SSH_PASSWORD, DEPLOY_SSH_PORT"
  exit 1
fi

echo "🔨 Building fresh standalone..."
npm run build

echo "📦 Creating tarball..."
# Copy static assets and public folder into standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
# Include server-side translation JSONs required by getTranslations()
mkdir -p .next/standalone/src
cp -r src/translations .next/standalone/src/translations
cd .next/standalone
tar -czf ../../manual-deploy.tar.gz .
cd ../..

echo "📤 Uploading to server..."
scp -P "${DEPLOY_SSH_PORT:-22}" \
  manual-deploy.tar.gz \
  "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST:/srv/customer/sites/ark-fid.ch/artifact/"

echo "🚀 Deploying on server..."
ssh -p "${DEPLOY_SSH_PORT:-22}" \
  "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST" 'bash -s' << 'ENDSSH'
    set -e
    BASE_DIR="/srv/customer/sites/ark-fid.ch"
    RELEASES_DIR="$BASE_DIR/releases"
    CURRENT_LINK="$BASE_DIR/current"
    PID_FILE="$BASE_DIR/.pid"
    TS=$(date +%Y%m%d-%H%M%S)
    REL_DIR="$RELEASES_DIR/$TS"
    
    echo "📂 Creating release directory..."
    mkdir -p "$REL_DIR"
    
    echo "📦 Extracting..."
    tar -xzf "$BASE_DIR/artifact/manual-deploy.tar.gz" -C "$REL_DIR"
    
    echo "🔗 Linking .env files..."
    [ -f "$BASE_DIR/shared/.env" ] && ln -sfn "$BASE_DIR/shared/.env" "$REL_DIR/.env"
    [ -f "$BASE_DIR/shared/.env.production" ] && ln -sfn "$BASE_DIR/shared/.env.production" "$REL_DIR/.env.production"
    
    echo "🔄 Switching to new release..."
    ln -sfn "$REL_DIR" "$CURRENT_LINK"
    
    echo "🛑 Stopping old process..."
    if [ -f "$PID_FILE" ]; then
      OLD_PID=$(cat "$PID_FILE" 2>/dev/null || true)
      if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        kill "$OLD_PID" || true
        sleep 2
        kill -9 "$OLD_PID" 2>/dev/null || true
      fi
      rm -f "$PID_FILE"
    fi
    # Kill any orphaned next-server processes
    pkill -9 -f 'next-server' 2>/dev/null || true
    # Fallback: kill all node processes
    pkill -9 node 2>/dev/null || true
    sleep 2
    
    echo "🚀 Starting new process..."
    cd "$CURRENT_LINK"
    PORT=3000 nohup node server.js > "$BASE_DIR/server.out" 2>&1 &
    NEW_PID=$!
    echo $NEW_PID > "$PID_FILE"
    
    echo "⏳ Waiting for server to start..."
    sleep 5
    
    echo "🏥 Health check..."
    if curl -fsS "http://127.0.0.1:3000/" >/dev/null 2>&1; then
      echo "✅ Server is running!"
      echo "📋 Release: $TS"
    else
      echo "❌ Server failed to start!"
      tail -50 "$BASE_DIR/server.out"
      exit 1
    fi
ENDSSH

echo "✅ Deployment complete!"
echo "🧹 Cleaning up..."
rm -f manual-deploy.tar.gz

echo "🌐 Check: https://ark-fid.ch/"
