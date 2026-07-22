import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pathAliases = {
    '@': __dirname,
    '@app': join(__dirname, 'app'),
    '@builder': join(__dirname, 'app/(builder)/wonder-build'),
    '@/core': join(__dirname, '../../engine/core'),
    '@core': join(__dirname, '../../engine/core'),
    '@engine': join(__dirname, '../../engine'),
    '@aetherguard': join(__dirname, '../../infra/aetherguard'),
    '@ai-modules': join(__dirname, 'ai-modules'),
    '@/ai-modules': join(__dirname, 'ai-modules'),
    '@styles': join(__dirname, 'styles'),
    '@/styles': join(__dirname, 'styles'),
    '@data': join(__dirname, 'data'),
    '@/data': join(__dirname, 'data'),
    '@utils': [join(__dirname, 'app/utils'), join(__dirname, 'utils')],
    '@/components': join(__dirname, 'components'),
    '@runners': join(__dirname, '../../runners'),
    '@infra': join(__dirname, '../../infra'),
    '@infra/*': join(__dirname, '../../infra/*'),
    '@infra/services': join(__dirname, '../../infra/services'),
    '@infra/lib': join(__dirname, '../../infra/lib'),
    '@/infra': join(__dirname, '../../infra'),
    '@/infra/*': join(__dirname, '../../infra/*'),
    '@services': join(__dirname, '../../infra/services'),
    '@lib': join(__dirname, './lib'),
    '@lib/*': join(__dirname, './lib/*'),
    '@types': join(__dirname, '../../types'),
    '@/ai-modules/EgyptianVoiceModule': join(__dirname, 'ai-modules/EgyptianVoiceModule'),
    '@/engine/core': join(__dirname, '../../engine/core'),
    '@/engine/core/ai': join(__dirname, '../../engine/core/ai'),
    '@/engine/core/ai/providers': join(__dirname, '../../engine/core/ai/providers'),
    '@/engine/core/ai/providers/index': join(__dirname, '../../engine/core/ai/providers/index'),
    '@/engine/core/ai/runModel': join(__dirname, '../../engine/core/ai/runModel'),
    '@/core/aetherguard/autofix': join(__dirname, '../../infra/aetherguard/autofix'),
    '@/core/aetherguard/checks/deadcode': join(__dirname, '../../infra/aetherguard/checks/deadcode'),
    '@/core/aetherguard/checks/deps': join(__dirname, '../../infra/aetherguard/checks/deps'),
    '@/core/aetherguard/checks/eslint': join(__dirname, '../../infra/aetherguard/checks/eslint'),
    '@/core/aetherguard/checks/typecheck': join(__dirname, '../../infra/aetherguard/checks/typecheck'),
    '@/core/aetherguard/repairs': join(__dirname, '../../infra/aetherguard/repairs'),
    '@/core/ai/bridge': join(__dirname, '../../engine/core/ai/bridge'),
    '@/core/ai/modules/registry': join(__dirname, '../../engine/core/ai/modules/registry'),
    '@/core/ai/personas': join(__dirname, '../../engine/core/ai/personas'),
    '@/core/ai/pipeline-v1/runtime/pipeline': join(__dirname, '../../engine/core/ai/pipeline-v1/runtime/pipeline'),
    '@/core/ai/promptBuilder': join(__dirname, '../../engine/core/ai/promptBuilder'),
    '@/core/ai/providers/groq': join(__dirname, '../../engine/core/ai/providers/groq'),
    '@/core/ai/providers/opencode': join(__dirname, '../../engine/core/ai/providers/opencode'),
    '@/core/ai/providers/openrouter': join(__dirname, '../../engine/core/ai/providers/openrouter'),
    '@/core/ai/runModel': join(__dirname, '../../engine/core/ai/runModel'),
    '@/core/ide/applyArtifact': join(__dirname, '../../engine/core/ide/applyArtifact'),
    '@/data/templates': join(__dirname, 'data/templates'),
    '@/infra/lib/supabase/server-client': join(__dirname, '../../infra/lib/supabase/server-client'),
    '@/infra/services/jobs/orchestrateScenePipeline': join(__dirname, '../../infra/services/jobs/orchestrateScenePipeline'),
    '@/infra/services/storage/promoteTempScene': join(__dirname, '../../infra/services/storage/promoteTempScene'),
    '@/infra/services/storage/provider': join(__dirname, '../../infra/services/storage/provider'),
    '@/runners/aetherguardWorker': join(__dirname, '../../runners/aetherguardWorker'),
    '@/runners/registry.worker': join(__dirname, '../../runners/registry.worker'),
  };

const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: '/wonder-build/preview',
        destination: '/wonder-build/studio',
        permanent: true,
      },
      {
        source: '/wonder-build/ai-builder',
        destination: '/wonder-build/studio',
        permanent: true,
      },
      {
        source: '/wonder-build/agent',
        destination: '/wonder-build/studio',
        permanent: true,
      },
    ];
  },

  allowedDevOrigins: [
    '*.replit.dev',
    '*.kirk.replit.dev',
    '*.janeway.replit.dev',
    '*.worf.replit.dev',
    '*.repl.co',
    '*.replit.app',
    '*.riker.replit.dev',
  ],

  experimental: {
    externalDir: true,
  },

  transpilePackages: ['@react-three/fiber', '@react-three/drei', 'three', '@wonderspace/ide-engine'],

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
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

    config.parallelism = 1;

    config.resolve.alias = {
      ...config.resolve.alias,
      ...pathAliases,
    };

    config.resolve.extensions = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.json',
      ...(config.resolve.extensions || []),
    ];

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
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://js.stripe.com https://replit.com https://static.cloudflareinsights.com",
            "style-src 'self' 'unsafe-inline' https://rsms.me",
            "img-src 'self' blob: data: https:",
            "font-src 'self' data: https://rsms.me",
            "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.openrouter.ai https://*.cloudflare.com https://replit.com https://*.replit.dev https://*.replit.app https://csp-reporting.cloudflare.com https://dreammakerhub.website https://hhdduixckgllodixrejp.supabase.co",
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.vercel.app https://*.cloudflare.app https://skybox.blockadelabs.com https://replit.com blob: data:",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join('; '),
        },
      ],
    },
  ],
};

export default nextConfig;
