import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr";
import SectionHeading from "@/src/components/site/section-heading";
import StructuredData from "@/src/components/seo/StructuredData";
import { getPageFaq } from "@/src/lib/page-faq";
import { buildFAQPage } from "@/src/lib/structuredData";
import { tidyTitle } from "@/src/lib/typography";

/**
 * Visible FAQ of a page and its FAQPage JSON-LD, built from the same
 * entries (src/lib/page-faq.ts). Renders nothing when the page has no FAQ.
 */
export default function PageFaq({ locale, ns, at, nonce }: { locale: string; ns: string; at?: string; nonce?: string }) {
  const faq = getPageFaq(locale, ns, at);
  if (!faq) return null;
  return (
    <section id="faq" className="mx-auto mb-10 w-full max-w-[1240px] px-5 py-8 sm:px-8 xs:py-16">
      <StructuredData nonce={nonce} data={buildFAQPage(faq.entries)} />
      <SectionHeading eyebrow="FAQ" title={tidyTitle(faq.title)} className="max-w-4xl" />
      <div className="mx-auto mt-8 max-w-4xl space-y-4">
        {faq.entries.map(({ question, answer }) => (
          <details
            key={question}
            className="group rounded-[22px] bg-surface-warm px-5 py-4 shadow-sm transition-shadow open:shadow-md dark:bg-card"
          >
            <summary className="faq-summary flex cursor-pointer select-none items-center justify-between gap-4 py-1 pr-2">
              <h3 className="text-lg font-semibold leading-snug tracking-tight">{question}</h3>
              <span className="faq-icon inline-flex h-7 w-7 flex-none shrink-0 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground transition-colors group-open:bg-foreground/15 group-open:text-foreground/90">
                <PlusIcon className="transition-transform group-open:rotate-45" />
              </span>
            </summary>
            <div className="mt-2 pb-2 text-left text-[15px] text-muted-foreground">{answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
