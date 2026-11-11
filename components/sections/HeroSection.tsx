"use client";

import React, { useEffect, useRef } from "react";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import { ArrowDown, ArrowUpRight, ArrowDownToLine } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";

export default function HeroSection() {
  const containerRef = useRef<HTMLElement | null>(null);
  const headingContainerRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const line1Ref = useRef<HTMLSpanElement | null>(null);
  const line2Ref = useRef<HTMLSpanElement | null>(null);
  const line3Ref = useRef<HTMLSpanElement | null>(null);
  const line4Ref = useRef<HTMLSpanElement | null>(null);
  const subtitleRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);
  const ambientGlowRef = useRef<HTMLDivElement | null>(null);
  const scrollLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (prefersReducedMotion()) {
      const elements = [
        badgeRef.current,
        line1Ref.current,
        line2Ref.current,
        line3Ref.current,
        line4Ref.current,
        subtitleRef.current,
        ctaRef.current,
        bottomBarRef.current,
      ];
      elements.forEach((el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      return;
    }

    const mm = gsap.matchMedia();

    // Responsive setup via matchMedia
    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isTablet: "(min-width: 768px) and (max-width: 1023px)",
        isMobile: "(max-width: 767px)",
      },
      (context) => {
        const { isDesktop, isMobile } = context.conditions as {
          isDesktop: boolean;
          isMobile: boolean;
        };

        const config = isMobile
          ? ANIMATION_CONFIG.mobile
          : ANIMATION_CONFIG.desktop;

        const headingLines = [
          line1Ref.current,
          line2Ref.current,
          line3Ref.current,
          line4Ref.current,
        ].filter(Boolean);

        // 1. Initial Page Entrance Timeline (coordinated sequence)
        const entranceTl = gsap.timeline({
          defaults: {
            ease: ANIMATION_CONFIG.ease.out,
          },
        });

        // Eyebrow availability badge
        if (badgeRef.current) {
          entranceTl.fromTo(
            badgeRef.current,
            { opacity: 0, y: config.offset.small, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.55 },
            0.1
          );
        }

        // Line-by-line typography reveal upward through overflow-hidden masks
        entranceTl.fromTo(
          headingLines,
          {
            y: config.offset.heroLines,
            opacity: 0,
          },
          {
            y: "0%",
            opacity: 1,
            duration: config.duration.heroHeading,
            stagger: config.stagger.heroLines,
          },
          0.2
        );

        // Subtitle & role details
        if (subtitleRef.current) {
          entranceTl.fromTo(
            subtitleRef.current,
            { opacity: 0, y: config.offset.section },
            {
              opacity: 1,
              y: 0,
              duration: config.duration.heroSubtitle,
            },
            0.6
          );
        }

        // Action CTA buttons
        if (ctaRef.current) {
          entranceTl.fromTo(
            ctaRef.current.children,
            { opacity: 0, y: 20, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: config.duration.heroButtons,
              stagger: 0.08,
            },
            0.75
          );
        }

        // Bottom explore bar
        if (bottomBarRef.current) {
          entranceTl.fromTo(
            bottomBarRef.current,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5 },
            0.9
          );
        }

        // 2. High-Impact Scroll-Controlled Typography Transformation
        if (containerRef.current) {
          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1.0,
              invalidateOnRefresh: true,
            },
          });

          if (isDesktop && headingContainerRef.current) {
            // A single restrained pull-back keeps the hero connected to the next scene.
            scrollTl.to(
              headingContainerRef.current,
              {
                scale: 0.9,
                y: 56,
                opacity: 0.3,
                ease: "none",
              },
              0
            );

            // Layered depth: Subtitle & CTAs drop faster away
            if (subtitleRef.current) {
              scrollTl.to(subtitleRef.current, { y: 48, opacity: 0, ease: "none" }, 0);
            }
            if (ctaRef.current) {
              scrollTl.to(ctaRef.current, { y: 56, opacity: 0, ease: "none" }, 0);
            }

            // Background ambient light scales and shifts
            if (ambientGlowRef.current) {
              scrollTl.to(
                ambientGlowRef.current,
                { scale: 1.18, y: 72, opacity: 0.16, ease: "none" },
                0
              );
            }

            // Visual Bridge: Progressive scroll connector line drawing down to About section
            if (scrollLineRef.current) {
              scrollTl.fromTo(
                scrollLineRef.current,
                { scaleY: 0 },
                { scaleY: 1, ease: "none" },
                0
              );
            }
          } else if (isMobile && headingContainerRef.current) {
            // Mobile: Restrained but distinct scale and fade to preserve 60fps touch
            scrollTl.to(
              headingContainerRef.current,
              {
                scale: 0.92,
                opacity: 0.25,
                y: 40,
                ease: "none",
              },
              0
            );
          }
        }
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between pt-28 sm:pt-36 pb-12 overflow-x-clip transition-colors duration-300"
    >
      {/* High-Performance Radial Ambient Light */}
      <div
        ref={ambientGlowRef}
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] opacity-35 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--ambient-teal),transparent_75%)] -z-10 origin-top"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 w-80 h-80 opacity-15 bg-[radial-gradient(circle_at_center,var(--ambient-warm),transparent_70%)] rounded-full -z-10"
        aria-hidden="true"
      />

      <Container className="relative z-10 my-auto">
        {/* Availability Pill & Name Eyebrow */}
        <div
          ref={badgeRef}
          className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-surface-border text-xs font-mono text-content-primary shadow-sm hover:border-accent/40 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sage opacity-55" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-sage shadow-[0_0_8px_var(--accent-glow)]" />
            </span>
            <span>Available for select opportunities</span>
          </div>

          <div className="hidden sm:inline-block h-3 w-px bg-surface-border" />

          <span className="font-mono text-xs sm:text-sm text-accent tracking-wider uppercase font-semibold">
            K. Venkata Sahith
          </span>
        </div>

        {/* Oversized Typography Hero with Scroll Perspective Transformation */}
        <div ref={headingContainerRef} className="w-full max-w-5xl origin-left">
          <h1 data-ink-headline className="w-full max-w-full font-heading font-extrabold tracking-tighter text-[clamp(2.25rem,8.2vw,6.5rem)] leading-[0.92] text-content-primary uppercase select-none">
            <span className="block py-1">
              <span ref={line1Ref} className="block inline-block">
                Building
              </span>
            </span>
            <span className="block py-1">
              <span
                ref={line2Ref}
                className="block text-gradient-teal inline-block"
              >
                Intelligence<span className="text-accent">.</span>
              </span>
            </span>
            <span className="block py-1">
              <span ref={line3Ref} className="block inline-block">
                Engineering
              </span>
            </span>
            <span className="block py-1">
              <span ref={line4Ref} className="block inline-block">
                Experiences<span className="text-accent">.</span>
              </span>
            </span>
          </h1>
        </div>

        {/* Subtitle & Role Details */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div ref={subtitleRef} data-ink-support className="md:col-span-7">
            <p className="font-mono text-xs sm:text-sm text-accent font-semibold tracking-wide uppercase mb-2">
              AI Engineer | Computer Vision | Full-Stack Developer
            </p>
            <p className="font-sans text-base sm:text-lg text-content-secondary leading-relaxed max-w-xl">
              B.Tech Artificial Intelligence student crafting neural systems,
              computer vision architectures, and modern web applications with
              rigorous engineering and meticulous aesthetics.
            </p>
          </div>

          {/* Action CTAs */}
          <div
            ref={ctaRef}
            className="md:col-span-5 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:justify-end"
          >
            <Button
              variant="primary"
              size="lg"
              href="#projects"
              rightIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              View Projects
            </Button>
            <Button
              variant="secondary"
              size="lg"
              href="/resume.pdf"
              download="K_Venkata_Sahith_Resume.pdf"
              rightIcon={<ArrowDownToLine className="w-4 h-4" />}
            >
              Resume
            </Button>
          </div>
        </div>
      </Container>

      {/* Hero Bottom Bar & Visual Bridge to Section 01 */}
      <Container className="relative z-10 pt-10">
        <div
          ref={bottomBarRef}
          className="flex items-center justify-between border-t border-surface-border/60 pt-6 relative"
        >
          <div className="font-mono text-xs text-content-muted tracking-wider uppercase">
            [ Phase 03 // Cinematic Scroll Transformation ]
          </div>

          {/* Visual Scroll Connector Line to Section 01 */}
          <div
            ref={scrollLineRef}
            className="hidden lg:block absolute left-1/2 -bottom-12 w-px h-12 bg-gradient-to-b from-accent to-transparent origin-top shadow-[0_0_8px_var(--accent-glow)]"
            aria-hidden="true"
            style={{ transform: "scaleY(0)" }}
          />

          <a
            href="#about"
            className="group inline-flex items-center gap-2 font-mono text-xs text-content-secondary hover:text-accent transition-colors"
            aria-label="Scroll to About section"
          >
            <span>EXPLORE</span>
            <span className="p-1 rounded-full border border-surface-border group-hover:border-accent text-content-muted group-hover:text-accent transition-colors">
              <ArrowDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
            </span>
          </a>
        </div>
      </Container>
    </section>
  );
}
