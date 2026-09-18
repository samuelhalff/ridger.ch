"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "@phosphor-icons/react";

/**
 * Floating scroll-down hint badge.
 *
 * Reusable on any page that has a full-viewport hero section.
 * Pass an optional `targetSelector` so the badge can also auto-hide when
 * the user scrolls the specified element into view (IntersectionObserver).
 * Defaults to `[data-service-content]` for backward-compatibility with
 * service pages.
 */
const ServiceScrollHint = ({
  label,
  targetSelector = "[data-service-content]",
}: {
  label: string;
  /** CSS selector for the content section below the hero. The badge hides
   *  when this element enters the viewport. */
  targetSelector?: string;
}) => {
  const [hidden, setHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionMedia.matches);
    const onMotionChange = () => setPrefersReducedMotion(motionMedia.matches);
    motionMedia.addEventListener?.("change", onMotionChange);
    // Safari fallback
    motionMedia.addListener?.(onMotionChange);

    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.2) {
        setHidden(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const target = document.querySelector(targetSelector);
    let observer: IntersectionObserver | null = null;

    if (target && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) setHidden(true);
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -40% 0px",
        }
      );
      observer.observe(target);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      motionMedia.removeEventListener?.("change", onMotionChange);
      motionMedia.removeListener?.(onMotionChange);
    };
  }, [targetSelector]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed bottom-16 left-8 z-30 hidden transition-opacity duration-300 sm:flex ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur ${
          prefersReducedMotion ? "" : "animate-bounce"
        }`}
      >
        <span>{label}</span>
        <ArrowDown className="h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  );
};

export default ServiceScrollHint;
