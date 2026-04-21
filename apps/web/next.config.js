/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';
const proxyBasePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';
const normalizedProxyBasePath =
  proxyBasePath && proxyBasePath !== '/' ? proxyBasePath.replace(/\/+$/, '') : '';

const nextConfig = {
  reactStrictMode: true,

  // Only enable a non-root base path when the deployment explicitly requires it.
  ...(!isDev && normalizedProxyBasePath
    ? {
        basePath: normalizedProxyBasePath,
        assetPrefix: normalizedProxyBasePath,
      }
    : {}),

  allowedDevOrigins: ["*.replit.dev", "*.kirk.replit.dev", "*.janeway.replit.dev", "*.worf.replit.dev", "*.repl.co"],

  experimental: {
    externalDir: true,
  },

  turbopack: {}, // Required when webpack config exists

  transpilePackages: ["@react-three/fiber", "@react-three/drei", "three", "@wonderspace/ide-engine"],

  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Headers for WebGL & Cross-Origin & Security
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
              test: /[\\/]node_modules[\\/](monaco|codemirror|ace)/,
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

  // Headers for WebGL & Cross-Origin & Security
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://js-mtls-com.s3.amazonaws.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' blob: data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://api.openrouter.ai https://*.vercel.app https://*.cloudflare.com",
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.vercel.app https://*.cloudflare.app blob: data:",
            "worker-src 'self' blob:",
          ].join('; ')
        },
      ],
    },
  ],
};

module.exports = nextConfig;
