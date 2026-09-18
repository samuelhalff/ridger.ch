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

  return await generateMetadataForPage(locale as Locale, "/legal/privacy");
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

export default async function PrivacyPage(
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
          {r("Privacy.Title", "Privacy Policy")}
        </h1>
        <p className="text-lg dark:text-white mb-2 mb-2">
          {r("Privacy.Subtitle", "Data Protection and Privacy Notice")}
        </p>
        <p className="text-xs dark:text-white mb-2">
          {r("Privacy.LastUpdated", "Last updated")}:{" "}
          {formatDate("2026-02-09", locale)}
        </p>
        <Separator className="mt-6" />
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.Introduction.Title", "Introduction")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.Introduction.Content.0",
                "At Ridger, we are committed to protecting your privacy and personal data in accordance with Swiss Federal Data Protection Act (FADP) and applicable EU regulations."
              )}
            </p>
            <p>
              {r(
                "Privacy.Introduction.Content.1",
                "This Privacy Policy explains how we collect, use, and protect your information when you use our services."
              )}
            </p>
          </div>
        </section>

        {/* Data Controller */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.DataController.Title", "Data Controller")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.DataController.Content",
                "Ridger acts as the data controller for personal data collected and processed in connection with our professional services."
              )}
            </p>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="font-semibold">
                {r("Privacy.DataController.ContactDetails", "Contact details:")}
              </p>
              <p>{r("Privacy.DataController.CompanyName", "Ridger")}</p>
              <p>
                {r("Privacy.DataController.Email", "Email: privacy@ridger.ch")}
              </p>
              <p>
                {r(
                  "Privacy.DataController.Address",
                  "Address: [Swiss Business Address]"
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Data We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.DataCollection.Title", "Data We Collect")}
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r(
                  "Privacy.DataCollection.ProfessionalData.Title",
                  "Professional Service Data:"
                )}
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Privacy.DataCollection.ProfessionalData.Items.0",
                    "Personal identification information (name, address, date of birth)"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.ProfessionalData.Items.1",
                    "Contact information (email, phone, business address)"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.ProfessionalData.Items.2",
                    "Financial information (bank details, income, expenses, assets)"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.ProfessionalData.Items.3",
                    "Tax and social security numbers"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.ProfessionalData.Items.4",
                    "Employment and business information"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.ProfessionalData.Items.5",
                    "Legal and compliance documentation"
                  )}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r("Privacy.DataCollection.WebsiteData.Title", "Website Data:")}
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Privacy.DataCollection.WebsiteData.Items.0",
                    "Technical information (IP address, browser type, device information)"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.WebsiteData.Items.1",
                    "Usage data (pages visited, time spent, referral sources)"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.WebsiteData.Items.2",
                    "Cookies and similar tracking technologies"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.WebsiteData.Items.3",
                    "Contact form submissions and communications"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataCollection.WebsiteData.Items.4",
                    "AI assistant chat content and lead details (email, name, optional company and phone) saved in our lead management system (Microsoft 365/SharePoint) to follow up on your request"
                  )}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Legal Basis */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.LegalBasis.Title", "Legal Basis for Processing")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.LegalBasis.Description",
                "We process your personal data based on the following legal grounds:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Privacy.LegalBasis.Grounds.0",
                  "Contract performance: To provide professional accounting and advisory services"
                )}
              </li>
              <li>
                {r(
                  "Privacy.LegalBasis.Grounds.1",
                  "Legal compliance: To meet Swiss regulatory and reporting requirements"
                )}
              </li>
              <li>
                {r(
                  "Privacy.LegalBasis.Grounds.2",
                  "Legitimate interests: For business operations, fraud prevention, and service improvement"
                )}
              </li>
              <li>
                {r(
                  "Privacy.LegalBasis.Grounds.3",
                  "Consent: For marketing communications and non-essential cookies (where required)"
                )}
              </li>
              <li>
                {r(
                  "Privacy.LegalBasis.Grounds.4",
                  "Vital interests: To protect your or others' vital interests in emergency situations"
                )}
              </li>
            </ul>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.DataUse.Title", "How We Use Your Data")}
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r(
                  "Privacy.DataUse.ServiceDelivery.Title",
                  "Service Delivery:"
                )}
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Privacy.DataUse.ServiceDelivery.Items.0",
                    "Providing accounting, tax, payroll, and advisory services"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataUse.ServiceDelivery.Items.1",
                    "Preparing financial statements and reports"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataUse.ServiceDelivery.Items.2",
                    "Managing compliance obligations"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataUse.ServiceDelivery.Items.3",
                    "Communicating about your services and account"
                  )}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r(
                  "Privacy.DataUse.BusinessOperations.Title",
                  "Business Operations:"
                )}
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Privacy.DataUse.BusinessOperations.Items.0",
                    "Client relationship management"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataUse.BusinessOperations.Items.1",
                    "Quality assurance and professional development"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataUse.BusinessOperations.Items.2",
                    "Risk management and fraud prevention"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataUse.BusinessOperations.Items.3",
                    "Legal and regulatory compliance"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataUse.BusinessOperations.Items.4",
                    "Business continuity and disaster recovery"
                  )}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.DataSharing.Title", "Data Sharing")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.DataSharing.Description",
                "We may share your personal data with:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Privacy.DataSharing.Recipients.0",
                  "Swiss tax authorities and regulatory bodies (as legally required)"
                )}
              </li>
              <li>
                {r(
                  "Privacy.DataSharing.Recipients.1",
                  "Banks and financial institutions (for payment processing)"
                )}
              </li>
              <li>
                {r(
                  "Privacy.DataSharing.Recipients.2",
                  "Professional service providers (auditors, legal counsel, IT support)"
                )}
              </li>
              <li>
                {r(
                  "Privacy.DataSharing.Recipients.3",
                  "Odoo SA and certified partners (for ERP services)"
                )}
              </li>
              <li>
                {r(
                  "Privacy.DataSharing.Recipients.4",
                  "Cloud service providers with appropriate safeguards"
                )}
              </li>
            </ul>
            <p>
              {r(
                "Privacy.DataSharing.NoSelling",
                "We do not sell personal data to third parties. All sharing is conducted with appropriate confidentiality agreements and data protection measures in place."
              )}
            </p>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.DataSecurity.Title", "Data Security")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.DataSecurity.Description",
                "We implement comprehensive security measures including:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Privacy.DataSecurity.Measures.0",
                  "Encryption of data in transit and at rest"
                )}
              </li>
              <li>
                {r(
                  "Privacy.DataSecurity.Measures.1",
                  "Multi-factor authentication and access controls"
                )}
              </li>
              <li>
                {r(
                  "Privacy.DataSecurity.Measures.2",
                  "Regular security assessments and updates"
                )}
              </li>
              <li>
                {r(
                  "Privacy.DataSecurity.Measures.3",
                  "Staff training on data protection"
                )}
              </li>
              <li>
                {r(
                  "Privacy.DataSecurity.Measures.4",
                  "Secure backup and disaster recovery procedures"
                )}
              </li>
            </ul>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">
                {r("Privacy.DataSecurity.Retention.Title", "Data Retention:")}
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Privacy.DataSecurity.Retention.Professional",
                    "Professional service records: As required by Swiss law (typically 10 years)"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataSecurity.Retention.Financial",
                    "Financial and tax records: As mandated by regulatory requirements"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataSecurity.Retention.Website",
                    "Website data: For the duration necessary to fulfill stated purposes"
                  )}
                </li>
                <li>
                  {r(
                    "Privacy.DataSecurity.Retention.Marketing",
                    "Marketing data: Until consent is withdrawn or data is no longer needed"
                  )}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.YourRights.Title", "Your Rights")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.YourRights.Description",
                "Under Swiss data protection law, you have the right to:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>
                  {r("Privacy.YourRights.Access.Title", "Access:")}
                </strong>{" "}
                {r(
                  "Privacy.YourRights.Access.Description",
                  "Request information about personal data we hold about you"
                )}
              </li>
              <li>
                <strong>
                  {r(
                    "Privacy.YourRights.Rectification.Title",
                    "Rectification:"
                  )}
                </strong>{" "}
                {r(
                  "Privacy.YourRights.Rectification.Description",
                  "Correct inaccurate or incomplete personal data"
                )}
              </li>
              <li>
                <strong>
                  {r("Privacy.YourRights.Erasure.Title", "Erasure:")}
                </strong>{" "}
                {r(
                  "Privacy.YourRights.Erasure.Description",
                  "Request deletion of personal data (subject to legal obligations)"
                )}
              </li>
              <li>
                <strong>
                  {r("Privacy.YourRights.Restriction.Title", "Restriction:")}
                </strong>{" "}
                {r(
                  "Privacy.YourRights.Restriction.Description",
                  "Limit processing in certain circumstances"
                )}
              </li>
              <li>
                <strong>
                  {r(
                    "Privacy.YourRights.Portability.Title",
                    "Data portability:"
                  )}
                </strong>{" "}
                {r(
                  "Privacy.YourRights.Portability.Description",
                  "Receive your data in a structured, machine-readable format"
                )}
              </li>
              <li>
                <strong>
                  {r("Privacy.YourRights.Object.Title", "Object:")}
                </strong>{" "}
                {r(
                  "Privacy.YourRights.Object.Description",
                  "Object to processing based on legitimate interests"
                )}
              </li>
              <li>
                <strong>
                  {r(
                    "Privacy.YourRights.WithdrawConsent.Title",
                    "Withdraw consent:"
                  )}
                </strong>{" "}
                {r(
                  "Privacy.YourRights.WithdrawConsent.Description",
                  "For processing based on consent"
                )}
              </li>
            </ul>
            <p>
              {r(
                "Privacy.YourRights.Exercise",
                "To exercise these rights, contact us at contact@ridger.ch. We will respond within 30 days."
              )}
            </p>
          </div>
        </section>

        {/* International Transfers */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r(
              "Privacy.InternationalTransfers.Title",
              "International Data Transfers"
            )}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.InternationalTransfers.Description",
                "We may transfer personal data outside Switzerland to:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Privacy.InternationalTransfers.Destinations.0",
                  "EU/EEA countries with adequate data protection"
                )}
              </li>
              <li>
                {r(
                  "Privacy.InternationalTransfers.Destinations.1",
                  "Countries with adequacy decisions from Swiss authorities"
                )}
              </li>
              <li>
                {r(
                  "Privacy.InternationalTransfers.Destinations.2",
                  "Third countries with appropriate safeguards (standard contractual clauses)"
                )}
              </li>
            </ul>
            <p>
              {r(
                "Privacy.InternationalTransfers.Safeguards",
                "All international transfers are conducted with appropriate legal safeguards to ensure your data remains protected to Swiss standards."
              )}
            </p>
          </div>
        </section>

        {/* Changes to Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.PolicyChanges.Title", "Changes to This Policy")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.PolicyChanges.Description",
                "We may update this Privacy Policy to reflect changes in our practices, services, or legal requirements. Material changes will be communicated through:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Privacy.PolicyChanges.Communication.0",
                  "Email notification to registered clients"
                )}
              </li>
              <li>
                {r(
                  "Privacy.PolicyChanges.Communication.1",
                  "Prominent notice on our website"
                )}
              </li>
              <li>
                {r(
                  "Privacy.PolicyChanges.Communication.2",
                  "Direct communication during service interactions"
                )}
              </li>
            </ul>
            <p>
              {r(
                "Privacy.PolicyChanges.Effectiveness",
                "The updated policy will be effective from the date specified in the revised version."
              )}
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Privacy.Contact.Title", "Contact Us")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Privacy.Contact.Description",
                "If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:"
              )}
            </p>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="font-semibold">
                {r("Privacy.Contact.CompanyName", "Ridger")}
              </p>
              <p>
                {r(
                  "Privacy.Contact.Address",
                  "26 Boulevard Georges Favon, 1204 Geneva"
                )}
              </p>
              <p>{r("Privacy.Contact.Email", "Email: contact@ridger.ch")}</p>
              <p>
                <a
                  href="tel:+41225125050"
                  className="text-brand-hover dark:text-brand hover:underline"
                  aria-label="Call us at +41 22 512 50 50"
                >
                  +41 22 512 50 50
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
