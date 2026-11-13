"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ScrollTrigger, refreshScrollTrigger, prefersReducedMotion } from "@/lib/animations/gsap";
import Lenis from "lenis";
import { gsap } from "@/lib/animations/gsap";
import { MOTION_CONFIG } from "@/lib/animations/motionConfig";

export type MotionState = {
  scrollY: number; velocity: number; direction: -1 | 0 | 1; progress: number;
  activeSection: string; intensity: number; particleMorph: number; cameraProgress: number;
  opacity: number;
};
const initialMotion: MotionState = { scrollY: 0, velocity: 0, direction: 0, progress: 0, activeSection: "hero", intensity: 0, particleMorph: 0, cameraProgress: 0, opacity: 0.92 };
interface AnimationContextType {
  isReducedMotion: boolean;
  refresh: () => void;
  motion: React.MutableRefObject<MotionState>;
}

const AnimationContext = createContext<AnimationContextType>({
  isReducedMotion: false,
  refresh: () => {},
  motion: { current: initialMotion },
});

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const motion = useRef<MotionState>({ ...initialMotion });

  useEffect(() => {
    setIsReducedMotion(prefersReducedMotion());

    // One Lenis instance, driven by the GSAP ticker so pins and smooth scroll share a clock.
    const reduced = prefersReducedMotion();
    const lenis = new Lenis({ autoRaf: false, lerp: reduced ? 1 : 0.09, smoothWheel: !reduced, anchors: true });
    const onTicker = (time: number) => lenis.raf(time * 1000);
    const onLenisScroll = (event: { scroll: number; velocity: number; direction: number }) => {
      const state = motion.current;
      state.scrollY = event.scroll;
      state.velocity = event.velocity;
      state.direction = event.direction as -1 | 0 | 1;
      state.intensity = Math.min(1, Math.abs(event.velocity) / MOTION_CONFIG.velocityIntensityScale);
      ScrollTrigger.update();
    };
    lenis.on("scroll", onLenisScroll);
    gsap.ticker.add(onTicker);
    gsap.ticker.lagSmoothing(0);
    const pageTrigger = ScrollTrigger.create({
      trigger: document.documentElement, start: "top top", end: "bottom bottom",
      onUpdate: (self) => {
        const state = motion.current;
        state.progress = self.progress;
        state.scrollY = self.scroll();
        const sections = MOTION_CONFIG.sectionIds;
        const marker = window.innerHeight * 0.45;
        const active = sections.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
          .find((el) => { const r = el.getBoundingClientRect(); return r.top <= marker && r.bottom > marker; });
        if (active) {
          state.activeSection = active.id;
          state.particleMorph = MOTION_CONFIG.particleStageBySection[active.id] ?? 0;
          state.cameraProgress = state.progress;
          const opacityStops = MOTION_CONFIG.particleOpacityStops;
          const index = Math.max(0, sections.indexOf(active.id as (typeof sections)[number]));
          const rect = active.getBoundingClientRect();
          const sectionProgress = Math.max(0, Math.min(1, (marker - rect.top) / Math.max(1, rect.height)));
          const from = opacityStops[index] ?? 0.2;
          const to = opacityStops[index + 1] ?? from;
          state.opacity = from + (to - from) * sectionProgress;
        }
        window.dispatchEvent(new Event("portfolio:motion-update"));
      },
    });

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    const onLoad = () => refreshScrollTrigger();
    window.addEventListener("load", onLoad, { once: true });
    document.addEventListener("load", onLoad, true);
    // Refresh ScrollTrigger when web fonts are ready to ensure layout accuracy
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        refreshScrollTrigger();
      });
    }

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("load", onLoad);
      document.removeEventListener("load", onLoad, true);
      pageTrigger.kill();
      lenis.off("scroll", onLenisScroll);
      gsap.ticker.remove(onTicker);
      lenis.destroy();
    };
  }, []);

  return (
    <AnimationContext.Provider
      value={{
        isReducedMotion,
        refresh: refreshScrollTrigger,
        motion,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  return useContext(AnimationContext);
}

export function useMotion() { return useContext(AnimationContext); }

