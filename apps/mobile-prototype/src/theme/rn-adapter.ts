import { nativeTokens } from "@fodmap/design-tokens/native";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const light = (nativeTokens.themes.light.semantic as any).color as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = nativeTokens.base as any;

export const severityColors = {
  none: {
    bg: base.color.emerald["100"] as string,
    fg: base.color.emerald["800"] as string,
  },
  low: {
    bg: base.color.amber["100"] as string,
    fg: base.color.amber["800"] as string,
  },
  moderate: {
    bg: base.color.amber["200"] as string,
    fg: base.color.amber["900"] as string,
  },
  high: {
    bg: base.color.red["100"] as string,
    fg: base.color.red["800"] as string,
  },
} as const;

export type SeverityColors = typeof severityColors;

export const rnTheme = {
  color: {
    canvas: light.background.canvas as string,
    surface: light.surface.default as string,
    surfaceRaised: light.surface.raised as string,
    surfaceMuted: light.surface.muted as string,
    text: light.text.primary as string,
    textMuted: light.text.muted as string,
    textInverse: light.text.inverse as string,
    border: light.border.default as string,
    borderSubtle: light.border.subtle as string,
    accent: light.action.primary.bg as string,
    accentStrong: light.action.primary.bgHover as string,
    accentFg: light.action.primary.fg as string,
    actionSecondaryBg: light.action.secondary.bg as string,
    actionSecondaryFg: light.action.secondary.fg as string,
    danger: light.action.destructive.bg as string,
    dangerFg: light.action.destructive.fg as string,
    warning: light.status.warning.bg as string,
    warningFg: light.status.warning.fg as string,
    statusInfoBg: light.status.info.bg as string,
    statusSuccessBg: light.status.success.bg as string,
  },

  severityColors,

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
