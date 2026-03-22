import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...tseslint.configs.recommended,
  {
    rules: {
      // TypeScript - CRÍTICAS
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": false,
        "ts-nocheck": false
      }],
      "@typescript-eslint/consistent-type-imports": ["error", {
        "prefer": "type-imports"
      }],

      // React hooks
      "react-hooks/exhaustive-deps": "warn",

      // Best practices
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "error",
      "require-await": "error",
      "no-return-await": "error",

      // React
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",

      // Next.js
      "@next/next/no-img-element": "warn",
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "*.js"],
  },
];

export default eslintConfig;
