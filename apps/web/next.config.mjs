import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === 'development';
const proxyBasePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';
const normalizedProxyBasePath =
  proxyBasePath && proxyBasePath !== '/' ? proxyBasePath.replace(/\/+$/, '') : '';

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: join(__dirname, '..', '..'),
  },

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

  transpilePackages: ["@react-three/fiber", "@react-three/drei", "three", "@wonderspace/ide-engine"],

  images: {
    unoptimized: true,
  },

  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            webgl: {
              test: /[\\/]node_modules[\\/](three|@react-three|babylon)/,
              name: 'chunk-webgl',
              priority: 30,
              reuseExistingChunk: true,
              enforce: true,
            },
            editors: {
              test: /[\\/]node_modules[\\/](monaco|codemirror|ace)/,
              name: 'chunk-editors',
              priority: 25,
              reuseExistingChunk: true,
              enforce: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'chunk-vendors',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    config.module.rules.push({
      test: /\.(glsl|vs|fs)$/,
      type: 'asset/source',
    });

    return config;
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://js-mtls-com.s3.amazonaws.com",
            "style-src 'self' 'unsafe-inline' https://rsms.me",
            "img-src 'self' blob: data: https:",
            "font-src 'self' data: https://rsms.me",
            "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://api.openrouter.ai https://*.cloudflare.com",
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.vercel.app https://*.cloudflare.app https://skybox.blockadelabs.com blob: data:",
            "worker-src 'self' blob:",
          ].join('; ')
        },
      ],
    },
  ],
};

export default nextConfig;