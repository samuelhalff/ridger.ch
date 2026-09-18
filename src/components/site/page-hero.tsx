import * as React from "react";

import SectionHeading from "@/src/components/site/section-heading";
import { cn } from "@/src/lib/utils";

type PageHeroProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
};

export default function PageHero({
  eyebrow,
  title,
  description,
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
  children,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative py-8 sm:py-10 lg:py-14",
        className,
      )}
    >
      <div className="relative">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          titleAs="h1"
          align="left"
          className="max-w-5xl"
          eyebrowClassName={eyebrowClassName}
          titleClassName={cn(
            "max-w-[16ch] text-5xl leading-[0.98] sm:text-6xl lg:text-7xl",
            titleClassName,
          )}
          descriptionClassName={cn(
            "max-w-[58ch] text-base leading-8 sm:text-lg",
            descriptionClassName,
          )}
        />
        {children ? <div className="relative mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
