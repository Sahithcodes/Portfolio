"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Container from "@/components/layout/Container";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/animations/gsap";
import { useMotion } from "@/components/animations/AnimationProvider";

// The desktop focus-story ScrollTrigger pins (and reparents) its React section.
const useGSAPLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const statements = [
  "Intelligent AI Systems",
  "Computer Vision Applications",
  "Full Stack Experiences",
  "Geospatial Intelligence",
  "Machine Learning Solutions",
];

export function CinematicStatementSection() {
  const section = useRef<HTMLElement>(null);
  const lines = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    if (!section.current || prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add("all", () => {
      gsap.fromTo(lines.current.filter(Boolean), { autoAlpha: 0, y: 30, scale: 0.96 }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: section.current, start: "top 72%", end: "top 32%", scrub: 0.55, invalidateOnRefresh: true },
      });
    });
    return () => mm.revert();
  }, []);

  return <section ref={section} id="statement" data-cursor="FOCUS" aria-label="A statement about my work" className="cinematic-statement relative min-h-[92vh] md:min-h-screen flex items-center justify-center overflow-hidden">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--background-rgb),0.08)_10%,rgba(var(--background-rgb),0.25)_100%)]" />
    <Container className="relative z-10 text-center">
      <div className="statement-copy w-full max-w-5xl space-y-3 sm:space-y-5">
        {["Curiosity drives me.", "Intelligence inspires me.", "Building is what I do."].map((line, index) => <p key={line} ref={(el) => { lines.current[index] = el; }} className={`font-heading font-bold tracking-tight text-4xl sm:text-6xl lg:text-8xl leading-[1.05] ${index === 2 ? "text-accent" : "text-content-primary"}`}>{line}</p>)}
      </div>
    </Container>
  </section>;
}

export function ActiveTypographySection() {
  const section = useRef<HTMLElement>(null);
  const rows = useRef<(HTMLParagraphElement | null)[]>([]);
  const progress = useRef<HTMLDivElement>(null);
  const skillMorphTween = useRef<gsap.core.Tween | null>(null);
  const { motion } = useMotion();

  useGSAPLayoutEffect(() => {
    if (!section.current || prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const items = rows.current.filter((item): item is HTMLParagraphElement => Boolean(item));
      ScrollTriggerCreate(items, section.current!, progress.current!, (position) => {
        motion.current.particleMorph = 1 + position;
      });
    });
    mm.add("(max-width: 767px)", () => {
      gsap.fromTo(rows.current, { opacity: 0.35, y: 14 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: section.current, start: "top 80%", once: true } });
      rows.current.forEach((row, index) => {
        if (!row) return;
        ScrollTrigger.create({
          trigger: row,
          start: "center 70%",
          end: "center 35%",
          onEnter: () => animateSkillFormation(index),
          onEnterBack: () => animateSkillFormation(index),
        });
      });
    });
    return () => {
      skillMorphTween.current?.kill();
      skillMorphTween.current = null;
      mm.revert();
    };

    function animateSkillFormation(index: number) {
      skillMorphTween.current?.kill();
      skillMorphTween.current = gsap.to(motion.current, {
        particleMorph: 1 + index,
        duration: 0.72,
        ease: "power2.inOut",
        overwrite: true,
      });
    }
  }, []);

  return <section ref={section} className="focus-studio relative py-24 sm:py-32 md:py-0 md:min-h-screen md:flex md:items-center overflow-hidden" aria-label="Areas of focus">
    <Container className="relative z-10 w-full">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent mb-10 md:mb-14">What I build</p>
      <div className="space-y-3 sm:space-y-4 md:space-y-2">
        {statements.map((statement, index) => <p key={statement} ref={(el) => { rows.current[index] = el; }} className="font-heading font-bold tracking-tight leading-tight text-3xl sm:text-5xl lg:text-6xl text-content-primary">{statement}</p>)}
      </div>
      <div className="mt-10 h-px bg-surface-border md:max-w-xs"><div ref={progress} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} /></div>
    </Container>
  </section>;
}

function ScrollTriggerCreate(items: HTMLParagraphElement[], trigger: HTMLElement, bar: HTMLDivElement, onPosition: (position: number) => void) {
  gsap.set(items, { transformOrigin: "left center" });
  gsap.to({ position: 0 }, {
    position: items.length - 1,
    ease: "none",
    onUpdate() {
      const position = this.targets()[0].position as number;
      onPosition(position);
      items.forEach((item, index) => {
        const distance = Math.abs(index - position);
        gsap.set(item, { opacity: Math.max(0.22, 1 - distance * 0.29), scale: 1 - Math.min(distance, 2) * 0.035, color: distance < 0.48 ? "var(--primary)" : "var(--foreground)" });
      });
      gsap.set(bar, { scaleX: position / (items.length - 1) });
    },
    scrollTrigger: { trigger, start: "top top", end: "+=220%", pin: true, scrub: 0.45, invalidateOnRefresh: true },
  });
}
