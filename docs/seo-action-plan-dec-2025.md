# SEO Action Plan - December 2025

## Executive Summary

Ark Fiduciaire is a new brand (founded 2025 through strategic union of two firms). Primary SEO goal: **Authority Transfer** from legacy domains to ark-fid.ch.

---

## ✅ Completed: Technical On-Page SEO

### 1. Title Tags & Meta Descriptions

**Status:** ✅ Implemented (Dec 18, 2025)

**Changes Made:**

- Enhanced all title tags with secondary keywords and click-worthy language
- Added CTAs to meta descriptions ("Book a confidential strategy session today")
- Targeted specific search intents:
  - "Family Office Switzerland | Wealth Structuring & Governance"
  - "Tax Advisory Geneva | Expat & SME Tax Services"
  - "Odoo Implementation Geneva | Swiss ERP for SMEs"
  - "Company Incorporation Geneva | Formation Costs & Process"

**Files Updated:**

- `/src/translations/en/metadata.json`
- `/src/translations/fr/metadata.json`

### 2. Schema Markup

**Status:** ✅ Already Implemented + Enhanced

**Existing Implementation:**

- ✅ LocalBusiness schema on homepage (with geo coordinates, opening hours, address)
- ✅ FAQ schema (home page)
- ✅ Article schema (all blog posts with reading time, author, publisher)
- ✅ Breadcrumb schema (all pages)
- ✅ Service schema (service pages)

**New Addition:**

- ✅ AccountingService (FinancialService) schema builder added to `/src/lib/structuredData.ts`
  - Can now be integrated into accounting-specific service pages for enhanced rich snippets

### 3. Content Structure

**Status:** ✅ Already Optimized

- All articles rendered as HTML pages (using ReactMarkdown)
- NOT PDFs (Google can fully index)
- Proper semantic HTML with structured data

---

## 🔄 Manual Tasks Required (External SEO)

### Priority 1: CRITICAL - Authority Transfer

#### 301 Redirects from Legacy Domains

**Status:** ⚠️ ACTION REQUIRED

**What to do:**

1. Identify the two original fiduciary firm domains
2. Map old URLs to new ark-fid.ch pages:
   ```
   OLD DOMAIN                        → NEW DOMAIN
   oldfirm1.ch/services/accounting  → ark-fid.ch/services/accounting
   oldfirm2.ch/comptabilite         → ark-fid.ch/services/accounting
   ```
3. **Not applicable** — there is no legacy website to redirect. Instead, focus on authority transfer via:
   - Press release / merger announcement to local media and industry outlets
   - Updating directory listings (local.ch, search.ch, ExpertSuisse)
   - Verifying Google Business Profiles and requesting reviews from legacy clients
   - Ensuring partner listings (Odoo, associations) point to `https://ark-fid.ch`
4. Verify forward-looking tasks using: `curl -I https://ark-fid.ch/` and monitor Search Console for index coverage

**Risk if not done:** You've lost years of SEO "juice" and domain authority.

**Tools:**

- `.htaccess` (Apache)
- `nginx.conf` redirects (Nginx)
- Cloudflare redirect rules

---

### Priority 2: Local SEO (Geneva & Lausanne)

#### Google Business Profile (GBP) Setup

**Status:** ⚠️ ACTION REQUIRED

**Tasks:**

1. **Create/Verify GBP Listings:**
   - Geneva location: verify ownership
   - Lausanne location: verify ownership
2. **Complete All Profile Fields:**

   - Business name: "Ark Fiduciaire SA"
   - Category: "Accounting Firm" (primary), "Tax Consultant", "Business Management Consultant"
   - Service areas: Geneva, Lausanne, Vaud, Romandy
   - Hours: Mon-Fri 8:30-17:30 (adjust as needed)
   - Website: `https://ark-fid.ch`
   - Phone: +41 XX XXX XX XX
   - Photos: Office, team, logo (min 3 high-quality images)

3. **Request Reviews from Legacy Clients:**

   - Email template: "We've merged under Ark Fiduciaire. If you were satisfied with our service, please leave a review on our new profile."
   - Target: 10+ reviews in first 3 months
   - **Do NOT incentivize reviews** (violates Google policy)

4. **GBP Posts (Weekly):**
   - Share new blog articles
   - Tax deadline reminders
   - "Did you know?" posts about Swiss incorporation

**Tool:** https://business.google.com

