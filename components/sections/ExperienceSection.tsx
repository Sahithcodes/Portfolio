"use client";

import React, { useEffect, useRef } from "react";
import Container from "@/components/layout/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";
import { experiences } from "@/data/experience";
import { leadership } from "@/data/leadership";
import { education } from "@/data/education";

export default function ExperienceSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const timelineLineRef = useRef<HTMLDivElement | null>(null);
  const runnerDotRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  const timeline = [
    ...education.map((item) => ({
      period: item.status,
      role: `${item.degree} in ${item.specialization}`,
      organization: item.institution,
      location: item.campus,
      type: "Education",
      points: ["Current academic status: undergraduate student."],
    })),
    ...experiences,
    ...leadership,
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    if (prefersReducedMotion()) {
      if (timelineLineRef.current) {
        timelineLineRef.current.style.transform = "none";
      }
      itemsRef.current.forEach((item) => {
        if (item) {
          item.style.opacity = "1";
          item.style.transform = "none";
        }
      });
      return;
    }

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 768px)",
        isMobile: "(max-width: 767px)",
      },
      (context) => {
        const { isDesktop } = context.conditions as { isDesktop: boolean };

        // Progressive draw of the vertical connecting line with illuminated runner
        if (isDesktop && timelineLineRef.current) {
          gsap.fromTo(
            timelineLineRef.current,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
                end: "bottom 65%",
                scrub: 0.6,
                onUpdate: (self) => {
                  if (runnerDotRef.current && timelineLineRef.current) {
                    const percent = self.progress * 100;
                    runnerDotRef.current.style.top = `${percent}%`;
                  }
                },
              },
            }
          );
        } else if (timelineLineRef.current) {
          timelineLineRef.current.style.transform = "scaleY(1)";
        }

        // Timeline items activation on entry
        itemsRef.current.filter(Boolean).forEach((item, idx) => {
          if (!item) return;
          const node = item.querySelector(".timeline-node");
          const card = item.querySelector(".timeline-card");
          const points = item.querySelectorAll(".timeline-point");

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: item,
              start: isDesktop ? "top 78%" : "top 85%",
              once: true,
            },
            defaults: {
              ease: ANIMATION_CONFIG.ease.out,
            },
          });

          // Beacon Node Burst
          if (node) {
            tl.fromTo(
              node,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: "back.out(2.0)",
              },
              0
            );
          }

          // Card slides in with directional momentum & scale
          if (card) {
            tl.fromTo(
              card,
              {
                opacity: 0,
                x: isDesktop ? 45 : 20,
                scale: 0.94,
              },
              {
                opacity: 1,
                x: 0,
                scale: 1,
                duration: 0.65,
              },
              0.1
            );
          }

          // Bullet points reveal in sequence
          if (points.length) {
            tl.fromTo(
              points,
              { opacity: 0, x: -12 },
              {
                opacity: 1,
                x: 0,
                duration: 0.4,
                stagger: 0.08,
                ease: "power2.out",
              },
              0.25
            );
          }
        });
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="py-24 sm:py-32 relative scroll-mt-20 transition-colors duration-300"
    >
      <Container>
        <SectionHeading
          index="04"
          eyebrow="Chronology & Milestones"
          title="Education, experience &"
          highlight="leadership."
          description="My current Artificial Intelligence studies, AI/ML virtual internship work, and student leadership in the Robotics Club."
        />

        <div className="relative ml-4 sm:ml-8 pl-6 sm:pl-12 space-y-14">
          {/* Timeline background track line */}
          <div
            className="absolute left-0 top-3 bottom-3 w-0.5 bg-surface-border"
            aria-hidden="true"
          />

          {/* Animated progressive foreground line */}
          <div
            ref={timelineLineRef}
            className="absolute left-0 top-3 bottom-3 w-0.5 bg-gradient-to-b from-accent via-accent to-accent-soft origin-top shadow-[0_0_12px_var(--accent-glow)]"
            aria-hidden="true"
            style={{ transform: "scaleY(0)" }}
          >
            {/* Illuminated runner beacon at the tip of the line */}
            <div
              ref={runnerDotRef}
              className="absolute -left-[3px] top-0 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_var(--primary)] -translate-y-1/2"
              aria-hidden="true"
            />
          </div>

          {timeline.map((exp, idx) => (
            <div
              key={idx}
              ref={(el) => {
                itemsRef.current[idx] = el;
              }}
              className="relative group"
            >
              {/* Luminous Timeline Node */}
              <div className="timeline-node absolute -left-[33px] sm:-left-[57px] top-2 w-4 h-4 rounded-full bg-background border-2 border-accent group-hover:scale-135 transition-transform duration-300 shadow-[0_0_12px_var(--accent-glow)]">
                <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping opacity-75" />
              </div>

              <div className="timeline-card p-7 sm:p-9 rounded-2xl bg-surface border border-surface-border hover:border-accent/60 hover:shadow-[0_0_35px_-5px_var(--accent-glow)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                  <span className="font-mono text-xs px-3 py-1 rounded-full bg-surface-elevated text-accent font-bold border border-surface-border shadow-sm">
                    {exp.period}
                  </span>
                  <span className="font-mono text-xs text-content-muted uppercase tracking-wider font-semibold">
                    {exp.type}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-xl sm:text-2xl text-content-primary mb-1 group-hover:text-accent transition-colors duration-200">
                  {exp.role}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-content-muted mb-4">
                  <span className="text-content-primary">{exp.organization}</span>
                  <span>•</span>
                  <span>{exp.location}</span>
                </div>

                <ul className="space-y-2.5 font-sans text-sm text-content-secondary leading-relaxed">
                  {exp.points.map((pt, pIdx) => (
                    <li key={pIdx} className="timeline-point flex items-start gap-2.5">
                      <span className="text-accent mt-1 text-xs font-bold">▹</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
