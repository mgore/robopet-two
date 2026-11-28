import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { setReducedMotion } from "../test/matchMedia";
import { Reflection } from "./Reflection";
import { GazeEyes } from "./GazeEyes";
import { Resolving } from "./Resolving";
import { RecognitionBeat } from "./RecognitionBeat";

afterEach(() => {
  vi.useRealTimers();
});

describe("Reflection", () => {
  it("renders the original and a hidden, flipped echo", () => {
    const { container } = render(
      <Reflection delayMs={80}>
        <p>Pet card</p>
      </Reflection>,
    );
    expect(screen.getAllByText("Pet card")).toHaveLength(2);
    const echo = container.querySelector('[data-reflection]') as HTMLElement;
    expect(echo.getAttribute("aria-hidden")).toBe("true");
    expect(echo.style.transform).toBe("scaleY(-1)");
    expect(echo.style.transition).toContain("80ms");
    expect(echo.style.pointerEvents).toBe("none");
  });

  it("drops the lag under reduced motion but keeps the echo", () => {
    setReducedMotion(true);
    const { container } = render(
      <Reflection>
        <p>Pet card</p>
      </Reflection>,
    );
    const echo = container.querySelector('[data-reflection]') as HTMLElement;
    expect(echo.style.transition).toContain("0ms");
    expect(echo).not.toBeNull();
  });
});

describe("GazeEyes", () => {
  it("is decorative unless labelled", () => {
    const { container } = render(<GazeEyes follow={false} />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("exposes a label when the eyes carry meaning", () => {
    render(<GazeEyes follow={false} label="The pet is looking at you" />);
    expect(screen.getByRole("img", { name: "The pet is looking at you" })).toBeTruthy();
  });

  it("renders two pairs of eyes", () => {
    const { container } = render(<GazeEyes follow={false} />);
    expect(container.querySelectorAll("ellipse").length).toBe(4);
  });
});

describe("Resolving", () => {
  it("shows an accessible status and hides content while pending", () => {
    render(
      <Resolving pending label="Sketching concepts">
        <p>Result</p>
      </Resolving>,
    );
    expect(screen.getByRole("status", { name: "Sketching concepts" })).toBeTruthy();
    expect(screen.queryByText("Result")).toBeNull();
  });

  it("resolves into the content once it arrives", () => {
    const { rerender } = render(
      <Resolving pending>
        <p>Result</p>
      </Resolving>,
    );
    rerender(
      <Resolving pending={false}>
        <p>Result</p>
      </Resolving>,
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Result").closest('[data-state="resolved"]')).not.toBeNull();
  });
});

describe("RecognitionBeat", () => {
  it("stays unaware while inactive", () => {
    const { container } = render(
      <RecognitionBeat active={false}>
        <p>Milestone</p>
      </RecognitionBeat>,
    );
    expect(container.firstElementChild?.getAttribute("data-phase")).toBe("unaware");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("pauses, then turns fuchsia and meets the user", () => {
    vi.useFakeTimers();
    const onRecognized = vi.fn();
    const { container } = render(
      <RecognitionBeat active pauseMs={700} onRecognized={onRecognized}>
        <p>Milestone</p>
      </RecognitionBeat>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-phase")).toBe("pause");
    expect(root.style.boxShadow).toBe("none");

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(root.getAttribute("data-phase")).toBe("recognized");
    expect(root.style.boxShadow).toContain("255, 0, 229");
    expect(container.querySelector("svg")).not.toBeNull();
    expect(onRecognized).toHaveBeenCalledTimes(1);
  });

  it("skips the pause under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(
      <RecognitionBeat active>
        <p>Milestone</p>
      </RecognitionBeat>,
    );
    expect(container.firstElementChild?.getAttribute("data-phase")).toBe("recognized");
  });

  it("resets when it becomes inactive again", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <RecognitionBeat active={false}>
        <p>Milestone</p>
      </RecognitionBeat>,
    );
    rerender(
      <RecognitionBeat active>
        <p>Milestone</p>
      </RecognitionBeat>,
    );
    act(() => {
      vi.advanceTimersByTime(700);
    });
    rerender(
      <RecognitionBeat active={false}>
        <p>Milestone</p>
      </RecognitionBeat>,
    );
    expect(container.firstElementChild?.getAttribute("data-phase")).toBe("unaware");
  });
});
