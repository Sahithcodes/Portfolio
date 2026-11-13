"use client";

import SignalSculpture from "@/components/animations/SignalSculpture";
import { useMotion } from "@/components/animations/AnimationProvider";

/** The single persistent scene consumes the page's shared scroll telemetry. */
export default function CinematicScrollDirector() {
  const { motion, isReducedMotion } = useMotion();
  return <SignalSculpture state={motion.current} reducedMotion={isReducedMotion} />;
}
