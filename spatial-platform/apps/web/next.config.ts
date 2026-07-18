import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@spatial/core',
    '@spatial/engine-core',
    '@spatial/plugin-sdk',
    '@spatial/ai-npc',
    '@spatial/marketplace',
    '@spatial/multiplayer',
    '@spatial/video-streaming',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
