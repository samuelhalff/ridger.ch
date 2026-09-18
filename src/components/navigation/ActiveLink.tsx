"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
  baseClass: string;
  mode?: "exact" | "section";
  locale?: string;
};

const normalize = (p: string) => {
  if (!p) return "/";
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
};

export default function ActiveLink({ href, children, baseClass, mode = "section", locale }: Props) {
  const pathname = normalize(usePathname() || "/");
  const target = normalize(href);
  const active = mode === "exact" ? pathname === target : pathname === target || pathname.startsWith(target + "/");
  const cls = `${baseClass} ${active ? "bg-accent" : "hover:bg-accent"}`.trim();
  return (
    <Link href={href} prefetch={false} locale={locale} className={cls}>
      {children}
    </Link>
  );
}

