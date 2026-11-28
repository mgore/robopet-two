import type { CSSProperties, ReactNode } from "react";
import { prefersReducedMotion } from "./motion";

/**
 * <Reflection>: a dim, flipped echo beneath an element, as if it sat on still
 * water (P2). The echo is decorative and hidden from assistive tech, so use it
 * for visuals, not for interactive controls.
 *
 * The echo's opacity changes lag the original by `delayMs` (~80ms by default),
 * which is what makes it feel alive. Use at most one per screen (P2).
 */

export interface ReflectionProps {
  children: ReactNode;
  /** Opacity of the echo, 0 to 1. The brief asks for 20 to 30%. */
  opacity?: number;
  /** Lag of the echo's opacity behind the original, in ms. */
  delayMs?: number;
  /** Height of the reflected band as a fraction of the element. */
  depth?: number;
  className?: string;
}

export function Reflection({
  children,
  opacity = 0.25,
  delayMs = 80,
  depth = 0.6,
  className,
}: ReflectionProps) {
  const lag = prefersReducedMotion() ? 0 : delayMs;
  const echo: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    height: `${depth * 100}%`,
    transform: "scaleY(-1)",
    transformOrigin: "top",
    opacity,
    filter: "blur(1px)",
    pointerEvents: "none",
    userSelect: "none",
    WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
    maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
    transition: `opacity 400ms cubic-bezier(0.22, 1, 0.36, 1) ${lag}ms`,
  };

  return (
    <div className={className} style={{ position: "relative" }}>
      {children}
      <div aria-hidden="true" data-reflection="" style={echo}>
        {children}
      </div>
    </div>
  );
}
