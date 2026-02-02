/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['date-fns'],
  experimental: {
    serverComponentsExternalPackages: ['framer-motion'],
    // Enable static file serving from public directory
    staticPageGenerationTimeout: 1000,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
  images: {
    domains: ['localhost'],
  },
  output: 'standalone',
  // Disable static optimization to avoid conflicts with API routes
  distDir: '.next',
  // Configure static file serving
  async rewrites() {
    return [
      // Serve static files from public/animations
      {
        source: '/animations/:path*',
        destination: '/_next/static/animations/:path*',
      },
    ]
  },
  // Add headers for static files
  async headers() {
    return [
      {
        source: '/animations/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, must-revalidate',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
