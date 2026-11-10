import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tap-to-wake intro ("Darkness Staring Back", docs/darkness-staring-back.md section 3).
 *
 * Beats: abyss -> cat at the pool -> not-recognition (tilt, late reflection, ripple)
 * -> recognition (reflection's eyes glow first, then the cat's) -> it looks up
 * -> "TAP TO WAKE". Nothing plays before the tap; the tap starts purr then meow
 * and the scene dissolves into the app.
 *
 * Audio lives in public/audio/{purr,meow}.mp3 so recordings can be swapped in
 * without code changes.
 */

type Beat = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0 abyss · 1 cat at pool · 2 tilt + ripple · 3 recognition · 4 look up · 5 tap to wake · 6 waking

const STORAGE_KEY = "rp-woken";
const BEAT_TIMES: Array<[Beat, number]> = [
  [1, 900],
  [2, 2300],
  [3, 3900],
  [4, 5100],
  [5, 5900],
];

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function shouldShowIntro(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has("intro")) return true;
    return sessionStorage.getItem(STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

function play(src: string, volume: number): HTMLAudioElement | null {
  try {
    const a = new Audio(src);
    a.volume = volume;
    a.play().catch(() => {});
    return a;
  } catch {
    return null;
  }
}

interface CatProps {
  beat: Beat;
  gaze: { x: number; y: number };
  reflection?: boolean;
}

/** Front-facing sitting cat. The reflection uses the same drawing, flipped and tinted. */
function Cat({ beat, gaze, reflection = false }: CatProps) {
  const lookingDown = beat >= 1 && beat < 4;
  const tilted = beat === 2;
  // Both recognize at beat 3; CSS delays the cat so the reflection "knows" first.
  const recognized = beat >= 3;
  const headY = lookingDown ? 6 : gaze.y * 3;
  const headX = lookingDown ? 0 : gaze.x * 3;
  const pupilY = lookingDown ? 2.2 : gaze.y * 2;
  const pupilX = lookingDown ? 0 : gaze.x * 2.2;

  return (
    <g className={`rp-cat ${reflection ? "rp-cat--reflection" : ""} ${recognized ? "is-recognized" : ""}`}>
      {/* body */}
      <path
        className="rp-cat__body"
        d="M70 168 C64 140 70 112 86 102 L114 102 C130 112 136 140 130 168 Z"
      />
      {/* tail curling around the front */}
      <path className="rp-cat__tail" d="M128 162 C150 160 156 146 146 136" fill="none" />
      {/* paw that dabs the water during the tilt beat */}
      <ellipse
        className={`rp-cat__paw ${beat === 2 ? "is-dabbing" : ""}`}
        cx="90"
        cy="166"
        rx="7"
        ry="4"
      />
      <ellipse className="rp-cat__paw" cx="110" cy="166" rx="7" ry="4" />
      {/* head */}
      <g
        className="rp-cat__head"
        style={{
          transform: `translate(${headX}px, ${headY}px) rotate(${tilted ? -12 : 0}deg)`,
        }}
      >
        <path className="rp-cat__ear" d="M78 70 L80 44 L98 60 Z" />
        <path className="rp-cat__ear" d="M122 70 L120 44 L102 60 Z" />
        <ellipse className="rp-cat__face" cx="100" cy="76" rx="27" ry="24" />
        <g className="rp-cat__eyes">
          <ellipse className="rp-cat__eye" cx="90" cy="76" rx="5.5" ry={lookingDown ? 3 : 4.2} />
          <ellipse className="rp-cat__eye" cx="110" cy="76" rx="5.5" ry={lookingDown ? 3 : 4.2} />
          <g className="rp-cat__pupils" style={{ transform: `translate(${pupilX}px, ${pupilY}px)` }}>
            <ellipse cx="90" cy="76" rx="1.3" ry="2.8" />
            <ellipse cx="110" cy="76" rx="1.3" ry="2.8" />
          </g>
        </g>
        <path className="rp-cat__nose" d="M97 87 L103 87 L100 90 Z" />
      </g>
    </g>
  );
}

interface IntroWakeProps {
  onDone: () => void;
}

export function IntroWake({ onDone }: IntroWakeProps) {
  const reduced = useRef(prefersReducedMotion());
  const [beat, setBeat] = useState<Beat>(reduced.current ? 5 : 0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);
  const idleTimer = useRef<number | null>(null);
  const audio = useRef<HTMLAudioElement[]>([]);

  // Silent, looping beats 1 to 5 before the tap.
  useEffect(() => {
    if (reduced.current) return;
    BEAT_TIMES.forEach(([b, t]) => {
      timers.current.push(window.setTimeout(() => setBeat((cur) => (cur < b ? b : cur)), t));
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // Once it has looked up, its eyes follow the pointer; after 8s of stillness they stare straight out.
  useEffect(() => {
    if (beat < 4 || reduced.current) return;
    const recenter = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setGaze({ x: 0, y: 0 }), 8000);
    };
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setGaze({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
      recenter();
    };
    window.addEventListener("pointermove", onMove);
    recenter();
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [beat >= 4]);

  const finish = useCallback(() => {
    setLeaving(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable: intro simply shows again next load */
    }
    window.setTimeout(onDone, reduced.current ? 0 : 900);
  }, [onDone]);

  const wake = useCallback(() => {
    if (beat === 6) {
      // Second tap skips the rest.
      audio.current.forEach((a) => a.pause());
      finish();
      return;
    }
    timers.current.forEach(clearTimeout);
    setBeat(6);
    setGaze({ x: 0, y: 0 });
    const purr = play("/audio/purr.mp3", 0.55);
    if (purr) audio.current.push(purr);
    timers.current.push(
      window.setTimeout(() => {
        const meow = play("/audio/meow.mp3", 0.8);
        if (meow) audio.current.push(meow);
      }, 2000),
      window.setTimeout(finish, 3300),
    );
  }, [beat, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wake();
      } else if (e.key === "Escape") {
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wake, finish]);

  useEffect(() => () => audio.current.forEach((a) => a.pause()), []);

  return (
    <div
      className={`rp-intro rp-intro--beat-${beat} ${leaving ? "is-leaving" : ""} ${reduced.current ? "is-still" : ""}`}
      role="dialog"
      aria-label="RoboPet is waking up. Tap or press Enter to wake it."
      onClick={wake}
    >
      <div className="rp-intro__stage">
        <svg viewBox="0 0 200 280" className="rp-intro__svg" aria-hidden="true">
          <defs>
            <clipPath id="rp-pool-clip">
              <ellipse cx="100" cy="222" rx="94" ry="52" />
            </clipPath>
            <radialGradient id="rp-pool-fill" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1c0d38" />
              <stop offset="100%" stopColor="#050008" />
            </radialGradient>
            <filter id="rp-ripple-blur">
              <feGaussianBlur stdDeviation="0.8" />
            </filter>
          </defs>

          {/* pool */}
          <ellipse className="rp-pool" cx="100" cy="222" rx="94" ry="52" fill="url(#rp-pool-fill)" />
          <g clipPath="url(#rp-pool-clip)">
            <g className="rp-reflection" transform="translate(0 340) scale(1 -1)" filter="url(#rp-ripple-blur)">
              <Cat beat={beat} gaze={gaze} reflection />
            </g>
            <ellipse className="rp-ripple rp-ripple--a" cx="90" cy="178" rx="10" ry="3" />
            <ellipse className="rp-ripple rp-ripple--b" cx="90" cy="178" rx="10" ry="3" />
          </g>
          <ellipse className="rp-pool__rim" cx="100" cy="222" rx="94" ry="52" fill="none" />

          {/* the cat */}
          <Cat beat={beat} gaze={gaze} />
        </svg>
      </div>

      <div className="rp-intro__copy">
        <p className="rp-intro__line" aria-live="polite">
          {beat === 6 ? "It sees you." : beat >= 4 ? "Something is looking back." : " "}
        </p>
        <button
          type="button"
          className="rp-intro__tap"
          onClick={(e) => {
            e.stopPropagation();
            wake();
          }}
        >
          Tap to wake
        </button>
        <span className="rp-intro__tap-echo" aria-hidden="true">
          Tap to wake
        </span>
      </div>
    </div>
  );
}
