import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./motion";

/**
 * Attention for the mirror kit (docs/darkness-staring-back.md, P4).
 *
 * The gaze follows the pointer or device tilt. After `idleMs` without input it
 * recentres and stares straight out. Under reduced motion it never moves:
 * the pose stays "looking at you" (P8).
 */

export interface Gaze {
  x: number;
  y: number;
}

export const CENTER_GAZE: Gaze = { x: 0, y: 0 };
export const DEFAULT_IDLE_MS = 8000;
/** Degrees of device tilt that map to a full-range gaze. */
const TILT_RANGE_DEG = 30;

export function clampUnit(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

/** Maps a pointer position inside a box to a gaze in [-1, 1] on both axes. */
export function gazeFromPoint(clientX: number, clientY: number, width: number, height: number): Gaze {
  if (width <= 0 || height <= 0) return CENTER_GAZE;
  return {
    x: clampUnit((clientX / width) * 2 - 1),
    y: clampUnit((clientY / height) * 2 - 1),
  };
}

/** Maps device tilt (gamma: left/right, beta: front/back, in degrees) to a gaze. */
export function gazeFromTilt(gamma: number | null, beta: number | null): Gaze {
  return {
    x: clampUnit((gamma ?? 0) / TILT_RANGE_DEG),
    y: clampUnit((beta ?? 0) / TILT_RANGE_DEG),
  };
}

export interface UseGazeOptions {
  /** When false the hook holds the centre pose and attaches no listeners. */
  enabled?: boolean;
  idleMs?: number;
}

export function useGaze({ enabled = true, idleMs = DEFAULT_IDLE_MS }: UseGazeOptions = {}): Gaze {
  const [gaze, setGaze] = useState<Gaze>(CENTER_GAZE);
  const active = enabled && !prefersReducedMotion();

  useEffect(() => {
    if (!active) {
      setGaze(CENTER_GAZE);
      return;
    }

    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const recentreLater = () => {
      if (idleTimer !== undefined) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setGaze(CENTER_GAZE), idleMs);
    };

    const onPointer = (e: PointerEvent) => {
      setGaze(gazeFromPoint(e.clientX, e.clientY, window.innerWidth, window.innerHeight));
      recentreLater();
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      setGaze(gazeFromTilt(e.gamma, e.beta));
      recentreLater();
    };

    window.addEventListener("pointermove", onPointer);
    window.addEventListener("deviceorientation", onTilt);
    recentreLater();

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
      if (idleTimer !== undefined) clearTimeout(idleTimer);
    };
  }, [active, idleMs]);

  return active ? gaze : CENTER_GAZE;
}
