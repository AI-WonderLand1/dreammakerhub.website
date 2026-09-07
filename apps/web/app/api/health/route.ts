import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  const response = {
    status: 'healthy' as const,
    timestamp,
    services: {
      api: 'healthy' as const,
    },
    details: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage(),
      responseTime: Date.now() - startTime,
    },
  };

  logger.info('API health check completed', {
    status: response.status,
    responseTime: response.details.responseTime,
    timestamp,
  });

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'X-Health-Check': 'ok',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}
