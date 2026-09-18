import React from "react";
import { CtaBanner } from "@/src/components/ui/surface";
import { ChatCircleText as MessageCircleIcon } from "@phosphor-icons/react/dist/ssr";
// Server-provided texts via ArticleContent props; no client translation needed

const ContactSection = ({
  locale,
  eyebrow,
  title,
  description,
  buttonText,
  secondaryButtonText,
}: {
  locale?: string;
  eyebrow?: string;
  title: string;
  description: string;
  buttonText: string;
  /** Optional "Get instant quote" CTA displayed next to the primary contact button */
  secondaryButtonText?: string;
}) => {
  const localePrefix = locale ? `/${locale}` : "/fr";

  return (
    <CtaBanner
      className="mt-16"
      variant="contrast"
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={
        <span className="flex size-14 items-center justify-center rounded-full bg-background/10 text-brand-onDark dark:bg-[#1f1b19]/10 dark:text-brand-hover">
          <MessageCircleIcon className="h-7 w-7" />
        </span>
      }
      primary={{
        href: `${localePrefix}/contact/`,
        label: buttonText,
        locale,
      }}
      secondary={
        secondaryButtonText
          ? {
              href: `${localePrefix}/agent/`,
              label: secondaryButtonText,
              locale,
            }
          : undefined
      }
    />
  );
};

export default ContactSection;
