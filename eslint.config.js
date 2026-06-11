import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/node_modules/", "**/dist/", "**/.next/", "**/coverage/", "**/.coder/", "**/venv/", "**/public/"]
  },
  {
    files: ["**/*.js"],
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
      "no-console": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-control-regex": "warn",
      "no-useless-escape": "warn"
    }
  }
);
