import { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import ContactForm from "@/src/components/ui/contact-form";
import StructuredData from "@/src/components/seo/StructuredData";
import { Button } from "@/src/components/ui/button";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { buildContactFormStrings } from "@/src/lib/contactFormStrings";
import { arkEntityIds } from "@/src/lib/structuredData";
import { tidyTitle } from "@/src/lib/typography";

export const runtime = "nodejs";
export const revalidate = false;

type Item = { Title?: string; Body?: string };
type Role = { Who?: string; Does?: string };

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  return await generateMetadataForPage(locale as Locale, "/advisers");
}

export default async function AdvisersPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await props.params;
  const locale = (rawLocale as Locale) || ("fr" as Locale);
  const nonce = (await headers()).get("x-nonce") || undefined;
  const t = await getTranslations(locale, "advisers");
  const tNav = await getTranslations(locale, "navbar");
  const baseUrl = "https://ridger.ch";
  const localePrefix = `/${locale}`;
  const pageUrl = `${baseUrl}${localePrefix}/advisers/`;

  const title = t("Hero.Title") as string;
  const description = t("Hero.Description") as string;
  const intro = asArray<string>(t("Intro"));
  const audiences = asArray<Item>(t("Audiences.Items"));
  const steps = asArray<Item>(t("Steps.Items"));
  const roles = asArray<Role>(t("Roles.Items"));
  const discretion = asArray<string>(t("Discretion.Body"));

  const formStrings = await buildContactFormStrings(locale, {
    title: t("Form.Title") as string,
    subtitle: t("Form.Subtitle") as string,
    messagePlaceholder: t("Form.MessagePlaceholder") as string,
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: (tNav("Home") as string) || "Home",
          item: `${baseUrl}${localePrefix}/`,
        },
        { "@type": "ListItem", position: 2, name: title, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": pageUrl,
      url: pageUrl,
      name: title,
      description,
      inLanguage: locale,
      about: { "@id": arkEntityIds.organization },
      audience: audiences.map((a) => ({
        "@type": "Audience",
        audienceType: a.Title,
      })),
    },
  ];

  return (
    <div>
      <StructuredData nonce={nonce} data={jsonLd} />

      <section className="w-full bg-background px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1240px]">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1 text-sm text-muted-foreground">
              <li>
                <Link href={`${localePrefix}/`} className="hover:underline">
                  {(tNav("Home") as string) || "Home"}
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <span className="text-muted-foreground/60">/</span>
                <span aria-current="page" className="font-medium text-foreground">
                  {title}
                </span>
              </li>
            </ol>
          </nav>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8f5f4a] dark:text-[#e1a488]">
            {t("Hero.Eyebrow") as string}
          </p>
          <h1 className="mt-4 max-w-[20ch] text-balance text-5xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
            {tidyTitle(title)}
          </h1>
          <p className="mt-7 max-w-[62ch] text-base leading-8 text-muted-foreground sm:text-lg">
            {description}
          </p>
          <div className="mt-10">
            <a href="#introduce">
              <Button
                size="lg"
                className="btn-main-cta rounded-full bg-foreground px-6 text-base text-background transition-colors hover:text-white"
              >
                <span>{t("Hero.CTA") as string}</span>
              </Button>
            </a>
          </div>
          {intro.length > 0 ? (
            <div className="mt-14 max-w-3xl space-y-6">
              {intro.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-base leading-8 text-muted-foreground sm:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="w-full px-5 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto w-full max-w-[1240px]">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {tidyTitle(t("Audiences.Title") as string)}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {audiences.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl bg-surface-warm p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {item.Title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.Body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-5 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto w-full max-w-[1240px]">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {tidyTitle(t("Steps.Title") as string)}
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 p-6"
              >
                <span
                  className="inline-flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {step.Title}
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  {step.Body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="w-full px-5 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {tidyTitle(t("Roles.Title") as string)}
            </h2>
            <dl className="mt-8 space-y-6">
              {roles.map((role, index) => (
                <div key={index} className="border-l-2 border-brand pl-5">
                  <dt className="text-base font-semibold text-foreground">
                    {role.Who}
                  </dt>
                  <dd className="mt-1 text-sm leading-7 text-muted-foreground">
                    {role.Does}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {tidyTitle(t("Discretion.Title") as string)}
            </h2>
            <div className="mt-8 space-y-5">
              {discretion.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-base leading-8 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="introduce"
        className="w-full scroll-mt-24 px-5 py-10 sm:px-8 lg:py-14"
      >
        <div className="mx-auto w-full max-w-[1240px]">
          <ContactForm
            strings={formStrings}
            locale={locale}
            redirectPath={`${localePrefix}/`}
            formType="introducer"
          />
        </div>
      </section>
    </div>
  );
}
