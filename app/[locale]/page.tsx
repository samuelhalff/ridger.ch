import { type Metadata } from "next";
import { headers } from "next/headers";
import Hero from "@/app/[locale]/home/components/hero";
import ContactForm from "@/src/components/ui/contact-form";
import Services from "@/app/[locale]/home/components/services";
import About from "@/app/[locale]/home/components/about";
import FAQ from "@/app/[locale]/home/components/faq";
import { generateMetadataForPage } from "@/src/lib/metadata";
import Defer from "@/src/components/Defer";
import StructuredData from "@/src/components/seo/StructuredData";
import { buildFAQPage } from "@/src/lib/structuredData";
import { getTranslations, isValidLocale, type Locale } from "@/src/lib/i18n";
import type { FAQEntry } from "@/src/lib/structuredData";

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

type HowStep = { Title?: string; Body?: string };

export default async function Home(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const nonce = (await headers()).get("x-nonce") || undefined;
  const requestedLocale = params.locale;
  const activeLocale = isValidLocale(requestedLocale) ? requestedLocale : "fr";
  const t = await getTranslations(activeLocale, "contact");
  const homeT = await getTranslations(activeLocale, "home");
  const heroTranslations = {
    "Hero.Title": homeT("Hero.Title"),
    "Hero.Description": homeT("Hero.Description"),
    "Hero.CTA": homeT("Hero.CTA"),
    "Hero.SecondaryCTA": homeT("Hero.SecondaryCTA"),
    "Hero.ImageAlt": homeT("Hero.ImageAlt"),
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

  const howSteps = Array.isArray(homeT("How.Steps") as unknown)
    ? (homeT("How.Steps") as unknown as HowStep[])
    : [];

  const trustItems = [
    {
      title: homeT("Trust.DataResidency.Title") as string,
      description: homeT("Trust.DataResidency.Description") as string,
    },
    {
      title: homeT("Trust.Secrecy.Title") as string,
      description: homeT("Trust.Secrecy.Description") as string,
    },
    {
      title: homeT("Trust.Response.Title") as string,
      description: homeT("Trust.Response.Description") as string,
    },
  ];

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

  return (
    <div className="mx-auto w-full pb-4">
      <StructuredData nonce={nonce} data={faqJsonLd} />
      <section id="hero">
        <Hero
          locale={activeLocale}
          translations={heroTranslations}
          facts={heroFacts}
        />
      </section>

      <section id="services">
        <Services locale={activeLocale} />
      </section>

      {howSteps.length > 0 ? (
        <section
          id="how-we-work"
          className="mx-auto w-full max-w-[1240px] px-5 py-12 sm:px-8 sm:py-16"
          aria-labelledby="how-we-work-title"
        >
          <p className="font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-muted-foreground/70">
            {homeT("How.Eyebrow") as string}
          </p>
          <h2
            id="how-we-work-title"
            className="mt-3 max-w-[20ch] text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl"
          >
            {homeT("How.Title") as string}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {howSteps.map((step, index) => (
              <div key={index} className="flex flex-col gap-2">
                <p className="text-[17px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
                  {step.Title}
                </p>
                <p className="text-[13.5px] leading-[1.55] text-muted-foreground">
                  {step.Body}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section
        id="trust"
        className="mx-auto w-full max-w-[1240px] border-y border-border/50 px-5 py-8 sm:px-8 sm:py-10"
        aria-labelledby="trust-title"
      >
        <div className="grid items-start gap-8 sm:grid-cols-[auto_repeat(3,1fr)] sm:items-center sm:gap-10">
          <p
            id="trust-title"
            className="font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-muted-foreground/70 sm:max-w-[100px]"
          >
            {homeT("Trust.Eyebrow") as string}
          </p>
          <ul className="col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {trustItems.map((item) => (
              <li key={item.title} className="flex flex-col gap-1.5">
                <p className="text-[17px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
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

      <section
        id="platform"
        className="mx-auto my-14 w-full max-w-[1240px] px-5 sm:px-8"
        aria-labelledby="platform-title"
      >
        <div className="rounded-lg bg-brand px-7 py-12 text-background sm:px-12 sm:py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
            {homeT("Platform.Eyebrow") as string}
          </p>
          <h2
            id="platform-title"
            className="font-display mt-3 max-w-[560px] text-[28px] font-light leading-[1.15] tracking-[-0.01em] sm:text-[34px]"
          >
            {homeT("Platform.Title") as string}
          </h2>
          <p className="mt-4 max-w-[520px] text-[14.5px] leading-[1.6] opacity-80">
            {homeT("Platform.Body") as string}
          </p>
          <a
            href={`${localePrefix}/platform/`}
            className="mt-7 inline-block border-b border-current pb-0.5 font-mono text-[12px] uppercase tracking-[0.1em] transition-opacity hover:opacity-70"
          >
            {homeT("Platform.CTA") as string}
          </a>
        </div>
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
