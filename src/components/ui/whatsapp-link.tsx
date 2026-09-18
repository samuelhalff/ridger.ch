"use client";

import { useEffect, useState } from "react";

import { WhatsAppIcon } from "@/src/components/icons/WhatsAppIcon";
import { cn } from "@/src/lib/utils";
import { trackEvent } from "@/src/lib/analytics";
import {
  WHATSAPP_NUMBER,
  WHATSAPP_URL,
} from "@/src/lib/whatsapp";

const FLOATING_VISIBILITY_SYNC_DELAY_MS = 180;
const COOKIE_UI_SPACING_PX = 16;

function getFloatingBottomOffset(cookieDialog: HTMLElement | null) {
  if (!cookieDialog) return undefined;

  return `calc(env(safe-area-inset-bottom, 0px) + ${Math.ceil(cookieDialog.getBoundingClientRect().height) + COOKIE_UI_SPACING_PX}px)`;
}

type WhatsAppLinkProps = {
  badgeText: string;
  ctaLabel: string;
  variant?: "floating" | "badge";
  className?: string;
};

export default function WhatsAppLink({
  badgeText,
  ctaLabel,
  variant = "floating",
  className,
}: WhatsAppLinkProps) {
  const [isFloatingVisible, setIsFloatingVisible] = useState(false);
  const [floatingBottom, setFloatingBottom] = useState<string | undefined>(
    undefined
  );
  const [isCookieBannerVisible, setIsCookieBannerVisible] = useState(false);

  useEffect(() => {
    if (variant !== "floating") return;

    let observer: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let frameId: ReturnType<typeof requestAnimationFrame> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const syncFloatingState = () => {
      const cookieBanner = document.querySelector<HTMLElement>(
        '[aria-labelledby="cookie-consent-title"]'
      );
      const cookieDialog = cookieBanner?.closest<HTMLElement>('[role="dialog"]');

      setIsCookieBannerVisible(Boolean(cookieDialog));
      setFloatingBottom(getFloatingBottomOffset(cookieDialog ?? null));
      setIsFloatingVisible(true);

      observer?.disconnect();
      observer = null;

      if (cookieDialog && typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
          if (frameId !== null) window.cancelAnimationFrame(frameId);
          frameId = window.requestAnimationFrame(syncFloatingState);
        });
        observer.observe(cookieDialog);
      }
    };

    const scheduleSync = () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncFloatingState);
    };

    scheduleSync();
    timeoutId = setTimeout(scheduleSync, FLOATING_VISIBILITY_SYNC_DELAY_MS);

    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(scheduleSync);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    window.addEventListener("resize", scheduleSync);
    window.addEventListener("cookie-consent-changed", scheduleSync);
    window.addEventListener("open-cookie-settings", scheduleSync);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      observer?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("cookie-consent-changed", scheduleSync);
      window.removeEventListener("open-cookie-settings", scheduleSync);
    };
  }, [variant]);

  if (variant === "badge") {
    return (
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${ctaLabel} ${WHATSAPP_NUMBER}`}
        onClick={() =>
          trackEvent("contact_channel_click", {
            channel: "whatsapp",
            placement: "badge",
          })
        }
        className={cn(
          "group inline-flex max-w-full items-center gap-2.5 text-left text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md",
          className
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/8 text-[#1f9d55] shadow-sm transition-colors duration-200 group-hover:bg-[#25D366]/12">
          <WhatsAppIcon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground">
            {badgeText}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {WHATSAPP_NUMBER}
          </span>
        </span>
      </a>
    );
  }

  if (!isFloatingVisible) return null;

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${ctaLabel} ${WHATSAPP_NUMBER}`}
      onClick={() =>
        trackEvent("contact_channel_click", {
          channel: "whatsapp",
          placement: "floating",
        })
      }
      style={floatingBottom ? { bottom: floatingBottom } : undefined}
      className={cn(
        "whatsapp-float-entry group fixed right-4 z-40 bottom-[var(--floating-secondary-bottom)] flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-colors duration-200 hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:right-6",
        isCookieBannerVisible && "shadow-sm",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "whatsapp-float-pulse absolute inset-0 rounded-full bg-white/15",
          isCookieBannerVisible && "opacity-0"
        )}
      />
      <WhatsAppIcon className="relative size-5" />
      <span className="sr-only">
        {badgeText} - {ctaLabel}
      </span>
    </a>
  );
}
