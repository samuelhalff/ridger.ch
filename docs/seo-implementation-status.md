# SEO Implementation Status - Ark Fiduciaire

**Last Updated:** October 6, 2025

## ✅ Completed Implementations

### 1. **Meta Tags & Title Optimization**

- ✅ **Natural sentence case titles** across all languages (EN, FR, DE, ES, PT)
- ✅ **Service-location pattern**: "Fiduciary services Geneva" instead of "Professional Fiduciary Services"
- ✅ **Avoided AI-sounding language**: Removed words like "Professional", "Expert", "Comprehensive"
- ✅ **H1 tags optimized** with long-tail keywords:
  - EN: "Fiduciary services in Geneva – Trusted Partner for SMEs"
  - FR: "Fiduciaire à Genève – Votre partenaire de confiance"
  - DE, ES, PT: Consistent translations following same pattern
- ✅ **Resources page** included in SEO metadata with natural capitalization

**Scripts Created:**

- `scripts/update-seo-metadata.js` - Updates EN/FR metadata
- `scripts/update-seo-metadata-multi.js` - Updates DE/ES/PT metadata
- `scripts/fix-seo-capitalization.js` - Fixes capitalization in EN/FR
- `scripts/fix-seo-capitalization-multi.js` - Fixes capitalization in DE/ES/PT

### 2. **Technical SEO**

- ✅ **Clean URL structure**: `/fr/services/comptabilite`, `/en/services/accounting`
- ✅ **Hreflang tags**: Fully implemented in `src/lib/metadata.ts`
  - Maps FR → fr-CH, DE → de-CH, ES → es-ES, PT → pt-PT, EN → en
  - x-default points to FR (canonical)
- ✅ **XML Sitemap**: `app/sitemap.xml/route.ts`
  - All pages included with hreflang alternates
  - Proper changefreq and priority values
  - Includes dynamic article pages from resources
- ✅ **Image optimization**:
  - ✅ next/image with automatic optimization
  - ✅ AVIF/WebP formats in `/public/assets/`
  - ✅ Lazy loading on non-critical images
  - ✅ Priority loading for hero images
  - ✅ Blur placeholders for smooth loading

### 3. **Local SEO**

- ✅ **Footer NAP (Name, Address, Phone)**:
  - Full address: 26 Boulevard Georges Favon, 1204 Genève, CH
  - Phone: +41 22 700 70 20
  - Email: info@ark-fid.ch
  - Google Maps link included
  - Microdata markup with schema.org/PostalAddress
- ✅ **LocalBusiness Schema (JSON-LD)**:
  - Added to home page
  - Includes complete NAP data
  - Geo coordinates: 46.2021, 6.1419
  - Opening hours: Mo-Fr 09:00-18:00
  - Area served: Geneva, Switzerland, Genève, Suisse
- ✅ **Service Schema**: Each service page has structured data
- ✅ **Breadcrumb Schema**: Implemented on all service pages
- ✅ **FAQ Schema**: Home page FAQ structured for rich snippets

### 4. **Language Switching Fix**

- ✅ **Client-side reactive components**:
  - Converted Hero, Services, About components to "use client"
  - Use `useTranslation()` hook instead of server-side `getTranslations()`
  - All home page sections now switch language when toggled
  - Fixed issue where FAQ and "Why choose Ark" didn't update

### 5. **Content Structure**

- ✅ **Service pages** use H1, H2, H3 hierarchy:
  - Hero H1 with primary keyword
  - Presentation sections with H2 subheadings
  - Accordion/FAQ sections with H3 for long-tail keywords
- ✅ **Existing content depth**:
  - Accounting page: ~680 words (good depth)
  - Other service pages: 240-260 words each
  - All pages use structured components with IconList, Accordions

## 🔄 Recommended Next Steps

### 1. **Content Expansion (Priority: HIGH)**

Each service page should have **500-700 words minimum** for better SEO:

