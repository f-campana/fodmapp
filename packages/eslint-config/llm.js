const jsTsCode = ["**/*.{js,cjs,mjs,jsx,ts,tsx}"];

export default [
  {
    files: jsTsCode,
    rules: {
      "id-denylist": ["warn", "tmp", "obj"],
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "variable",
          filter: {
            regex: "^[A-Z]",
            match: false,
          },
          format: ["camelCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "interface",
          filter: {
            regex: "Props$",
            match: false,
          },
          format: ["PascalCase"],
        },
        {
          selector: "interface",
          filter: {
            regex: "Props$",
            match: true,
          },
          format: ["PascalCase"],
          suffix: ["Props"],
        },
      ],
      "no-duplicate-imports": "warn",
      "react/jsx-no-duplicate-props": "warn",
      "max-params": ["warn", 6],
      "max-lines-per-function": [
        "warn",
        {
          max: 180,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    files: [
      "apps/storybook/**/*.{js,cjs,mjs,jsx,ts,tsx}",
      "apps/storybook/**/*.mdx",
    ],
    rules: {
      "max-lines-per-function": [
        "warn",
        {
          max: 240,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    files: ["apps/storybook/stories/foundations/token-docs.components.tsx"],
    rules: {
      "max-lines-per-function": [
        "warn",
        {
          max: 320,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
];
