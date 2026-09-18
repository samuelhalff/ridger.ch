import { Metadata } from "next";
import dynamic from "next/dynamic";
import { generateMetadataForPage } from "@/src/lib/metadata";
import GoogleMap from "@/src/components/ui/GoogleMap";
import Defer from "@/src/components/Defer";
import { CalendarIcon } from "@/src/components/icons/CalendarIcon";
import { PhoneIcon } from "@/src/components/icons/PhoneIcon";
import { WhatsAppIcon } from "@/src/components/icons/WhatsAppIcon";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import {
  WHATSAPP_BADGE_FALLBACK,
  WHATSAPP_CTA_FALLBACK,
  WHATSAPP_NUMBER,
  WHATSAPP_PHONE_E164,
  WHATSAPP_URL,
} from "@/src/lib/whatsapp";
import { headers } from "next/headers";
import PageHero from "@/src/components/site/page-hero";
import Reveal from "@/src/components/motion/reveal";
import services from "@/app/[locale]/home/components/services-items";
import { ActionCard } from "@/src/components/ui/surface";

const BOOKING_URL =
  "https://outlook.office.com/bookwithme/user/a21b46e2d9a540cca4c290a48c40119e@ridger.ch/meetingtype/GHNs6ESvEUWN2gUat7rePg2?anonymous&ismsaljsauthenabled&ep=mlink";

const ContactForm = dynamic(() => import("@/src/components/ui/contact-form"), {
  loading: () => (
    <div className="mx-auto w-full max-w-3xl">
      <div className="animate-pulse rounded-2xl bg-muted/30 p-6 sm:p-8">
        <div className="h-6 w-48 rounded bg-foreground/10" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-12 rounded bg-foreground/5" />
          <div className="h-12 rounded bg-foreground/5" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="h-12 rounded bg-foreground/5" />
          <div className="h-12 rounded bg-foreground/5" />
        </div>
        <div className="mt-4 h-28 rounded bg-foreground/5" />
        <div className="mt-6 h-11 w-40 rounded-full bg-foreground/10" />
      </div>
    </div>
  ),
});

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  return await generateMetadataForPage(locale as Locale, "/contact");
}

