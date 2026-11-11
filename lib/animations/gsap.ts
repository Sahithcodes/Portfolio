import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Ensure GSAP plugins are registered once on the client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  // Set global defaults
  ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
  });
}

export { gsap, ScrollTrigger };

/**
 * Checks if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Safe utility to refresh ScrollTrigger calculations (e.g. after layout changes or font loads)
 */
export function refreshScrollTrigger(): void {
  if (typeof window !== "undefined" && ScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

