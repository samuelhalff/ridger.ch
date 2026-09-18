#!/usr/bin/env bash
set -euo pipefail

# Prepare a minimal deployable directory in ./dist for Next.js standalone output
# Requires: next.config.js with `output: 'standalone'` and a successful `npm run build`

ROOT_DIR=$(pwd)
BUILD_DIR="$ROOT_DIR/.next"
DIST_DIR="$ROOT_DIR/dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/.next"

# Copy the standalone server and minimal node_modules into dist/
cp -R "$BUILD_DIR/standalone/"* "$DIST_DIR/"

# Ensure .next/static resides alongside the server bundle
mkdir -p "$DIST_DIR/.next"
cp -R "$BUILD_DIR/static" "$DIST_DIR/.next/"

# Copy BUILD_ID so Next.js can verify a production build exists
if [ -f "$BUILD_DIR/BUILD_ID" ]; then
  cp "$BUILD_DIR/BUILD_ID" "$DIST_DIR/.next/BUILD_ID"
else
  echo "Warning: BUILD_ID not found in $BUILD_DIR"
fi

# Create percent-encoded aliases for any bracket-named chunk directories under app/
# Some reverse proxies serve '/_next/static' directly and do not decode %5B %5D in paths.
# Duplicating '[locale]' → '%5Blocale%5D' (and similar) avoids 404s for encoded requests.
APP_CHUNKS_DIR="$DIST_DIR/.next/static/chunks/app"
if [ -d "$APP_CHUNKS_DIR" ]; then
  while IFS= read -r -d '' dir; do
    base="$(basename "$dir")"
    enc="${base//'['/%5B}"
    enc="${enc//']'/%5D}"
    if [ "$base" != "$enc" ]; then
      target="$(dirname "$dir")/$enc"
      if [ ! -d "$target" ]; then
        mkdir -p "$(dirname "$target")"
        cp -R "$dir" "$target"
      fi
    fi
  done < <(find "$APP_CHUNKS_DIR" -type d -name '*[*]*' -print0)
fi

# Verify BUILD_ID matches static folder
if [ -f "$DIST_DIR/.next/BUILD_ID" ]; then
  BUILD_ID=$(cat "$DIST_DIR/.next/BUILD_ID")
  if [ ! -d "$DIST_DIR/.next/static/$BUILD_ID" ]; then
    echo "Error: Static folder $BUILD_ID not found in $DIST_DIR/.next/static/"
    ls -la "$DIST_DIR/.next/static/" || true
    exit 1
  fi
fi

# Copy required Next.js manifests from the build output into runtime .next
# This avoids runtime ENOENT for routes/build/prerender manifests when using standalone
for f in \
  "routes-manifest.json" \
  "build-manifest.json" \
  "prerender-manifest.json" \
  "app-build-manifest.json" \
  "images-manifest.json" \
  "middleware-manifest.json" \
  "app-path-routes-manifest.json" \
  "react-loadable-manifest.json"
do
  if [ -f "$BUILD_DIR/$f" ]; then
    cp "$BUILD_DIR/$f" "$DIST_DIR/.next/$f"
  fi
done

# Copy public assets if present (e.g., non-critical CSS, images)
if [ -d "$ROOT_DIR/public" ]; then
  cp -R "$ROOT_DIR/public" "$DIST_DIR/public"
fi

# Include server-side translation JSONs used by getTranslations() at runtime
if [ -d "$ROOT_DIR/src/translations" ]; then
  mkdir -p "$DIST_DIR/src"
  cp -R "$ROOT_DIR/src/translations" "$DIST_DIR/src/translations"
fi

# Include runtime env loader for standalone start
if [ -f "$ROOT_DIR/scripts/load-env.js" ]; then
  mkdir -p "$DIST_DIR/scripts"
  cp "$ROOT_DIR/scripts/load-env.js" "$DIST_DIR/scripts/load-env.js"
fi

# Ship the managed restart script with the release; the deploy extract step
# installs it to shared/ so the restart step can invoke it over ssh.
if [ -f "$ROOT_DIR/scripts/server/restart-server.sh" ]; then
  cp "$ROOT_DIR/scripts/server/restart-server.sh" "$DIST_DIR/restart-server.sh"
fi

# Also include required server-side manifests under .next/server to avoid ENOENT
mkdir -p "$DIST_DIR/.next/server" "$DIST_DIR/.next/server/chunks"
cp -R "$BUILD_DIR/standalone/.next/server/"* "$DIST_DIR/.next/server/" || true

# Include compiled server code directories so Next can require them at runtime
if [ -d "$BUILD_DIR/server/pages" ]; then
  mkdir -p "$DIST_DIR/.next/server/pages"
  cp -R "$BUILD_DIR/server/pages" "$DIST_DIR/.next/server/"
fi
if [ -d "$BUILD_DIR/server/app" ]; then
  mkdir -p "$DIST_DIR/.next/server/app"
  cp -R "$BUILD_DIR/server/app" "$DIST_DIR/.next/server/"
fi

# Ensure any files required by Next's standalone runtime are present
if [ -f "$BUILD_DIR/required-server-files.json" ]; then
  BUILD_DIR="$BUILD_DIR" DIST_DIR="$DIST_DIR" ROOT_DIR="$ROOT_DIR" node <<'NODE'
const fs = require('fs');
const path = require('path');

const buildDir = process.env.BUILD_DIR;
const distDir = process.env.DIST_DIR;
const rootDir = process.env.ROOT_DIR;
const data = JSON.parse(fs.readFileSync(path.join(buildDir, 'required-server-files.json'), 'utf8'));

for (const rel of data.files || []) {
  const src = path.join(rootDir, rel);
  const dest = path.join(distDir, rel);
  if (!fs.existsSync(src)) {
    console.warn(`[prepare-artifact] Required file missing in build output: ${src}`);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}
NODE
fi

# Include environment files if present
shopt -s nullglob
for envfile in "$ROOT_DIR"/.env*; do
  # Only copy regular files (skip directories)
  if [ -f "$envfile" ]; then
    cp "$envfile" "$DIST_DIR/" || true
  fi
done
shopt -u nullglob

echo "Prepared deployable artifact in $DIST_DIR"
du -sh "$DIST_DIR"
find "$DIST_DIR" -maxdepth 2 -type d -print
