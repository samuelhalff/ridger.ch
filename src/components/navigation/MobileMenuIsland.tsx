"use client";
import { useEffect, useState } from "react";
import type { NavData } from "@/src/components/navigation/types";
import MobileMenu from "@/src/components/navigation/MobileMenu";

export default function MobileMenuIsland({
  locale,
  navData,
}: {
  locale?: string;
  navData: NavData;
}) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setShouldRender(mq.matches);
    update();
    try {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } catch {
      mq.addListener(update);
      return () => mq.removeListener(update);
    }
  }, []);

  if (!shouldRender) return null;
  return <MobileMenu locale={locale} navData={navData} />;
}
