import { type ComponentType, createElement, Fragment } from "react";

import type { Preview } from "@storybook/react-vite";

import { Agentation, type AgentationProps } from "agentation";

import "./preview.generated.css";

import { tokens } from "@fodmapp/design-tokens";

type PreviewTheme = "light" | "dark";
type ThemeMode = "system" | PreviewTheme;
type PreviewBackground = "canvas" | "surface";
type SemanticColorTokens = {
  readonly background: { readonly canvas: string };
  readonly surface: { readonly default: string };
};

const PREVIEW_BACKGROUND_CSS_VAR = "--storybook-preview-background";
const LIGHT_SEMANTIC_COLORS = tokens.themes.light.semantic
  .color as SemanticColorTokens;
const DARK_SEMANTIC_COLORS = tokens.themes.dark.semantic
  .color as SemanticColorTokens;
const SEMANTIC_COLORS_BY_THEME: Record<PreviewTheme, SemanticColorTokens> = {
  light: LIGHT_SEMANTIC_COLORS,
  dark: DARK_SEMANTIC_COLORS,
};

const STORYBOOK_BACKGROUND_OPTIONS = {
  canvas: {
    name: "Canvas",
    value: LIGHT_SEMANTIC_COLORS.background.canvas,
  },
  surface: {
    name: "Surface",
    value: LIGHT_SEMANTIC_COLORS.surface.default,
  },
} satisfies Record<
  PreviewBackground,
  { readonly name: string; readonly value: string }
>;

function shouldRenderAgentation(): boolean {
  const isEnabledFlag = import.meta.env.STORYBOOK_ENABLE_AGENTATION === "true";
  if (!isEnabledFlag || typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  return isEnabledFlag && isLocalhost;
}

const AgentationComponent = Agentation as ComponentType<AgentationProps>;

function resolvePreviewTheme(theme: ThemeMode): PreviewTheme {
  if (theme === "light" || theme === "dark") {
    return theme;
  }

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function resolvePreviewBackground(
  background: PreviewBackground | undefined,
  theme: PreviewTheme,
): string | null {
  const semanticColors = SEMANTIC_COLORS_BY_THEME[theme];

  if (background === "surface") {
    return semanticColors.surface.default;
  }

  return null;
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Theme mode",
      defaultValue: "system",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "canvas" },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as ThemeMode;
      const resolvedTheme = resolvePreviewTheme(theme);

      if (theme === "light" || theme === "dark") {
        document.documentElement.setAttribute("data-theme", resolvedTheme);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }

      const selectedBackground = context.globals.backgrounds?.value as
        | PreviewBackground
        | undefined;
      const previewBackground = resolvePreviewBackground(
        selectedBackground,
        resolvedTheme,
      );

      if (previewBackground) {
        document.documentElement.style.setProperty(
          PREVIEW_BACKGROUND_CSS_VAR,
          previewBackground,
        );
      } else {
        document.documentElement.style.removeProperty(
          PREVIEW_BACKGROUND_CSS_VAR,
        );
      }

      return Story();
    },
    (Story) => {
      const storyElement = Story();
      return createElement(
        Fragment,
        null,
        storyElement,
        shouldRenderAgentation()
          ? createElement(AgentationComponent, { copyToClipboard: true })
          : null,
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    backgrounds: {
      options: STORYBOOK_BACKGROUND_OPTIONS,
    },
    a11y: {
      test: "error",
    },
  },
};

export default preview;
