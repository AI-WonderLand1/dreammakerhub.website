import next from "eslint-config-next";

export default [
  ...next,
  {
    ignores: ["node_modules/", "dist/", ".next/", "coverage/", ".coder/"]
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/jsx-no-comment-textnodes": "off", 
      "react/no-unescaped-entities": "off"
    }
  }
];