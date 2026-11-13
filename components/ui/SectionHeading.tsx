"use client";

import React, { useEffect, useRef, useState } from "react";
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

const DECODE_ALPHABET = "01/\\<>+=-";
const DECODE_FRAMES = 8;

function getDecodedText(value: string, frame: number): string {
  if (frame >= DECODE_FRAMES) return value;
  const chars = Array.from(value);
  const resolved = Math.floor((frame / DECODE_FRAMES) * chars.length);
  return chars.map((char, index) => {
    if (char === " " || index < resolved) return char;
    return DECODE_ALPHABET[(index * 7 + frame * 3) % DECODE_ALPHABET.length];
  }).join("");
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
  const [decodeFrame, setDecodeFrame] = useState(DECODE_FRAMES);

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

    const decodeTrigger = headingMaskRef.current ? ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        let frame = 0;
        setDecodeFrame(0);
        decodeTimer.current = window.setInterval(() => {
          frame += 1;
          setDecodeFrame(frame);
          if (frame >= DECODE_FRAMES) {
            if (decodeTimer.current) window.clearInterval(decodeTimer.current);
            decodeTimer.current = null;
          }
        }, 28);
      },
    }) : null;

    return () => {
      if (decodeTimer.current) {
        window.clearInterval(decodeTimer.current);
        decodeTimer.current = null;
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
          {getDecodedText(title, decodeFrame)}{" "}
          {highlight && <span className="text-content-primary">{getDecodedText(highlight, decodeFrame)}</span>}
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
