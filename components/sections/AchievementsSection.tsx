"use client";

import React, { useEffect, useRef } from "react";
import Container from "@/components/layout/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { Award, Code, Trophy, BookOpen } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";

export default function AchievementsSection() {
  const gridRef = useRef<HTMLDivElement | null>(null);

  const achievements = [
    {
      icon: Trophy,
      title: "Algorithmic Problem Solving",
      category: "Competitive Programming",
      detail:
        "Active practice across algorithmic platforms (Codeforces, LeetCode) focusing on graph algorithms, dynamic programming, and computational complexity.",
      tag: "Top Percentile",
    },
    {
      icon: Award,
      title: "AI & ML Specialization Milestones",
      category: "Academic & Professional",
      detail:
        "Deep technical mastery in deep learning, computer vision models, and applied data science as part of the core B.Tech Artificial Intelligence curriculum.",
      tag: "Academic Excellence",
    },
    {
      icon: Code,
      title: "Full-Stack Project Deployments",
      category: "Engineering Craft",
      detail:
        "Architected and deployed responsive applications with clean component design, type safety, and modern performance metrics.",
      tag: "Production Quality",
    },
    {
      icon: BookOpen,
      title: "Continuous Research & Technical Exploration",
      category: "Knowledge & Innovation",
      detail:
        "Reading and reproducing foundational AI papers across computer vision, neural representation, and modern transformer architectures.",
      tag: "Ongoing R&D",
    },
  ];

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    if (prefersReducedMotion()) {
      Array.from(grid.children).forEach((child) => {
        (child as HTMLElement).style.opacity = "1";
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

        const cards = Array.from(grid.children) as HTMLElement[];

        cards.forEach((card, idx) => {
          const iconBox = card.querySelector(".achieve-icon-box");

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              start: isDesktop ? "top 82%" : "top 88%",
              once: true,
            },
            defaults: {
              ease: ANIMATION_CONFIG.ease.out,
            },
          });

          tl.fromTo(
            card,
            {
              opacity: 0,
              y: isDesktop ? 45 : 24,
              scale: isDesktop ? 0.93 : 1,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
            },
            idx * 0.1
          );

          if (iconBox) {
            tl.fromTo(
              iconBox,
              { scale: 0.5, rotate: -15, opacity: 0 },
              { scale: 1, rotate: 0, opacity: 1, duration: 0.45, ease: "back.out(1.8)" },
              idx * 0.1 + 0.1
            );
          }
        });
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      id="achievements"
      className="py-24 sm:py-32 relative scroll-mt-20 transition-colors duration-300"
    >
      <Container>
        <SectionHeading
          index="05"
          eyebrow="Recognition & Discipline"
          title="Milestones & Core"
          highlight="Achievements."
          description="A record of dedication to technical mastery, algorithmic discipline, and academic excellence in artificial intelligence."
        />

        <div
          ref={gridRef}
          className="divide-y divide-surface-border/80 border-y border-surface-border/80"
        >
          {achievements.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative grid grid-cols-[2.5rem_1fr] md:grid-cols-[3.5rem_minmax(0,1fr)_auto] gap-x-4 md:gap-x-6 gap-y-3 py-6 sm:py-8 transition-colors duration-300 hover:bg-accent-subtle/20"
              >
                <span className="pt-1 font-mono text-sm text-accent-amber group-hover:text-accent-terracotta transition-colors">0{idx + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-start gap-3.5">
                    <div className="achieve-icon-box shrink-0 p-2.5 rounded-xl bg-surface-elevated border border-surface-border text-accent group-hover:border-accent/40 transition-colors duration-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] text-accent tracking-wider uppercase block font-semibold">{item.category}</span>
                      <h3 className="font-heading font-semibold text-lg sm:text-xl text-content-primary group-hover:text-accent transition-colors duration-200">{item.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 md:ml-[3.25rem] font-sans text-sm text-content-secondary leading-relaxed max-w-3xl">{item.detail}</p>
                </div>
                <span className="col-start-2 md:col-start-3 md:row-start-1 md:self-center font-mono text-[11px] text-content-muted">{item.tag}</span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
