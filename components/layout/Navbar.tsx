"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowDownToLine } from "lucide-react";
import Container from "./Container";
import Button from "../ui/Button";
import ThemeToggle from "../theme/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Home", href: "#hero", id: "hero" },
  { name: "About", href: "#about", id: "about" },
  { name: "Skills", href: "#skills", id: "skills" },
  { name: "Projects", href: "#projects", id: "projects" },
  { name: "Experience", href: "#experience", id: "experience" },
  { name: "Contact", href: "#contact", id: "contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Background appearance change on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track active section via IntersectionObserver for performant scroll-aware highlights
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((link) => link.id);
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: "-20% 0px -65% 0px",
      threshold: 0,
    });

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const offset = 80; // height of sticky navbar
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        setActiveSection(targetId);
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header
      id="navbar"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/85 backdrop-blur-md border-b border-surface-border py-3.5 shadow-[var(--shadow-soft)]"
          : "bg-transparent py-5 sm:py-6"
      )}
    >
      <Container>
        <nav
          className="flex items-center justify-between"
          aria-label="Main Navigation"
        >
          {/* Brand Wordmark */}
          <Link
            href="#hero"
            onClick={(e) => handleLinkClick(e, "#hero")}
            className="group flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-content-primary group-hover:text-accent transition-colors">
              SAHITH
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent group-hover:scale-125 transition-transform duration-200 shadow-[0_0_8px_var(--accent-glow)]" />
          </Link>

          {/* Desktop Navigation Links with Active Indicator */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5 p-1 rounded-full bg-surface/40 border border-surface-border/40 backdrop-blur-sm">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={cn(
                    "relative px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-200",
                    isActive
                      ? "text-content-primary bg-surface-elevated border border-surface-border shadow-sm text-accent font-semibold"
                      : "text-content-secondary hover:text-content-primary hover:bg-surface/60"
                  )}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-accent rounded-full shadow-[0_0_6px_var(--accent-glow)]" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Right Actions: Theme Toggle, Resume Button & Mobile Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              href="/resume.pdf"
              download="K_Venkata_Sahith_Resume.pdf"
              rightIcon={<ArrowDownToLine className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              Resume
            </Button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-accent" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>
      </Container>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[65px] bg-background/95 backdrop-blur-xl md:hidden z-40 border-b border-surface-border px-6 py-8 flex flex-col justify-between"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={cn(
                    "flex items-center justify-between font-heading text-lg font-semibold transition-colors py-2.5 border-b border-surface-border/40",
                    isActive ? "text-accent" : "text-content-primary hover:text-accent"
                  )}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent-glow)]" />
                  )}
                </a>
              );
            })}
          </div>

          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surface-border">
              <span className="font-mono text-xs uppercase tracking-wider text-content-secondary">
                Theme
              </span>
              <ThemeToggle showLabel />
            </div>

            <Button
              variant="primary"
              size="lg"
              href="/resume.pdf"
              download="K_Venkata_Sahith_Resume.pdf"
              rightIcon={<ArrowDownToLine className="w-4 h-4" />}
              className="w-full justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Download Resume
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-content-secondary">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent-glow)]" />
              Available for AI/ML & Full-Stack roles
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
