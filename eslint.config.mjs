// ESLint 9 usa "flat config". Sin este archivo, `eslint` no corre
// (ESLint 9 ya no lee .eslintrc) y `next lint` no existe desde Next 16.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "scripts/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // REleo no usa next/image a propósito en varios lugares (personajes con
      // tamaño fijo servidos ya optimizados por scripts/optimize-assets.mjs).
      "@next/next/no-img-element": "warn",
    },
  },
];
