"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";

export default function BackToTop({ threshold = 600 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 bottom-[var(--floating-tertiary-bottom)] z-30 rounded-full bg-background/80 px-3 py-2 shadow-md backdrop-blur transition-colors hover:bg-surface-warm data-[state=open]:animate-in sm:right-6 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
