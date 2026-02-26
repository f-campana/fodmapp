import { toHaveNoViolations } from "jest-axe";

import "@testing-library/jest-dom/vitest";

expect.extend(toHaveNoViolations);
