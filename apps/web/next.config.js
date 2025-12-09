/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'api.qrserver.com'],
  },
  // Disable all caching for real-time data
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },
  output: 'standalone',
  // Force new build hash to break browser cache
  generateBuildId: async () => {
    return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`
  },
}

export default nextConfig
