"use client";

import React, { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  threshold?: string;
  fadeOnly?: boolean;
}

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  duration = ANIMATION_CONFIG.duration.section,
  yOffset = ANIMATION_CONFIG.offset.section,
  threshold = ANIMATION_CONFIG.scroll.start,
  fadeOnly = false,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: fadeOnly ? 0 : yOffset,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: ANIMATION_CONFIG.ease.out,
          scrollTrigger: {
            trigger: el,
            start: threshold,
            once: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [delay, duration, yOffset, threshold, fadeOnly]);

  return (
    <div ref={containerRef} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

