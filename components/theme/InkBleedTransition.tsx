"use client";

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import gsap from "gsap";
import { capturePage, layoutKey, renderScale } from "./capture";
import { inkParams, PIGMENT_COLOR } from "./gl/params";
import { InkRenderer, type InkFrame, type InkSource } from "./gl/renderer";
import type { Theme } from "./gl/params";

export interface Point {
  x: number;
  y: number;
}

export interface InkBleedTransitionOptions {
  fromTheme: Theme;
  toTheme: Theme;
  origin?: Point;
  onThemeReveal: () => void;
  onComplete: () => void;
}

export interface InkBleedTransitionRef {
  trigger: (options: InkBleedTransitionOptions) => void;
}

const FADE_OUT = 0.15;
const RESIZE_DEBOUNCE_MS = 250;
const CSS_FADE_S = 0.45;
const REVEAL_DURATION = 0.42;

/**
 * Spread geometry configuration:
 *  - growth: base radius at progress 1 relative to farthest corner
 *  - cleanupFrom: fraction of duration after which uniform extra reach cleans lagging corners
 *  - cleanupReach: extra reach at progress 1 relative to farthest corner
 */
export const SPREAD = {
  growth: 0.7,
  cleanupFrom: 0.45,
  cleanupReach: 0.4,
  cleanupPow: 2,
};

function farthestCorner(p: Point): number {
  if (typeof document === "undefined") return 1000;
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  return (
    Math.max(
      Math.hypot(p.x, p.y),
      Math.hypot(w - p.x, p.y),
      Math.hypot(p.x, h - p.y),
      Math.hypot(w - p.x, h - p.y)
    ) + 4
  );
}

function randomSeed(): InkFrame["seed"] {
  return {
    x: Math.random() * 64 - 32,
    y: Math.random() * 64 - 32,
    angle: Math.random() * Math.PI * 2,
  };
}

function snapshotKey(scale: number, scrollRevision: number): string {
  return `${layoutKey(scale)}:scroll-${scrollRevision}`;
}

type HeroCopyOverlay = { wrapper: HTMLDivElement; text: HTMLElement; groups: HTMLElement[] };
type HeroTextTransition = { old: HeroCopyOverlay[]; next: HeroCopyOverlay[]; threshold: number; started: boolean };

function pigmentCss(theme: Theme): string {
  const [r, g, b] = PIGMENT_COLOR[theme].map((channel) => Math.round(channel * 255));
  return `rgb(${r} ${g} ${b})`;
}

function createHeroCopy(selector: string, background: string): HeroCopyOverlay | null {
  const source = document.querySelector<HTMLElement>(selector);
  if (!source) return null;
  const rect = source.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2 || rect.bottom <= 0 || rect.top >= window.innerHeight) return null;

  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  Object.assign(wrapper.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    boxSizing: "border-box",
    margin: "0",
    padding: "0",
    overflow: "visible",
    backgroundColor: background,
    opacity: "0",
    zIndex: "100001",
    pointerEvents: "none",
  });

  const text = source.cloneNode(true) as HTMLElement;
  text.removeAttribute("data-ink-headline");
  text.removeAttribute("data-ink-support");
  Object.assign(text.style, {
    width: "100%",
    height: "100%",
    margin: "0",
    transform: "none",
    opacity: "1",
    overflow: "visible",
  });
  text.querySelectorAll<HTMLElement>("*").forEach((child) => {
    child.style.transform = "none";
    child.style.opacity = "1";
    if (child.classList.contains("overflow-hidden")) child.style.overflow = "visible";
  });
  wrapper.appendChild(text);
  document.body.appendChild(wrapper);
  const groups = source.matches("[data-ink-headline]")
    ? Array.from(text.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
    : [text];
  return { wrapper, text, groups };
}

function removeHeroCopy(transition: HeroTextTransition | null): void {
  if (!transition) return;
  [...transition.old, ...transition.next].forEach(({ wrapper }) => wrapper.remove());
}

type ActiveFrame = Omit<InkFrame, "progress" | "radius" | "time" | "cleanup" | "reveal">;
type PendingTransition = {
  fromTheme: Theme;
  toTheme: Theme;
  start: () => void;
  timer: number;
};

