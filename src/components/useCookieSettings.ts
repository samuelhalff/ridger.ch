"use client";

import { useCallback } from "react";

export function useOpenCookieSettings() {
  return useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent("open-cookie-settings"));
    } catch {}
  }, []);
}
