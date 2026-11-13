"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  index?: string;
  align?: "left" | "center";
  className?: string;
  animate?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  index,
  align = "left",
  className,
  animate = true,
}: SectionHeadingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLDivElement | null>(null);
  const headingMaskRef = useRef<HTMLSpanElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const decodeTimer = useRef<number | null>(null);

  const isCenter = align === "center";

  useEffect(() => {
    if (!animate || !containerRef.current) return;

    if (prefersReducedMotion()) {
      [eyebrowRef.current, headingMaskRef.current, descRef.current].forEach(
        (el) => {
          if (el) {
            el.style.opacity = "1";
            el.style.transform = "none";
          }
        }
      );
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          once: true,
        },
        defaults: {
          ease: ANIMATION_CONFIG.ease.out,
        },
      });

      // 1. Eyebrow badge reveals upward
      if (eyebrowRef.current) {
        tl.fromTo(
          eyebrowRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.45 }
        );
      }

      // 2. Heading reveals through clean overflow mask
      if (headingMaskRef.current) {
        tl.fromTo(
          headingMaskRef.current,
          { opacity: 0, y: "105%" },
          { opacity: 1, y: "0%", duration: 0.65 },
          "-=0.3"
        );
      }

      // 3. Supporting description follows
      if (descRef.current) {
        tl.fromTo(
          descRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        );
      }
    }, containerRef);

    const heading = headingMaskRef.current;
    const originalMarkup = heading?.innerHTML;
    const originalText = heading?.textContent || "";
    const decodeTrigger = heading ? ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (!heading || !originalMarkup) return;
        let frame = 0;
        const alphabet = "01/\\<>+=-";
        decodeTimer.current = window.setInterval(() => {
          frame += 1;
          const resolved = Math.floor((frame / 8) * originalText.length);
          heading.textContent = Array.from(originalText, (char, index) => {
            if (char === " ") return " ";
            if (index < resolved || frame >= 8) return char;
            return alphabet[(index * 7 + frame * 3) % alphabet.length];
          }).join("");
          if (frame >= 8) {
            if (decodeTimer.current) window.clearInterval(decodeTimer.current);
            decodeTimer.current = null;
            heading.innerHTML = originalMarkup;
          }
        }, 28);
      },
    }) : null;

    return () => {
      if (decodeTimer.current) {
        window.clearInterval(decodeTimer.current);
        if (heading && originalMarkup) heading.innerHTML = originalMarkup;
      }
      decodeTrigger?.kill();
      ctx.revert();
    };
  }, [animate]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col mb-12 sm:mb-16",
        isCenter ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {(eyebrow || index) && (
        <div ref={eyebrowRef} className="flex items-center gap-2 mb-3">
          {index && (
            <span className="font-mono text-xs sm:text-sm text-accent tracking-wider font-semibold">
              {index}
            </span>
          )}
          {eyebrow && (
            <span className="font-mono text-xs sm:text-sm uppercase tracking-widest text-content-muted">
              {eyebrow}
            </span>
          )}
        </div>
      )}

      {/* Masked Heading Wipe */}
      <h2 aria-label={`${title}${highlight ? ` ${highlight}` : ""}`} className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-content-primary leading-[1.1] overflow-hidden py-0.5">
        <span ref={headingMaskRef} className="block">
          {title}{" "}
          {highlight && <span className="text-content-primary">{highlight}</span>}
        </span>
      </h2>

      {description && (
        <p
          ref={descRef}
          className="mt-4 font-sans text-base sm:text-lg text-content-secondary max-w-2xl leading-relaxed"
        >
          {description}
        </p>
      )}
    </div>
  );
}
