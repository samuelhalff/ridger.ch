import { type Metadata } from "next";
import { headers } from "next/headers";
import Hero from "@/app/[locale]/home/components/hero";
import ContactForm from "@/src/components/ui/contact-form";
import Services from "@/app/[locale]/home/components/services";
import About from "@/app/[locale]/home/components/about";
import FAQ from "@/app/[locale]/home/components/faq";
import Testimonials from "@/app/[locale]/home/components/testimonials";
import { generateMetadataForPage } from "@/src/lib/metadata";
import Defer from "@/src/components/Defer";
import StructuredData from "@/src/components/seo/StructuredData";
import { buildFAQPage } from "@/src/lib/structuredData";
import { getTranslations, isValidLocale, type Locale } from "@/src/lib/i18n";
import type { FAQEntry } from "@/src/lib/structuredData";
import { CtaBanner } from "@/src/components/ui/surface";
import { Lightning } from "@phosphor-icons/react/dist/ssr";
import { TrustSignals } from "@/src/components/seo/TrustBlocks";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  const activeLocale = isValidLocale(locale) ? locale : "fr";
  return await generateMetadataForPage(activeLocale, "/");
}

// Redeploy happens every 48h, so cache the page until next deployment window
export const revalidate = 172800; // 48 hours

export default async function Home(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const nonce = (await headers()).get("x-nonce") || undefined;
  const requestedLocale = params.locale;
  const activeLocale = isValidLocale(requestedLocale) ? requestedLocale : "fr";
  const t = await getTranslations(activeLocale, "contact");
  const homeT = await getTranslations(activeLocale, "home");
  const agentT = await getTranslations(activeLocale, "agent");
  const heroTranslations = {
    "Hero.Title": homeT("Hero.Title"),
    "Hero.Description": homeT("Hero.Description"),
    "Hero.CTA": homeT("Hero.CTA"),
    "Hero.SecondaryCTA": homeT("Hero.SecondaryCTA"),
    "Hero.ImageAlt": homeT("Hero.ImageAlt"),
    "Hero.OdooPartnerBadge": homeT("Hero.OdooPartnerBadge"),
    "Hero.OdooBadge": homeT("Hero.OdooBadge"),
    "Hero.ScrollHint": homeT("Hero.ScrollHint"),
  };
  const heroFacts = [
    {
      label: homeT("Hero.Facts.Implantation.Label") as string,
      value: homeT("Hero.Facts.Implantation.Value") as string,
      sub: homeT("Hero.Facts.Implantation.Sub") as string,
    },
    {
      label: homeT("Hero.Facts.Expertises.Label") as string,
      value: homeT("Hero.Facts.Expertises.Value") as string,
      sub: homeT("Hero.Facts.Expertises.Sub") as string,
    },
    {
      label: homeT("Hero.Facts.Solutions.Label") as string,
      value: homeT("Hero.Facts.Solutions.Value") as string,
      sub: homeT("Hero.Facts.Solutions.Sub") as string,
    },
  ];
  const localePrefix = `/${activeLocale}`;
  // Load FAQ texts for JSON-LD
  const loadFaq = async (locale: Locale) => {
    try {
      const faqModule: { default: Record<string, string> } = await import(
        `@/src/translations/${locale}/faq.json`
      );
      return faqModule.default;
    } catch {
      const fallbackModule: { default: Record<string, string> } = await import(
        "@/src/translations/en/faq.json"
      );
      return fallbackModule.default;
    }
  };
  const faq = await loadFaq(activeLocale);

  const faqEntries: FAQEntry[] = Array.from({ length: 12 })
    .map((_, i) => i + 1)
    .filter((i) => faq[`Question${i}`] && faq[`Answer${i}`])
    .map((i) => ({ question: faq[`Question${i}`], answer: faq[`Answer${i}`] }));
  const faqJsonLd = buildFAQPage(faqEntries, 8);

  // Choose a stable hero image index per request to avoid hydration mismatch
  const indexSeed = (nonce || `${Date.now()}`)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const heroIndex = indexSeed % 9; // there are 9 service hero images

  const contactStrings = {
    title: (t("Title") as string) || "Get in Touch",
    subtitle: (t("Subtitle") as string) || "",
    labels: {
      name: (t("Form.Name") as string) || "Name",
      companyName:
        (t("Form.CompanyName") as string) || "Company Name (Optional)",
      phone: (t("Form.Phone") as string) || "Phone Number (Optional)",
      email: (t("Form.Email") as string) || "Email",
      message: (t("Form.Message") as string) || "Message",
      consent: (t("Form.Consent") as string) || "I consent to being contacted",
      submit: (t("Form.Submit") as string) || "Submit",
      sending: (t("Form.Sending") as string) || "Sending...",
    },
    placeholders: {
      name: (t("Form.Placeholders.Name") as string) || "Your name",
      companyName:
        (t("Form.Placeholders.CompanyName") as string) || "Company name",
      phone: (t("Form.Placeholders.Phone") as string) || "Phone number",
      email: (t("Form.Placeholders.Email") as string) || "email@example.com",
      message: (t("Form.Placeholders.Message") as string) || "How can we help?",
    },
    errors: {
      required: (t("Errors.Required") as string) || "This field is required",
      invalidEmail:
        (t("Errors.InvalidEmail") as string) || "Invalid email address",
      maxLength: (t("Errors.MaxLength") as string) || "Message is too long",
      consent: (t("Errors.Consent") as string) || "Please provide consent",
    },
    toasts: {
      success:
        (t("Form.Success") as string) || "Thanks! We'll get back to you soon.",
      error: (t("Form.Error") as string) || "Something went wrong.",
    },
  } as const;

  const trustItems = [
    {
      title: homeT("Trust.Sofit.Title") as string,
      description: homeT("Trust.Sofit.Description") as string,
      featured: true,
    },
    {
      title: homeT("Trust.Odoo.Title") as string,
      description: homeT("Trust.Odoo.Description") as string,
      odoo: true,
    },
    {
      title: homeT("Trust.Gaap.Title") as string,
      description: homeT("Trust.Gaap.Description") as string,
    },
  ];
  const entitySummary =
    activeLocale === "fr"
      ? "Ridger est une fiduciaire basée à Genève qui accompagne PME suisses, entrepreneurs, sociétés internationales et familles dans la comptabilité, la fiscalité, les salaires, la domiciliation, l’administration corporate, l’implémentation Odoo et la coordination administrative."
      : "Ridger is a Geneva-based fiduciary firm supporting Swiss SMEs, entrepreneurs, international companies and families with accounting, tax, payroll, domiciliation, corporate administration, Odoo implementation and administrative coordination.";
  const entityFacts =
    activeLocale === "fr"
      ? [
          { title: "Genève", description: "26 Boulevard Georges Favon, 1204 Genève" },
          { title: "SO-FIT", description: "Membre d’un organisme d’autorégulation reconnu pour les activités soumises à la LBA" },
          { title: "Odoo", description: "Intégration et automatisation des processus comptables et administratifs" },
          { title: "Expertises", description: "Comptabilité, fiscalité, salaires, corporate, domiciliation et pilotage financier" },
          { title: "Clients", description: "PME, entrepreneurs, familles et sociétés internationales actives en Suisse" },
          { title: "Équipe", description: "Des profils comptables, fiscaux, juridiques et digitaux réunis autour de vos dossiers" },
        ]
      : [
          { title: "Geneva", description: "26 Boulevard Georges Favon, 1204 Geneva" },
          { title: "SO-FIT", description: "Member of a recognized self-regulatory organization for activities subject to AML rules" },
          { title: "Odoo", description: "Implementation and automation for accounting and administrative workflows" },
          { title: "Expertise", description: "Accounting, tax, payroll, corporate administration, domiciliation and financial steering" },
          { title: "Clients", description: "SMEs, entrepreneurs, families and international companies active in Switzerland" },
          { title: "Team", description: "Accounting, tax, legal and digital profiles working together on your files" },
        ];

  return (
    <div className="mx-auto w-full pb-4">
      <StructuredData nonce={nonce} data={faqJsonLd} />
      <section id="hero">
        <Hero
          locale={activeLocale}
          heroIndex={heroIndex}
          translations={heroTranslations}
          facts={heroFacts}
        />
      </section>
      <section
        id="entity-clarity"
        className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10"
        aria-labelledby="entity-clarity-title"
      >
        <div className="grid gap-6 border-b border-border/50 pb-8 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] md:items-start">
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-muted-foreground/70">
              {activeLocale === "fr" ? "Pourquoi Ridger" : "Why Ridger"}
            </p>
            <h2
              id="entity-clarity-title"
              className="max-w-[16ch] text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl"
            >
              {activeLocale === "fr"
                ? "Fiduciaire à Genève pour décisions concrètes"
                : "A Geneva fiduciary firm for practical decisions"}
            </h2>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {entitySummary}
            </p>
          </div>
          <TrustSignals items={entityFacts} />
        </div>
      </section>
      <section
        id="affiliations"
        className="mx-auto w-full max-w-[1240px] border-y border-border/50 px-5 py-8 sm:px-8 sm:py-10"
        aria-labelledby="affiliations-title"
      >
        <div className="grid items-start gap-8 sm:grid-cols-[auto_repeat(3,1fr)] sm:items-center sm:gap-10">
          <p
            id="affiliations-title"
            className="font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-muted-foreground/70 sm:max-w-[100px]"
          >
            {homeT("Trust.Eyebrow") as string}
          </p>
          <ul className="col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {trustItems.map((item) => (
              <li key={item.title} className="flex flex-col gap-1.5">
                <p
                  className={`text-[17px] font-semibold tracking-[-0.02em] leading-tight ${
                    item.featured
                      ? "text-brand-hover dark:text-brand"
                      : "text-foreground"
                  }`}
                  style={item.odoo ? { color: "#714B67" } : undefined}
                >
                  {item.title}
                </p>
                <p className="text-[13px] leading-[1.55] text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section id="services">
        <Services locale={activeLocale} />
      </section>
      <section
        id="instant-quote"
        className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8"
      >
        <CtaBanner
          variant="warm"
          className="rounded-[28px] p-6 sm:p-8"
          eyebrow={agentT("Title") as string}
          title={agentT("Lead.Title") as string}
          description={`${agentT("Subtitle") as string} ${
            agentT("Intro") as string
          }`}
          icon={
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Lightning className="size-4" weight="fill" aria-hidden="true" />
            </span>
          }
          primary={{
            href: `${localePrefix}/agent/`,
            label: agentT("Lead.Button") as string,
          }}
        />
      </section>
      <section id="about">
        <Defer
          rootMargin="300px"
          idle={200}
          maxDelay={1200}
          placeholder={<div className="h-40 w-full rounded-lg bg-muted/40" />}
        >
          <About />
        </Defer>
      </section>
      <section id="faq">
        <Defer
          rootMargin="300px"
          idle={200}
          maxDelay={1200}
          placeholder={<div className="h-40 w-full rounded-lg bg-muted/40" />}
        >
          <FAQ />
        </Defer>
      </section>
      <section id="testimonials">
        <Defer
          rootMargin="400px"
          idle={300}
          maxDelay={1400}
          placeholder={<div className="h-64 w-full rounded-lg bg-muted/40" />}
        >
          <Testimonials />
        </Defer>
      </section>
      <section id="contact" className="px-5 py-10 sm:px-8">
        <Defer
          rootMargin="300px"
          idle={200}
          maxDelay={1400}
          placeholder={<div className="h-64 w-full rounded-lg bg-muted/40" />}
        >
          <ContactForm strings={contactStrings} redirectPath={`${localePrefix}/`} />
        </Defer>
      </section>
    </div>
  );
}
