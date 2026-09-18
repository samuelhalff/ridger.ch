#!/bin/bash
# Verify hreflang tags are properly rendered in production build

echo "🔍 Checking hreflang implementation..."
echo ""

# Check if .next build exists
if [ ! -d ".next" ]; then
    echo "❌ No .next directory found. Run 'npm run build' first."
    exit 1
fi

echo "✅ Build directory exists"
echo ""

# Check metadata.ts implementation
echo "📝 Checking metadata.ts hreflang configuration..."
if grep -q "alternates.*languages" src/lib/metadata.ts; then
    echo "✅ Hreflang configured in metadata.ts via alternates.languages"
else
    echo "❌ Hreflang not found in metadata.ts"
fi
echo ""

# Check if generateMetadata is exported from pages
echo "📄 Checking page metadata exports..."
PAGES_WITHOUT_METADATA=$(find app/\[locale\] -name "page.tsx" -type f | while read file; do
    if ! grep -q "generateMetadata" "$file"; then
        echo "  ⚠️  Missing in: $file"
    fi
done)

if [ -z "$PAGES_WITHOUT_METADATA" ]; then
    echo "✅ All pages export generateMetadata"
else
    echo "$PAGES_WITHOUT_METADATA"
fi
echo ""

# Instructions for manual verification
echo "🌐 To verify hreflang in production:"
echo ""
echo "1. Build and run production server:"
echo "   npm run build && npm start"
echo ""
echo "2. Check HTML output:"
echo "   curl http://localhost:3000/en/ | grep -i hreflang"
echo ""
echo "3. Expected output should include:"
echo "   <link rel=\"alternate\" hreflang=\"en\" href=\"https://ridger.ch/en/\"/>"
echo "   <link rel=\"alternate\" hreflang=\"fr-CH\" href=\"https://ridger.ch/fr/\"/>"
echo "   <link rel=\"alternate\" hreflang=\"de-CH\" href=\"https://ridger.ch/de/\"/>"
echo "   <link rel=\"alternate\" hreflang=\"es-ES\" href=\"https://ridger.ch/es/\"/>"
echo "   <link rel=\"alternate\" hreflang=\"pt-PT\" href=\"https://ridger.ch/pt/\"/>"
echo "   <link rel=\"alternate\" hreflang=\"x-default\" href=\"https://ridger.ch/fr/\"/>"
echo ""
echo "4. Or check live site:"
echo "   curl https://ridger.ch/en/ | grep -i hreflang"
echo ""
echo "📚 Note: Next.js 14+ uses metadata.alternates.languages"
echo "   This automatically generates <link rel=\"alternate\" hreflang> tags"
echo "   in the HTML <head> section."