export const InkBleedTransition = forwardRef<InkBleedTransitionRef, {}>(
  (_, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<InkRenderer | null>(null);

    const stateRef = useRef({ progress: 0, time: 0, reveal: 0 });
    const tweenRef = useRef<gsap.core.Tween | null>(null);
    const fadeRef = useRef<gsap.core.Tween | null>(null);
    const frameRef = useRef<ActiveFrame | null>(null);
    const activeCompleteRef = useRef<(() => void) | null>(null);
    const activeRevealRef = useRef<(() => void) | null>(null);
    const activeRevealedRef = useRef(false);
    const heroTextRef = useRef<HeroTextTransition | null>(null);
    const heroTextTweenRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);

    const capturingRef = useRef(false);
    const captureQueuedRef = useRef(false);
    const captureGenRef = useRef(0);
    const scrollRevisionRef = useRef(0);
    const pendingTransitionRef = useRef<PendingTransition | null>(null);
    const resizeTimerRef = useRef<number>(0);
    const cssFadeTimerRef = useRef<number>(0);
    const viewportRef = useRef({ width: 0, height: 0 });

    // Helper: current frame calculation
    const getCurrentFrame = useCallback((): InkFrame | null => {
      const active = frameRef.current;
      if (!active) return null;
      const { progress, time, reveal } = stateRef.current;
      const { maxDist } = active;
      const linear = Math.min(1, time / inkParams.duration);
      const ramp = Math.max(
        0,
        (linear - SPREAD.cleanupFrom) / (1 - SPREAD.cleanupFrom)
      );
      const cleanup =
        ramp ** SPREAD.cleanupPow * maxDist * SPREAD.cleanupReach +
        Math.max(0, (linear - 0.97) / 0.03) * maxDist;

      return {
        ...active,
        progress,
        time,
        reveal,
        radius: progress * maxDist * SPREAD.growth,
        cleanup,
      };
    }, []);

    const draw = useCallback(() => {
      const frame = getCurrentFrame();
      const renderer = rendererRef.current;
      if (renderer && frame) {
        renderer.draw(frame);
      }
    }, [getCurrentFrame]);

    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<number>(0);

    // Schedule snapshot captures only when completely idle and NOT scrolling
    const captureAll = useCallback(async () => {
      const renderer = rendererRef.current;
      if (typeof window === "undefined" || !renderer || renderer.isLost) return;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reducedMotion) return;

      // Never run expensive capture while user is scrolling or animating
      if (
        isScrollingRef.current ||
        capturingRef.current ||
        frameRef.current ||
        document.documentElement.classList.contains("theme-fade")
      ) {
        captureQueuedRef.current = true;
        return;
      }

      const scale = renderScale();
      const revision = scrollRevisionRef.current;
      const key = snapshotKey(scale, revision);
      const currentTheme: Theme =
        document.documentElement.getAttribute("data-theme") === "light"
          ? "light"
          : "dark";
      const otherTheme: Theme = currentTheme === "dark" ? "light" : "dark";
      const themes: Theme[] = ([currentTheme, otherTheme] as const).filter(
        (t): t is Theme => !renderer.hasValid(t, key)
      );

      captureQueuedRef.current = false;
      if (themes.length === 0) {
        const pending = pendingTransitionRef.current;
        if (
          pending &&
          renderer.hasValid(pending.fromTheme, key) &&
          renderer.hasValid(pending.toTheme, key)
        ) {
          window.clearTimeout(pending.timer);
          pendingTransitionRef.current = null;
          pending.start();
        }
        return;
      }

      const gen = ++captureGenRef.current;
      capturingRef.current = true;

      try {
        for (const theme of themes) {
          const snap = await capturePage(theme, scale, renderer.maxTextureSize);
          if (gen !== captureGenRef.current) return;
          if (
            snap.key !== layoutKey(renderScale()) ||
            revision !== scrollRevisionRef.current
          ) {
            captureQueuedRef.current = true;
            break;
          }
          renderer.upload({ ...snap, key: snapshotKey(snap.scale, revision) });
        }
      } catch (err) {
        console.warn("[ink] capture warning:", err);
      } finally {
        capturingRef.current = false;
      }

      const pending = pendingTransitionRef.current;
      if (
        pending &&
        renderer.hasValid(pending.fromTheme, snapshotKey(renderScale(), scrollRevisionRef.current)) &&
        renderer.hasValid(pending.toTheme, snapshotKey(renderScale(), scrollRevisionRef.current))
      ) {
        window.clearTimeout(pending.timer);
        pendingTransitionRef.current = null;
        pending.start();
      }

      if (captureQueuedRef.current) {
        window.clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = window.setTimeout(
          () => void captureAll(),
          RESIZE_DEBOUNCE_MS
        );
      }
    }, []);

    const scheduleCapture = useCallback(
      (delay: number) => {
        window.clearTimeout(resizeTimerRef.current);
        // Use requestIdleCallback if available to prevent any thread blocking
        const run = () => {
          if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            (window as any).requestIdleCallback(() => void captureAll(), {
              timeout: 2000,
            });
          } else {
            void captureAll();
          }
        };
        resizeTimerRef.current = window.setTimeout(run, delay);
      },
      [captureAll]
    );

    const cancel = useCallback(() => {
      const wasActive = frameRef.current !== null;
      tweenRef.current?.kill();
      fadeRef.current?.kill();
      heroTextTweenRef.current?.kill();
      heroTextTweenRef.current = null;
      removeHeroCopy(heroTextRef.current);
      heroTextRef.current = null;
      tweenRef.current = null;
      fadeRef.current = null;
      frameRef.current = null;
      const canvas = rendererRef.current?.canvas;
      if (canvas) {
        canvas.classList.remove("is-active");
        canvas.style.opacity = "0";
      }
      if (wasActive) {
        if (!activeRevealedRef.current) activeRevealRef.current?.();
        activeRevealRef.current = null;
        activeRevealedRef.current = false;
        const complete = activeCompleteRef.current;
        activeCompleteRef.current = null;
        complete?.();
      }
    }, []);

    // Setup WebGL2 Renderer and event listeners on mount
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = InkRenderer.create(canvas);
      rendererRef.current = renderer;

      if (!renderer) {
        document.documentElement.dataset.ink = "css";
        return;
      }
      document.documentElement.dataset.ink = "webgl";

      renderer.resize(renderScale());
      viewportRef.current = { width: window.innerWidth, height: window.innerHeight };
      renderer.watchContext(
        () => cancel(),
        () => scheduleCapture(0)
      );

      const handleResize = () => {
        const previous = viewportRef.current;
        const next = { width: window.innerWidth, height: window.innerHeight };
        viewportRef.current = next;
        renderer.resize(renderScale());
        const active = frameRef.current;
        if (active && previous.width > 0 && previous.height > 0) {
          active.center = {
            x: (active.center.x / previous.width) * next.width,
            y: (active.center.y / previous.height) * next.height,
          };
          active.maxDist = farthestCorner(active.center);
        }
        if (
          active &&
          !renderer.hasValid(active.to, snapshotKey(renderScale(), scrollRevisionRef.current))
        ) {
          // The old full-page textures no longer describe the reflowed page.
          // Finish on the already-revealed live theme instead of sampling stale
          // texture coordinates or leaving the transition canvas covering it.
          cancel();
        }
        if (frameRef.current) draw();
        scheduleCapture(RESIZE_DEBOUNCE_MS);
      };

      // Track active scrolling to prevent html2canvas execution while scrolling
      const handleScroll = () => {
        // Scroll-linked transforms and pinned content change the full-page
        // snapshots. Keep the existing GPU textures, but invalidate their cache
        // key so the next theme switch captures the current visual state.
        scrollRevisionRef.current += 1;
        isScrollingRef.current = true;
        if (pendingTransitionRef.current) captureQueuedRef.current = true;
        window.clearTimeout(scrollTimeoutRef.current);
        const pending = pendingTransitionRef.current;
        if (pending) window.clearTimeout(pending.timer);
        pendingTransitionRef.current = null;
        scrollTimeoutRef.current = window.setTimeout(() => {
          isScrollingRef.current = false;
          if (captureQueuedRef.current) {
            scheduleCapture(500);
          }
        }, 600);
      };

      window.addEventListener("resize", handleResize, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });

      // Pre-capture once fonts are loaded and page is idle
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => scheduleCapture(600));
      } else {
        scheduleCapture(800);
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll);
        window.clearTimeout(resizeTimerRef.current);
        window.clearTimeout(cssFadeTimerRef.current);
        window.clearTimeout(scrollTimeoutRef.current);
        const pending = pendingTransitionRef.current;
        if (pending) window.clearTimeout(pending.timer);
        pendingTransitionRef.current = null;
        tweenRef.current?.kill();
        fadeRef.current?.kill();
        heroTextTweenRef.current?.kill();
        removeHeroCopy(heroTextRef.current);
        heroTextRef.current = null;
      };
    }, [cancel, draw, scheduleCapture]);

    // Imperative trigger
    useImperativeHandle(
      ref,
      () => ({
        trigger({ fromTheme, toTheme, origin, onThemeReveal, onComplete }) {
          if (frameRef.current?.to === toTheme) return;
          const renderer = rendererRef.current;
          const reducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

          const fallback = () => {
            cancel();
            const root = document.documentElement;
            root.classList.add("theme-fade");
            root.style.setProperty("--theme-fade", `${CSS_FADE_S}s`);
            onThemeReveal();
            window.clearTimeout(cssFadeTimerRef.current);
            cssFadeTimerRef.current = window.setTimeout(() => {
              root.classList.remove("theme-fade");
              onComplete();
              if (renderer && !reducedMotion) scheduleCapture(0);
            }, CSS_FADE_S * 1000 + 50);
          };

          window.clearTimeout(cssFadeTimerRef.current);
          document.documentElement.classList.remove("theme-fade");
          const usableRenderer = renderer && !renderer.isLost && !reducedMotion;
          if (!usableRenderer) {
            fallback();
            return;
          }

          const startAnimation = () => {
            const scale = renderScale();
            const interrupting = frameRef.current !== null;

            // Interrupted click: freeze the current pigment field before reversing
            // or redirecting it, so the user never sees a theme flash.
            let from: InkSource = fromTheme;
            if (interrupting) {
              tweenRef.current?.kill();
              fadeRef.current?.kill();
              heroTextTweenRef.current?.kill();
              heroTextTweenRef.current = null;
              removeHeroCopy(heroTextRef.current);
              heroTextRef.current = null;
              tweenRef.current = null;
              fadeRef.current = null;
              renderer.resize(scale);
              const frozen = getCurrentFrame();
              from = frozen && renderer.freeze(frozen) ? "composite" : fromTheme;
            }

            const center: Point = origin ?? {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            };
            const maxDist = farthestCorner(center);
            const frameSeed = randomSeed();

            frameRef.current = {
              from,
              to: toTheme,
              center,
              maxDist,
              seed: frameSeed,
              pigment: fromTheme,
            };
            activeCompleteRef.current = onComplete;
            activeRevealRef.current = onThemeReveal;
            activeRevealedRef.current = false;

            stateRef.current.progress = 0;
            stateRef.current.time = 0;
            stateRef.current.reveal = 0;

            const oldCopies = [
              createHeroCopy("[data-ink-headline]", pigmentCss(fromTheme)),
              createHeroCopy("[data-ink-support]", pigmentCss(fromTheme)),
            ].filter((copy): copy is HeroCopyOverlay => copy !== null);
            const nextCopies = [
              createHeroCopy("[data-ink-headline]", "var(--background)"),
              createHeroCopy("[data-ink-support]", "var(--background)"),
            ].filter((copy): copy is HeroCopyOverlay => copy !== null);
            const copyDistance = [...oldCopies, ...nextCopies].reduce((farthest, copy) => {
              const rect = copy.wrapper.getBoundingClientRect();
              return Math.max(
                farthest,
                Math.hypot(rect.left - center.x, rect.top - center.y),
                Math.hypot(rect.right - center.x, rect.top - center.y),
                Math.hypot(rect.left - center.x, rect.bottom - center.y),
                Math.hypot(rect.right - center.x, rect.bottom - center.y),
              );
            }, 0);
            const textTransition: HeroTextTransition = {
              old: oldCopies,
              next: nextCopies,
              threshold: Math.min(0.82, Math.max(0.12, copyDistance / Math.max(1, maxDist * SPREAD.growth * 0.86))),
              started: false,
            };
            heroTextRef.current = textTransition;

            renderer.resize(scale);
            draw();

            // Hold the old theme under a pigment spread. The live theme is not
            // changed until the source snapshot is fully covered.
            gsap.set(renderer.canvas, { opacity: 1 });
            renderer.canvas.classList.add("is-active");

            tweenRef.current = gsap.to(stateRef.current, {
              progress: 1,
              duration: inkParams.duration,
              ease: "power2.inOut",
              onUpdate: () => {
                stateRef.current.time = tweenRef.current?.time() ?? 0;
                draw();
                const copyTransition = heroTextRef.current;
                if (copyTransition && !copyTransition.started && stateRef.current.progress >= copyTransition.threshold) {
                  copyTransition.started = true;
                  copyTransition.old.forEach(({ wrapper }) => gsap.set(wrapper, { opacity: 1 }));
                  if (copyTransition.old.length) {
                    const timeline = gsap.timeline({
                      onComplete: () => {
                        copyTransition.old.forEach(({ wrapper }) => wrapper.remove());
                        heroTextTweenRef.current = null;
                      },
                    });
                    timeline.to(copyTransition.old.flatMap(({ groups }) => groups), {
                      y: -12,
                      opacity: 0,
                      duration: 0.26,
                      stagger: 0.035,
                      ease: "power2.in",
                    });
                    timeline.to(copyTransition.old.map(({ wrapper }) => wrapper), {
                      opacity: 0,
                      duration: 0.12,
                      ease: "none",
                    }, "-=0.08");
                    heroTextTweenRef.current = timeline;
                  }
                }
              },
              onComplete: () => {
                tweenRef.current = null;
                stateRef.current.progress = 1;
                stateRef.current.time = inkParams.duration;
                stateRef.current.reveal = 0;
                draw();

                // The full-screen pigment now masks every source glyph; remove
                // any finishing text mask before the new theme is introduced.
                const finishedCopyTransition = heroTextRef.current;
                finishedCopyTransition?.old.forEach(({ wrapper }) => wrapper.remove());
                if (finishedCopyTransition) finishedCopyTransition.old = [];
                heroTextTweenRef.current?.kill();
                heroTextTweenRef.current = null;

                // Full pigment coverage is now in place. Change the live DOM and
                // begin the target-theme reveal only after this point.
                onThemeReveal();
                activeRevealedRef.current = true;
                const copyTransition = heroTextRef.current;
                if (copyTransition?.next.length) {
                  copyTransition.next.forEach(({ wrapper }) => gsap.set(wrapper, { opacity: 1 }));
                  heroTextTweenRef.current = gsap.fromTo(
                    copyTransition.next.flatMap(({ groups }) => groups),
                    { y: 16, opacity: 0 },
                    {
                      y: 0,
                      opacity: 1,
                      duration: 0.36,
                      stagger: 0.07,
                      ease: "power2.out",
                    },
                  );
                }

                tweenRef.current = gsap.to(stateRef.current, {
                  reveal: 1,
                  duration: REVEAL_DURATION,
                  ease: "power2.inOut",
                  onUpdate: draw,
                  onComplete: () => {
                    tweenRef.current = null;
                    fadeRef.current = gsap.to(renderer.canvas, {
                      opacity: 0,
                      duration: FADE_OUT,
                      ease: "none",
                      onComplete: () => {
                        fadeRef.current = null;
                        frameRef.current = null;
                        renderer.canvas.classList.remove("is-active");
                        heroTextTweenRef.current?.kill();
                        heroTextTweenRef.current = null;
                        removeHeroCopy(heroTextRef.current);
                        heroTextRef.current = null;
                        const complete = activeCompleteRef.current;
                        activeCompleteRef.current = null;
                        activeRevealRef.current = null;
                        activeRevealedRef.current = false;
                        complete?.();
                        if (captureQueuedRef.current) scheduleCapture(0);
                      },
                    });
                    fadeRef.current.timeScale(inkParams.timeScale);
                  },
                });
                tweenRef.current.timeScale(inkParams.timeScale);
              },
            });
            tweenRef.current.timeScale(inkParams.timeScale);
          };

          const key = snapshotKey(renderScale(), scrollRevisionRef.current);
          const interrupting = frameRef.current !== null;
          const snapshotsReady =
            renderer.hasValid(toTheme, key) &&
            (interrupting || renderer.hasValid(fromTheme, key));

          if (snapshotsReady) {
            if (pendingTransitionRef.current) {
              window.clearTimeout(pendingTransitionRef.current.timer);
            }
            pendingTransitionRef.current = null;
            startAnimation();
            return;
          }

          // Keep the live page stable while first-use snapshots are prepared. A
          // transient capture delay must not silently downgrade a supported WebGL
          // transition into a plain CSS color fade.
          if (pendingTransitionRef.current) return;
          const pending: PendingTransition = {
            fromTheme,
            toTheme,
            start: startAnimation,
            timer: window.setTimeout(() => {
              if (pendingTransitionRef.current !== pending) return;
              pendingTransitionRef.current = null;
              fallback();
            }, 3500),
          };
          pendingTransitionRef.current = pending;
          scheduleCapture(0);
        },
      }),
      [cancel, draw, getCurrentFrame, scheduleCapture]
    );

    return (
      <canvas
        ref={canvasRef}
        className="ink-canvas"
        aria-hidden="true"
        data-html2canvas-ignore=""
      />
    );
  }
);

InkBleedTransition.displayName = "InkBleedTransition";
export default InkBleedTransition;
