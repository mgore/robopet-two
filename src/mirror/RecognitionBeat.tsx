import { useEffect, useRef, useState, type ReactNode } from "react";
import { GazeEyes } from "./GazeEyes";
import { prefersReducedMotion } from "./motion";

/**
 * <RecognitionBeat>: one moment of recognition for a first-time milestone (P5).
 *
 * When `active` turns true the element pauses for `pauseMs` (the mirror test's
 * beat of not knowing), then its glow turns fuchsia and the eyes meet the user.
 * Under reduced motion there is no pause, but the glow and eyes still change,
 * so the meaning survives without movement (P8).
 */

export interface RecognitionBeatProps {
  active: boolean;
  children: ReactNode;
  pauseMs?: number;
  onRecognized?: () => void;
  className?: string;
}

type Phase = "unaware" | "pause" | "recognized";

const RECOGNIZED_GLOW = "0 0 18px rgba(255, 0, 229, 0.45)";

export function RecognitionBeat({
  active,
  children,
  pauseMs = 700,
  onRecognized,
  className,
}: RecognitionBeatProps) {
  const reduced = prefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("unaware");
  const onRecognizedRef = useRef(onRecognized);

  useEffect(() => {
    onRecognizedRef.current = onRecognized;
  }, [onRecognized]);

  useEffect(() => {
    if (!active) {
      setPhase("unaware");
      return;
    }
    const recognize = () => {
      setPhase("recognized");
      onRecognizedRef.current?.();
    };
    if (reduced) {
      recognize();
      return;
    }
    setPhase("pause");
    const timer = setTimeout(recognize, pauseMs);
    return () => clearTimeout(timer);
  }, [active, pauseMs, reduced]);

  const recognized = phase === "recognized";

  return (
    <div
      className={className}
      data-phase={phase}
      style={{
        boxShadow: recognized ? RECOGNIZED_GLOW : "none",
        transition: reduced ? "none" : "box-shadow 600ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
      {recognized && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <GazeEyes follow={false} color="#ff00e5" />
        </div>
      )}
    </div>
  );
}
