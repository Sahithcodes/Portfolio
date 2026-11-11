"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ScrollTrigger, refreshScrollTrigger, prefersReducedMotion } from "@/lib/animations/gsap";

interface AnimationContextType {
  isReducedMotion: boolean;
  refresh: () => void;
}

const AnimationContext = createContext<AnimationContextType>({
  isReducedMotion: false,
  refresh: () => {},
});

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    setIsReducedMotion(prefersReducedMotion());

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    // Refresh ScrollTrigger when web fonts are ready to ensure layout accuracy
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        refreshScrollTrigger();
      });
    }

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      // Clean up any remaining triggers on unmount
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <AnimationContext.Provider
      value={{
        isReducedMotion,
        refresh: refreshScrollTrigger,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  return useContext(AnimationContext);
}

