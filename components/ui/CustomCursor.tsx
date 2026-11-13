"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/animations/gsap";

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorLabelRef = useRef<HTMLSpanElement | null>(null);
  const [cursorLabelText, setCursorLabelText] = useState("");

  useEffect(() => {
    // Only enable on non-touch devices with fine pointer and no reduced motion
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }

    const container = containerRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!container || !ring || !dot) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let isVisible = false;
    let isHovered = false;
    let currentLabel = "";

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        container.style.opacity = "1";
      }

      // Update dot directly without lag
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
    };

    const onMouseLeave = () => {
      isVisible = false;
      container.style.opacity = "0";
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const interactive =
        target?.closest("a") ||
        target?.closest("button") ||
        target?.closest("[role='button']") ||
        target?.closest("input") ||
        target?.closest("textarea") ||
        target?.closest(".project-card");

      const contextTarget = target?.closest<HTMLElement>("[data-cursor]");
      const label = target?.closest(".project-card") ? "VIEW PROJECT" : contextTarget?.dataset.cursor || "";
      const nextHovered = Boolean(interactive) || Boolean(label);
      if (nextHovered !== isHovered || label !== currentLabel) {
        isHovered = nextHovered;
        currentLabel = label;
        if (isHovered) {
          const focus = label === "FOCUS";
          ring.style.width = label && !focus ? "112px" : "48px";
          ring.style.height = label && !focus ? "42px" : "48px";
          ring.style.borderColor = "var(--primary)";
          ring.style.backgroundColor = "var(--accent-subtle)";
          setCursorLabelText(label);
        } else {
          ring.style.width = "28px";
          ring.style.height = "28px";
          ring.style.borderColor = "var(--border)";
          ring.style.backgroundColor = "transparent";
          setCursorLabelText("");
        }
      }
    };

    // Smooth trailing ring loop using direct DOM writes (Zero React state updates)
    const ease = 0.2;
    const tick = () => {
      if (isVisible) {
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;
        ring.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
        if (cursorLabelRef.current) {
          cursorLabelRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[9999] opacity-0 transition-opacity duration-300"
      aria-hidden="true"
    >
      {/* Outer trailing ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full border border-surface-border transition-[width,height,border-color,background-color] duration-150 ease-out"
        style={{
          width: "28px",
          height: "28px",
          willChange: "transform",
        }}
      />
      {/* Center dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]"
        style={{
          willChange: "transform",
        }}
      />
      <span
        ref={cursorLabelRef}
        className="fixed top-0 left-0 flex items-center justify-center font-mono text-[9px] tracking-widest text-content-primary whitespace-nowrap"
        style={{ pointerEvents: "none", willChange: "transform" }}
      >
        {cursorLabelText}
      </span>
    </div>
  );
}
