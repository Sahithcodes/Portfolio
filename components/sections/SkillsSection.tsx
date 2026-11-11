"use client";

import React, { useEffect, useRef } from "react";
import Container from "@/components/layout/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { Layers, Terminal, Database, Code2, Sparkles } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/animations/gsap";
import { ANIMATION_CONFIG } from "@/lib/animations/animationConfig";

export default function SkillsSection() {
  const gridRef = useRef<HTMLDivElement | null>(null);

  const skillCategories = [
    {
      category: "AI & Machine Learning",
      level: "Core Specialization",
      icon: Layers,
      skills: [
        "Python",
        "PyTorch",
        "TensorFlow",
        "OpenCV",
        "Computer Vision",
        "Deep Neural Networks",
        "Scikit-Learn",
        "Model Optimization",
      ],
    },
    {
      category: "Full-Stack Development",
      level: "Production Architecture",
      icon: Code2,
      skills: [
        "TypeScript",
        "JavaScript",
        "Next.js 14",
        "React 18",
        "Node.js",
        "Tailwind CSS",
        "REST APIs",
        "Modern Web Standards",
      ],
    },
    {
      category: "Data & Infrastructure",
      level: "Data Engineering",
      icon: Database,
      skills: [
        "PostgreSQL",
        "MongoDB",
        "Git & GitHub",
        "Docker (Basics)",
        "Linux CLI",
        "Data Pipelines",
        "Numpy & Pandas",
      ],
    },
    {
      category: "Core Computer Science",
      level: "Algorithmic Foundations",
      icon: Terminal,
      skills: [
        "Data Structures & Algorithms",
        "Object-Oriented Design",
        "Problem Solving",
        "Linear Algebra & Calculus",
        "System Architecture",
        "Clean Code Practices",
      ],
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

    // Desktop & Tablet: 3D perspective entrance and cascading tag reveals
    mm.add("(min-width: 768px)", () => {
      const cards = Array.from(grid.children) as HTMLElement[];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: grid,
          start: "top 80%",
          once: true,
        },
      });

      // 1. Cards enter with 3D perspective and depth
      cards.forEach((card, cIdx) => {
        const iconBox = card.querySelector(".skill-icon-box");
        const tags = card.querySelectorAll(".skill-tag");

        tl.fromTo(
          card,
          {
            opacity: 0,
            y: 50,
            scale: 0.92,
            rotateX: 6,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            duration: 0.65,
            ease: ANIMATION_CONFIG.ease.out,
          },
          cIdx * 0.14
        );

        if (iconBox) {
          tl.fromTo(
            iconBox,
            { scale: 0.6, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" },
            cIdx * 0.14 + 0.1
          );
        }

        if (tags.length) {
          tl.fromTo(
            tags,
            { opacity: 0, scale: 0.85, y: 8 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.35,
              stagger: 0.025,
              ease: "power2.out",
            },
            cIdx * 0.14 + 0.2
          );
        }
      });
    });

    // Mobile: Lightweight staggered reveal
    mm.add("(max-width: 767px)", () => {
      gsap.fromTo(
        grid.children,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: ANIMATION_CONFIG.ease.out,
          scrollTrigger: {
            trigger: grid,
            start: "top 88%",
            once: true,
          },
        }
      );
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      id="skills"
      className="py-24 sm:py-32 relative scroll-mt-20 transition-colors duration-300"
    >
      <Container>
        <SectionHeading
          index="02"
          eyebrow="Technical Stack"
          title="Skills, Frameworks &"
          highlight="Core Disciplines."
          description="A structured overview of technical proficiencies across intelligence systems, application engineering, and computing foundations."
        />

        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 perspective-[1000px]"
        >
          {skillCategories.map((group, idx) => {
            const Icon = group.icon;
            return (
              <div
                key={idx}
                className={`group p-6 sm:p-8 rounded-2xl border hover:border-accent/60 hover:-translate-y-1 hover:shadow-[0_0_35px_-5px_var(--accent-glow)] transition-all duration-300 relative overflow-hidden ${idx === 0 ? "bg-gradient-to-br from-surface via-surface to-accent-subtle/40 border-accent/35" : "bg-surface border-surface-border"}`}
              >
                {/* Subtle card top glow accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent transition-opacity duration-300 ${idx === 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  aria-hidden="true"
                />

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="skill-icon-box p-2.5 rounded-xl bg-surface-elevated border border-surface-border text-accent bg-accent-subtle/30 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-accent-subtle/50 transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg sm:text-xl text-content-primary group-hover:text-accent transition-colors duration-200">
                        {group.category}
                      </h3>
                      <span className="font-mono text-[11px] text-content-muted">
                        {group.level}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs text-accent px-2.5 py-1 rounded-full bg-surface-elevated border border-surface-border font-semibold">
                    0{idx + 1}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span
                      key={skill}
                      className="skill-tag px-3 py-1 rounded-full text-xs font-mono bg-surface-elevated text-content-secondary border border-surface-border group-hover:border-surface-border/80 hover:!border-accent/60 hover:!text-content-primary hover:!bg-accent-subtle/30 hover:scale-105 transition-all duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
