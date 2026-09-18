import { Separator } from "@/src/components/ui/separator";
import { WhatsAppIcon } from "@/src/components/icons/WhatsAppIcon";
import Link from "next/link";
import Image from "next/image";
import CookieSettingsLink from "@/src/components/CookieSettingsLink";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { buildInternalUrl } from "@/src/lib/paths";
import { WHATSAPP_URL } from "@/src/lib/whatsapp";

// Replace '#' with real or placeholder URLs for SEO. Update as needed.
const footerSections = [
  {
    titleKey: "Services.Title",
    links: [
      {
        titleKey: "Accounting.Title",
        href: "/services/accounting/",
        ns: "servicesItems",
      },
      {
        titleKey: "TaxesCompanyPersonal.Title",
        href: "/services/taxes/",
        ns: "servicesItems",
      },
      {
        titleKey: "PayrollHR.Title",
        href: "/services/payroll/",
        ns: "servicesItems",
      },
      {
        titleKey: "OutsourcingServices.Title",
        href: "/services/outsourcing/",
        ns: "servicesItems",
      },
      {
        titleKey: "MAServices.Title",
        href: "/services/mergers-acquisitions/",
        ns: "servicesItems",
      },
      {
        titleKey: "CorporateServices.Title",
        href: "/services/corporate/",
        ns: "servicesItems",
      },
      {
        titleKey: "OdooImplementation.Title",
        href: "/services/odoo/",
        ns: "servicesItems",
      },
    ],
  },
  {
    titleKey: "Company.Title",
    links: [
      { titleKey: "Contact", href: "/contact/", ns: "navbar" },
    ],
  },
  {
    titleKey: "Resources.Title",
    links: [
      { titleKey: "Ressources", href: "/ressources/", ns: "navbar" },
      {
        titleKey: "Social.LinkedIn",
        href: "https://www.linkedin.com/company/ridger/",
        ns: "footer",
      },
    ],
  },
  {
    titleKey: "Legal.Title",
    links: [
      { titleKey: "Legal.Terms", href: "/legal/terms/", ns: "footer" },
      { titleKey: "Legal.Privacy", href: "/legal/privacy/", ns: "footer" },
      { titleKey: "Legal.Cookies", href: "/legal/cookies/", ns: "footer" },
      { titleKey: "Legal.Settings", href: "#cookie-settings", ns: "footer" },
    ],
  },
];

const Footer = async ({ locale }: { locale?: string }) => {
  const currentLocale = (locale as Locale) || ("fr" as Locale);
  const localePrefix = `/${currentLocale}`;
  const tFooter = await getTranslations(currentLocale, "footer");
  const tNavbar = await getTranslations(currentLocale, "navbar");
  const tItems = await getTranslations(currentLocale, "servicesItems");
  const tContact = await getTranslations(currentLocale, "contact");
  return (
    <footer
      className="mt-12 bg-surface-warm/35 text-foreground xs:mt-20"
      role="contentinfo"
    >
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-x-8 gap-y-10 px-5 py-12 sm:grid-cols-2 sm:px-8 md:grid-cols-4 lg:grid-cols-[120px_minmax(340px,2fr)_repeat(4,minmax(120px,1fr))]">
        <Link
          href={`${localePrefix}/`}
          aria-label={tNavbar("Home")}
          locale={locale}
          prefetch={false}
          className="space-y-5 lg:pt-1"
        >
          <span className="block">
            <Image
              className="hidden dark:block"
              src="/assets/ridger--light.svg"
              width={100}
              height={40}
              alt="Logo Ridger"
              sizes="(max-width: 768px) 88px, 100px"
              loading="lazy"
              decoding="async"
            />
            <Image
              className="dark:hidden"
              src="/assets/ridger--color.svg"
              width={100}
              height={40}
              alt="Logo Ridger"
              sizes="(max-width: 768px) 88px, 100px"
              loading="lazy"
              decoding="async"
            />
          </span>
        </Link>

        <div
          className="space-y-3 rounded-2xl bg-surface-warm p-5 text-sm shadow-sm sm:col-span-2 md:col-span-2 lg:col-span-1"
          itemScope
          itemType="https://schema.org/PostalAddress"
        >
          <p className="font-semibold">Ridger</p>
          <p>
            <span itemProp="streetAddress">26 Boulevard Georges Favon</span>
            <br />
            <span itemProp="postalCode">1204</span>{" "}
            <span itemProp="addressLocality">Genève</span>,{" "}
            <span itemProp="addressCountry">CH</span>
          </p>
          <p>
            <a
              href="mailto:info@ridger.ch"
              className="text-[#b6542b] hover:underline dark:text-[#f2b294]"
              itemProp="email"
            >
              info@ridger.ch
            </a>
          </p>
          <p>
            <a
              href="tel:+41225125050"
              className="text-[#b6542b] hover:underline dark:text-[#f2b294]"
              itemProp="telephone"
              aria-label="Call Ridger at +41 22 512 50 50"
            >
              +41 22 512 50 50
            </a>
          </p>
          <p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#b6542b] hover:underline dark:text-[#f2b294]"
              aria-label={tContact("WhatsApp.Open") as string}
            >
              <WhatsAppIcon className="size-4 text-[#1f9d55]" />
              <span>{tContact("WhatsApp.Badge") as string}</span>
            </a>
          </p>
          <p>
            <a
              href="https://maps.google.com/?cid=14946625157719331801"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b6542b] hover:underline dark:text-[#f2b294]"
            >
              Google Maps
            </a>
          </p>
        </div>

        {footerSections.map(({ titleKey, links }) => (
          <nav
            key={titleKey}
            aria-label={tFooter(titleKey)}
            className="min-w-0 break-words"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8f5f4a] dark:text-[#e1a488]">
              {tFooter(titleKey)}
            </p>
            <ul className="mt-5 space-y-3">
              {links.map(({ titleKey, href, ns }) => (
                <li key={titleKey}>
                  {href.startsWith("http") ? (
                    <a
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ns === "servicesItems"
                        ? tItems(titleKey)
                        : ns === "navbar"
                          ? tNavbar(titleKey)
                          : tFooter(titleKey)}
                    </a>
                  ) : href === "#cookie-settings" ? (
                    <CookieSettingsLink className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                      {tFooter(titleKey)}
                    </CookieSettingsLink>
                  ) : (
                    <Link
                      href={buildInternalUrl(href, currentLocale)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      locale={locale}
                      prefetch={false}
                    >
                      {ns === "servicesItems"
                        ? tItems(titleKey)
                        : ns === "navbar"
                          ? tNavbar(titleKey)
                          : tFooter(titleKey)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <Separator />
      <div className="mx-auto flex max-w-[1240px] flex-col-reverse items-center justify-between gap-x-2 gap-y-5 px-5 py-8 sm:flex-row sm:px-8">
        <span className="w-full text-center text-sm text-muted-foreground xs:text-start">
          {tFooter("Ridger")} - {tFooter("Copyright")} -{" "}
          <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
          <br />
          <span className="text-xs">
            {tFooter("SoFitAffiliationPrefix")}{" "}
            <a
              href="https://so-fit.ch"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="hover:text-foreground hover:underline"
            >
              SO-FIT
            </a>
          </span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
