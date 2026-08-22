import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a esta carpeta. Sin esto, Turbopack infiere
  // la raíz en el directorio padre (que tiene otro package-lock.json) y no
  // encuentra el paquete de Next.js → panic "Next.js package not found".
  turbopack: {
    root: __dirname,
  },
  // MCP server en /_next/mcp (Next.js 16+). Solo en desarrollo: es una
  // herramienta de debug, no tiene por qué quedar expuesta en producción.
  experimental: {
    mcpServer: process.env.NODE_ENV !== 'production',
  },
  devIndicators: false,
  // /ilustracion es la grilla de control del sistema de ilustración: sirve
  // para trabajar, no para publicar. En producción no existe.
  //
  // Va acá y no con notFound() dentro de la página porque el layout de (main)
  // es un componente de cliente: el servidor devuelve igual un 200 con el
  // shell "Cargando…" y el notFound recién actuaría después de hidratar.
  async redirects() {
    if (process.env.NODE_ENV !== "production") return []
    return [{ source: "/ilustracion", destination: "/dashboard", permanent: false }]
  },
}

export default nextConfig
