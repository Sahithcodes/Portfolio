"use client";

import React, { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { cn } from "@/lib/utils";

interface ParallaxElementProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // e.g. -0.2 for slower, 0.2 for faster
  direction?: "vertical" | "horizontal";
}

export default function ParallaxElement({
  children,
  className,
  speed = 0.2,
  direction = "vertical",
}: ParallaxElementProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const distance = speed * 120;

      gsap.to(el, {
        [direction === "vertical" ? "y" : "x"]: distance,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }, elementRef);

    return () => ctx.revert();
  }, [speed, direction]);

  return (
    <div ref={elementRef} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

