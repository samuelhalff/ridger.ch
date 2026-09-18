import * as React from "react";

import { cn } from "@/src/lib/utils";

type SectionHeadingProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  titleAs?: React.ElementType;
  align?: "left" | "center";
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  titleAs: TitleTag = "h2",
  align = "center",
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
  children,
}: SectionHeadingProps) {
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "space-y-4",
        isCentered ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <div
          className={cn(
            "text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-brand-hover",
            isCentered
              ? "grid grid-cols-[1.5rem_auto_1.5rem] items-center justify-center gap-3"
              : "inline-flex items-center justify-start gap-3",
            eyebrowClassName,
          )}
        >
          {isCentered ? (
            <span aria-hidden="true" className="h-px w-6 bg-current/65" />
          ) : null}
          <span className="min-w-0 text-center">{eyebrow}</span>
          {isCentered ? (
            <span aria-hidden="true" className="h-px w-6 bg-current/65" />
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <TitleTag
          className={cn(
            "text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.85rem] lg:leading-[1.05]",
            titleClassName,
          )}
        >
          {title}
        </TitleTag>
        {description ? (
          <p
            className={cn(
              "max-w-3xl text-sm leading-7 text-foreground/75 sm:text-base",
              isCentered ? "mx-auto" : "",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </div>
  );
}