**Current status:**

- ✅ Accounting: ~680 words (sufficient)
- ⚠️ Taxes: ~240 words (needs expansion)
- ⚠️ Payroll: ~254 words (needs expansion)
- ⚠️ Incorporation: ~243 words (needs expansion)

**Recommended additions:**

- Add "Common Questions" section to each service page
- Expand "How we help" sections with specific use cases
- Add "Who is this for" section targeting specific client types
- Include process/timeline sections

**Long-tail keyword opportunities:**

- "Déclaration d'impôt pour particuliers Genève"
- "TVA compliance for small businesses Geneva"
- "Payroll outsourcing for startups Switzerland"
- "Company formation Geneva step by step"

### 2. **Service Page FAQs (Priority: MEDIUM)**

Add dedicated FAQ components to each service page:

```tsx
// Example structure for /services/taxes
<h3>Common tax questions in Geneva</h3>
- When is the tax filing deadline in Geneva?
- How to optimize VAT for small businesses?
- What tax deductions are available for SMEs?
```

**Benefits:**

- Targets long-tail search queries
- Increases page word count
- Great for Google featured snippets
- Improves user experience

### 3. **External Authority Building (Priority: MEDIUM)**

**Directory listings:**

- [ ] Register on local.ch (Swiss business directory)
- [ ] Submit to CCIG (Geneva Chamber of Commerce)
- [ ] Add to Swiss fiduciary associations
- [ ] Create/update Yelp Business listing
- [ ] Register on europages.com

**Google Business Profile:**

- [ ] Create/optimize listing for "Ark Fiduciaire Genève"
- [ ] Add complete NAP information
- [ ] Upload photos of office, team
- [ ] Encourage client reviews
- [ ] Post regular updates (services, articles)

**Backlinks strategy:**

- [ ] Publish LinkedIn articles about Geneva tax deadlines, business formation
- [ ] Partner blog posts (e.g., Odoo implementation case studies)
- [ ] Guest posts on Swiss business blogs
- [ ] Create shareable infographics (tax calendar, incorporation checklist)

### 4. **Tracking & Analytics (Priority: HIGH)**

**Google Search Console:**

- [ ] Verify property ownership
- [ ] Submit sitemap: `https://ark-fid.ch/sitemap.xml`
- [ ] Monitor indexing status
- [ ] Track search impressions and queries
- [ ] Check for crawl errors
- [ ] Review mobile usability

**Google Analytics / GA4:**

- [ ] Set up GA4 property
- [ ] Configure conversion tracking (contact form submissions)
- [ ] Track page views by language
- [ ] Monitor bounce rate by page
- [ ] Set up goal funnels (homepage → service page → contact)

**Performance monitoring:**

- [ ] Lighthouse CI already set up (desktop + mobile)
- [ ] Monitor Core Web Vitals
- [ ] Track time to first byte (TTFB)
- [ ] Check mobile vs desktop performance

### 5. **Content Marketing (Priority: LOW)**

**Resources section expansion:**

- [ ] Publish monthly articles on Geneva tax updates
- [ ] Create downloadable checklists (company formation, tax filing)
- [ ] Quarterly business guides (Q1 tax deadlines, year-end accounting)
- [ ] Video content (embedded YouTube with transcripts)

**Social media integration:**

- [ ] Share new articles on LinkedIn
- [ ] Create carousel posts with key insights
- [ ] Engage with Geneva business community
- [ ] Share client success stories (anonymized)

## 📊 SEO Metrics to Track

### Search Console (Weekly)

- Total impressions
- Average position for key terms
- Click-through rate (CTR)
- Pages with crawl errors

### Key Performance Indicators (Monthly)

- Organic traffic growth
- Keyword rankings for:
  - "fiduciaire genève"
  - "comptabilité genève"
  - "création entreprise genève"
  - "expert comptable genève"
- Conversion rate (contact form submissions)
- Bounce rate by page

