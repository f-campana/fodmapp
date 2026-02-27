import { type RNTheme, rnTheme } from "./rn-adapter";

export const theme = {
  color: {
    canvas: rnTheme.color.canvas,
    surface: rnTheme.color.surface,
    surfaceMuted: rnTheme.color.surfaceMuted,
    text: rnTheme.color.text,
    textMuted: rnTheme.color.textMuted,
    border: rnTheme.color.border,
    accent: rnTheme.color.accent,
    accentStrong: rnTheme.color.accentStrong,
    accentSoft: rnTheme.color.surfaceMuted,
    infoSoft: rnTheme.color.surfaceRaised,
    danger: rnTheme.color.danger,
  },
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

export type { RNTheme };
export { rnTheme };
