import { toHaveNoViolations } from "jest-axe";

import "@testing-library/jest-dom/vitest";

expect.extend(toHaveNoViolations);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  // Radix primitives (Slider/ScrollArea/Tooltip) rely on ResizeObserver in JSDOM tests.
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
}
