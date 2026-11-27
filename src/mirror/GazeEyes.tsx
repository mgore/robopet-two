import { motion } from "motion/react";
import { CENTER_GAZE, useGaze, type Gaze } from "./useGaze";
import { SOFT_EASE, prefersReducedMotion } from "./motion";

/**
 * <GazeEyes>: a pair of eyes whose pupils follow the pointer or tilt (P4).
 *
 * Pass `gaze` to drive it yourself, or leave it out to follow the user through
 * useGaze. Set `follow={false}` to hold the centre pose ("looking at you").
 * Decorative by default; pass `label` when the eyes are the only signal.
 */

export interface GazeEyesProps {
  gaze?: Gaze;
  follow?: boolean;
  idleMs?: number;
  color?: string;
  label?: string;
  className?: string;
}

const PUPIL_TRAVEL = 2.2;

export function GazeEyes({
  gaze,
  follow = true,
  idleMs,
  color = "currentColor",
  label,
  className,
}: GazeEyesProps) {
  // Only follow the user when no explicit gaze is given and following is on.
  const followed = useGaze({ enabled: gaze === undefined && follow, idleMs });
  const current = gaze ?? (follow ? followed : CENTER_GAZE);
  const reduced = prefersReducedMotion();
  const pupil = { x: current.x * PUPIL_TRAVEL, y: current.y * PUPIL_TRAVEL };

  const labelProps = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };

  return (
    <svg viewBox="0 0 60 24" className={className} width="60" height="24" fill="none" {...labelProps}>
      {[15, 45].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="12" rx="10" ry="9" stroke={color} strokeOpacity="0.55" strokeWidth="1.25" />
          <motion.ellipse
            cx={cx}
            cy="12"
            rx="3.2"
            ry="4.2"
            fill={color}
            animate={{ x: pupil.x, y: pupil.y }}
            transition={reduced ? { duration: 0 } : { duration: 0.6, ease: SOFT_EASE }}
          />
        </g>
      ))}
    </svg>
  );
}
