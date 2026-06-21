import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Aturan React Compiler — terlalu ketat untuk codebase existing; jangan blokir deploy.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "prefer-const": "warn",
      "@typescript-eslint/no-this-alias": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "scripts/**",
  ]),
]);

export default eslintConfig;
