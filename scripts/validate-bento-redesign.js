const fs = require("fs");
const path = require("path");

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assertIncludes(file, needle, message) {
  const content = read(file);
  if (!content.includes(needle)) {
    throw new Error(`${file}: ${message}\nMissing: ${needle}`);
  }
}

function assertNotMatches(file, pattern, message) {
  const content = read(file);
  const match = content.match(pattern);
  if (match) {
    throw new Error(`${file}: ${message}\nFound: ${match[0]}`);
  }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), {
    withFileTypes: true,
  })) {
    if (entry.name === "translations" || entry.name.endsWith(".backup")) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const checks = [
  () => assertIncludes("app/globals.css", "--brand: 0.658 0.122 47.5;", "brand token must match the V2 brief"),
  () => assertIncludes("app/globals.css", "--card: 0.94 0.009 75;", "card token must create visible contrast with the white page background"),
  () => assertIncludes("app/globals.css", "--surface-warm: 0.928 0.012 68;", "surface token must create visible contrast with card and background surfaces"),
  () => assertIncludes("tailwind.config.ts", 'DEFAULT: "oklch(var(--brand) / <alpha-value>)"', "tailwind must expose bg-brand/text-brand"),
  () => assertIncludes("tailwind.config.ts", 'warm: "oklch(var(--surface-warm) / <alpha-value>)"', "tailwind must expose bg-surface-warm"),
  () => assertIncludes("src/translations/fr/home.json", '"Title": "Comptabilité, fiscalité, tranquillité."', "French home hero title should follow the V2 mockup"),
  () => assertIncludes("app/[locale]/home/components/hero.tsx", "max-w-[14ch]", "home hero H1 must use the decisive V2 scale and measure"),
  () => assertNotMatches("app/[locale]/home/components/hero.tsx", /hero-preview|Implantation|Expertises|Odoo · IA|Genève · Lausanne|Compta · Tax · RH/, "home hero must not keep the removed preview/facts strip"),
  () => assertNotMatches("app/[locale]/home/components/hero.tsx", /Hero\.Badge|Swiss made/, "home hero must not render the Swiss Made badge"),
  () => assertNotMatches("app/[locale]/home/components/hero.tsx", /<Badge|from "@\/src\/components\/ui\/badge"/, "home hero must not render a badge above the title"),
  () => assertNotMatches("app/[locale]/home/components/hero.tsx", /ResponsiveImage|ParallaxReveal|min-h-\[calc\(100vh-4rem\)\]|rounded-\[36px\]/, "home hero must not keep the old image-card composition"),
  () => assertNotMatches("src/components/site/page-hero.tsx", /rounded-\[32px\]|bg-gradient-to-br|radial-gradient/, "shared PageHero must be an editorial section, not the old rounded gradient card"),
  () => assertNotMatches("app/layout.tsx", /className="[^"]*(abstract-background|pt-15|mt-10)/, "root content wrapper must not create the colored banner below the top bar"),
  () => assertIncludes("src/components/navigation/NavbarClient.tsx", "max-w-[1240px]", "header contents must align to the same max-width as the page content"),
  () => assertNotMatches("app/[locale]/shared/footer.tsx", /Ridger<\/span>/, "footer logo area must not include the extra Ridger badge"),
  () => assertIncludes("app/[locale]/home/components/services.tsx", "grid-cols-1", "services must use a single-column mobile bento grid"),
  () => assertIncludes("app/[locale]/home/components/services.tsx", "md:grid-cols-4 lg:grid-cols-6", "services must use the requested tablet/desktop bento grid"),
  () => assertIncludes("app/[locale]/home/components/services.tsx", "lg:row-span-2", "first service tile must span two rows on desktop"),
  () => assertIncludes("app/[locale]/home/components/services.tsx", 'service.titleKey === "OdooImplementation.Title"', "Odoo tile must be highlighted by existing title key"),
  () => assertIncludes("app/[locale]/home/components/services.tsx", "bg-[#1f1b19] text-white", "hero service tile must be a distinct readable dark anchor tile"),
  () => assertIncludes("app/[locale]/page.tsx", "max-w-[900px]", "instant quote banner must be narrow and centered"),
  () => assertIncludes("app/[locale]/page.tsx", "CtaBanner", "instant quote banner must use the shared CTA surface"),
  () => assertIncludes("src/components/ui/surface.tsx", "bg-surface-warm text-foreground", "shared warm CTA surface must use the warm neutral compact surface"),
  () => assertIncludes("app/globals.css", ".btn-secondary-cta", "secondary CTA buttons must use a reusable higher-contrast style"),
  () => assertIncludes("src/components/ui/article-contextual-cta.tsx", "CtaBanner", "article contextual CTA must use the shared readable CTA surface"),
  () => assertIncludes("app/[locale]/ressources/articles/components/ContactSection.tsx", "CtaBanner", "article end CTA must use the shared contrast CTA surface"),
  () => assertIncludes("src/components/ui/surface.tsx", "bg-card text-foreground", "shared contrast CTA surface must align with the reusable card surface"),
  () => assertIncludes("src/components/ui/surface.tsx", "| \"whatsapp\"", "contact WhatsApp card must use a dedicated green action-card variant"),
  () => assertIncludes("src/components/ui/service-longform.tsx", "ServiceContactForm", "service long-form content must include the reusable mid-page service CTA"),
  () => assertIncludes("app/globals.css", ".prose a", "brand-aware prose styles must be present"),
  () => assertIncludes("src/components/motion/reveal.tsx", "setMounted(true)", "Reveal must keep SSR content visible before motion hydrates"),
  () => assertIncludes("src/components/motion/parallax-reveal.tsx", "setMounted(true)", "ParallaxReveal must keep SSR content visible before motion hydrates"),
];

for (const check of checks) check();

const scanned = [
  ...walk("app"),
  ...walk("src").filter((file) => !file.startsWith("src/translations/")),
  "tailwind.config.ts",
];

for (const file of scanned) {
  assertNotMatches(file, /brand-peach|brand-ink|brand-paper/, "old custom brand token names should not remain");
  assertNotMatches(file, /(text|bg|border|ring)-(blue|indigo|sky)-/, "blue/indigo/sky utility classes should not remain");
  assertNotMatches(file, /#(2D5BFF|3B82F6|1E40AF|2563EB)/i, "literal blue brand colors should not remain");
}

console.log("Bento redesign source checks passed.");
