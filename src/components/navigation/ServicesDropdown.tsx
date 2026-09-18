"use client";

import Link from "next/link";
import { useState, useCallback, type FocusEvent } from "react";
import { CaretDown } from "@phosphor-icons/react";

import type { NavData } from "@/src/components/navigation/types";

type ServicesDropdownProps = {
  locale?: string;
  localePrefix: string;
  navData: NavData;
  isActive: boolean;
};

export default function ServicesDropdown({
  locale,
  localePrefix,
  navData,
  isActive,
}: ServicesDropdownProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const handleBlur = useCallback((event: FocusEvent<HTMLLIElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false);
    }
  }, []);

  return (
    <li
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
      onFocusCapture={() => setOpen(true)}
      onBlur={handleBlur}
    >
      <Link
        href={`${localePrefix}/services/`}
        prefetch={false}
        locale={locale}
        aria-expanded={open}
        className={`critical-nav__link relative inline-flex items-center gap-1 rounded-full px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-surface-warm after:absolute after:inset-x-3 after:-bottom-1 after:h-[2px] after:origin-center after:rounded-full after:bg-brand after:transition-transform after:duration-200 ${
          isActive
            ? "text-brand-hover after:scale-x-100 dark:text-brand"
            : "after:scale-x-0"
        }`}
        onClick={close}
      >
        {navData.labels.services}
        <CaretDown
          className={`relative top-px ml-1 size-3 transition duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </Link>
      <div
        className={`absolute left-0 top-full z-50 w-[min(92vw,720px)] rounded-md bg-background pt-2 shadow-xl transition-opacity duration-150 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="p-3">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navData.services.map((item) => (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  prefetch={false}
                  locale={locale}
                  className="block rounded-md p-3 transition-colors hover:bg-surface-warm/70 focus:bg-surface-warm/70 focus:outline-none focus:ring-2 focus:ring-foreground/15 dark:hover:bg-white/[0.06] dark:focus:bg-white/[0.06]"
                  onClick={close}
                >
                  <div className="text-left text-sm font-medium leading-none truncate">
                    {item.title}
                  </div>
                  <p className="mt-1 text-left text-sm text-muted-foreground leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-right">
            <Link
              href={`${localePrefix}/services/`}
              prefetch={false}
              locale={locale}
              className="text-sm text-primary underline hover:no-underline"
              onClick={close}
            >
              {navData.labels.services} →
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
