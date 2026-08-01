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

      // ── Diagnósticos del React Compiler → warn, no error ──────────────
      // eslint-plugin-react-hooks v6 marca como ERROR patrones que el React
      // Compiler no puede auto-memoizar. NO son bugs: acá son sobre todo el
      // game loop mutando refs (BitsReading, WordFishing) y algún Date.now()
      // dentro de un useMemo. La app no usa el compiler, así que en error solo
      // servían para dejar el lint permanentemente en rojo y por lo tanto
      // inservible como portón para código nuevo.
      //
      // Si algún día se activa el React Compiler (sería una mejora real de
      // performance en los juegos), volver a subirlas a "error" y encararlas
      // como tarea propia.
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
