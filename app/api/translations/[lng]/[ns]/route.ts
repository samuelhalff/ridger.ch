import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { locales, type Locale } from "@/src/lib/i18n-locales";
import { namespaceSet, type Namespace } from "@/src/lib/i18n-namespaces";

const localeSet = new Set<Locale>(locales as readonly Locale[]);

const CACHE_CONTROL_HEADER = "public, max-age=86400, stale-while-revalidate=604800";

const resolveTranslationPath = (lng: string, ns: string) =>
  path.join(process.cwd(), "src", "translations", lng, `${ns}.json`);

const isNamespace = (value: string): value is Namespace => namespaceSet.has(value);

export async function GET(_request: Request, props: { params: Promise<{ lng: string; ns: string }> }) {
  const params = await props.params;
  const { lng, ns } = params;

  if (!localeSet.has(lng as Locale) || !isNamespace(ns)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = resolveTranslationPath(lng, ns);

  try {
    const file = await fs.readFile(filePath, "utf8");
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": CACHE_CONTROL_HEADER,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Missing translation file: ${filePath}`, error);
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
