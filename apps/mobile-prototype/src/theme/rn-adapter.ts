import { nativeTokens } from "@fodmapp/design-tokens/native";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = nativeTokens.base as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildColors(semantic: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (semantic as any).color;
  return {
    canvas: c.background.canvas as string,
    surface: c.surface.default as string,
    surfaceRaised: c.surface.raised as string,
    surfaceMuted: c.surface.muted as string,
    text: c.text.primary as string,
    textMuted: c.text.muted as string,
    textInverse: c.text.inverse as string,
    border: c.border.default as string,
    borderSubtle: c.border.subtle as string,
    accent: c.action.primary.bg as string,
    accentStrong: c.action.primary.bgHover as string,
    accentFg: c.action.primary.fg as string,
    actionSecondaryBg: c.action.secondary.bg as string,
    actionSecondaryFg: c.action.secondary.fg as string,
    danger: c.action.destructive.bg as string,
    dangerFg: c.action.destructive.fg as string,
    warning: c.status.warning.bg as string,
    warningFg: c.status.warning.fg as string,
    statusInfoBg: c.status.info.bg as string,
    statusSuccessBg: c.status.success.bg as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSeverityColors(semantic: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = (semantic as any).color.status;
  return {
    none: { bg: s.success.bg as string, fg: s.success.fg as string },
    low: { bg: s.warning.bg as string, fg: s.warning.fg as string },
    moderate: { bg: s.warning.bg as string, fg: s.warning.fg as string },
    high: { bg: s.danger.bg as string, fg: s.danger.fg as string },
    unknown: { bg: s.info.bg as string, fg: s.info.fg as string },
  };
}

export type RNColors = ReturnType<typeof buildColors>;
export type SeverityColors = ReturnType<typeof buildSeverityColors>;

export const lightColors = buildColors(nativeTokens.themes.light.semantic);
export const darkColors = buildColors(nativeTokens.themes.dark.semantic);
export const lightSeverityColors = buildSeverityColors(
  nativeTokens.themes.light.semantic,
);
export const darkSeverityColors = buildSeverityColors(
  nativeTokens.themes.dark.semantic,
);

// rnTheme.color REMOVED — use useTheme().colors
export const rnTheme = {
  radius: {
    control: base.radius.lg as number,
    container: base.radius.xl as number,
    pill: base.radius.full as number,
    sm: base.radius.sm as number,
    md: base.radius.md as number,
    lg: base.radius.lg as number,
    xl: base.radius.xl as number,
    "2xl": base.radius["2xl"] as number,
  },

  spacing: {
    1: base.space["1"] as number,
    2: base.space["2"] as number,
    3: base.space["3"] as number,
    4: base.space["4"] as number,
    5: base.space["5"] as number,
    6: base.space["6"] as number,
    8: base.space["8"] as number,
    10: base.space["10"] as number,
    controlX: base.space["4"] as number,
    controlY: base.space["2_5"] as number,
    section: base.space["10"] as number,
  },

  typography: {
    fontSize: {
      xs: base.typography.fontSize.xs as number,
      sm: base.typography.fontSize.sm as number,
      md: base.typography.fontSize.md as number,
      lg: base.typography.fontSize.lg as number,
      xl: base.typography.fontSize.xl as number,
      "2xl": base.typography.fontSize["2xl"] as number,
      "3xl": base.typography.fontSize["3xl"] as number,
      "4xl": base.typography.fontSize["4xl"] as number,
    },
    fontWeight: {
      regular: base.typography.fontWeight.regular as string,
      medium: base.typography.fontWeight.medium as string,
      semibold: base.typography.fontWeight.semibold as string,
      bold: base.typography.fontWeight.bold as string,
    },
    lineHeight: {
      tight: base.typography.lineHeight.tight as number,
      snug: base.typography.lineHeight.snug as number,
      normal: base.typography.lineHeight.normal as number,
      relaxed: base.typography.lineHeight.relaxed as number,
    },
  },

  motion: {
    duration: {
      fast: base.motion.duration.fast as number,
      normal: base.motion.duration.normal as number,
      slow: base.motion.duration.slow as number,
    },
  },

  shadow: {
    card: {
      elevation: 2,
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    elevated: {
      elevation: 4,
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
    },
  },
} as const;

export type RNTheme = typeof rnTheme;
