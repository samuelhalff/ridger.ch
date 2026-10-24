"use client";

import Link from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { trackEvent } from "@/src/lib/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  /** When set, a click fires a GA4 `cta_click` event with this cta name. */
  cta?: string;
};

/** next/link that reports a `cta_click` event; stays inert without `cta`. */
const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  ({ cta, onClick, href, ...props }, ref) => (
    <Link
      ref={ref}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (cta) {
          trackEvent("cta_click", {
            cta,
            destination: typeof href === "string" ? href : (href.pathname ?? ""),
          });
        }
      }}
      {...props}
    />
  ),
);
TrackedLink.displayName = "TrackedLink";

export default TrackedLink;
