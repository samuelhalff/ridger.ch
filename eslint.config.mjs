import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", ".worktrees/**", "dist/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "@next/next/no-css-tags": "warn",
    },
  },
];

export default eslintConfig;
