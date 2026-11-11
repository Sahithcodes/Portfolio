"use client";

import { useEffect, useRef } from "react";
import SignalSculpture from "@/components/animations/SignalSculpture";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/animations/gsap";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * clamp01(progress);

/** Owns the single persistent signal sculpture and its page-wide scroll state. */
export default function CinematicScrollDirector() {
  const state = useRef({ dissolve: 0, opacity: 0.92 });
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      state.current.dissolve = 0;
      state.current.opacity = 0.76;
      return;
    }

    let anchors = { heroTop: 0, heroBottom: 1, aboutTop: 1, aboutBottom: 2, skillsBottom: 3, projectsBottom: 4 };
    const measure = () => {
      const top = (id: string) => {
        const element = document.getElementById(id);
        return element ? element.getBoundingClientRect().top + window.scrollY : 0;
      };
      const hero = document.getElementById("hero");
      const about = document.getElementById("about");
      const skills = document.getElementById("skills");
      const projects = document.getElementById("projects");
      const heroTop = top("hero");
      const aboutTop = top("about");
      anchors = {
        heroTop,
        heroBottom: heroTop + (hero?.offsetHeight || window.innerHeight),
        aboutTop,
        aboutBottom: aboutTop + (about?.offsetHeight || window.innerHeight),
        skillsBottom: top("skills") + (skills?.offsetHeight || window.innerHeight),
        projectsBottom: top("projects") + (projects?.offsetHeight || window.innerHeight),
      };
    };

    measure();
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onRefresh: measure,
      onUpdate: (self) => {
        const y = self.scroll();
        const heroSpan = Math.max(1, anchors.heroBottom - anchors.heroTop);
        const heroProgress = clamp01((y - anchors.heroTop) / heroSpan);
        state.current.dissolve = mix(0, 1, heroProgress);

        if (y <= anchors.heroBottom) {
          // The ribbons become the starfield here, so let their brightness
          // hold through the final part of the hero reveal.
          state.current.opacity = mix(0.92, 0.76, heroProgress);
        } else if (y <= anchors.aboutTop) {
          state.current.opacity = mix(0.76, 0.62, (y - anchors.heroBottom) / Math.max(1, anchors.aboutTop - anchors.heroBottom));
        } else if (y <= anchors.aboutBottom) {
          state.current.opacity = mix(0.62, 0.44, (y - anchors.aboutTop) / Math.max(1, anchors.aboutBottom - anchors.aboutTop));
        } else if (y <= anchors.skillsBottom) {
          state.current.opacity = mix(0.44, 0.34, (y - anchors.aboutBottom) / Math.max(1, anchors.skillsBottom - anchors.aboutBottom));
        } else if (y <= anchors.projectsBottom) {
          state.current.opacity = mix(0.34, 0.25, (y - anchors.skillsBottom) / Math.max(1, anchors.projectsBottom - anchors.skillsBottom));
        } else {
          // Leave a restrained constellation behind the rest of the portfolio.
          state.current.opacity = 0.20;
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, [reducedMotion]);

  return <SignalSculpture state={state.current} reducedMotion={reducedMotion} />;
}
