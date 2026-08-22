import { notFound } from "next/navigation";
import IlustracionPreview from "./Preview";

// Herramienta de desarrollo: en producción esta ruta no existe. Mismo criterio
// que el MCP server de next.config.ts — sirve para trabajar, no es algo que
// deba quedar colgando en releo.resolvia.online para quien adivine la URL.
//
// El chequeo va en un componente de servidor a propósito: en el cliente el
// servidor igual devolvía 200 con el shell "Cargando…" y el 404 recién
// aparecía después de hidratar.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <IlustracionPreview />;
}
