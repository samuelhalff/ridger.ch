"use client";
import ServicesElements from "@/app/[locale]/navigation";
import React from "react";
import Link from "next/link";
import {
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/src/components/navigation/NavigationComponents";
import type { NavData } from "@/src/components/navigation/types";

function ListItem({
  title,
  children,
  href,
  icon,
  locale,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  href: string;
  icon: React.ReactNode;
  locale?: string;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          prefetch={false}
          locale={locale}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-surface-warm/70 hover:text-foreground focus:bg-surface-warm/70 focus:text-foreground focus:ring-2 focus:ring-foreground/15 dark:hover:bg-white/[0.06] dark:focus:bg-white/[0.06]"
        >
          <div className="flex gap-2 items-center text-sm font-medium leading-none">
            {icon && icon}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default function ServicesDropdownContent({
  locale,
  navData,
}: {
  locale?: string;
  navData: NavData;
}) {
  const localePrefix = locale ? `/${locale}` : "";
  function normalizeHref(href: string) {
    if (!href) return href;
    // Remove accidental double /services/services occurrences
    href = href.replace(/\/services\/services(\/|$)/, "/services/$1");
    // Collapse any duplicate slashes (except after protocol if any)
    href = href.replace(/([^:])\/+/g, "$1/");
    return href;
  }
  return (
    <NavigationMenuContent className="left-auto right-0">
      <ul className="grid w-[400px] gap-2 md:w-[350px] md:grid-cols-2 lg:w-[600px]">
        {ServicesElements.map((component, idx) => (
          <ListItem
            key={component.titleKey}
            title={navData.services[idx]?.title || component.titleKey}
            href={localePrefix + normalizeHref(component.href)}
            icon={component.icon}
            locale={locale}
          >
            {navData.services[idx]?.description || component.descriptionKey}
          </ListItem>
        ))}
      </ul>
    </NavigationMenuContent>
  );
}
