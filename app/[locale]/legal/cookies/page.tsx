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

  return await generateMetadataForPage(locale as Locale, "/legal/cookies");
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

export default async function CookiesPage(
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
          {r("Cookies.Title", "Cookies Policy")}
        </h1>
        <p className="text-lg dark:text-white mb-2">
          {r(
            "Cookies.Subtitle",
            "Information about our use of cookies and tracking technologies"
          )}
        </p>
        <p className="text-xs dark:text-white">
          {r("Cookies.LastUpdated", "Last updated")}:{" "}
          {formatDate("2025-08-25", locale)}
        </p>
        <Separator className="mt-6" />
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.Introduction.Title", "Introduction")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Cookies.Introduction.Content.0",
                "This Cookies Policy explains how Ridger uses cookies and similar tracking technologies on our website. It provides information about what cookies are, how we use them, and your choices regarding their use."
              )}
            </p>
            <p>
              {r(
                "Cookies.Introduction.Content.1",
                "By using our website, you consent to the use of cookies in accordance with this policy and our Privacy Policy."
              )}
            </p>
          </div>
        </section>

        {/* What Are Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.WhatAreCookies.Title", "What Are Cookies?")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Cookies.WhatAreCookies.Description",
                "Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They allow the website to recognize your device and store information about your preferences or past actions."
              )}
            </p>
            <p>
              {r(
                "Cookies.WhatAreCookies.CookiesContain",
                "Cookies typically contain:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Cookies.WhatAreCookies.Contents.0",
                  "The name of the server that placed the cookie"
                )}
              </li>
              <li>
                {r(
                  "Cookies.WhatAreCookies.Contents.1",
                  "An identifier in the form of a unique number"
                )}
              </li>
              <li>
                {r(
                  "Cookies.WhatAreCookies.Contents.2",
                  "An expiration date (some cookies only last for the duration of your session)"
                )}
              </li>
            </ul>
          </div>
        </section>

        {/* Types of Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.Types.Title", "Types of Cookies We Use")}
          </h2>
          <div className="space-y-8">
            {/* Essential Cookies */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r("Cookies.Types.Essential.Title", "1. Essential Cookies")}
              </h3>
              <p className="mb-3">
                {r(
                  "Cookies.Types.Essential.Description",
                  "These cookies are necessary for the website to function properly and cannot be disabled."
                )}
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold mb-2">
                  {r("Cookies.Types.Essential.Purpose", "Purpose:")}
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    {r(
                      "Cookies.Types.Essential.Items.0",
                      "Website navigation and basic functionality"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Essential.Items.1",
                      "Security and authentication"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Essential.Items.2",
                      "Language and accessibility preferences"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Essential.Items.3",
                      "Form submission and session management"
                    )}
                  </li>
                </ul>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r("Cookies.Types.Analytics.Title", "2. Analytics Cookies")}
              </h3>
              <p className="mb-3">
                {r(
                  "Cookies.Types.Analytics.Description",
                  "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously."
                )}
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold mb-2">
                  {r("Cookies.Types.Analytics.Purpose", "Purpose:")}
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    {r(
                      "Cookies.Types.Analytics.Items.0",
                      "Website traffic analysis"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Analytics.Items.1",
                      "Page performance monitoring"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Analytics.Items.2",
                      "User behavior patterns"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Analytics.Items.3",
                      "Website optimization and improvement"
                    )}
                  </li>
                </ul>
                <p className="mt-2 text-sm">
                  <strong>
                    {r(
                      "Cookies.Types.Analytics.Providers",
                      "Providers: Google Analytics, internal analytics tools"
                    )}
                  </strong>
                </p>
              </div>
            </div>

            {/* Functional Cookies */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r("Cookies.Types.Functional.Title", "3. Functional Cookies")}
              </h3>
              <p className="mb-3">
                {r(
                  "Cookies.Types.Functional.Description",
                  "These cookies enable enhanced functionality and personalization features."
                )}
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold mb-2">
                  {r("Cookies.Types.Functional.Purpose", "Purpose:")}
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    {r(
                      "Cookies.Types.Functional.Items.0",
                      "Remembering language and theme preferences"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Functional.Items.1",
                      "Saving form data and progress"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Functional.Items.2",
                      "Customizing content and layout"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Functional.Items.3",
                      "Providing live chat functionality"
                    )}
                  </li>
                </ul>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r("Cookies.Types.Marketing.Title", "4. Marketing Cookies")}
              </h3>
              <p className="mb-3">
                {r(
                  "Cookies.Types.Marketing.Description",
                  "These cookies track visitors across websites to display relevant and engaging advertisements."
                )}
              </p>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="font-semibold mb-2">
                  {r("Cookies.Types.Marketing.Purpose", "Purpose:")}
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    {r(
                      "Cookies.Types.Marketing.Items.0",
                      "Targeted advertising"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Marketing.Items.1",
                      "Measuring ad effectiveness"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Marketing.Items.2",
                      "Retargeting campaigns"
                    )}
                  </li>
                  <li>
                    {r(
                      "Cookies.Types.Marketing.Items.3",
                      "Social media integration"
                    )}
                  </li>
                </ul>
                <p className="mt-2 text-sm">
                  <strong>
                    {r(
                      "Cookies.Types.Marketing.Providers",
                      "Providers: Google Ads, LinkedIn, Facebook"
                    )}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.ThirdParty.Title", "Third-Party Cookies")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Cookies.ThirdParty.Description",
                "Our website may include content or services from third parties that set their own cookies. These include:"
              )}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                      {r(
                        "Cookies.ThirdParty.TableHeaders.Provider",
                        "Provider"
                      )}
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                      {r("Cookies.ThirdParty.TableHeaders.Purpose", "Purpose")}
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                      {r(
                        "Cookies.ThirdParty.TableHeaders.PrivacyPolicy",
                        "Privacy Policy"
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      {r(
                        "Cookies.ThirdParty.Providers.GoogleAnalytics",
                        "Google Analytics"
                      )}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      {r(
                        "Cookies.ThirdParty.Purposes.Analytics",
                        "Website analytics and performance"
                      )}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      <a
                        href="https://policies.google.com/privacy"
                        className="text-brand-hover hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Privacy Policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      {r(
                        "Cookies.ThirdParty.Providers.GoogleMaps",
                        "Google Maps"
                      )}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      {r(
                        "Cookies.ThirdParty.Purposes.Maps",
                        "Location services and maps"
                      )}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      <a
                        href="https://policies.google.com/privacy"
                        className="text-brand-hover hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Privacy Policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      {r("Cookies.ThirdParty.Providers.LinkedIn", "LinkedIn")}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      {r(
                        "Cookies.ThirdParty.Purposes.Professional",
                        "Professional networking and advertising"
                      )}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                      <a
                        href="https://www.linkedin.com/legal/privacy-policy"
                        className="text-brand-hover hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn Privacy Policy
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Cookie Duration */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.Duration.Title", "Cookie Duration")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Cookies.Duration.Description",
                "Cookies are classified by duration as follows:"
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Cookies.Duration.Types.0",
                  "Session Cookies: Temporary cookies that are deleted when you close your browser"
                )}
              </li>
              <li>
                {r(
                  "Cookies.Duration.Types.1",
                  "Persistent Cookies: Remain on your device for a set period or until manually deleted"
                )}
              </li>
            </ul>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">
                {r(
                  "Cookies.Duration.Lifespans.Title",
                  "Typical Cookie Lifespans:"
                )}
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Cookies.Duration.Lifespans.Items.0",
                    "Essential cookies: Session duration or up to 1 year"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Duration.Lifespans.Items.1",
                    "Analytics cookies: 2 years maximum"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Duration.Lifespans.Items.2",
                    "Functional cookies: 1 year maximum"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Duration.Lifespans.Items.3",
                    "Marketing cookies: 30 days to 2 years"
                  )}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.Management.Title", "Managing cookies")}
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r("Cookies.Management.ConsentBanner.Title", "Consent Banner")}
              </h3>
              <p>
                {r(
                  "Cookies.Management.ConsentBanner.Description",
                  "When you first visit our website, you'll see a cookie consent banner with two options:"
                )}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Cookies.Management.ConsentBanner.Options.0",
                    '"All" - Accept all cookies including analytics, advertising, and personalization'
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Management.ConsentBanner.Options.1",
                    '"Essential" - Accept only essential functional cookies, declining analytics and advertising'
                  )}
                </li>
              </ul>
              <p className="mt-3">
                {r(
                  "Cookies.Management.ConsentBanner.ChangePreferences",
                  "You can change your preferences at any time using the cookie settings button that appears on the website."
                )}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r(
                  "Cookies.Management.BrowserSettings.Title",
                  "Browser Settings"
                )}
              </h3>
              <p>
                {r(
                  "Cookies.Management.BrowserSettings.Description",
                  "You can also control cookies through your browser settings. Most browsers allow you to:"
                )}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Cookies.Management.BrowserSettings.Options.0",
                    "View and delete cookies"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Management.BrowserSettings.Options.1",
                    "Block cookies from specific websites"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Management.BrowserSettings.Options.2",
                    "Block third-party cookies"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Management.BrowserSettings.Options.3",
                    "Clear all cookies when you close the browser"
                  )}
                </li>
              </ul>

              <div className="mt-4">
                <p className="font-semibold mb-2">
                  {r(
                    "Cookies.Management.BrowserSettings.Instructions",
                    "Browser-specific instructions:"
                  )}
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <a
                      href="https://support.google.com/chrome/answer/95647"
                      className="text-brand-hover hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Manage cookies in Chrome
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                      className="text-brand-hover hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Manage cookies in Firefox
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                      className="text-brand-hover hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Manage cookies in Safari
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies"
                      className="text-brand-hover hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Manage cookies in Internet Explorer
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                {r(
                  "Cookies.Management.DisablingImpact.Title",
                  "Impact of Disabling Cookies"
                )}
              </h3>
              <p>
                {r(
                  "Cookies.Management.DisablingImpact.Description",
                  "Please note that disabling certain cookies may affect your experience on our website:"
                )}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  {r(
                    "Cookies.Management.DisablingImpact.Effects.0",
                    "Essential cookies: Website may not function properly"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Management.DisablingImpact.Effects.1",
                    "Analytics cookies: We cannot improve our website based on usage data"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Management.DisablingImpact.Effects.2",
                    "Functional cookies: Personalization features will be disabled"
                  )}
                </li>
                <li>
                  {r(
                    "Cookies.Management.DisablingImpact.Effects.3",
                    "Marketing cookies: You may see less relevant advertisements"
                  )}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.Retention.Title", "Data Retention")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Cookies.Retention.Description",
                "We retain cookie data for a limited period necessary for the purposes described in this policy."
              )}
            </p>
          </div>
        </section>

        {/* Updates to Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.Updates.Title", "Updates to this Policy")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Cookies.Updates.Description",
                "We may update this policy from time to time to reflect changes in technology, regulation, or our practices."
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {r(
                  "Cookies.Updates.Actions.0",
                  "Update this page with the latest effective date"
                )}
              </li>
              <li>
                {r(
                  "Cookies.Updates.Actions.1",
                  "Notify users through our website banner or email (for significant changes)"
                )}
              </li>
              <li>
                {r(
                  "Cookies.Updates.Actions.2",
                  "Request renewed consent where required by law"
                )}
              </li>
            </ul>
          </div>
        </section>

        {/* Do Not Track Signals */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.DoNotTrack.Title", "Do Not Track Signals")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Cookies.DoNotTrack.Description",
                'Some browsers include a "Do Not Track" feature that lets you tell websites you do not want to be tracked. Currently, there is no accepted standard for how websites should respond to Do Not Track signals.'
              )}
            </p>
            <p>
              {r(
                "Cookies.DoNotTrack.Response",
                "We respect your privacy choices and are monitoring developments in this area to implement appropriate responses to Do Not Track signals when industry standards are established."
              )}
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {r("Cookies.Contact.Title", "Contact")}
          </h2>
          <div className="space-y-4">
            <p>
              {r(
                "Cookies.Contact.Description",
                "If you have any questions about this policy, please contact us at privacy@ridger.ch"
              )}
            </p>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="font-semibold">Ridger</p>
              <p>
                {r(
                  "Cookies.Contact.Address",
                  "26 Boulevard Georges Favon, 1204 Geneva"
                )}
              </p>
              <p className="font-semibold">
                {r("Cookies.Contact.Email", "Email: info@ridger.ch")}
              </p>
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
