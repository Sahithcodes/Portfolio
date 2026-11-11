"use client";

import React, { useEffect, useRef } from "react";
import Container from "@/components/layout/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { Brain, Code, Cpu } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const maskContainerRef = useRef<HTMLDivElement | null>(null);
  const narrativeRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const backgroundGlowRef = useRef<HTMLDivElement | null>(null);

  const highlights = [
    {
      icon: Brain,
      title: "Artificial Intelligence",
      description:
        "Specializing in deep learning paradigms, computer vision pipelines, and intelligent multimodal agents.",
      tag: "Core Focus",
      metric: "Neural Inference",
    },
    {
      icon: Code,
      title: "Full-Stack Engineering",
      description:
        "Building scalable web platforms, resilient REST/GraphQL APIs, and polished interactive frontends.",
      tag: "Application Layer",
      metric: "Distributed Web",
    },
    {
      icon: Cpu,
      title: "Systems & Optimization",
      description:
        "Tuning neural model inference, structuring clean architectures, and writing robust algorithmic solutions.",
      tag: "Optimization",
      metric: "Low-Latency Code",
    },
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    if (prefersReducedMotion()) {
      if (narrativeRef.current) narrativeRef.current.style.opacity = "1";
      if (cardsRef.current) {
        Array.from(cardsRef.current.children).forEach((c) => {
          (c as HTMLElement).style.opacity = "1";
        });
      }
      return;
    }

    const mm = gsap.matchMedia();

    // Desktop & Tablet: Cinematic Mask Reveal, Keyword Highlights & Noticeable Parallax
    mm.add("(min-width: 768px)", () => {
      const section = sectionRef.current;
      const maskContainer = maskContainerRef.current;
      const narrative = narrativeRef.current;
      const cards = cardsRef.current;
      const bgGlow = backgroundGlowRef.current;

      if (!section) return;

      // 1. Cinematic Container Clip-Path Expansion Reveal on Scroll
      if (maskContainer) {
        gsap.fromTo(
          maskContainer,
          {
            clipPath: "inset(24px 16px round 1.5rem)",
            opacity: 0.85,
          },
          {
            clipPath: "inset(0px 0px round 0rem)",
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
              end: "top 45%",
              scrub: 0.8,
            },
          }
        );
      }

      // 2. Background ambient light drift
      if (bgGlow) {
        gsap.to(bgGlow, {
          y: 80,
          scale: 1.2,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      // 3. Narrative Text entrance & Individual Keyword Illuminations
      if (narrative) {
        gsap.fromTo(
          narrative.children,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: ANIMATION_CONFIG.ease.out,
            scrollTrigger: {
              trigger: narrative,
              start: "top 80%",
              once: true,
            },
          }
        );

        // Keywords sweep and illuminate progressively with scroll
        const keywords = narrative.querySelectorAll(".keyword-illuminate");
        if (keywords.length) {
          gsap.fromTo(
            keywords,
            {
              color: "var(--foreground)",
              backgroundColor: "transparent",
            },
            {
              color: "var(--primary)",
              backgroundColor: "var(--accent-subtle)",
              stagger: 0.15,
              ease: "power1.inOut",
              scrollTrigger: {
                trigger: narrative,
                start: "top 70%",
                end: "bottom 60%",
                scrub: 0.6,
              },
            }
          );
        }
      }

      // 4. Foreground Focus Cards with notice-level parallax and scale depth
      if (cards) {
        gsap.fromTo(
          cards.children,
          { opacity: 0, y: 45, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.14,
            ease: ANIMATION_CONFIG.ease.out,
            scrollTrigger: {
              trigger: cards,
              start: "top 80%",
              once: true,
            },
          }
        );

        // Noticeable vertical differential parallax between left narrative and right cards
        gsap.to(cards, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.0,
          },
        });
      }
    });

    // Mobile: Lightweight native reveals without scroll scrub
    mm.add("(max-width: 767px)", () => {
      const narrative = narrativeRef.current;
      const cards = cardsRef.current;

      if (narrative) {
        gsap.fromTo(
          narrative.children,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: ANIMATION_CONFIG.ease.out,
            scrollTrigger: {
              trigger: narrative,
              start: "top 88%",
              once: true,
            },
          }
        );
      }

      if (cards) {
        gsap.fromTo(
          cards.children,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: ANIMATION_CONFIG.ease.out,
            scrollTrigger: {
              trigger: cards,
              start: "top 88%",
              once: true,
            },
          }
        );
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="py-24 sm:py-32 relative scroll-mt-20 transition-colors duration-300 overflow-hidden"
    >
      {/* Background ambient light */}
      <div
        ref={backgroundGlowRef}
        className="pointer-events-none absolute -left-28 top-1/2 -translate-y-1/2 w-96 h-96 opacity-20 bg-[radial-gradient(circle_at_center,var(--ambient-teal),transparent_70%)] -z-10"
        aria-hidden="true"
      />

      <div ref={maskContainerRef} className="relative z-10 w-full">
        <Container>
          <SectionHeading
            index="01"
            eyebrow="Background & Direction"
            title="Bridging Theoretical AI with"
            highlight="Scalable Systems."
            description="A B.Tech Artificial Intelligence student committed to turning machine learning research into robust, production-ready developer tools and user-centric products."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Narrative description with scroll-illuminated keywords */}
            <div
              ref={narrativeRef}
              className="about-narrative-panel lg:col-span-7 space-y-5 text-content-secondary leading-relaxed font-sans text-base sm:text-lg"
            >
              <p>
                I am <strong className="text-content-primary font-semibold">K. Venkata Sahith</strong>,
                an <span className="keyword-illuminate px-1.5 py-0.5 rounded transition-colors duration-200 font-medium">AI engineer and developer</span> focused
                on modern computational systems. My work centers at the intersection of{" "}
                <span className="keyword-illuminate px-1.5 py-0.5 rounded transition-colors duration-200 font-medium">deep learning algorithms</span> and
                end-to-end full-stack architectures.
              </p>
              <p>
                Whether analyzing complex visual datasets through{" "}
                <span className="keyword-illuminate px-1.5 py-0.5 rounded transition-colors duration-200 font-medium">computer vision pipelines</span> or
                architecting intuitive frontend experiences, I build software with an obsession for precision, performance, and clean code.
              </p>
              <p>
                Currently exploring{" "}
                <span className="keyword-illuminate px-1.5 py-0.5 rounded transition-colors duration-200 font-medium">multimodal neural architectures</span>,
                real-time edge inference, and software development that empowers users with intelligent autonomy.
              </p>
            </div>

            {/* Focus Cards with 3D Depth & Noticeable Parallax */}
            <div
              ref={cardsRef}
              className="lg:col-span-5 grid grid-cols-1 gap-4.5"
            >
              {highlights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="about-focus-card group p-6 rounded-2xl bg-surface border border-surface-border hover:border-accent/60 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--accent-glow)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-surface-elevated border border-surface-border text-accent group-hover:scale-110 group-hover:bg-accent-subtle/50 transition-all duration-300">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-heading font-semibold text-content-primary text-base sm:text-lg group-hover:text-accent transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <span className="font-mono text-[11px] text-accent uppercase tracking-wider font-semibold">
                        {item.tag}
                      </span>
                    </div>

                    <p className="font-sans text-sm text-content-secondary leading-relaxed pl-1 mb-3">
                      {item.description}
                    </p>

                    <div className="pt-2.5 border-t border-surface-border/50 flex items-center justify-between font-mono text-[11px] text-content-muted">
                      <span>Telemetry Spec</span>
                      <span className="text-content-primary font-medium">{item.metric}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
