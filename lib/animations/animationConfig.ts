/**
 * Centralized Responsive Animation Configuration
 * Provides distinct profiles for Desktop, Tablet, Mobile, and Reduced Motion.
 */

export const ANIMATION_CONFIG = {
  // Easing curves
  ease: {
    out: "power3.out",
    inOut: "power2.inOut",
    smooth: "power4.out",
    expo: "expo.out",
    cubic: "cubic-bezier(0.22, 1, 0.36, 1)",
  },

  // Desktop Profile (Full cinematic experience)
  desktop: {
    duration: {
      heroHeading: 0.8,
      heroSubtitle: 0.6,
      heroButtons: 0.5,
      section: 0.75,
      card: 0.6,
      fast: 0.35,
    },
    stagger: {
      heroLines: 0.12,
      cards: 0.1,
      fast: 0.08,
      timeline: 0.15,
    },
    offset: {
      heroLines: "115%",
      section: 32,
      card: 28,
      small: 16,
    },
    parallax: {
      slow: 0.1,
      normal: 0.2,
      fast: 0.35,
    },
  },

  // Tablet Profile (Slightly reduced offsets, no horizontal pins)
  tablet: {
    duration: {
      heroHeading: 0.7,
      heroSubtitle: 0.5,
      heroButtons: 0.45,
      section: 0.6,
      card: 0.5,
      fast: 0.3,
    },
    stagger: {
      heroLines: 0.1,
      cards: 0.08,
      fast: 0.06,
      timeline: 0.12,
    },
    offset: {
      heroLines: "110%",
      section: 24,
      card: 20,
      small: 12,
    },
    parallax: {
      slow: 0.05,
      normal: 0.1,
      fast: 0.15,
    },
  },

  // Mobile Profile (Lightweight, instant, touch-optimized, no fill-rate bottlenecks)
  mobile: {
    duration: {
      heroHeading: 0.6,
      heroSubtitle: 0.45,
      heroButtons: 0.4,
      section: 0.45,
      card: 0.4,
      fast: 0.25,
    },
    stagger: {
      heroLines: 0.08,
      cards: 0.06,
      fast: 0.04,
      timeline: 0.08,
    },
    offset: {
      heroLines: "105%",
      section: 16,
      card: 16,
      small: 8,
    },
    parallax: {
      slow: 0,
      normal: 0,
      fast: 0, // Disabled on mobile to preserve 60 FPS touch scroll
    },
  },

  // Shared defaults (mapped to desktop)
  duration: {
    heroHeading: 0.8,
    heroSubtitle: 0.6,
    heroButtons: 0.5,
    section: 0.75,
    card: 0.6,
    fast: 0.35,
    normal: 0.5,
  },
  stagger: {
    heroLines: 0.12,
    cards: 0.1,
    fast: 0.08,
    timeline: 0.15,
  },
  offset: {
    heroLines: "115%",
    section: 32,
    card: 28,
    small: 16,
  },
  scroll: {
    start: "top 85%",
    end: "bottom 15%",
    once: true,
  },
} as const;
