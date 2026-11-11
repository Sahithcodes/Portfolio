"use client";

import React, { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";
import { cn } from "@/lib/utils";

interface StaggerRevealProps {
  children: React.ReactNode;
  className?: string;
  itemSelector?: string;
  stagger?: number;
  duration?: number;
  yOffset?: number;
  delay?: number;
  threshold?: string;
}

export default function StaggerReveal({
  children,
  className,
  itemSelector = "> *",
  stagger = ANIMATION_CONFIG.stagger.cards,
  duration = ANIMATION_CONFIG.duration.card,
  yOffset = ANIMATION_CONFIG.offset.card,
  delay = 0,
  threshold = ANIMATION_CONFIG.scroll.start,
}: StaggerRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const items = el.querySelectorAll(itemSelector);
    if (!items.length) return;

    if (prefersReducedMotion()) {
      items.forEach((item) => {
        (item as HTMLElement).style.opacity = "1";
        (item as HTMLElement).style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: yOffset,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
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
  }, [itemSelector, stagger, duration, yOffset, delay, threshold]);

  return (
    <div ref={containerRef} className={cn(className)}>
      {children}
    </div>
  );
}

