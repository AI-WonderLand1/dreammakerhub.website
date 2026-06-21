import { NextResponse } from 'next/server';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  
  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      ai: 'healthy',
      auth: 'healthy',
      database: 'healthy',
    },
    details: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage(),
      responseTime: 0,
    }
  };
  
  try {
    // Test basic API endpoint
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health`);
    if (!apiResponse.ok) {
      checks.services.api = 'unhealthy';
      checks.status = 'degraded';
    }
    
    // Test AI endpoint (basic connectivity test)
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'health check' })
    }).catch(() => null);
    
    if (!aiResponse?.ok) {
      checks.services.ai = 'degraded';
      checks.status = 'degraded';
    }
    
    // Test auth endpoint
    const authResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/auth`);
    if (!authResponse.ok) {
      checks.services.auth = 'unhealthy';
      checks.status = 'degraded';
    }
    
    // Test database endpoint
    const dbResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/db`);
    if (!dbResponse.ok) {
      checks.services.database = 'unhealthy';
      checks.status = 'degraded';
    }
    
    // Test AI service specifically
    const aiServiceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/ai`);
    if (!aiServiceResponse.ok) {
      checks.services.ai = 'unhealthy';
      checks.status = 'degraded';
    }
    
    // Calculate response time
    checks.details.responseTime = Date.now() - startTime;
    
    // Log the health check
    console.log('Health check completed:', {
      status: checks.status,
      responseTime: checks.details.responseTime,
      services: checks.services,
      timestamp: checks.timestamp,
    });
    
    return NextResponse.json(checks, {
      status: checks.status === 'healthy' ? 200 : 503,
      headers: {
        'X-Health-Check': 'ok',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 503 });
  }
}
