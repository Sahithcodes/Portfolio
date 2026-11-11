"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";

type Shape = "capsule" | "orb" | "particle" | "glow";
interface FieldItem {
  shape: Shape;
  className: string;
  speed: number;
  xSpeed?: number;
}

const palettes = {
  hero: [
    { shape: "capsule", className: "left-[12%] top-[22%] h-36 w-10 -rotate-[24deg] border border-accent-secondary/20 bg-gradient-to-b from-accent-secondary/15 to-accent/5", speed: -0.16, xSpeed: -0.035 },
    { shape: "orb", className: "right-[13%] top-[24%] h-24 w-24 bg-gradient-to-br from-accent-amber/14 to-accent/5", speed: 0.11, xSpeed: 0.04 },
    { shape: "particle", className: "left-[72%] top-[69%] h-2 w-2 bg-accent-amber/60", speed: -0.24, xSpeed: 0.05 },
    { shape: "particle", className: "left-[22%] top-[76%] h-1.5 w-1.5 bg-accent-sage/50", speed: 0.19, xSpeed: -0.04 },
    { shape: "glow", className: "right-[28%] top-[12%] h-52 w-52 bg-[radial-gradient(circle,rgba(var(--teal-secondary-rgb),0.10),transparent_70%)]", speed: -0.08 },
  ],
  cinematic: [
    { shape: "orb", className: "left-[9%] top-[22%] h-40 w-40 bg-gradient-to-br from-accent/15 to-accent-sage/5", speed: -0.11, xSpeed: -0.025 },
    { shape: "capsule", className: "right-[16%] top-[18%] h-48 w-12 rotate-[28deg] border border-accent-secondary/15 bg-gradient-to-b from-accent-secondary/10 to-accent/5", speed: 0.1, xSpeed: 0.03 },
    { shape: "glow", className: "right-[24%] bottom-[4%] h-56 w-56 bg-[radial-gradient(circle,rgba(var(--sage-rgb),0.09),transparent_70%)]", speed: 0.08 },
  ],
  subtle: [
    { shape: "orb", className: "right-[8%] top-[21%] h-28 w-28 bg-gradient-to-br from-accent/10 to-accent-sage/5", speed: -0.07, xSpeed: 0.025 },
    { shape: "particle", className: "left-[12%] top-[66%] h-1.5 w-1.5 bg-accent-sage/45", speed: 0.14, xSpeed: -0.03 },
  ],
  focus: [
    { shape: "orb", className: "right-[8%] top-[16%] h-24 w-24 bg-gradient-to-br from-accent/10 to-accent-sage/5", speed: -0.045, xSpeed: 0.02 },
    { shape: "particle", className: "left-[7%] bottom-[18%] h-1.5 w-1.5 bg-accent-terracotta/40", speed: 0.08, xSpeed: -0.02 },
  ],
  projects: [
    { shape: "capsule", className: "right-[9%] top-[22%] h-40 w-10 rotate-[25deg] border border-accent/15 bg-gradient-to-b from-accent/10 to-accent-sage/5", speed: -0.07, xSpeed: 0.025 },
    { shape: "orb", className: "left-[16%] bottom-[13%] h-24 w-24 bg-gradient-to-br from-accent-amber/10 to-accent/5", speed: 0.06, xSpeed: -0.02 },
  ],
} satisfies Record<string, FieldItem[]>;

export type ParallaxFieldVariant = keyof typeof palettes;

/** Decorative, scroll-bound depth layer. Scrub interpolation provides trailing without a separate RAF loop. */
export default function ParallaxField({ variant, className = "" }: { variant: ParallaxFieldVariant; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const items = palettes[variant];

  useEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const ctx = gsap.context(() => {
        const elements = gsap.utils.toArray<HTMLElement>("[data-parallax-item]", root.current);
        gsap.to(elements, {
          y: (_index, element) => window.innerHeight * Number(element.dataset.speed || 0),
          x: (_index, element) => window.innerWidth * Number(element.dataset.xSpeed || 0),
          ease: "none",
          scrollTrigger: { trigger: root.current?.parentElement, start: "top bottom", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
        });
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return <div ref={root} aria-hidden="true" className={`pointer-events-none absolute inset-0 z-0 overflow-hidden select-none ${className}`}>
    {items.map((item, index) => <span key={`${variant}-${index}`} data-parallax-item data-speed={item.speed} data-x-speed={item.xSpeed || 0} className={`absolute block ${index >= (variant === "hero" ? 2 : 1) ? "hidden md:block" : ""} ${item.className} ${item.shape === "capsule" || item.shape === "orb" || item.shape === "glow" ? "rounded-full" : "rounded-full shadow-[0_0_12px_var(--accent-glow)]"}`} />)}
  </div>;
}