export default async function ContactPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = (params?.locale as Locale) || ("fr" as Locale);
  const t = await getTranslations(locale, "contact");
  const tNav = await getTranslations(locale, "navbar");
  const tServices = await getTranslations(locale, "servicesItems");
  const nonce = (await headers()).get("x-nonce") || undefined;
  const baseUrl = "https://ridger.ch";
  const localePrefix = params?.locale ? `/${params.locale}` : "/fr";
  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Ridger",
    url: "https://ridger.ch",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 46.2021556,
      longitude: 6.1399595,
    },
    hasMap: "https://maps.google.com/?cid=14946625157719331801",
    identifier: "14946625157719331801",
    telephone: "+41225125050",
    sameAs: [
      "https://www.google.com/maps/place/Ark+Fiduciaire+SA/",
      "https://maps.google.com/?cid=14946625157719331801",
      WHATSAPP_URL,
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: WHATSAPP_PHONE_E164,
        url: WHATSAPP_URL,
        availableLanguage: ["English", "French", "German", "Spanish", "Portuguese"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "26 Boulevard Georges Favon",
      addressLocality: "Genève",
      postalCode: "1204",
      addressCountry: "CH",
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: (tNav("Home") as string) || "Home",
        item: `${baseUrl}${localePrefix}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("Title"),
        item: `${baseUrl}${localePrefix}/contact/`,
      },
    ],
  } as const;

  const strings = {
    title:
      typeof t("Title") === "string" ? (t("Title") as string) : "Get in Touch",
    subtitle:
      typeof t("Subtitle") === "string" ? (t("Subtitle") as string) : "",
    bookingDescription:
      (t("BookingDescription") as string) ||
      "Best for a planned discussion with our team.",
    orContactUs: (t("OrContactUs") as string) || "or contact us",
    bookingButton: (t("BookingButton") as string) || "Book a call",
    callLabel: (t("CallLabel") as string) || "Call us",
    callDescription:
      (t("CallDescription") as string) || "Speak directly with our team.",
    whatsapp: {
      badge: (t("WhatsApp.Badge") as string) || WHATSAPP_BADGE_FALLBACK,
      cta: (t("WhatsApp.Open") as string) || WHATSAPP_CTA_FALLBACK,
      description:
        (t("WhatsApp.Description") as string) ||
        "Quick questions, quick replies.",
    },
    labels: {
      name: (t("Form.Name") as string) || "Name",
      companyName:
        (t("Form.CompanyName") as string) || "Company Name (Optional)",
      phone: (t("Form.Phone") as string) || "Phone Number (Optional)",
      aumBand: (t("Form.AumBand") as string) || "Patrimoine sous surveillance",
      horizon: (t("Form.Horizon") as string) || "Horizon",
      serviceInterest:
        (t("Form.ServiceInterest") as string) || "Service d'intérêt",
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
      select:
        (t("Form.Placeholders.Select") as string) ||
        (locale === "fr" ? "Sélectionner" : "Select"),
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
    serviceInterests: services.map((service) => ({
      label: tServices(service.titleKey) as string,
      value: service.href.replace("/services/", ""),
    })),
    aumBands: (t("Form.AumBands") as unknown as Array<{
      label: string;
      value: string;
    }>) || [],
    horizons: (t("Form.Horizons") as unknown as Array<{
      label: string;
      value: string;
    }>) || [],
  } as const;
  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-3 px-0">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <a href={`${localePrefix}/`} className="hover:underline">
              {(tNav("Home") as string) || "Home"}
            </a>
          </li>
          <li className="flex items-center gap-1">
            <span className="text-muted-foreground/60">/</span>
            <span aria-current="page" className="font-medium text-foreground">
              {strings.title}
            </span>
          </li>
        </ol>
      </nav>
      <Reveal className="mb-8 sm:mb-14">
        <PageHero
          eyebrow={(tNav("Contact") as string) || strings.title}
          title={strings.title}
          className="pb-0 pt-8 sm:pb-0 sm:pt-10"
        />
        {strings.subtitle ? (
          <p
            data-contact-response-note
            className="mt-6 max-w-[58ch] text-base leading-8 text-muted-foreground sm:text-lg"
          >
            {strings.subtitle}
          </p>
        ) : null}
      </Reveal>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
        <div className="min-w-0">
          <ContactForm
            showTitle={true}
            showSubtitle={false}
            strings={{
              ...strings,
              title: locale === "fr" ? "Entretien confidentiel" : strings.orContactUs,
            }}
            locale={locale}
            redirectPath={`${localePrefix}/`}
            cardClassName="rounded-[24px] bg-card shadow-sm"
          />
        </div>

        <Reveal className="space-y-4" delay={0.1}>
          <div className="grid gap-3">
            <ActionCard
              href={BOOKING_URL}
              external
              variant="contrast"
              icon={<CalendarIcon className="size-5" />}
              title={strings.bookingButton}
              description={strings.bookingDescription}
            />
            <ActionCard
              href={WHATSAPP_URL}
              aria-label={`${strings.whatsapp.cta} ${WHATSAPP_NUMBER}`}
              external
              variant="whatsapp"
              icon={<WhatsAppIcon className="size-5" />}
              title={strings.whatsapp.badge}
              description={WHATSAPP_NUMBER}
              className="focus-visible:ring-[#25D366]/40"
            />
            <ActionCard
              variant="plain"
              icon={<PhoneIcon className="size-5" />}
              title={strings.callLabel}
              description={
                <a
                  href="tel:+41225125050"
                  className="transition-colors hover:text-foreground"
                  aria-label={`${strings.callLabel} +41 22 512 50 50`}
                >
                  +41 22 512 50 50
                </a>
              }
            />
          </div>
          <Defer
            rootMargin="200px"
            idle={200}
            placeholder={
              <div className="h-[280px] w-full rounded-[22px] bg-muted/40" />
            }
          >
            <GoogleMap
              className="w-full rounded-[22px]"
              privacyMode={false}
              labels={{
                loadMap: t("MapLoadButton") as string,
                openInGoogle: t("MapOpenExternal") as string,
                placeholderNotice: t("MapPrivacyPlaceholder") as string,
              }}
            />
          </Defer>
        </Reveal>
      </section>
    </div>
  );
}
