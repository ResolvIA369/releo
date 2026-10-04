"use client";

import { usePathname } from "next/navigation";

// REleo responde en dos dominios de producción: releo.resolvia.online (el
// oficial) y releo-sable.vercel.app (el que generó Vercel, enlazado todavía
// desde algunas páginas de resolvia.online). El canonical le dice a los
// buscadores cuál es el oficial, página por página.
//
// Va en un componente cliente porque usePathname es la única forma de saber
// la ruta desde el layout raíz; React 19 lleva el <link> al <head> y sale en
// el HTML inicial. Sin query string a propósito: /demo?session=3 y /demo son
// la misma página para un buscador.
export const CANONICAL_ORIGIN = "https://releo.resolvia.online";

export function Canonical() {
  const pathname = usePathname() || "/";
  return <link rel="canonical" href={`${CANONICAL_ORIGIN}${pathname}`} />;
}
