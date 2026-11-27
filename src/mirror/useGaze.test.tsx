import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { setReducedMotion } from "../test/matchMedia";
import {
  useGaze,
  gazeFromPoint,
  gazeFromTilt,
  clampUnit,
  CENTER_GAZE,
  DEFAULT_IDLE_MS,
} from "./useGaze";

afterEach(() => {
  vi.useRealTimers();
});

function pointerMove(clientX: number, clientY: number) {
  window.dispatchEvent(new MouseEvent("pointermove", { clientX, clientY }));
}

describe("gaze maths", () => {
  it("clamps to [-1, 1] and treats NaN as centre", () => {
    expect(clampUnit(3)).toBe(1);
    expect(clampUnit(-3)).toBe(-1);
    expect(clampUnit(0.25)).toBe(0.25);
    expect(clampUnit(Number.NaN)).toBe(0);
  });

  it("maps the box centre to the centre pose and corners to the extremes", () => {
    expect(gazeFromPoint(500, 400, 1000, 800)).toEqual({ x: 0, y: 0 });
    expect(gazeFromPoint(0, 0, 1000, 800)).toEqual({ x: -1, y: -1 });
    expect(gazeFromPoint(1000, 800, 1000, 800)).toEqual({ x: 1, y: 1 });
  });

  it("falls back to centre for an empty box", () => {
    expect(gazeFromPoint(10, 10, 0, 0)).toEqual(CENTER_GAZE);
  });

  it("maps tilt to gaze and clamps large tilts", () => {
    expect(gazeFromTilt(15, 0)).toEqual({ x: 0.5, y: 0 });
    expect(gazeFromTilt(90, -90)).toEqual({ x: 1, y: -1 });
    expect(gazeFromTilt(null, null)).toEqual(CENTER_GAZE);
  });
});

describe("useGaze", () => {
  it("follows the pointer", () => {
    const { result } = renderHook(() => useGaze());
    act(() => pointerMove(window.innerWidth, window.innerHeight / 2));
    expect(result.current.x).toBe(1);
    expect(result.current.y).toBeCloseTo(0);
  });

  it("follows device tilt", () => {
    const { result } = renderHook(() => useGaze());
    act(() => {
      window.dispatchEvent(Object.assign(new Event("deviceorientation"), { gamma: -15, beta: 0 }));
    });
    expect(result.current.x).toBeCloseTo(-0.5);
  });

  it("stares straight out again after idle time", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGaze());
    act(() => pointerMove(window.innerWidth, window.innerHeight));
    expect(result.current).toEqual({ x: 1, y: 1 });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_IDLE_MS - 1);
    });
    expect(result.current).toEqual({ x: 1, y: 1 });

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toEqual(CENTER_GAZE);
  });

  it("holds the centre pose when disabled and ignores input", () => {
    const { result } = renderHook(() => useGaze({ enabled: false }));
    act(() => pointerMove(window.innerWidth, window.innerHeight));
    expect(result.current).toEqual(CENTER_GAZE);
  });

  it("never moves under reduced motion", () => {
    setReducedMotion(true);
    const { result } = renderHook(() => useGaze());
    act(() => pointerMove(window.innerWidth, window.innerHeight));
    expect(result.current).toEqual(CENTER_GAZE);
  });

  it("removes its listeners on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useGaze());
    unmount();
    const removed = remove.mock.calls.map(([type]) => type);
    expect(removed).toContain("pointermove");
    expect(removed).toContain("deviceorientation");
    remove.mockRestore();
  });
});
