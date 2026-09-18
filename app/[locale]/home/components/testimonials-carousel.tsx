"use client";

import * as React from "react";
import Image from "next/image";
import { testimonialAvatarMap } from "@/src/lib/testimonialImages";
import { Star } from "@phosphor-icons/react";

interface Testimonial {
  name?: string;
  company?: string;
  service?: string;
  testimonial: string;
  rating?: number;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  anonymousLabel: string;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <Star
    size={18}
    weight={filled ? "fill" : "regular"}
    aria-hidden="true"
    className={filled ? "text-amber-400" : "text-muted-foreground/20"}
  />
);

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5 shrink-0"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= rating} />
      ))}
    </div>
  );
}

function getEffectiveRating(testimonial: Testimonial): number {
  return testimonial.rating ?? 5;
}

// Interleave named and anonymous testimonials
function interleaveTestimonials(testimonials: Testimonial[]): Testimonial[] {
  const named = testimonials.filter((t) => !!t.name);
  const anonymous = testimonials.filter((t) => !t.name);

  const result: Testimonial[] = [];
  let namedIdx = 0;
  let anonIdx = 0;

  // Pattern: anonymous, named, anonymous, anonymous, named, etc.
  while (namedIdx < named.length || anonIdx < anonymous.length) {
    if (anonIdx < anonymous.length) {
      result.push(anonymous[anonIdx++]);
    }
    if (anonIdx < anonymous.length) {
      result.push(anonymous[anonIdx++]);
    }
    if (namedIdx < named.length) {
      result.push(named[namedIdx++]);
    }
  }

  return result;
}

function TestimonialCard({
  testimonial,
  anonymousLabel,
  index,
}: {
  testimonial: Testimonial;
  anonymousLabel: string;
  index: number;
}) {
  const isNamed = !!testimonial.name;
  const authorName = isNamed ? testimonial.name : anonymousLabel;
  const effectiveRating = getEffectiveRating(testimonial);

  // Named testimonials use male avatar, anonymous alternate between male/female based on index
  const avatarPath = isNamed
    ? "/assets/testimonials/avatar.avif"
    : index % 2 === 0
      ? "/assets/testimonials/avatar.avif"
      : "/assets/testimonials/avatar-female.avif";
  const avatarSrc = testimonialAvatarMap[avatarPath];

  return (
    <article
      aria-label={`Review by ${authorName}`}
      className="shrink-0 w-[320px] sm:w-[400px] lg:w-[460px]"
    >
      <figure className="m-0 h-full rounded-[24px] bg-surface-warm p-6 shadow-sm transition-colors duration-200 hover:bg-card dark:bg-card dark:hover:bg-surface-warm">
        {/* Header with avatar, name, company and rating */}
        <figcaption className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 shrink-0 rounded-full bg-white flex items-center justify-center">
              <Image
                src={avatarSrc}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                placeholder="blur"
                sizes="40px"
                quality={50}
              />
            </div>
            <div className="min-w-0 flex-1">
              <cite className="font-semibold text-base text-foreground not-italic block">
                {authorName}
              </cite>
              {isNamed && testimonial.company ? (
                <p className="text-sm text-muted-foreground">
                  {testimonial.company}
                </p>
              ) : testimonial.service ? (
                <p className="text-sm text-muted-foreground">
                  {testimonial.service}
                </p>
              ) : null}
            </div>
          </div>
          <StarRating rating={effectiveRating} />
        </figcaption>

        {/* Testimonial quote */}
        <blockquote className="text-[15px] leading-relaxed text-foreground/80">
          <p>&quot;{testimonial.testimonial}&quot;</p>
        </blockquote>
      </figure>
    </article>
  );
}

export default function TestimonialsCarousel({
  testimonials,
  anonymousLabel,
}: TestimonialsCarouselProps) {
  const interleavedTestimonials = React.useMemo(
    () => interleaveTestimonials(testimonials),
    [testimonials]
  );

  // Duplicate for seamless loop
  const duplicatedTestimonials = [
    ...interleavedTestimonials,
    ...interleavedTestimonials,
  ];

  return (
    <div className="testimonials-carousel relative mx-auto w-full max-w-[1240px] overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-background sm:w-12" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-background sm:w-12" aria-hidden="true" />
      <div
        className="flex animate-testimonials-scroll gap-5 px-10 sm:gap-6 sm:px-14"
        style={{ width: "max-content" }}
      >
        {duplicatedTestimonials.map((testimonial, index) => (
          <TestimonialCard
            key={index}
            testimonial={testimonial}
            anonymousLabel={anonymousLabel}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
