export const MOTION_CONFIG = {
  sectionIds: ["hero", "statement", "about", "skills", "projects", "experience", "certifications", "contact"],
  particleStageBySection: {
    hero: 0,
    about: 0,
    skills: 1,
    projects: 6,
    experience: 6,
    certifications: 6,
    statement: 0,
    contact: 7,
  } as Record<string, number>,
  velocityIntensityScale: 2.5,
  particleOpacityStops: [1.0, 1.0, 0.94, 0.82, 0.68, 0.56, 0.44, 0.34],
} as const;
