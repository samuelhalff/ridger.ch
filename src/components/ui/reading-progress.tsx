"use client";

import { useEffect, useState } from "react";

/**
 * ReadingProgress shows a thin progress bar at the top that fills as the user scrolls the article content.
 */
export default function ReadingProgress({
  targetSelector = "article",
}: {
  targetSelector?: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.querySelector(targetSelector) as HTMLElement | null;
    if (!target) return;

    const onScroll = () => {
      const total = target.scrollHeight - window.innerHeight;
      const scrolled = Math.min(
        Math.max(window.scrollY - (target.offsetTop - 0), 0),
        total
      );
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      setProgress(pct);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetSelector]);

  return (
    <div
      aria-hidden
      className="fixed left-0 right-0 top-[64px] z-30 h-1 bg-transparent"
    >
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
