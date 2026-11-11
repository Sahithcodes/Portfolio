"use client";

import React, { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
  triggerOnScroll?: boolean;
}

export default function TextReveal({
  lines,
  className,
  lineClassName,
  stagger = ANIMATION_CONFIG.stagger.heroLines,
  duration = ANIMATION_CONFIG.duration.heroHeading,
  delay = 0.1,
  triggerOnScroll = false,
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const linesRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (prefersReducedMotion()) {
      linesRef.current.forEach((el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      return;
    }

    const validLines = linesRef.current.filter(Boolean);

    const ctx = gsap.context(() => {
      const animProps: gsap.TweenVars = {
        y: "0%",
        opacity: 1,
        duration,
        stagger,
        delay,
        ease: ANIMATION_CONFIG.ease.out,
      };

      if (triggerOnScroll) {
        animProps.scrollTrigger = {
          trigger: containerRef.current,
          start: ANIMATION_CONFIG.scroll.start,
          once: true,
        };
      }

      gsap.fromTo(
        validLines,
        {
          y: ANIMATION_CONFIG.offset.heroLines,
          opacity: 0,
        },
        animProps
      );
    }, containerRef);

    return () => ctx.revert();
  }, [stagger, duration, delay, triggerOnScroll]);

  return (
    <div ref={containerRef} className={className}>
      {lines.map((line, idx) => (
        <span key={idx} className="block overflow-hidden py-0.5">
          <span
            ref={(el) => {
              linesRef.current[idx] = el;
            }}
            className={cn("block will-change-transform", lineClassName)}
          >
            {line}
          </span>
        </span>
      ))}
    </div>
  );
}

