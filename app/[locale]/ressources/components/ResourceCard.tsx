import React from "react";
import Reveal from "@/src/components/motion/reveal";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

interface Labels {
  ReadArticle?: string;
  By?: string;
  Published?: string;
}

// Badge styles keyed by name so each category always renders the same color
const badgeStyles = {
  brand: "bg-brand-soft text-brand-hover dark:bg-brand/15 dark:text-brand",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  amber:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  stone: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
} as const;

type BadgeStyle = keyof typeof badgeStyles;

// Deterministic category -> color mapping (ResourceCategoryId values)
const categoryBadgeStyle: Record<string, BadgeStyle> = {
  accounting: "brand",
  tax: "amber",
  payroll: "emerald",
  odoo: "violet",
  audit: "rose",
  corporate: "stone",
  domiciliation: "brand",
  outsourcing: "emerald",
  ma: "violet",
  "family-office": "amber",
  incorporation: "rose",
  immigration: "stone",
  finance: "emerald",
  regulatory: "amber",
  general: "stone",
};

interface ResourceCardProps {
  title: string;
  description: string;
  href: string;
  date?: string;
  author?: string;
  category?: string;
  categoryId?: string;
  locale?: string;
  labels?: Labels;
  /** Position in the grid, used only to stagger the reveal animation. */
  colorIndex?: number;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  description,
  href,
  date,
  category,
  categoryId,
  locale,
  labels,
  colorIndex = 0,
}) => {
  const badgeClass =
    badgeStyles[(categoryId && categoryBadgeStyle[categoryId]) || "stone"];
  const formattedDate = formatResourceDate(date, locale);

  return (
    <Reveal delay={Math.min(colorIndex * 0.04, 0.24)} className="h-full">
    <a
      href={href}
      className="group relative flex h-full flex-col rounded-[18px] bg-card p-5 shadow-sm transition-colors duration-200 hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-surface-warm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {category ? (
          <span className={`w-fit rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${badgeClass}`}>
            {category}
          </span>
        ) : (
          <span />
        )}
        {formattedDate ? (
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/75">
            {formattedDate}
          </span>
        ) : null}
      </div>

      <h3 className="mb-3 text-lg font-semibold leading-snug tracking-tight text-foreground">
        {title}
      </h3>

      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="flex items-center justify-end pt-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 group-hover:text-brand-hover">
          {(labels && labels.ReadArticle) || "Read"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </a>
    </Reveal>
  );
};

function formatResourceDate(date?: string, locale = "fr") {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export default ResourceCard;
