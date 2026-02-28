import { rnTheme } from "./rn-adapter";

export type { RNColors, RNTheme, SeverityColors } from "./rn-adapter";

// theme.color REMOVED — colors come from useTheme().colors
export const theme = {
  // Numeric keys + backward-compat named aliases
  radius: {
    ...rnTheme.radius,
    sm: rnTheme.radius.control, // 12 — buttons, controls
    md: rnTheme.radius.container, // 16 — cards, containers
    lg: rnTheme.radius["2xl"], // 24 — large radius
  },
  // Numeric keys + backward-compat named aliases
  spacing: {
    ...rnTheme.spacing,
    xs: rnTheme.spacing[2], // 8
    sm: rnTheme.spacing[3], // 12
    md: rnTheme.spacing[4], // 16
    lg: rnTheme.spacing[5], // 20
    xl: rnTheme.spacing[8], // 32
  },
  shadow: { card: rnTheme.shadow.card },
} as const;

export { rnTheme };
