import { FlatCompat } from "@eslint/eslintrc";
import sakinahRules from "./scripts/eslint-sakinah-rules.mjs";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      "coverage/**",
      "drizzle/**",
      "mobile/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/**",
      "Sakinah v7.html",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      sakinah: sakinahRules,
    },
    rules: {
      "sakinah/no-verified-component": "error",
      "sakinah/trust-chip-contract": "error",
      "sakinah/no-raw-sage": "error",
      "sakinah/no-raw-brass": "error",
    },
  },
];

export default config;
