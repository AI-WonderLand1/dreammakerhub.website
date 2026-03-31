/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: ["*.replit.dev", "*.kirk.replit.dev", "*.janeway.replit.dev", "*.worf.replit.dev", "*.repl.co"],

  experimental: {
    externalDir: false,
  },

  turbopack: {},

  transpilePackages: ["@react-three/fiber", "@react-three/drei", "three"],

  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // WebGL & Heavy Module Configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side chunking strategy for better performance
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Separate heavy WebGL libraries from other node_modules
            webgl: {
              test: /[\\/]node_modules[\\/](three|@react-three|babylon)/,
              name: 'chunk-webgl',
              priority: 30,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate UI editor libraries
            editors: {
              test: /[\\/]node_modules[\\/](@measured|monaco|codemirror|ace)/,
              name: 'chunk-editors',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Main vendor chunk for everything else
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'chunk-vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common code shared between multiple entry points
            common: {
              minChunks: 2,
              name: 'chunk-common',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Handle raw shader files
    config.module.rules.push({
      test: /\.(glsl|vs|fs)$/,
      type: 'asset/source',
    });

    return config;
  },

  // Headers for WebGL & Cross-Origin
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ],
    },
  ],
};

module.exports = nextConfig;
