import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

type ActionCardVariant = "contrast" | "warm" | "plain" | "whatsapp";
type CtaBannerVariant = "contrast" | "warm";

const actionCardClasses: Record<ActionCardVariant, string> = {
  contrast: "bg-foreground text-background dark:bg-card dark:text-foreground",
  warm: "bg-surface-warm text-foreground",
  plain: "bg-card text-foreground",
  whatsapp:
    "bg-[#e6f6ed] text-[#123b27] dark:bg-[#123022] dark:text-[#e4f7ec]",
};

const actionIconClasses: Record<ActionCardVariant, string> = {
  contrast:
    "bg-background/12 text-background group-hover:bg-brand group-hover:text-white dark:bg-background/10 dark:text-foreground dark:group-hover:bg-brand dark:group-hover:text-white",
  warm:
    "bg-background/75 text-brand-hover group-hover:bg-brand group-hover:text-white dark:bg-background/10 dark:text-brand dark:group-hover:bg-brand dark:group-hover:text-white",
  plain:
    "bg-brand-soft text-brand-hover group-hover:bg-brand group-hover:text-white dark:bg-brand/10 dark:text-brand dark:group-hover:bg-brand dark:group-hover:text-white",
  whatsapp:
    "bg-white text-[#1f9d55] group-hover:bg-[#25D366] group-hover:text-white dark:bg-white/8 dark:text-[#61d394] dark:group-hover:bg-[#25D366] dark:group-hover:text-[#10331f]",
};

const actionDescriptionClasses: Record<ActionCardVariant, string> = {
  contrast: "text-background/75 dark:text-foreground/75",
  warm: "text-foreground/80",
  plain: "text-muted-foreground",
  whatsapp: "text-[#315c44] dark:text-[#bde7cc]",
};

type ActionCardProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  external?: boolean;
  ariaLabel?: string;
  variant?: ActionCardVariant;
  className?: string;
};

export function ActionCard({
  icon,
  title,
  description,
  href,
  external,
  ariaLabel,
  variant = "warm",
  className,
}: ActionCardProps) {
  const content = (
    <>
      {icon ? (
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            actionIconClasses[variant],
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-base font-semibold">{title}</span>
        {description ? (
          <span
            className={cn(
              "mt-1 block text-sm leading-6 transition-colors duration-200",
              actionDescriptionClasses[variant],
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
    </>
  );

  const classes = cn(
    "group flex items-start gap-4 rounded-[22px] p-5 shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    actionCardClasses[variant],
    className,
  );

  if (href) {
    return (
      <a
        data-surface="action-card"
        data-variant={variant}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-label={ariaLabel}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      data-surface="action-card"
      data-variant={variant}
      aria-label={ariaLabel}
      className={classes}
    >
      {content}
    </div>
  );
}

const bannerClasses: Record<CtaBannerVariant, string> = {
  contrast: "bg-card text-foreground dark:bg-card dark:text-foreground",
  warm: "bg-surface-warm text-foreground",
};

const bannerDescriptionClasses: Record<CtaBannerVariant, string> = {
  contrast: "text-muted-foreground dark:text-foreground/78",
  warm: "text-foreground/80",
};

const bannerEyebrowClasses: Record<CtaBannerVariant, string> = {
  contrast: "text-brand-hover dark:text-brand",
  warm: "text-brand-hover",
};

type CtaAction = {
  label: string;
  href: string;
  locale?: string;
};

type CtaBannerProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  primary?: CtaAction;
  secondary?: CtaAction;
  variant?: CtaBannerVariant;
  className?: string;
  titleClassName?: string;
};

export function CtaBanner({
  eyebrow,
  title,
  description,
  icon,
  primary,
  secondary,
  variant = "warm",
  className,
  titleClassName,
}: CtaBannerProps) {
  return (
    <section
      data-surface="cta-banner"
      data-variant={variant}
      className={cn(
        "relative overflow-hidden rounded-2xl p-8 text-center shadow-sm sm:p-12",
        bannerClasses[variant],
        className,
      )}
    >
      <div className="relative mx-auto max-w-2xl">
        {icon ? <div className="mb-5 flex justify-center">{icon}</div> : null}
        {eyebrow ? (
          <p
            className={cn(
              "font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em]",
              bannerEyebrowClasses[variant],
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "mt-3 text-2xl font-semibold tracking-tight sm:text-3xl",
            titleClassName,
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mx-auto mt-3 max-w-2xl text-sm leading-7 sm:text-base",
              bannerDescriptionClasses[variant],
            )}
          >
            {description}
          </p>
        ) : null}
        {(primary || secondary) ? (
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            {primary ? (
              <Button
                asChild
                size="lg"
                className={cn(
                  "w-full rounded-full sm:w-auto sm:min-w-[14rem]",
                  variant === "contrast"
                    ? "btn-main-cta !bg-foreground !text-background hover:!text-white dark:!bg-foreground dark:!text-background dark:hover:!text-white"
                    : "btn-main-cta !bg-foreground !text-background hover:!text-white",
                )}
              >
                <Link
                  href={primary.href}
                  locale={primary.locale}
                  prefetch={false}
                >
                  <span>{primary.label}</span>
                </Link>
              </Button>
            ) : null}
            {secondary ? (
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="btn-secondary-cta w-full rounded-full sm:w-auto sm:min-w-[14rem]"
              >
                <Link
                  href={secondary.href}
                  locale={secondary.locale}
                  prefetch={false}
                >
                  <span>{secondary.label}</span>
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
