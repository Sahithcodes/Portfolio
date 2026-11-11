"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import InkBleedTransition, {
  type InkBleedTransitionRef,
} from "./InkBleedTransition";
import type { Theme } from "./gl/params";

export type { Theme };

interface ThemeContextType {
  theme: Theme;
  isTransitioning: boolean;
  toggleTheme: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "sahith_portfolio_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionRef = useRef<InkBleedTransitionRef>(null);

  const applyThemeToDOM = useCallback((targetTheme: Theme) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", targetTheme);
    if (targetTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        applyThemeToDOM(savedTheme);
      } else {
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        const initialTheme: Theme = prefersLight ? "light" : "dark";
        setTheme(initialTheme);
        applyThemeToDOM(initialTheme);
      }
    } catch {
      applyThemeToDOM("dark");
    }
    setMounted(true);
  }, [applyThemeToDOM]);

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const nextTheme: Theme = theme === "dark" ? "light" : "dark";

      // Check prefers-reduced-motion
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion || !transitionRef.current) {
        // Immediate switch for reduced motion
        setTheme(nextTheme);
        applyThemeToDOM(nextTheme);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch {}
        return;
      }

      setIsTransitioning(true);

      transitionRef.current.trigger({
        fromTheme: theme,
        toTheme: nextTheme,
        origin: origin || {
          x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
          y: typeof window !== "undefined" ? 40 : 0,
        },
        onThemeReveal: () => {
          setTheme(nextTheme);
          applyThemeToDOM(nextTheme);
          try {
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
          } catch {}
        },
        onComplete: () => {
          setIsTransitioning(false);
        },
      });
    },
    [theme, applyThemeToDOM]
  );

  return (
    <ThemeContext.Provider value={{ theme, isTransitioning, toggleTheme }}>
      {children}
      <InkBleedTransition ref={transitionRef} />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
