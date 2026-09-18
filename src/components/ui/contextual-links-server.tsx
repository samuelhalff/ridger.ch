import Link from "next/link";
import { type Locale } from "@/src/lib/i18n";
import { localizePath, withTrailingSlash } from "@/src/lib/paths";

interface LinkMapping {
  keywords: string[];
  path: string;
  caseSensitive?: boolean;
}

const serviceLinkMappings: LinkMapping[] = [
  { keywords: ["accounting", "comptabilité", "buchhaltung", "contabilidad", "contabilidade"], path: "/services/accounting" },
  { keywords: ["tax", "taxation", "fiscalité", "steuern", "impuestos", "impostos", "fiscal"], path: "/services/taxes" },
  { keywords: ["payroll", "paie", "lohn", "nómina", "salários"], path: "/services/payroll" },
  { keywords: ["incorporation", "company formation", "création d'entreprise", "firmengründung", "creación de empresa", "criação de empresa"], path: "/services/incorporation" },
  { keywords: ["corporate services", "services corporatifs", "unternehmensdienste", "servicios corporativos", "serviços corporativos"], path: "/services/corporate" },
  { keywords: ["outsourcing", "externalisation", "auslagerung"], path: "/services/outsourcing" },
  { keywords: ["domiciliation", "domizilierung", "domiciliación"], path: "/services/domiciliation" },
];

interface ContextualLinksProps {
  children: string | string[];
  className?: string;
  maxLinksPerParagraph?: number;
  locale: Locale;
}

export default function ContextualLinksServer({ children, className = "", maxLinksPerParagraph = 2, locale }: ContextualLinksProps) {
  const localePrefix = `/${locale}`;

  const linkifyText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remainingText = text;
    let currentIndex = 0;

    const matches: Array<{ index: number; length: number; keyword: string; path: string }> = [];

    serviceLinkMappings.forEach(({ keywords, path }) => {
      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({ index: match.index, length: keyword.length, keyword: match[0], path });
        }
      });
    });

    matches.sort((a, b) => a.index - b.index);
    const selectedMatches = matches.slice(0, maxLinksPerParagraph);

    selectedMatches.forEach((match, idx) => {
      if (match.index > currentIndex) {
        parts.push(remainingText.substring(0, match.index - currentIndex));
        remainingText = remainingText.substring(match.index - currentIndex);
      }

      const localizedPath = withTrailingSlash(localizePath(match.path, locale));
      parts.push(
        <Link key={`link-${idx}-${match.index}`} href={`${localePrefix}${localizedPath}`} className="text-primary hover:underline font-medium" prefetch={false}>
          {match.keyword}
        </Link>
      );

      remainingText = remainingText.substring(match.length);
      currentIndex = match.index + match.length;
    });

    if (remainingText) parts.push(remainingText);
    return parts.length > 0 ? parts : [text];
  };

  if (Array.isArray(children)) {
    return (
      <>
        {children.map((paragraph, idx) => (
          <p key={idx} className={className}>
            {linkifyText(paragraph)}
          </p>
        ))}
      </>
    );
  }

  return <p className={className}>{linkifyText(children)}</p>;
}

