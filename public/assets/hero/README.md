# Hero Image Structure

Place high-quality (non-blurry) service hero images under `services/<service>/hero-original.(jpg|png)`.

Naming convention per service:

- accounting: hero.jpg
- payroll: hero.jpg
- taxes: hero.jpg
- incorporation: hero.jpg
- outsourcing: hero.jpg
- domiciliation: hero.jpg
- corporate: hero.jpg
- odoo: hero.jpg

Optimization guidelines:

- Source width ideally 1600-2000px for future-proof DPR.
- Avoid aggressive compression: aim WebP quality ~82, AVIF ~70 for large photographic images.
- Script overrides will treat any path matching `/assets/hero/services/` as hero (higher cap & quality).
