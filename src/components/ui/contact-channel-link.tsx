"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/src/lib/analytics";

type ContactChannelLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** Channel reported to GA4, e.g. "email", "phone", "whatsapp". */
  channel: string;
  /** Where the link sits, e.g. "footer", "contact_page". */
  placement: string;
};

/**
 * Plain anchor (mailto:, tel:, wa.me) that reports
 * `contact_channel_click {channel, placement}`. Meant for links rendered
 * inside server components.
 */
export default function ContactChannelLink({
  channel,
  placement,
  onClick,
  children,
  ...props
}: ContactChannelLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        trackEvent("contact_channel_click", { channel, placement });
      }}
    >
      {children}
    </a>
  );
}
