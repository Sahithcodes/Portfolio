"use client";

import React, { useRef } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Get origin coordinates from button
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      toggleTheme({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    } else {
      toggleTheme({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const isDark = theme === "dark";
  const labelText = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      ref={buttonRef}
      type="button"
      data-ink-live=""
      onClick={handleClick}
      aria-label={labelText}
      title={labelText}
      className={cn(
        "group relative inline-flex items-center justify-center p-2 rounded-full transition-all duration-300",
        "bg-surface border border-surface-border hover:border-accent/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "hover:shadow-[0_0_16px_var(--accent-glow)] cursor-pointer select-none",
        className
      )}
    >
      {/* Subtle organic pulse ring on hover */}
      <span
        className="absolute inset-0 rounded-full bg-accent-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        aria-hidden="true"
      />

      {/* Icon Container */}
      <div className="relative w-5 h-5 flex items-center justify-center text-content-primary transition-transform duration-300 group-hover:scale-110">
        {isDark ? (
          <Moon className="w-4 h-4 text-accent transition-transform duration-300 rotate-0 group-hover:-rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-accent transition-transform duration-300 rotate-0 group-hover:rotate-45" />
        )}
      </div>

      {showLabel && (
        <span className="ml-2 font-mono text-xs text-content-secondary group-hover:text-content-primary transition-colors">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
