"use client";
import { Button } from "@/src/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
import LangSwitchMobile from "@/src/components/navigation/LangSwitchMobile";
import { Suspense } from "react";
import ThemeToggleMobile from "@/src/components/navigation/ThemeToggleMobile";
import ServicesMobile, {
  normalizePath,
} from "@/src/components/navigation/ServicesMobile";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import TrackedLink from "@/src/components/ui/tracked-link";
import { cn } from "@/src/lib/utils";
import { trackEvent } from "@/src/lib/analytics";
import type { NavData } from "@/src/components/navigation/types";
import { List, X } from "@phosphor-icons/react";

const MobileMenuToggleIcon = ({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) => (
  open ? (
    <X aria-hidden className={cn("h-6 w-6", className)} />
  ) : (
    <List aria-hidden className={cn("h-6 w-6", className)} />
  )
);

const rowClass =
  "flex min-h-11 items-center border-b px-2 py-3 text-md font-bold transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:text-accent";

const MobileMenu = ({
  locale,
  navData,
}: {
  locale?: string;
  navData: NavData;
}) => {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };
  const localePrefix = locale ? `/${locale}` : "/fr";
  const pathname = normalizePath(usePathname() || "");
  const isCurrent = (href: string) => normalizePath(href) === pathname;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "p-2 text-foreground transition-colors",
            open ? "text-primary" : "hover:text-primary",
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mobile-menu-panel"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <MobileMenuToggleIcon open={open} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-[100vw] h-[100svh] sm:h-full overflow-hidden p-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right"
        hideClose
        id="mobile-menu-panel"
        aria-label="Mobile navigation"
        role="dialog"
      >
        <SheetTitle className="sr-only">
          {navData.labels.mobileNavigation}
        </SheetTitle>
        <div className="flex h-16 items-center px-4 shadow-[0_10px_24px_rgba(20,16,14,0.05)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
          <div className="flex-1 flex justify-start">
            <Image
              className="hidden dark:block"
              src="/assets/ridger--light.svg"
              width={100}
              height={32}
              alt="Ridger"
              loading="lazy"
              decoding="async"
              sizes="100px"
            />
            <Image
              className="dark:hidden"
              src="/assets/ridger--color.svg"
              width={100}
              height={32}
              alt="Ridger"
              loading="lazy"
              decoding="async"
              sizes="100px"
            />
          </div>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="ml-2 p-2 text-primary transition-colors hover:text-primary/90"
              aria-label="Close menu"
            >
              <MobileMenuToggleIcon open className="scale-90" />
            </Button>
          </SheetTrigger>
        </div>
        <div
          className="h-[calc(100svh-64px)] md:h-[calc(100vh-64px)] overflow-y-auto pb-24 [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:bg-gray-300
  dark:[&::-webkit-scrollbar-track]:bg-neutral-700
  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <nav className="flex flex-col px-4 mt-3 pb-10 pt-2">
            <ul className="flex flex-col border-t">
              <li>
                <Link
                  href={`${localePrefix}/`}
                  onClick={handleLinkClick}
                  prefetch={false}
                  locale={locale}
                  aria-current={isCurrent(`${localePrefix}/`) ? "page" : undefined}
                  className={rowClass}
                >
                  {navData.labels.home}
                </Link>
              </li>
              <ServicesMobile
                locale={locale}
                onLinkClick={handleLinkClick}
                services={navData.services}
                label={navData.labels.services}
                allLabel={navData.labels.allServices}
              />
              <li>
                <Link
                  href={`${localePrefix}/approach/`}
                  onClick={handleLinkClick}
                  prefetch={false}
                  locale={locale}
                  aria-current={isCurrent(`${localePrefix}/approach/`) ? "page" : undefined}
                  className={rowClass}
                >
                  {navData.labels.approach}
                </Link>
              </li>
              <li>
                <Link
                  href={`${localePrefix}/platform/`}
                  onClick={handleLinkClick}
                  prefetch={false}
                  locale={locale}
                  aria-current={isCurrent(`${localePrefix}/platform/`) ? "page" : undefined}
                  className={rowClass}
                >
                  {navData.labels.platform}
                </Link>
              </li>
              <li>
                <Link
                  href={`${localePrefix}/ressources/`}
                  onClick={handleLinkClick}
                  prefetch={false}
                  locale={locale}
                  aria-current={isCurrent(`${localePrefix}/ressources/`) ? "page" : undefined}
                  className={rowClass}
                >
                  {navData.labels.ressources}
                </Link>
              </li>
            </ul>
            {/* Contact: final entry — a quiet accent link over the email address. */}
            <div className="mt-6">
              <TrackedLink
                cta="nav_mobile_contact"
                href={`${localePrefix}/contact/`}
                onClick={handleLinkClick}
                prefetch={false}
                locale={locale}
                aria-current={isCurrent(`${localePrefix}/contact/`) ? "page" : undefined}
                className="flex min-h-11 items-center px-2 py-2 text-md font-bold text-accent transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {navData.labels.contact}
              </TrackedLink>
              <a
                href="mailto:contact@ridger.ch"
                onClick={() =>
                  trackEvent("contact_channel_click", {
                    channel: "email",
                    placement: "mobile_menu",
                  })
                }
                className="flex min-h-11 items-center px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                contact@ridger.ch
              </a>
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t pt-4">
              <ThemeToggleMobile />
              <Suspense fallback={null}>
                <LangSwitchMobile onLocaleChange={handleLinkClick} />
              </Suspense>
            </div>
            {/* Footer is server-rendered in layout; omit here to keep client bundle light */}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
