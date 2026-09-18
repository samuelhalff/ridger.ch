"use client";

import React from "react";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function CookieSettingsLink({ className, children }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        try {
          window.dispatchEvent(new CustomEvent("open-cookie-settings"));
        } catch {}
      }}
    >
      {children}
    </button>
  );
}
