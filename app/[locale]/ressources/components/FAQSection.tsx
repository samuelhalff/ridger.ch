import React from "react";

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQSection({
  faq,
  locale: _locale,
  nonce,
}: {
  faq: { Title?: string; Items?: FAQItem[] };
  locale: string;
  nonce?: string;
}) {
  if (!faq?.Items || !faq.Items.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.Items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <section className="mt-20 mb-24" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 id="faq-heading" className="text-2xl font-semibold mb-8">
        {faq.Title || "Frequently asked questions"}
      </h2>
      <div className="space-y-6">
        {faq.Items.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-md bg-surface-warm/60 p-4 shadow-sm"
          >
            <summary className="cursor-pointer list-none font-medium flex items-start justify-between">
              <span className="pr-4 leading-snug">{item.q}</span>
              <span className="text-sm text-muted-foreground group-open:hidden">
                +
              </span>
              <span className="text-sm text-muted-foreground hidden group-open:inline">
                –
              </span>
            </summary>
            <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