---

#### Local Directory Listings

**Status:** ⚠️ ACTION REQUIRED

**Update NAP (Name, Address, Phone) on:**

- ✅ local.ch
- ✅ search.ch
- ⚠️ ExpertSuisse (if member)
- ⚠️ Swiss Fiduciary Association directories
- ⚠️ Yelp Switzerland
- ⚠️ Apple Maps Connect

**Consistency is critical:** Ensure exact same business name, address format across all platforms.

---

### Priority 3: Backlinks & Authority Building

#### Odoo Partner Directory Link

**Status:** ⚠️ ACTION REQUIRED

**What to check:**

1. Go to: https://www.odoo.com/partners
2. Search for "Ark Fiduciaire"
3. Verify link points to `https://ark-fid.ch` (not old domains)
4. If missing/incorrect, contact Odoo partner support

**Why important:** Official Odoo Partner badge = high-quality backlink for "Odoo Geneva" rankings.

---

#### Personal Brand Backlinks

**Status:** ⚠️ Quick Win

**Action:**

1. Search Google for:

   - "Samuel Halff"
   - "Hassan Barbir"
   - [Other partners' names]

2. Update their LinkedIn profiles:

   - Current company: "Ark Fiduciaire SA"
   - Company URL: `https://ark-fid.ch`

3. Update any personal bios on:
   - Industry association websites
   - Conference speaker profiles
   - Guest blog author bios
   - University alumni pages

**Why:** Personal brands often rank faster than new corporate brands. Leverage them for authority transfer.

---

### Priority 4: Local Keyword Targeting

#### Content Ideas (Write in 2026 Q1)

**Status:** 📝 Content Backlog

1. **Expat-Focused Content:**

   - "Tax Guide for Expats Moving to Geneva in 2026"
   - "English-Speaking Fiduciary Services in Lausanne"
   - "Non-Resident Tax Filing in Switzerland: What You Need to Know"

2. **Cost-Focused Content:**

   - "Company Incorporation Costs in Geneva: Complete 2026 Breakdown"
   - "How Much Does a Fiduciary Cost for SMEs in Switzerland?"

3. **Odoo Content Hub:**

   - Create a main page: `/services/odoo` (already exists ✅)
   - Link all Odoo articles to this hub page
   - Add internal links from:
     - Accounting service page → Odoo page ("We implement Odoo for...")
     - Resources page → Odoo articles

4. **Problem-Solution Content:**
   - "Switching Fiduciaries in Geneva: A Checklist for 2026"
   - "5 Signs Your Fiduciary Is Not Meeting Swiss Compliance Standards"
   - "Why Traditional ERPs Are Failing Swiss SMEs (And What to Do)"

**Keyword Research Tools:**

- Google Keyword Planner (free with Google Ads account)
- Answer the Public (free tier)
- Search Console (query report)

#### Geneva keyword list (decoded)

| Keyword | Intent | Page Type | Priority | Volume | Location |
| --- | --- | --- | --- | --- | --- |
| permis de travail genève | local | service | medium | 1900 | Geneva, Geneva, Switzerland |
| déclaration d'impôt genève | local | service | medium | 1000 | Geneva, Geneva, Switzerland |
| création de société genève | local | service | high | 880 | Geneva, Geneva, Switzerland |
| experts comptables genève | local | landing | high | 720 | Geneva, Geneva, Switzerland |
| fiduciaire à genève | local | primary | high | 480 | Geneva, Geneva, Switzerland |
| domiciliation d'entreprise genève | local | service | high | 480 | Geneva, Geneva, Switzerland |
| domiciliation société genève | local | service | high | 390 | Geneva, Geneva, Switzerland |
| constitution de société genève | local | service | high | 390 | Geneva, Geneva, Switzerland |
| conseil fiscal genève | local | service | high | 320 | Geneva, Geneva, Switzerland |
| création sarl genève | local | service | high | 260 | Geneva, Geneva, Switzerland |
| cabinet fiduciaire genève | local | primary | high | 260 | Geneva, Geneva, Switzerland |
| comptabilité entreprise genève | local | service | high | 260 | Geneva, Geneva, Switzerland |
| gestion de paie genève | local | service | high | 220 | Geneva, Geneva, Switzerland |
| domiciliation commerciale genève | local | service | medium | 210 | Geneva, Geneva, Switzerland |
| société fiduciaire genève | local | landing | medium | 210 | Geneva, Geneva, Switzerland |
| optimisation fiscale genève | local | landing | high | 170 | Geneva, Geneva, Switzerland |
| fiduciaire impôts genève | local | service | high | 170 | Geneva, Geneva, Switzerland |
| tenue comptable genève | local | service | high | 170 | Geneva, Geneva, Switzerland |
| adresse de domiciliation genève | local | service | medium | 170 | Geneva, Geneva, Switzerland |
| création sa genève | local | service | high | 140 | Geneva, Geneva, Switzerland |
| services fiduciaires genève | local | primary | high | 140 | Geneva, Geneva, Switzerland |
| conseil installation genève | local | landing | low | 140 | Geneva, Geneva, Switzerland |
| fiduciaire anglophone genève | local | landing | medium | 140 | Geneva, Geneva, Switzerland |
| cabinet fiscal genève | local | service | medium | 140 | Geneva, Geneva, Switzerland |
| fiduciaire paie genève | local | service | high | 120 | Geneva, Geneva, Switzerland |
| gestion salaires genève | local | service | medium | 120 | Geneva, Geneva, Switzerland |
| gestion comptable genève | local | service | medium | 120 | Geneva, Geneva, Switzerland |
| accompagnement permis b genève | local | service | low | 110 | Geneva, Geneva, Switzerland |
| clôture annuelle genève | local | service | medium | 110 | Geneva, Geneva, Switzerland |
| administration rh genève | local | service | medium | 110 | Geneva, Geneva, Switzerland |
| fiduciaire internationale genève | local | landing | medium | 110 | Geneva, Geneva, Switzerland |
| ark fiduciaire genève | navigational | primary | high | 90 | Geneva, Geneva, Switzerland |
| fiduciaire pme genève | local | landing | high | 90 | Geneva, Geneva, Switzerland |
| externalisation comptable genève | local | service | high | 90 | Geneva, Geneva, Switzerland |
| fiduciaire domiciliation genève | local | service | high | 90 | Geneva, Geneva, Switzerland |
| déclaration fiscale entreprise genève | local | service | high | 90 | Geneva, Geneva, Switzerland |
| bulletins de salaire genève | local | service | medium | 90 | Geneva, Geneva, Switzerland |
| fiduciaire pour expatriés genève | local | landing | medium | 90 | Geneva, Geneva, Switzerland |
| assistance permis de séjour genève | local | service | medium | 90 | Geneva, Geneva, Switzerland |
| externalisation paie genève | local | service | high | 80 | Geneva, Geneva, Switzerland |
| états financiers genève | local | service | low | 80 | Geneva, Geneva, Switzerland |
| décompte tva genève | local | service | high | 70 | Geneva, Geneva, Switzerland |
| bouclage comptable genève | local | service | medium | 70 | Geneva, Geneva, Switzerland |
| conseil tva genève | local | service | medium | 70 | Geneva, Geneva, Switzerland |
| fiduciaire startup genève | local | landing | medium | 70 | Geneva, Geneva, Switzerland |
| fiscalité pme genève | local | landing | high | 60 | Geneva, Geneva, Switzerland |
| fiduciaire création société genève | local | landing | high | 60 | Geneva, Geneva, Switzerland |
| comptabilité tva genève | local | service | medium | 60 | Geneva, Geneva, Switzerland |
| fiduciaire entrepreneurs genève | local | landing | medium | 60 | Geneva, Geneva, Switzerland |
| immigration entreprise genève | local | service | low | 50 | Geneva, Geneva, Switzerland |
| fiduciaire scale-up genève | local | landing | low | 30 | Geneva, Geneva, Switzerland |

---

### Priority 5: Technical Monitoring

#### Schema Validation

**Status:** ⚠️ Ongoing Monitoring

**Tools:**

- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org

**Pages to test:**

- ✅ Homepage (LocalBusiness + FAQ)
- ✅ Service pages (Service + Breadcrumb)
- ✅ Article pages (Article + Breadcrumb)

**Fix any warnings/errors immediately.**

---

#### Mobile Speed Audit

**Status:** ⚠️ Quarterly Check

**Test URLs:**

- https://pagespeed.web.dev/
- Lighthouse CI (already configured ✅)

**Target Scores:**

- Mobile: 90+ (Performance)
- Desktop: 95+ (Performance)
- Accessibility: 100
- Best Practices: 100
- SEO: 100

**Common fiduciary client scenario:** High-net-worth individuals browsing on mobile while traveling. Slow load = lost lead.

---

## 🎯 Quick Wins (Do This Week)

1. **Update LinkedIn profiles** of all partners to link to ark-fid.ch ⏱️ 15 min
2. **Claim Google Business Profile** for Geneva + Lausanne ⏱️ 30 min
3. **Verify Odoo partner link** points to new domain ⏱️ 5 min
4. **Submit sitemap to Google Search Console & verify property** ⏱️ 10 min
5. **Test schema markup** on homepage using Google Rich Results Test ⏱️ 5 min

**Total time investment:** ~65 minutes
**SEO impact:** High (especially for local rankings)

---

## 📊 Measurement & Tracking

### Key Metrics to Monitor (Monthly)

1. **Google Search Console:**

   - Impressions (target: +20% month-over-month)
   - Click-through rate (target: >3% average)
   - Top queries: "fiduciaire genève", "family office suisse", "odoo geneva"

2. **Google Business Profile Insights:**

   - Search views (target: 100+/month per location)
   - Direction requests
   - Phone calls
   - Review count & average rating (target: 4.5+ stars)

3. **Google Analytics 4:**

   - Organic traffic (target: +15% month-over-month)
   - Top landing pages from organic search
   - Conversion rate for contact form submissions

4. **Backlink Monitoring:**
   - Tool: Ahrefs, Moz, or free alternative (Ubersuggest)
   - Domain Authority (DA) score
   - Number of referring domains

### Red Flags to Watch

- ⚠️ Sudden drop in rankings = potential algorithm update or technical issue
- ⚠️ High bounce rate on service pages = content doesn't match search intent
- ⚠️ Low CTR despite high impressions = title tags need improvement

---

## 🚀 6-Month SEO Roadmap

### Month 1 (Jan 2026): Foundation

- ✅ N/A — no legacy website; prioritize GBP verification, directory updates, and a merger announcement/press release
- ✅ Set up Google Business Profiles
- ✅ Request 10 reviews from legacy clients
- ✅ Update all directory listings

### Month 2-3 (Feb-Mar 2026): Content Expansion

- 📝 Publish 2 expat-focused articles
- 📝 Publish 1 cost breakdown article
- 📝 Create Odoo content hub with 3 linked articles
- 📝 Add "Switching fiduciaries" guide

### Month 4-5 (Apr-May 2026): Authority Building

- 🔗 Outreach to Swiss business blogs (guest posting)
- 🔗 Get featured in local business publications
- 🔗 Speak at Geneva/Lausanne SME events (backlinks from event pages)

### Month 6 (Jun 2026): Analysis & Iteration

- 📊 Full SEO audit
- 📊 Compare rankings vs. competitors
- 📊 Identify top-performing content
- 📊 Double down on what works

**Expected Results by Jun 2026:**

- 50-100% increase in organic traffic
- Top 3 rankings for "fiduciaire genève", "family office suisse"
- 20+ total Google reviews (combined Geneva + Lausanne)
- Domain Authority: 25-30 (from current ~15-20 for new domain)

---

## 📚 Resources & Tools

### Free SEO Tools

- Google Search Console: https://search.google.com/search-console
- Google Business Profile: https://business.google.com
- Google Analytics 4: https://analytics.google.com
- PageSpeed Insights: https://pagespeed.web.dev
- Schema Validator: https://validator.schema.org

### Paid Tools (Optional)

- Ahrefs ($99/mo): Backlink analysis, keyword research
- SEMrush ($119/mo): Competitor analysis, rank tracking
- Screaming Frog (Free tier): Technical SEO audits

### Learning Resources

- Google Search Central: https://developers.google.com/search
- Ahrefs Blog: SEO best practices
- Search Engine Journal: Industry news

---

## ✅ Next Steps

1. **Assign ownership:** Who manages GBP? Who writes content?
2. **Set up tracking:** Ensure Google Analytics 4 + Search Console installed
3. **Weekly review:** Every Monday, check Search Console for new queries
4. **Monthly meeting:** Review progress against 6-month roadmap

**Contact:** For questions about this SEO plan, refer to this document or consult with your SEO/marketing lead.

---

_Document created: December 18, 2025_
_Last updated: December 18, 2025_
_Next review: January 15, 2026_
