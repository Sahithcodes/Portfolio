import type { Theme } from "./gl/params";

/**
 * Full-document snapshots of the page in a given theme.
 *
 * We capture the whole document (not just the viewport) so a snapshot stays valid
 * while the user scrolls; the shader picks the visible window using the live scroll
 * offset. The theme is applied to html2canvas' *cloned* document via `onclone`, so the
 * live page never flickers during pre-capture.
 */

export interface Snapshot {
  theme: Theme;
  canvas: HTMLCanvasElement;
  /** Texture pixels per CSS pixel. */
  scale: number;
  /** Layout this snapshot is valid for; see {@link layoutKey}. */
  key: string;
  ms: number;
}

const BACKGROUND: Record<Theme, string> = {
  light: "#F3F7F7",
  dark: "#0B1110",
};

const isCoarsePointer = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** Device-pixel ratio used for both the snapshots and the overlay canvas. */
export function renderScale(): number {
  if (typeof window === "undefined") return 1;
  // Full-page snapshots can be very tall. Keeping their pixel density near
  // CSS resolution avoids large html2canvas uploads and GPU texture work.
  const cap = isCoarsePointer() ? 1 : 1.25;
  return Math.min(window.devicePixelRatio || 1, cap);
}

export function documentSize(): { width: number; height: number } {
  if (typeof document === "undefined") return { width: 1920, height: 1080 };
  const el = document.documentElement;
  return { width: el.clientWidth, height: Math.max(el.scrollHeight, el.clientHeight) };
}

/**
 * Identifies the layout a snapshot depends on. Viewport height is deliberately
 * excluded (mobile URL-bar show/hide changes it without reflowing the document).
 */
export function layoutKey(scale: number): string {
  const { width, height } = documentSize();
  return `${width}x${height}@${scale}`;
}

export async function capturePage(
  theme: Theme,
  scale: number,
  maxTextureSize: number
): Promise<Snapshot> {
  const t0 = performance.now();
  const key = layoutKey(scale);
  const { width, height } = documentSize();

  // Never exceed what the GPU can hold; the shader handles scale != canvas DPR.
  const safeScale = Math.min(scale, maxTextureSize / width, maxTextureSize / height);

  // Lazy-loaded: html2canvas is ~200 KB and only needed after first paint.
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(document.body, {
    scale: safeScale,
    backgroundColor: BACKGROUND[theme],
    x: 0,
    y: 0,
    width,
    height,
    scrollX: 0,
    scrollY: 0,
    // The clone iframe renders without a scrollbar, so give it the live page's
    // scrollbar-less width; otherwise centred content shifts by half a scrollbar.
    windowWidth: width,
    windowHeight: document.documentElement.clientHeight,
    logging: false,
    useCORS: true,
    onclone: (doc) => {
      doc.documentElement.dataset.theme = theme;
      if (theme === "light") {
        doc.documentElement.classList.add("light");
        doc.documentElement.classList.remove("dark");
      } else {
        doc.documentElement.classList.add("dark");
        doc.documentElement.classList.remove("light");
      }
      // The live toggle is drawn above the overlay, so leave a hole for it. `visibility`
      // (not data-html2canvas-ignore) keeps its box in the layout so the nav doesn't shift.
      doc.querySelectorAll<HTMLElement>("[data-ink-live]").forEach((el) => {
        el.style.visibility = "hidden";
      });
      // html2canvas cannot reliably rasterize clipped gradient text. Keep the
      // theme snapshots legible by flattening only the cloned copy to solid
      // theme text, while preserving accent-colored nested spans.
      doc.querySelectorAll<HTMLElement>(".text-gradient-teal, .text-gradient-teal-soft").forEach((el) => {
        el.style.backgroundImage = "none";
        el.style.backgroundClip = "border-box";
        el.style.webkitBackgroundClip = "border-box";
        el.style.webkitTextFillColor = "var(--foreground)";
        el.style.color = "var(--foreground)";
        el.querySelectorAll<HTMLElement>("*").forEach((child) => {
          child.style.webkitTextFillColor = "currentColor";
        });
      });

      // GSAP deliberately clips the hero lines during the entrance reveal. A
      // theme snapshot must represent the settled glyphs, not an intermediate
      // overflow crop or a line frozen halfway through its transform.
      doc.querySelectorAll<HTMLElement>("[data-ink-headline]").forEach((heading) => {
        heading.querySelectorAll<HTMLElement>("*").forEach((child) => {
          child.style.opacity = "1";
          child.style.transform = "none";
        });
        heading.querySelectorAll<HTMLElement>(".overflow-hidden").forEach((lineMask) => {
          lineMask.style.overflow = "visible";
        });
      });
      doc.querySelectorAll<HTMLElement>("[data-ink-support]").forEach((support) => {
        support.style.opacity = "1";
        support.style.transform = "none";
      });
    },
  });

  return { theme, canvas, scale: safeScale, key, ms: performance.now() - t0 };
}

