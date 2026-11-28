/**
 * jsdom has no matchMedia. Tests use this to set `prefers-reduced-motion`.
 */
let reducedMotion = false;

export function setReducedMotion(on: boolean) {
  reducedMotion = on;
}

window.matchMedia = (query: string): MediaQueryList =>
  ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
