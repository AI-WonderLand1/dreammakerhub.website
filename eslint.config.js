import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
<<<<<<< HEAD
=======
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
<<<<<<< HEAD
    ignores: ["node_modules/", "dist/", ".next/", "coverage/", ".coder/"]
  },
  {
    files: ["**/*.js"],
=======
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
  },
  {
    ignores: ["**/node_modules/", "**/dist/", "**/.next/", "**/coverage/", "**/.coder/", "**/venv/", "**/public/"]
  },
  {
    files: ["**/*.{js,mjs}"],
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      }
    }
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
<<<<<<< HEAD
      "no-console": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-control-regex": "warn",
      "no-useless-escape": "warn"
=======
      "no-case-declarations": "off",
      "no-console": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-control-regex": "warn",
      "no-useless-escape": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    }
  }
);