### Competitive Analysis (Quarterly)

- Compare rankings vs. competitors
- Analyze competitor content depth
- Review competitor backlink profiles
- Identify new keyword opportunities

## 🛠️ Technical Implementation Notes

### Files Modified (Latest Commits)

1. **Language switching fix:**

   - `app/[locale]/home/components/hero.tsx` - Client-side
   - `app/[locale]/home/components/services.tsx` - Client-side
   - `app/[locale]/home/components/about.tsx` - Client-side
   - `app/[locale]/page.tsx` - Updated prop passing

2. **LocalBusiness schema:**

   - `src/lib/structuredData.ts` - Added buildLocalBusiness()
   - `app/[locale]/page.tsx` - Integrated schema
   - `app/[locale]/shared/footer.tsx` - Added phone/email

3. **SEO metadata:**
   - `src/translations/*/metadata.json` (all 5 languages)
   - `src/translations/*/home.json` (H1 updates)

### Existing Infrastructure

- **Metadata generation**: `src/lib/metadata.ts` handles all meta tags
- **Sitemap**: `app/sitemap.xml/route.ts` (dynamic generation)
- **Structured data**: `src/lib/structuredData.ts` (reusable builders)
- **Translations**: `src/translations/{locale}/*.json` (i18next)

## 📝 Quick Reference

### Contact Information

- **Name**: Ark Fiduciaire SA
- **Address**: 26 Boulevard Georges Favon, 1204 Genève, CH
- **Phone**: +41 22 700 70 20
- **Email**: info@ark-fid.ch
- **Website**: https://ark-fid.ch
- **Google Maps CID**: 14946625157719331801

### Supported Languages

- French (FR) - Primary/x-default
- English (EN)
- German (DE)
- Spanish (ES)
- Portuguese (PT)

### Key URLs

- Sitemap: https://ark-fid.ch/sitemap.xml
- Robots: https://ark-fid.ch/robots.txt
- Humans: https://ark-fid.ch/humans.txt

## 🎯 Success Criteria

**3 Months:**

- [ ] Indexed on first page for "fiduciaire genève"
- [ ] 50+ organic visits per month
- [ ] 5+ contact form submissions from organic search
- [ ] Google Business Profile with 5+ reviews

**6 Months:**

- [ ] Top 5 for primary keywords in Geneva area
- [ ] 200+ organic visits per month
- [ ] 15+ contact form submissions from organic search
- [ ] Domain Authority score > 25

**12 Months:**

- [ ] Top 3 for "fiduciaire genève" and related terms
- [ ] 500+ organic visits per month
- [ ] 30+ contact form submissions from organic search
- [ ] Featured snippets for FAQ questions
- [ ] 20+ quality backlinks from Swiss business sites

---

**Note**: This document should be updated quarterly with progress, new findings, and adjusted strategies based on actual search performance data.
# Search Console indexation policy (July 2026)

The excluded-page total is not a defect count. The following exclusions are intentional and should be monitored rather than forced into the index:

- permanent redirects for retired, legacy, non-locale, or slashless URLs;
- generated Open Graph and Twitter images blocked by `robots.txt`;
- API and framework routes blocked by `robots.txt`;
- query/filter states carrying `X-Robots-Tag: noindex`;
- malformed crawl-junk URLs returning `410`;
- translations excluded by the genuine-translation or configured placeholder-locale policy.

Actionable defects are sitemap URLs that redirect or fail, canonical/hreflang targets that disagree or are not direct `200` responses, unexpected `404`/`5xx` responses, internal links that emit legacy paths, and useful eligible pages that remain crawled-not-indexed after their canonical and content signals have been reprocessed.

The July 2026 remediation keeps all genuine multilingual content and lead routes indexable. It does not introduce locale-wide `noindex`, serve slash duplicates as `200`, or block query strings before crawlers can observe their `noindex` response.
