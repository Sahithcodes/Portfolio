"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { projects as PROJECTS_DATA } from "@/data/projects";

// ScrollTrigger pinning reparents its target into a spacer. Revert it during
// React's layout cleanup, before React removes this route's DOM tree.
const useGSAPLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinContainerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const ambientStageGlowRef = useRef<HTMLDivElement | null>(null);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);

  useGSAPLayoutEffect(() => {
    if (!sectionRef.current) return;

    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    // Keep the horizontal pin only when there is enough vertical room for the
    // heading and full-height project card. Short desktop windows use the
    // naturally scrolling stacked layout below.
    mm.add("(min-width: 1024px) and (min-height: 880px)", () => {
      const pinContainer = pinContainerRef.current;
      const track = trackRef.current;
      const progressBar = progressBarRef.current;
      const ambientGlow = ambientStageGlowRef.current;

      if (!pinContainer || !track) return;

      const getScrollAmount = () => {
        return track.scrollWidth - window.innerWidth + 140;
      };

      const tween = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: pinContainer,
          pin: true,
          scrub: 0.65,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Direct DOM update: Progress Bar (Zero React re-renders)
            if (progressBar) {
              progressBar.style.transform = `scaleX(${self.progress})`;
            }

            const count = PROJECTS_DATA.length;
            const current = Math.min(
              count - 1,
              Math.floor(self.progress * count)
            );
            setActiveProjectIndex(current);

            // Background glow drift
            if (ambientGlow) {
              const xPercent = (self.progress - 0.5) * 80;
              ambientGlow.style.transform = `translate3d(calc(-50% + ${xPercent}px), -50%, 0)`;
            }
          },
        },
      });

      // Cinematic expanding mask reveals on each project card
      const cards = track.querySelectorAll(".project-card");
      cards.forEach((card) => {
        const visualMask = card.querySelector(".project-visual-mask");
        const visualInner = card.querySelector(".project-visual-preview");
        const cardTitle = card.querySelector(".project-title-text");

        if (visualMask && visualInner) {
          // Expanding mask clip-path reveal
          gsap.fromTo(
            visualMask,
            {
              clipPath: "inset(14% 14% 14% 14% round 1.5rem)",
            },
            {
              clipPath: "inset(0% 0% 0% 0% round 1rem)",
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                containerAnimation: tween,
                start: "left 90%",
                end: "left 40%",
                scrub: true,
              },
            }
          );

          // Inner visual scale down for camera zoom-in effect
          gsap.fromTo(
            visualInner,
            { scale: 1.18, opacity: 0.8 },
            {
              scale: 1,
              opacity: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                containerAnimation: tween,
                start: "left 90%",
                end: "left 40%",
                scrub: true,
              },
            }
          );
        }

        // Animated title reveal as card enters focal center
        if (cardTitle) {
          gsap.fromTo(
            cardTitle,
            { y: "60%", opacity: 0.4 },
            {
              y: "0%",
              opacity: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                containerAnimation: tween,
                start: "left 80%",
                end: "left 45%",
                scrub: true,
              },
            }
          );
        }
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="projects"
      data-cursor="DRAG"
      className="relative scroll-mt-20 transition-colors duration-300"
    >
      {/* =========================================================================
          DESKTOP PINNED SHOWCASE (>= 1024px)
          ========================================================================= */}
      <div
        ref={pinContainerRef}
        className="projects-desktop-showcase hidden lg:flex flex-col justify-between h-screen w-full overflow-hidden bg-background/80 pt-20 pb-8 relative"
      >
        {/* Dynamic Scrubbed Ambient Light Stage */}
        <div
          ref={ambientStageGlowRef}
          className="pointer-events-none absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-35 -z-10"
          style={{
            background:
              "radial-gradient(circle at center, var(--ambient-teal), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <Container className="w-full flex-shrink-0 z-10">
          <div className="flex items-end justify-between border-b border-surface-border/60 pb-5 mb-3">
            <SectionHeading
              index="03"
              eyebrow="Signature Works"
              title="Engineered Systems &"
              highlight="Featured Projects."
              description="Curated collection of artificial intelligence implementations, computer vision solutions, and full-stack software architectures."
              className="mb-0"
            />

            {/* Direct DOM Scroll Telemetry */}
            <div className="flex flex-col items-end gap-2 pb-1">
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-xs text-content-secondary max-w-[280px] truncate hidden xl:inline-block"
                >
                  {PROJECTS_DATA[activeProjectIndex].title}
                </span>
                <span
                  className="font-mono text-xs uppercase tracking-wider text-accent font-semibold"
                >
                  {`[ 0${activeProjectIndex + 1} // 0${PROJECTS_DATA.length} ]`}
                </span>
              </div>
              <div className="w-40 h-1.5 bg-surface-elevated rounded-full overflow-hidden border border-surface-border">
                <div
                  ref={progressBarRef}
                  className="h-full bg-accent origin-left transition-transform duration-75 shadow-[0_0_8px_var(--accent-glow)]"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
              <span className="font-mono text-[11px] text-content-muted">
                SCROLL VERTICALLY TO EXPLORE →
              </span>
            </div>
          </div>
        </Container>

        {/* Dynamic Horizontal Track */}
        <div
          ref={trackRef}
          className="flex items-center gap-12 pl-[max(2.5rem,calc((100vw-1320px)/2+2.5rem))] pr-32 flex-1 my-auto z-10"
        >
          {PROJECTS_DATA.map((project) => {
            const Icon = project.icon;
            return (
              <div
                key={project.id}
                className="project-card flex-shrink-0 w-[720px] xl:w-[780px] h-[520px]"
              >
                <Link href={`/projects/${project.id}`} className="project-inner block w-full h-full p-8 rounded-3xl bg-surface border border-surface-border hover:border-accent/60 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_45px_-5px_var(--accent-glow)] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {/* Top Bar: Category & External Link */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-surface-elevated text-accent font-bold border border-surface-border">
                          {project.index}
                        </span>
                        <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
                          {project.category}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center text-content-muted group-hover:text-accent group-hover:border-accent group-hover:scale-110 transition-all duration-300">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="overflow-hidden py-1">
                      <h3 className="project-title-text font-heading font-bold text-2xl xl:text-3xl text-content-primary group-hover:text-accent transition-colors duration-200">
                        {project.title}
                      </h3>
                    </div>

                    <p className="mt-2.5 font-sans text-sm text-content-secondary leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Cinematic Expanding Mask Visual Viewport */}
                  <div className="project-visual-mask overflow-hidden my-3 rounded-2xl">
                    <div className="project-visual-preview p-5 rounded-2xl bg-surface-elevated/80 border border-surface-border/70 relative transition-transform duration-100">
                      <div className="flex items-center justify-between border-b border-surface-border/60 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-accent" />
                          <span className="font-mono text-xs text-content-primary font-semibold">
                            {project.accentBadge}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-content-muted">
                          {project.status}
                        </span>
                      </div>

                      {/* Architecture Specs Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {project.architectureDetails.map((detail, dIdx) => (
                          <div
                            key={dIdx}
                            className="p-3 rounded-xl bg-background/60 border border-surface-border/50 group-hover:border-accent/30 transition-colors"
                          >
                            <span className="block font-mono text-[10px] uppercase text-content-muted">
                              {detail.label}
                            </span>
                            <span className="block font-sans text-xs font-semibold text-content-primary truncate mt-0.5">
                              {detail.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Tags & Status */}
                  <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-surface-elevated text-content-secondary border border-surface-border/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-xs text-content-muted flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                      {project.status}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MOBILE & TABLET RESPONSIVE STACKED SHOWCASE (< 1024px)
          Native touch scrolling with zero horizontal overflow
          ========================================================================= */}
      <div className="projects-stacked-showcase lg:hidden py-24 sm:py-32">
        <Container>
          <SectionHeading
            index="03"
            eyebrow="Selected Works"
            title="Engineered Systems &"
            highlight="Featured Projects."
            description="Curated collection of artificial intelligence implementations, computer vision solutions, and full-stack software applications."
          />

          <div className="flex flex-col gap-6">
            {PROJECTS_DATA.map((project) => {
              const Icon = project.icon;
              return (
                <Link
                  href={`/projects/${project.id}`}
                  aria-label={`View details for ${project.title}`}
                  key={project.id}
                  className="block p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border hover:border-accent/50 hover:shadow-[0_0_30px_-5px_var(--accent-glow)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-accent font-bold border border-surface-border">
                        {project.index}
                      </span>
                      <span className="font-mono text-xs text-accent uppercase tracking-wider font-semibold">
                        {project.category}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center text-content-muted">
                      <ArrowUpRight className="w-4 h-4 text-accent" />
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-content-primary mb-2">
                    {project.title}
                  </h3>

                  <p className="font-sans text-sm text-content-secondary leading-relaxed mb-4">
                    {project.description}
                  </p>

                  <div className="p-3.5 rounded-xl bg-surface-elevated/70 border border-surface-border space-y-2.5 mb-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-accent" />
                        <span className="font-mono text-xs text-content-primary font-semibold">
                          {project.accentBadge}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-accent-amber font-medium">
                        {project.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-border/50">
                      {project.architectureDetails.map((detail, dIdx) => (
                        <div key={dIdx}>
                          <span className="block font-mono text-[9px] uppercase text-content-muted">
                            {detail.label}
                          </span>
                          <span className="block font-sans text-[11px] font-semibold text-content-primary truncate">
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-surface-border/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-elevated text-content-secondary border border-surface-border/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-xs text-content-muted">
                      {project.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </div>
    </section>
  );
}
