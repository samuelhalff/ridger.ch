"use client";

import type { ComponentProps } from "react";
import { trackEvent } from "@/src/lib/analytics";

type TrackedAnchorProps = ComponentProps<"a"> & {
  /** GA4 `cta_click` cta name. */
  cta: string;
};

/** Plain in-page anchor that reports a `cta_click` event. */
export default function TrackedAnchor({
  cta,
  onClick,
  href,
  ...props
}: TrackedAnchorProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        trackEvent("cta_click", { cta, destination: href ?? "" });
      }}
      {...props}
    />
  );
}
