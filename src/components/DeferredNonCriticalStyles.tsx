"use client";

import { useEffect } from "react";

type DeferredNonCriticalStylesProps = {
  href: string;
};

export default function DeferredNonCriticalStyles({
  href,
}: DeferredNonCriticalStylesProps) {
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (isDev) {
      const markDev = "non-critical-dev";
      const existing = document.querySelectorAll(
        `link[data-arkfid-style="${markDev}"]`
      );
      let found = false;
      existing.forEach((node) => {
        if (!(node instanceof HTMLLinkElement)) {
          return;
        }
        if (node.href.includes(href)) {
          found = true;
        } else {
          node.remove();
        }
      });
      if (found) {
        return;
      }
      const sheet = document.createElement("link");
      sheet.rel = "stylesheet";
      sheet.href = `${href}?dev=${Date.now()}`;
      sheet.setAttribute("data-arkfid-style", markDev);
      document.head.appendChild(sheet);
      return () => {
        sheet.remove();
      };
    }
    const mark = "non-critical";
    const selector = `link[data-arkfid-style="${mark}"]`;
    const existingLinks = document.querySelectorAll(selector);
    let alreadyLoaded = false;

    existingLinks.forEach((node) => {
      if (!(node instanceof HTMLLinkElement)) {
        return;
      }
      const link = node;
      if (link.href.includes(href)) {
        alreadyLoaded = true;
        return;
      }
      link.remove();
    });

    if (alreadyLoaded) {
      return;
    }

    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "style";
    preload.href = href;
    preload.crossOrigin = "anonymous";
    preload.setAttribute("data-arkfid-style", mark);

    preload.onload = () => {
      const sheet = document.createElement("link");
      sheet.rel = "stylesheet";
      sheet.href = href;
      sheet.media = "print";
      sheet.crossOrigin = preload.crossOrigin;
      sheet.setAttribute("data-arkfid-style", mark);
      sheet.onload = () => {
        sheet.media = "all";
      };
      document.head.appendChild(sheet);
    };

    preload.onerror = () => {
      const fallback = document.createElement("link");
      fallback.rel = "stylesheet";
      fallback.href = href;
      fallback.crossOrigin = preload.crossOrigin;
      fallback.setAttribute("data-arkfid-style", mark);
      document.head.appendChild(fallback);
    };

    document.head.appendChild(preload);

    return () => {
      preload.onload = null;
      preload.onerror = null;
    };
  }, [href, isDev]);

  return (
    <noscript>
      <link rel="stylesheet" href={href} />
    </noscript>
  );
}
