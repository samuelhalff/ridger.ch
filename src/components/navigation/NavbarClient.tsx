"use client";

import Link from "next/link";
import Image from "next/image";
import Defer from "@/src/components/Defer";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ServicesDropdown from "@/src/components/navigation/ServicesDropdown";
import type { NavData } from "@/src/components/navigation/types";
import HeaderControls from "@/src/components/navigation/HeaderControls";
import MobileMenuIsland from "@/src/components/navigation/MobileMenuIsland";

export default function NavbarClient({
  locale,
  navData,
}: {
  locale?: string;
  navData: NavData;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const localePrefix = locale ? `/${locale}` : "/fr";

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 4);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  const normalize = (p: string) => {
    if (!p) return "/";
    return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
  };
  const isActive = (href: string) => normalize(pathname) === normalize(href);
  const isSection = (href: string) => {
    const cur = normalize(pathname);
    const base = normalize(href);
    return cur === base || cur.startsWith(base + "/");
  };
  const linkBase =
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-center transition-colors duration-160 ease-in-out hover:bg-surface-warm hover:text-foreground cursor-pointer after:absolute after:inset-x-3 after:-bottom-1 after:h-[2px] after:origin-center after:scale-x-0 after:rounded-full after:bg-brand after:transition-transform after:duration-200";
  const activeClasses =
    "text-brand-hover hover:text-brand-hover after:scale-x-100 dark:text-brand dark:hover:text-brand";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full">
      <nav
        className={`site-header flex h-16 items-center bg-background transition-[box-shadow] duration-200 ${
          scrolled
            ? "shadow-[0_16px_38px_rgba(20,16,14,0.16),0_1px_0_rgba(20,16,14,0.06)] dark:shadow-[0_18px_42px_rgba(0,0,0,0.72),0_1px_0_rgba(255,255,255,0.10)]"
            : "shadow-none"
        }`}
      >
        <div className="site-header-inner mx-auto flex h-full w-full max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8 xl:px-0">
          <Link
            href={`/${locale || 'fr'}/`}
            prefetch={false}
            locale={locale}
            aria-label={navData.labels.home}
          >
            <span className="site-logo flex items-center w-[100px] h-[32px]">
              <Image
                className="hidden dark:block"
                src="/assets/ridger--light.svg"
                width={100}
                height={32}
                alt="Ridger"
                sizes="(max-width: 768px) 88px, 100px"
                decoding="async"
              />
              <Image
                className="dark:hidden"
                src="/assets/ridger--color.svg"
                width={100}
                height={32}
                alt="Ridger"
                sizes="(max-width: 768px) 88px, 100px"
                decoding="async"
              />
            </span>
          </Link>

          {/* Desktop primary navigation (server-rendered) */}
          <div className="hidden min-w-0 flex-1 md:block">
            <nav aria-label="Primary">
              <ul className="flex min-w-0 items-center justify-end gap-1">
                <li>
                  <Link
                    href={`${localePrefix}/`}
                    prefetch={false}
                    locale={locale}
                    aria-current={
                      isActive(`${localePrefix}`) ? "page" : undefined
                    }
                    className={`${linkBase} ${
                      isActive(`${localePrefix}`) ? activeClasses : ""
                    }`}
                  >
                    {navData.labels.home}
                  </Link>
                </li>
                <ServicesDropdown
                  locale={locale}
                  localePrefix={localePrefix}
                  navData={navData}
                  isActive={isSection(`${localePrefix}/services`)}
                />
                <li>
                  <Link
                    href={`${localePrefix}/approach/`}
                    prefetch={false}
                    locale={locale}
                    aria-current={
                      isSection(`${localePrefix}/approach`) ? "page" : undefined
                    }
                    className={`${linkBase} ${
                      isSection(`${localePrefix}/approach`) ? activeClasses : ""
                    }`}
                  >
                    {navData.labels.approach}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`${localePrefix}/platform/`}
                    prefetch={false}
                    locale={locale}
                    aria-current={
                      isSection(`${localePrefix}/platform`) ? "page" : undefined
                    }
                    className={`${linkBase} ${
                      isSection(`${localePrefix}/platform`) ? activeClasses : ""
                    }`}
                  >
                    {navData.labels.platform}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`${localePrefix}/ressources/`}
                    prefetch={false}
                    locale={locale}
                    aria-current={
                      isSection(`${localePrefix}/ressources`)
                        ? "page"
                        : undefined
                    }
                    className={`${linkBase} ${
                      isSection(`${localePrefix}/ressources`)
                        ? activeClasses
                        : ""
                    }`}
                  >
                    {navData.labels.ressources}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`${localePrefix}/contact/`}
                    prefetch={false}
                    locale={locale}
                    aria-current={
                      isSection(`${localePrefix}/contact`) ? "page" : undefined
                    }
                    className={`${linkBase} ${
                      isSection(`${localePrefix}/contact`) ? activeClasses : ""
                    }`}
                  >
                    {navData.labels.contact}
                  </Link>
                </li>
                <li className="site-header-controls ml-1">
              <HeaderControls />
                </li>
              </ul>
            </nav>
          </div>

          {/* Mobile menu (client-only, deferred with safety maxDelay) */}
          <div className="flex md:hidden">
            <Defer
              rootMargin="100px"
              idle={150}
              maxDelay={1800}
              placeholder={null}
            >
              <MobileMenuIsland locale={locale} navData={navData} />
            </Defer>
          </div>
        </div>
      </nav>
    </div>
  );
}
