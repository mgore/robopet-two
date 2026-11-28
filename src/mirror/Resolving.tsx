import type { ReactNode } from "react";
import { motion } from "motion/react";
import { SOFT_EASE, prefersReducedMotion } from "./motion";

/**
 * <Resolving>: replaces spinners for AI work (P5).
 *
 * While `pending`, it shows a slow fuchsia breathing glow with an accessible
 * status label. When the content arrives, it resolves out of a dim, blurred
 * reflection into focus. Under reduced motion the glow holds still and the
 * content appears without the blur.
 */

export interface ResolvingProps {
  pending: boolean;
  /** Accessible name for the waiting state, e.g. "Sketching concepts". */
  label?: string;
  children: ReactNode;
  className?: string;
}

const GLOW = "radial-gradient(ellipse at center, rgba(255, 0, 229, 0.35), transparent 70%)";

export function Resolving({ pending, label = "Working", children, className }: ResolvingProps) {
  const reduced = prefersReducedMotion();

  if (pending) {
    return (
      <div role="status" aria-label={label} className={className} data-state="pending">
        <motion.div
          aria-hidden="true"
          style={{ minHeight: 48, height: "100%", borderRadius: 2, background: GLOW }}
          animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
          transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      data-state="resolved"
      initial={reduced ? false : { opacity: 0.3, filter: "blur(8px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={reduced ? { duration: 0 } : { duration: 0.7, ease: SOFT_EASE }}
    >
      {children}
    </motion.div>
  );
}
