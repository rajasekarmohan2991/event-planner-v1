import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['date-fns'],
  experimental: {
    serverComponentsExternalPackages: ['framer-motion'],
    optimizeCss: true,
    // removed deprecated/relocated options
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Skip static generation for admin routes
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://event-planner-v1.onrender.com'
        : 'http://localhost:8081'),
  },
  images: {
    domains: ['localhost', 'lottiefiles.com', 'assets8.lottiefiles.com'],
    unoptimized: true, // Disable image optimization if not needed
  },
  output: 'standalone',
  
  // Disable static optimization for admin routes
  async generateBuildId() {
    return 'build-' + Date.now()
  },
  
  // Handle font loading
  async headers() {
    return [
      {
        source: '/(.*).(woff|woff2|eot|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/styles': path.resolve(__dirname, './styles'),
    };

    // Handle font loading in webpack
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]',
      },
    });

    return config;
  },
};

export default nextConfig;
