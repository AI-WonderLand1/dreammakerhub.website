import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: ["node_modules/", "dist/", ".next/", "coverage/", ".coder/"],
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/jsx-no-comment-textnodes": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
