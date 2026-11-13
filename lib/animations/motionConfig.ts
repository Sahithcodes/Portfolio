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
  velocityIntensityScale: 2.5,
  particleOpacityStops: [1.0, 0.88, 0.74, 0.62, 0.48, 0.40, 0.34, 0.30],
} as const;
