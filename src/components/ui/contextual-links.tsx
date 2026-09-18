"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type Locale } from "@/src/lib/i18n";
import { localizePath, withTrailingSlash } from "@/src/lib/paths";

interface LinkMapping {
  keywords: string[];
  path: string;
  caseSensitive?: boolean;
}

const serviceLinkMappings: LinkMapping[] = [
  {
    keywords: [
      "accounting",
      "comptabilité",
      "buchhaltung",
      "contabilidad",
      "contabilidade",
    ],
    path: "/services/accounting",
  },
  {
    keywords: [
      "tax",
      "taxation",
      "fiscalité",
      "steuern",
      "impuestos",
      "impostos",
      "fiscal",
    ],
    path: "/services/taxes",
  },
  {
    keywords: ["payroll", "paie", "lohn", "nómina", "salários"],
    path: "/services/payroll",
  },
  {
    keywords: [
      "incorporation",
      "company formation",
      "création d'entreprise",
      "firmengründung",
      "creación de empresa",
      "criação de empresa",
    ],
    path: "/services/incorporation",
  },
  {
    keywords: [
      "corporate services",
      "services corporatifs",
      "unternehmensdienste",
      "servicios corporativos",
      "serviços corporativos",
    ],
    path: "/services/corporate",
  },
  {
    keywords: ["outsourcing", "externalisation", "auslagerung"],
    path: "/services/outsourcing",
  },
  {
    keywords: ["domiciliation", "domizilierung", "domiciliación"],
    path: "/services/domiciliation",
  },
];

interface ContextualLinksProps {
  children: string | string[];
  className?: string;
  maxLinksPerParagraph?: number;
}

/**
 * Component that automatically adds contextual internal links to service pages
 * based on keyword matching in the text content.
 */
export default function ContextualLinks({
  children,
  className = "",
  maxLinksPerParagraph = 2,
}: ContextualLinksProps) {
  const params = useParams();
  const locale = (params?.locale as Locale) || "fr";
  const localePrefix = `/${locale}`;

  const linkifyText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remainingText = text;
    let currentIndex = 0;

    // Find all potential matches
    const matches: Array<{
      index: number;
      length: number;
      keyword: string;
      path: string;
    }> = [];

    serviceLinkMappings.forEach(({ keywords, path }) => {
      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            index: match.index,
            length: keyword.length,
            keyword: match[0], // Preserve original case
            path,
          });
        }
      });
    });

    // Sort matches by position and take only first N
    matches.sort((a, b) => a.index - b.index);
    const selectedMatches = matches.slice(0, maxLinksPerParagraph);

    // Build the text with links
    selectedMatches.forEach((match, idx) => {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(remainingText.substring(0, match.index - currentIndex));
        remainingText = remainingText.substring(match.index - currentIndex);
      }

      // Add the link
      const localizedPath = withTrailingSlash(localizePath(match.path, locale));
      parts.push(
        <Link
          key={`link-${idx}-${match.index}`}
          href={`${localePrefix}${localizedPath}`}
          className="text-primary hover:underline font-medium"
          prefetch={false}
        >
          {match.keyword}
        </Link>
      );

      // Move past the matched text
      remainingText = remainingText.substring(match.length);
      currentIndex = match.index + match.length;
    });

    // Add remaining text
    if (remainingText) {
      parts.push(remainingText);
    }

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
