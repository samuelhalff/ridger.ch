import ContextualLinksServer from "@/src/components/ui/contextual-links-server";
import type { Locale } from "@/src/lib/i18n";

interface StructuredCopyProps {
  paragraphs: string[];
  locale: Locale;
  leadCount?: number;
}

export default function StructuredCopy({
  paragraphs,
  locale,
  leadCount = 2,
}: StructuredCopyProps) {
  const lead = paragraphs.slice(0, leadCount);
  const supporting = paragraphs.slice(leadCount);

  return (
    <div className="space-y-8">
      <div className="max-w-4xl space-y-5 text-lg leading-8 text-foreground/85">
        {lead.map((paragraph, index) => (
          <ContextualLinksServer
            key={`lead-${index}`}
            locale={locale}
            className="max-w-[68ch]"
          >
            {paragraph}
          </ContextualLinksServer>
        ))}
      </div>
      {supporting.length > 0 ? (
        <div className="grid gap-x-10 gap-y-5 rounded-[24px] bg-surface-warm/45 p-6 shadow-sm md:grid-cols-2">
          {supporting.map((paragraph, index) => (
            <ContextualLinksServer
              key={`supporting-${index}`}
              locale={locale}
              className="text-sm leading-7 text-foreground/80"
              maxLinksPerParagraph={1}
            >
              {paragraph}
            </ContextualLinksServer>
          ))}
        </div>
      ) : null}
    </div>
  );
}
