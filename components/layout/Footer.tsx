import React from "react";
import Link from "next/link";
import Container from "./Container";
import { Mail, ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";

// Crisp inline SVGs for standard developer brands
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const NAV_LINKS = [
  { name: "Home", href: "#hero" },
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Experience", href: "#experience" },
  { name: "Certifications", href: "#certifications" },
  { name: "Contact", href: "#contact" },
];

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    href: profile.github,
    icon: GithubIcon,
  },
  {
    name: "Email",
    href: `mailto:${profile.email}`,
    icon: Mail,
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="border-t border-surface-border/50 bg-surface/30 mt-0 transition-colors duration-300">
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-surface-border/60">
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col items-start">
            <Link
              href="#hero"
              className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              <span className="font-heading text-2xl font-bold tracking-tight text-content-primary">
                SAHITH
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            </Link>
            <p className="mt-3 font-sans text-sm text-content-secondary max-w-sm leading-relaxed">
              {profile.headline}. {profile.institution}, {profile.campus}.
            </p>
            <div className="mt-4 flex items-center gap-2 font-mono text-xs text-content-secondary">
              <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_var(--accent-glow)]" />
              Available for select opportunities
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 flex flex-col">
            <span className="font-mono text-xs uppercase tracking-widest text-content-muted mb-4 font-semibold">
              Navigation
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="font-sans text-sm text-content-secondary hover:text-accent transition-colors py-1"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Connect / Socials */}
          <div className="md:col-span-3 flex flex-col">
            <span className="font-mono text-xs uppercase tracking-widest text-content-muted mb-4 font-semibold">
              Connect
            </span>
            <div className="flex flex-col gap-2.5">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-sm text-content-secondary hover:text-accent transition-colors"
                  >
                    <Icon className="w-4 h-4 text-accent transition-transform group-hover:scale-110" />
                    <span>{social.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-content-muted">
          <p>© {currentYear} K. Venkata Sahith. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed with <span className="text-accent font-mono font-medium">Electric Teal</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
