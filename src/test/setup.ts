import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { setReducedMotion } from "./matchMedia";

// Unmount rendered trees between tests (no globals, so RTL cannot auto-clean).
afterEach(() => {
  cleanup();
  setReducedMotion(false);
});
