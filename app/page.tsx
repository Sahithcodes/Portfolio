import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import SkillsSection from "@/components/sections/SkillsSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import CertificationsSection from "@/components/sections/CertificationsSection";
import ContactSection from "@/components/sections/ContactSection";
import { ActiveTypographySection, CinematicStatementSection } from "@/components/sections/ScrollStorySections";

export default function Home() {
  return (
    <>
      <HeroSection />
      <CinematicStatementSection />
      <AboutSection />
      <SkillsSection />
      <ActiveTypographySection />
      <ProjectsSection />
      <ExperienceSection />
      <CertificationsSection />
      <ContactSection />
    </>
  );
}

