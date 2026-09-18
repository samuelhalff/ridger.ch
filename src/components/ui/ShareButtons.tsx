"use client";
import React from "react";
import {
  EnvelopeSimple,
  LinkSimple,
  LinkedinLogo,
  WhatsappLogo,
  XLogo,
} from "@phosphor-icons/react";

type Props = {
  url: string;
  title?: string;
  className?: string;
  labels?: {
    shareArticle: string;
    shareLinkedIn: string;
    shareX: string;
    shareWhatsApp: string;
    shareEmail: string;
    copyLink: string;
    copied: string;
  };
};

export default function ShareButtons({ url, title, className, labels }: Props) {
  const [copied, setCopied] = React.useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || "");

  const links = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    mailto: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}`,
  } as const;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  const baseBtn =
    "inline-flex items-center gap-2 rounded-md bg-surface-warm px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary";
  const text = labels || {
    shareArticle: "Share this article",
    shareLinkedIn: "Share on LinkedIn",
    shareX: "Share on X",
    shareWhatsApp: "Share on WhatsApp",
    shareEmail: "Share via email",
    copyLink: "Copy link",
    copied: "Copied",
  };

  return (
    <div
      className={"flex flex-wrap items-center gap-2 " + (className || "")}
      aria-label={text.shareArticle}
    >
      <a
        className={baseBtn}
        href={links.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={text.shareLinkedIn}
      >
        <LinkedinLogo className="h-4 w-4" weight="fill" aria-hidden="true" />
        LinkedIn
      </a>
      <a
        className={baseBtn}
        href={links.twitter}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={text.shareX}
      >
        <XLogo className="h-4 w-4" weight="fill" aria-hidden="true" />
        X
      </a>
      <a
        className={baseBtn}
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={text.shareWhatsApp}
      >
        <WhatsappLogo className="h-4 w-4" weight="fill" aria-hidden="true" />
        WhatsApp
      </a>
      <a className={baseBtn} href={links.mailto} aria-label={text.shareEmail}>
        <EnvelopeSimple className="h-4 w-4" aria-hidden="true" />
        Email
      </a>
      <button
        type="button"
        className={baseBtn}
        onClick={copyLink}
        aria-live="polite"
        aria-label={text.copyLink}
      >
        <LinkSimple className="h-4 w-4" aria-hidden="true" />
        {copied ? text.copied : text.copyLink}
      </button>
    </div>
  );
}
