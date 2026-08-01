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
}

export default nextConfig
