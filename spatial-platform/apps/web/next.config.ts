import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@spatial/engine-core': path.resolve(__dirname, 'src/stubs/engine-core.ts'),
      '@spatial/core': path.resolve(__dirname, 'src/stubs/core.ts'),
      '@dreammakerhub/gesture-engine': path.resolve(__dirname, 'src/stubs/gesture-engine.ts'),
    }
    return config
  },
  eslint: { ignoreDuringBuilds: true },
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
