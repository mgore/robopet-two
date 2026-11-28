/** Shared motion helpers for the mirror kit. */

/** Soft easing from docs/darkness-staring-back.md, P7. */
export const SOFT_EASE = [0.22, 1, 0.36, 1] as const;

/** True when the user asks for reduced motion. Safe where matchMedia is missing. */
export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
