"use client";

import * as React from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

import { cn } from "@/src/lib/utils";

type ParallaxRevealProps = {
  children: React.ReactNode;
  className?: string;
  offset?: number;
  delay?: number;
};

export default function ParallaxReveal({
  children,
  className,
  offset = 26,
  delay = 0.08,
}: ParallaxRevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.985, 1.01, 0.995]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (shouldReduceMotion || !mounted) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        ref={ref}
        className={cn(className)}
        initial={{ opacity: 0, y: 28, scale: 0.975, filter: "blur(10px)" }}
        whileInView={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
        }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          duration: 0.7,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ y, scale, willChange: "transform" }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
