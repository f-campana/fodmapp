import * as mdx from "eslint-plugin-mdx";

const markdownGlobs = ["**/*.{md,mdx}"];

export default [
  {
    ...mdx.flat,
    files: markdownGlobs,
    rules: {
      ...mdx.flat.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];
