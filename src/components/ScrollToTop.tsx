"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Scrolls the window to the top whenever the pathname changes.
 * Uses `behavior: "instant"` to bypass the global `scroll-behavior: smooth`
 * CSS rule which can cause new pages to appear at the previous scroll position
 * while the smooth animation is still running.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial render — the browser already handles the first load.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
