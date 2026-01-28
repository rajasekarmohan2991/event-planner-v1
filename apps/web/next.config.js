/** @type {import('next').NextConfig} */

// Render backend URL - set in Vercel environment variables
const RENDER_BACKEND_URL = process.env.RENDER_BACKEND_URL || process.env.NEXT_PUBLIC_RENDER_BACKEND_URL || 'https://event-planner-api.onrender.com'

const nextConfig = {
  experimental: {
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Proxy specific API routes to Render backend
  async rewrites() {
    return [
      // Proxy Java backend specific endpoints to Render
      {
        source: '/api/backend/:path*',
        destination: `${RENDER_BACKEND_URL}/api/:path*`,
      },
      // Health check endpoint
      {
        source: '/api/health',
        destination: `${RENDER_BACKEND_URL}/api/health`,
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Avoid pulling in Node-only canvas dependency from konva during build
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
      'konva/lib/index-node': 'konva/lib/index',
    }
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas']
    }
    return config
  },
  // Disable all caching for real-time data
  async headers() {
    return [
      {
        source: '/api/map/static',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, immutable' },
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
