import { type Metadata } from "next";
import { Separator } from "@/src/components/ui/separator";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { getTranslations, type Locale } from "@/src/lib/i18n";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  return await generateMetadataForPage(locale as Locale, "/legal/terms");
}

function formatDate(date: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export default async function TermsPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = params.locale as Locale;
  const t = await getTranslations(locale, "legal");
  const r = (key: string, fallback: string) => (t(key) as string) || fallback;

  return (
    <div className="mx-auto px-5 py-16 sm:px-8 max-w-[var(--breakpoint-xl)]">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">
          {r("Terms.Title", "Terms of Service")}
        </h1>
        <p className="text-lg dark:text-white mb-2 mb-2">
          {r("Terms.Subtitle", "Our terms of service")}
        </p>
        <p className="text-xs dark:text-white mb-2">
          {r("Terms.LastUpdated", "Last updated")}:{" "}
          {formatDate("2025-08-25", locale)}
        </p>
        <Separator className="mt-6" />
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Terms.Introduction.Title", "Introduction")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Terms.Introduction.Content.0",
                "Welcome to Ridger. Ridger is a brand of Ark Fiduciaire SA, Geneva. These Terms of Service govern your use of our website and services."
              )}
            </p>
            <p>
              {r(
                "Terms.Introduction.Content.1",
                "By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access our services."
              )}
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Terms.Services.Title", "Our Services")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Terms.Services.Content.0",
                "Ridger, a brand of Ark Fiduciaire SA, provides multi-family office services: consolidated reporting, investment oversight, coordination, governance and succession support, tax and administrative coordination, and a digital vault. Execution, custody and asset management remain with the client's regulated banks and asset managers. Ridger does not manage assets and does not provide investment advice."
              )}
            </p>
            <p>
              {r(
                "Terms.Services.Content.1",
                "All services are provided in accordance with Swiss law and professional standards of the Swiss Expert Association for Audit, Tax and Fiduciary (EXPERTsuisse)."
              )}
            </p>
          </div>
        </section>

        {/* Client Responsibilities */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Terms.Responsibilities.Title", "Client Responsibilities")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Terms.Responsibilities.Content.0",
                "Clients must provide accurate, complete, and timely information necessary for the provision of our services."
              )}
            </p>
            <p>
              {r(
                "Terms.Responsibilities.Content.1",
                "Clients are responsible for maintaining the confidentiality of their login credentials and for all activities under their account."
              )}
            </p>
            <p>
              {r(
                "Terms.Responsibilities.Content.2",
                "Clients must comply with all applicable laws and regulations in their business operations."
              )}
            </p>
          </div>
        </section>

        {/* Professional Standards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r(
              "Terms.ProfessionalStandards.Title",
              "Professional Standards & Confidentiality"
            )}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Terms.ProfessionalStandards.Content.0",
                "We maintain strict confidentiality regarding all client information in accordance with Swiss professional secrecy laws and the Federal Act on Data Protection (FADP)."
              )}
            </p>
            <p>
              {r(
                "Terms.ProfessionalStandards.Content.1",
                "Our services are provided by qualified professionals who adhere to the highest standards of ethics and competence as required by Swiss professional associations."
              )}
            </p>
            <p>
              {r(
                "Terms.ProfessionalStandards.Content.2",
                "We implement appropriate technical and organizational measures to protect your personal data and business information against unauthorized access, alteration, disclosure, or destruction."
              )}
            </p>
          </div>
        </section>

        {/* Fees and Payment */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Terms.Fees.Title", "Fees and Payment Terms")}
          </h2>
          <div className="space-y-4">
            <p>
              {r("Terms.Fees.Intro", "Service fees are established based on:")}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Terms.Fees.Factors.0",
                  "Complexity and scope of services required"
                )}
              </li>
              <li>
                {r(
                  "Terms.Fees.Factors.1",
                  "Time and resources allocated to your engagement"
                )}
              </li>
              <li>
                {r(
                  "Terms.Fees.Factors.2",
                  "Market rates for similar professional services"
                )}
              </li>
              <li>
                {r(
                  "Terms.Fees.Factors.3",
                  "Specific terms outlined in your service agreement"
                )}
              </li>
            </ul>
            <p>
              {r(
                "Terms.Fees.PaymentTerms",
                "Payment terms are typically 30 days from invoice date unless otherwise agreed. Late payment may result in interest charges and suspension of services. All fees are subject to applicable Swiss VAT."
              )}
            </p>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Terms.Liability.Title", "Limitation of Liability")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Terms.Liability.Overview",
                "Our liability is limited to the maximum extent permitted under Swiss law. We maintain professional indemnity insurance as required by our professional associations."
              )}
            </p>
            <p>
              {r(
                "Terms.Liability.ExclusionsIntro",
                "We shall not be liable for:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Terms.Liability.Exclusions.0",
                  "Consequential, indirect, or special damages"
                )}
              </li>
              <li>
                {r(
                  "Terms.Liability.Exclusions.1",
                  "Loss of profits or business opportunities"
                )}
              </li>
              <li>
                {r(
                  "Terms.Liability.Exclusions.2",
                  "Damages arising from client's failure to provide accurate information"
                )}
              </li>
              <li>
                {r(
                  "Terms.Liability.Exclusions.3",
                  "Force majeure events beyond our reasonable control"
                )}
              </li>
            </ul>
            <p>
              {r(
                "Terms.Liability.Cap",
                "Our total liability shall not exceed the fees paid for the specific service giving rise to the claim."
              )}
            </p>
          </div>
        </section>

        {/* Termination */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Terms.Termination.Title", "Termination")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Terms.Termination.General",
                "Either party may terminate this agreement with 30 days written notice. Immediate termination may occur in cases of:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Terms.Termination.Immediate.0",
                  "Material breach of these Terms"
                )}
              </li>
              <li>
                {r("Terms.Termination.Immediate.1", "Non-payment of fees")}
              </li>
              <li>
                {r(
                  "Terms.Termination.Immediate.2",
                  "Circumstances that would compromise our professional independence"
                )}
              </li>
            </ul>
            <p>
              {r(
                "Terms.Termination.UponTermination",
                "Upon termination, we will:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Terms.Termination.Actions.0",
                  "Complete work in progress (subject to payment)"
                )}
              </li>
              <li>
                {r(
                  "Terms.Termination.Actions.1",
                  "Return client documents and data"
                )}
              </li>
              <li>
                {r(
                  "Terms.Termination.Actions.2",
                  "Provide reasonable assistance in transition to new service providers"
                )}
              </li>
              <li>
                {r(
                  "Terms.Termination.Actions.3",
                  "Continue to maintain confidentiality obligations"
                )}
              </li>
            </ul>
          </div>
        </section>

        {/* Governing Law */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Terms.GoverningLaw.Title", "Governing Law")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Terms.GoverningLaw.Description",
                "These Terms are governed by Swiss law. Any disputes arising from these Terms or our professional relationship shall be resolved through:"
              )}
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                {r(
                  "Terms.GoverningLaw.Resolution.0",
                  "Good faith negotiations between the parties"
                )}
              </li>
              <li>
                {r(
                  "Terms.GoverningLaw.Resolution.1",
                  "Mediation through a recognized Swiss commercial mediation service"
                )}
              </li>
              <li>
                {r(
                  "Terms.GoverningLaw.Resolution.2",
                  "If necessary, litigation before the competent Swiss courts"
                )}
              </li>
            </ol>
            <p>
              {r(
                "Terms.GoverningLaw.Jurisdiction",
                "The place of jurisdiction is the registered office of Ark Fiduciaire SA, Geneva, Switzerland."
              )}
            </p>
          </div>
        </section>

        {/* SO-FIT Affiliation */}
        <section className="mb-12">
          <p className="text-xs text-muted-foreground italic">
            {r(
              "Terms.SoFitAffiliation",
              "Ark Fiduciaire SA, Geneva (operator of the Ridger brand), is affiliated with the SRO of"
            )}{" "}
            <a
              href="https://so-fit.ch"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="hover:underline"
            >
              SO-FIT
            </a>
            {r(
              "Terms.SoFitAffiliationSuffix",
              " (self-regulatory body under the Swiss AMLA/FinSA)."
            )}
          </p>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Terms.Contact.Title", "Contact Information")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Terms.Contact.Description",
                "For questions regarding these Terms of Service or our professional services, please contact us:"
              )}
            </p>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="font-semibold">
                {r("Terms.Contact.CompanyName", "Ridger — Ark Fiduciaire SA")}
              </p>
              <p>{r("Terms.Contact.Email", "Email: contact@ridger.ch")}</p>
              <p>
                <a
                  href="tel:+41225125050"
                  className="text-brand-hover dark:text-brand hover:underline"
                  aria-label="Call us at +41 22 512 50 50"
                >
                  +41 22 512 50 50
                </a>
              </p>
              <p>
                {r(
                  "Terms.Contact.Address",
                  "Address: 26 Boulevard Georges Favon, 1204 Geneva"
                )}
              </p>
            </div>
            <p>
              {r(
                "Terms.Contact.Commitment",
                "We are committed to maintaining the highest standards of professional service and client satisfaction."
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
