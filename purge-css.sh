#!/bin/bash

# Script to purge unused CSS from non-critical.css
# This will overwrite the file with purged version

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSS_PATH="$PROJECT_ROOT/public/assets/css/non-critical.css"

if [ ! -f "$CSS_PATH" ]; then
    echo "CSS file not found at $CSS_PATH"
    exit 1
fi

echo "Purging unused CSS from $CSS_PATH..."

# Use npx to run purgecss
npx purgecss --css "$CSS_PATH" --output "$CSS_PATH" \
    --content "$PROJECT_ROOT/app/**/*.{js,jsx,ts,tsx}" \
    --content "$PROJECT_ROOT/src/**/*.{js,jsx,ts,tsx}" \
    --content "$PROJECT_ROOT/components/**/*.{js,jsx,ts,tsx}" \
    --content "$PROJECT_ROOT/pages/**/*.{js,jsx,ts,tsx}" \
    --safelist "critical-"

echo "CSS purged successfully. Run 'npm run css:build' to regenerate if needed."