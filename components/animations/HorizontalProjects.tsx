"use client";

import React, { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { cn } from "@/lib/utils";

interface HorizontalProjectsProps {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
  onProgress?: (progress: number) => void;
}

export default function HorizontalProjects({
  children,
  className,
  trackClassName,
  onProgress,
}: HorizontalProjectsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;
    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const getScrollDistance = () => track.scrollWidth - window.innerWidth + 80;

      gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (onProgress) {
              onProgress(self.progress);
            }
          },
        },
      });
    });

    return () => mm.revert();
  }, [onProgress]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden will-change-transform", className)}
    >
      <div
        ref={trackRef}
        className={cn("flex will-change-transform", trackClassName)}
      >
        {children}
      </div>
    </div>
  );
}

