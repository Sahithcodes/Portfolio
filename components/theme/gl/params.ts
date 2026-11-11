export type Theme = "dark" | "light";

/** Live-tunable look of the ink. */
export interface InkParams {
  /** Seconds for the spread (before the 150ms fade). */
  duration: number;
  /** Tendril reach multiplier, 0 = clean blob. */
  tendril: number;
  /** Noise frequency multiplier: lower = bigger, lazier shapes. */
  noiseScale: number;
  /** Frontier half-width in CSS px. */
  softness: number;
  /** Speed at which the shape evolves during the spread. */
  drift: number;
  /** Global playback rate (0.25 for slow motion). */
  timeScale: number;
}

export const inkParams: InkParams = {
  duration: 1.8,
  tendril: 1.08,
  noiseScale: 1.0,
  softness: 2.4,
  drift: 0.82,
  timeScale: 1.0,
};

/** Electric-teal pigment pooled at the frontier, keyed to the revealed theme. */
export const RIM_COLOR: Record<Theme, [number, number, number]> = {
  dark: [0.133, 0.722, 0.667], // secondary teal against charcoal
  light: [0.024, 0.427, 0.404], // deep teal against ivory
};

/** Quiet, theme-matched pigment used to cover the old page before the swap. */
export const PIGMENT_COLOR: Record<Theme, [number, number, number]> = {
  dark: [0.043, 0.067, 0.063],
  light: [0.953, 0.969, 0.969],
};

