import js from "@eslint/js";

import prettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

const codeGlobs = ["**/*.{js,cjs,mjs,jsx,ts,tsx}"];
const typeScriptCodeGlobs = ["**/*.{ts,tsx}"];

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: codeGlobs,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      import: importPlugin,
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "simple-import-sort": simpleImportSort,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/parsers": {
        "@typescript-eslint/parser": [
          ".ts",
          ".tsx",
          ".js",
          ".jsx",
          ".cjs",
          ".mjs",
        ],
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts", ".cjs", ".mjs"],
        },
        typescript: true,
      },
    },
    rules: {
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      curly: "error",
      eqeqeq: ["error", "smart"],
      "no-alert": "error",
      "no-console": "error",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-var": "error",
      "prefer-const": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react/jsx-key": "error",
      "react/jsx-no-target-blank": ["error", { allowReferrer: true }],
      "react/self-closing-comp": "error",
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
      "import/no-unresolved": [
        "error",
        {
          ignore: ["^\\.\\/\\.next\\/types\\/", "^astro:"],
        },
      ],
      "no-duplicate-imports": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^node:"],
            ["^react$", "^react/"],
            ["^next$", "^next/"],
            ["^@(?!(?:fodmapp)/)"],
            ["^\\w"],
            ["^\\u0000@(?!(?:fodmapp)/)"],
            ["^\\u0000@fodmapp/"],
            ["^\\u0000"],
            ["^@fodmapp/"],
            ["^@/", "^~/", "^#"],
            ["^\\.\\./", "^\\./"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: typeScriptCodeGlobs,
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
    },
  },
];
