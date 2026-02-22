import type { Preview } from "@storybook/react-vite";

import "@fodmap/ui/styles.css";

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
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;
      if (theme === "light" || theme === "dark") {
        document.documentElement.setAttribute("data-theme", theme);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      return Story();
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
      default: "canvas",
      values: [
        { name: "canvas", value: "var(--color-bg)" },
        { name: "surface", value: "var(--color-surface)" },
      ],
    },
    a11y: {
      test: "error",
    },
  },
};

export default preview;
