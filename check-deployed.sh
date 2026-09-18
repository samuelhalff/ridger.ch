#!/bin/bash
# Quick remote check - Run this to see what's actually deployed
# Usage: ./check-deployed.sh

if [ ! -f .env ]; then
  echo "❌ .env file not found. Cannot connect to server."
  exit 1
fi

source .env

if [ -z "$DEPLOY_SSH_USER" ] || [ -z "$DEPLOY_SSH_HOST" ] || [ -z "$DEPLOY_SSH_PASSWORD" ]; then
  echo "❌ Missing SSH credentials in .env"
  exit 1
fi

echo "🔍 Checking deployed version on server..."
echo "📡 Connecting to: $DEPLOY_SSH_USER@$DEPLOY_SSH_HOST:${DEPLOY_SSH_PORT:-22}"
echo ""

# Test SSH connection first
if ! sshpass -p "$DEPLOY_SSH_PASSWORD" ssh -p "${DEPLOY_SSH_PORT:-22}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST" 'echo "Connection successful"' 2>/dev/null; then
  echo "❌ SSH connection failed!"
  echo "   Host: $DEPLOY_SSH_HOST"
  echo "   Port: ${DEPLOY_SSH_PORT:-22}"
  echo "   User: $DEPLOY_SSH_USER"
  echo ""
  echo "Debugging info:"
  sshpass -p "$DEPLOY_SSH_PASSWORD" ssh -v -p "${DEPLOY_SSH_PORT:-22}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
    "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST" 'echo test' 2>&1 | grep -E 'Connecting|Connected|debug1:' | head -10
  exit 1
fi

sshpass -p "$DEPLOY_SSH_PASSWORD" ssh -p "${DEPLOY_SSH_PORT:-22}" -o StrictHostKeyChecking=no \
  "$DEPLOY_SSH_USER@$DEPLOY_SSH_HOST" bash -lc '
  BASE="/srv/customer/sites/ark-fid.ch"
  
  echo "📦 Current Release:"
  if [ -L "$BASE/current" ]; then
    RELEASE=$(basename "$(readlink -f "$BASE/current")")
    echo "   $RELEASE"
  else
    echo "   ❌ No current symlink!"
  fi
  
  echo ""
  echo "🔖 BUILD_ID:"
  if [ -f "$BASE/current/.next/BUILD_ID" ]; then
    cat "$BASE/current/.next/BUILD_ID"
  else
    echo "   ❌ BUILD_ID not found"
  fi
  
  echo ""
  echo "📁 Static Folder:"
  if [ -f "$BASE/current/.next/BUILD_ID" ]; then
    BUILD_ID=$(cat "$BASE/current/.next/BUILD_ID")
    if [ -d "$BASE/current/.next/static/$BUILD_ID" ]; then
      echo "   ✅ Static folder $BUILD_ID exists"
      echo "   Contents: $(ls -1 "$BASE/current/.next/static/$BUILD_ID" | wc -l) items"
      echo "   Permissions: $(stat -c '%a' "$BASE/current/.next/static/$BUILD_ID" 2>/dev/null || echo 'unknown')"
    else
      echo "   ❌ Static folder $BUILD_ID NOT found"
      echo "   Available folders: $(ls -1 "$BASE/current/.next/static" 2>/dev/null || echo 'none')"
    fi
  else
    echo "   Cannot check without BUILD_ID"
  fi
  
  echo ""
  echo "🚀 Process Status:"
  PORT_VAL=${PORT:-3000}
  if curl -fsS "http://127.0.0.1:$PORT_VAL/" >/dev/null 2>&1; then
    echo "   ✅ Server is running and responding on port $PORT_VAL"
    if [ -f "$BASE/ark-fid.pid" ]; then
      PID=$(cat "$BASE/ark-fid.pid")
      echo "   Last known PID: $PID"
    fi
  else
    echo "   ❌ Server is NOT responding on port $PORT_VAL"
    if [ -f "$BASE/ark-fid.pid" ]; then
      PID=$(cat "$BASE/ark-fid.pid")
      if kill -0 "$PID" 2>/dev/null; then
        echo "   PID $PID exists but may not be serving"
      else
        echo "   PID $PID is stale"
      fi
    fi
  fi
  
  echo ""
  echo "📊 Latest 5 Releases:"
  ls -1t "$BASE/releases" 2>/dev/null | head -5 | while read r; do
    if [ -L "$BASE/current" ] && [ "$(readlink -f "$BASE/current")" = "$BASE/releases/$r" ]; then
      echo "   → $r (CURRENT)"
    else
      echo "     $r"
    fi
  done
  
  echo ""
  echo "📝 Recent Server Logs (last 10 lines):"
  tail -10 "$BASE/server.out" 2>/dev/null | sed "s/^/   /"
'

echo ""
echo "✅ Check complete!"
