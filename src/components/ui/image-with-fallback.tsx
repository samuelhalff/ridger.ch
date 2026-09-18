"use client";

import Image, { ImageProps } from "next/image";
import React from "react";
import InitialsTile from "@/src/components/ui/initials-tile";

type Props = Omit<ImageProps, "onError"> & {
  /** Optional image URL used when the primary src fails (kept for backward compatibility). */
  fallbackSrc?: string;
  /** Render an initials tile fallback when the image fails */
  fallbackVariant?: "initials" | "image" | "none";
  /** The display name used to compute initials */
  fallbackInitialsName?: string;
  /** Optional className applied to the fallback wrapper */
  fallbackClassName?: string;
};

export default function ImageWithFallback({
  // Default to a 1x1 transparent pixel to avoid hard dependency on a public asset
  fallbackSrc =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  fallbackVariant = "image",
  fallbackInitialsName,
  fallbackClassName,
  ...props
}: Props) {
  const [src, setSrc] = React.useState<ImageProps["src"]>(props.src);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setSrc(props.src);
    setError(false);
  }, [props.src]);

  const isBlank = !src || (typeof src === "string" && String(src).trim() === "");
  if ((error || isBlank) && fallbackVariant === "initials" && fallbackInitialsName) {
    return (
      <InitialsTile name={fallbackInitialsName} className={fallbackClassName} />
    );
  }

  return (
    <Image
      {...(props as ImageProps)}
      src={src}
      alt={props.alt || ""}
      onError={() => {
        if (fallbackVariant === "initials") setError(true);
        else if (fallbackVariant !== "none") setSrc(fallbackSrc);
      }}
    />
  );
}
