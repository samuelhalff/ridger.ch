import { getTranslations, type Locale } from "@/src/lib/i18n";
import React from "react";
import {
  Briefcase,
  ChartBar,
  ClipboardText,
  FileText,
  Gear,
  ShieldCheck,
  Users,
} from "@phosphor-icons/react/dist/ssr";

interface ServicesListServerProps {
  ns: string;
  translationKey: string; // e.g. "Presentation.Services"
  fallbackText: string[]; // ["Title: Desc", ...]
  icons?: React.ReactNode[]; // Optional per-item inline SVGs
  className?: string;
  locale?: Locale;
}

export default async function ServicesListServer({
  ns,
  translationKey,
  fallbackText,
  icons,
  className = "space-y-6 mt-4",
  locale = "fr",
}: ServicesListServerProps) {
  const t = await getTranslations(locale, ns);
  const raw = t(translationKey) as unknown;
  const items = Array.isArray(raw) && raw.length > 0 ? (raw as string[]) : fallbackText;
  const DefaultIcons: React.ReactNode[] = [
    <Briefcase key="briefcase" size={18} aria-hidden />,
    <Users key="users" size={18} aria-hidden />,
    <FileText key="file" size={18} aria-hidden />,
    <ShieldCheck key="shield" size={18} aria-hidden />,
    <Gear key="gear" size={18} aria-hidden />,
    <ChartBar key="chart" size={18} aria-hidden />,
    <ClipboardText key="clipboard" size={18} aria-hidden />,
  ];

  return (
    <div className={className}>
      {items.map((text, idx) => {
        const [title, ...rest] = String(text).split(":");
        const desc = rest.join(":").trim();
        const IconNode = icons && icons[idx % icons.length] ? icons[idx % icons.length] : DefaultIcons[idx % DefaultIcons.length];
        return (
          <div key={idx} className="my-5 flex items-center gap-5 overflow-hidden rounded-xl bg-card px-6 py-6 shadow-sm transition-colors hover:bg-surface-warm sm:gap-6 sm:px-8 dark:bg-muted/50">
            <span className="ui-icon inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground ring-1 ring-primary/20 dark:bg-primary/10 dark:text-primary shrink-0">
              {IconNode}
            </span>
            <div className="min-w-0">
              <span className="font-semibold text-base sm:text-lg text-foreground block mb-2 break-anywhere">{title}</span>
              {desc && <span className="text-sm sm:text-base text-muted-foreground break-anywhere leading-relaxed">{desc}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
