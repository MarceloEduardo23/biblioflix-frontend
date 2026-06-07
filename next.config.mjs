/** @type {import('next').NextConfig} */

// URL do gateway visto PELO SERVIDOR do Next (mesma máquina). Como o gateway
// está publicado em localhost:8080, o padrão já serve. As chamadas do navegador
// vão para /gw/* e o Next as repassa para o gateway — um único endereço público
// (o do frontend) basta, e não há CORS.
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/gw/:path*', destination: `${GATEWAY_URL}/:path*` },
    ]
  },
}

export default nextConfig
