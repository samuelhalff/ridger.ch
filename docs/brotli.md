# Brotli Compression Guide

Brotli reduces transfer size for text assets (HTML, CSS, JS, JSON, SVG, XML) improving LCP & INP. On Vercel, Brotli (and gzip) are automatically negotiated for eligible assets, so no custom setup is required for the default deployment. This document provides guidance if you self-host or use a custom CDN layer.

## Why Brotli

- Higher compression ratio vs gzip for text
- Smaller bundle → faster TTFB + render
- Broad browser support (all modern browsers)

## What to Compress

Text-based assets only:

- .html, .css, .js, .mjs, .json, .svg, .xml, .txt, .wasm
  Do NOT recompress already compressed formats:
- Images (webp, avif, jpg, png) – use proper image optimization process
- PDFs, fonts (woff2 already compressed)

## Vercel Behavior

- Static text responses served with `content-encoding: br` automatically when client supports it.
- Edge / server responses also eligible if size & type meet thresholds.
- No manual configuration needed unless adding custom headers or middleware interfering with compression.

## Self-Hosting Examples

### Nginx

```nginx
brotli              on;
brotli_comp_level   6;        # 4–6 good balance (max 11)
brotli_types        text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml application/xml+rss;
# gzip fallback
gzip                on;
gzip_comp_level     6;
gzip_min_length     1024;
gzip_types          text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml;
```

Ensure `ngx_brotli` module compiled (for some distros you may need dynamic module).

### Apache (mod_brotli + mod_deflate)

```apache
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml
  BrotliCompressionQuality 6
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml
</IfModule>
```

### Node / Express

Prefer a CDN or reverse proxy for heavy lifting, but minimal example:

```js
import express from "express";
import compression from "compression";
import shrinkRay from "shrink-ray-current"; // supports brotli & gzip

const app = express();
app.use(shrinkRay({ brotli: { quality: 6 } }));
// Fallback if you only need gzip:
// app.use(compression());
```

## Verification

Use curl:

```
curl -H 'Accept-Encoding: br' -I https://ark-fid.ch/ | grep -i content-encoding
```

Or Chrome DevTools → Network → Response Headers.

## Best Practices

- Target quality 4–6 (diminishing returns >7) for dynamic responses.
- Do not precompress huge JS bundles if build pipeline already outputs optimal code-splitting; rely on server negotiation.
- Automate regression checks in CI (lighthouse or custom script) if moving off Vercel.

## Troubleshooting

| Symptom                    | Cause                                    | Fix                                                   |
| -------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Missing `content-encoding` | Proxy stripped header                    | Ensure upstream allows `Accept-Encoding` pass-through |
| Large JS still slow        | CPU-bound decompression on older devices | Evaluate reducing bundle size first                   |
| Fonts double-compressed    | Misapplied filter list                   | Remove woff2 from compression types                   |

---

Iterate this file as infrastructure changes (CDN migration, edge middleware modifications, etc.).
