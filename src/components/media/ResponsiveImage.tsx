import Image, { ImageProps } from "next/image";
import React from "react";

export type ResponsiveImageProps = Omit<ImageProps, "src"> & {
  /** Image to use below the Tailwind `sm` breakpoint (< 640px) */
  mobileSrc: string;
  /** Image to use at and above the Tailwind `sm` breakpoint (>= 640px) */
  desktopSrc: string;
  /** Optional className applied on the wrapping <picture> element */
  pictureClassName?: string;
};

/**
 * Server-friendly responsive image that swaps source at Tailwind's `sm` breakpoint.
 *
 * - Uses a <picture> element with media queries so only the matching source loads.
 * - Falls back to Next.js <Image> for optimization and placeholders.
 * - Pass usual <Image> props (fill/width/height/priority/placeholder/sizes/...).
 */
export default function ResponsiveImage({
  mobileSrc,
  desktopSrc,
  alt,
  pictureClassName,
  className,
  ...imageProps
}: ResponsiveImageProps) {
  // If both sources are the same, render a single Next.js Image so optimization
  // (responsive sizing, format, quality) is applied. Using <picture> with <source>
  // bypasses Next.js optimization for those <source> URLs.
  if (!mobileSrc || mobileSrc === desktopSrc) {
    return (
      <Image alt={alt} src={desktopSrc} className={className} {...imageProps} />
    );
  }

  // Art-directed variant: keep <picture> for different sources per breakpoint.
  // Note: <source> elements are not optimized by Next.js. Prefer identical
  // sources with a single <Image> whenever possible.
  return (
    <picture className={pictureClassName}>
      <source media="(max-width: 639px)" srcSet={mobileSrc} />
      <source media="(min-width: 640px)" srcSet={desktopSrc} />
      <Image alt={alt} src={desktopSrc} className={className} {...imageProps} />
    </picture>
  );
}
