export const MOTION_CONFIG = {
  sectionIds: ["hero", "about", "skills", "projects", "experience", "achievements", "statement", "contact"],
  particleStageBySection: {
    hero: 0,
    about: 1,
    skills: 2,
    projects: 3,
    experience: 3,
    achievements: 3,
    statement: 3,
    contact: 4,
  } as Record<string, number>,
  particleMorphDurationMs: 1200,
  velocityIntensityScale: 2.5,
  particleOpacityStops: [0.92, 0.62, 0.44, 0.34, 0.25, 0.20, 0.20, 0.20],
} as const;
