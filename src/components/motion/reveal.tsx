"use client";

import * as React from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

import { cn } from "@/src/lib/utils";

type RevealOrigin = "bottom" | "top" | "left" | "right";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  amount?: number;
  from?: RevealOrigin;
};

function getInitialOffset(from: RevealOrigin, distance: number) {
  switch (from) {
    case "top":
      return { x: 0, y: -distance };
    case "left":
      return { x: -distance, y: 0 };
    case "right":
      return { x: distance, y: 0 };
    case "bottom":
    default:
      return { x: 0, y: distance };
  }
}

export default function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  distance = 26,
  once = true,
  amount = 0.22,
  from = "bottom",
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (shouldReduceMotion || !mounted) {
    return <div className={className}>{children}</div>;
  }

  const { x, y } = getInitialOffset(from, distance);

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(className)}
        initial={{ opacity: 0, x, y, filter: "blur(10px)" }}
        whileInView={{
          opacity: 1,
          x: 0,
          y: 0,
          filter: "blur(0px)",
        }}
        viewport={{ once, amount }}
        transition={{
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
