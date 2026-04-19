import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/utils/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    api: 'healthy' | 'unhealthy';
    database: 'healthy' | 'unhealthy' | 'not_configured';
    environment: 'healthy' | 'unhealthy';
    memory: 'healthy' | 'warning' | 'critical';
  };
  details: {
    uptime: number;
    nodeVersion: string;
    environment: string;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    supabaseConfigured: boolean;
    supabaseReachable: boolean;
  };
}

export async function GET() {
  const startTime = Date.now();
  const traceId = crypto.randomUUID();
  
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      api: 'healthy',
      database: 'not_configured',
      environment: 'healthy',
      memory: 'healthy'
    },
    details: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage(),
      supabaseConfigured: false,
      supabaseReachable: false
    }
  };

  try {
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    if (missingEnvVars.length > 0) {
      healthCheck.checks.environment = 'unhealthy';
      healthCheck.status = 'degraded';
      healthCheck.details.missingEnvVars = missingEnvVars;
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    if (memoryPercent > 90) {
      healthCheck.checks.memory = 'critical';
      healthCheck.status = 'unhealthy';
    } else if (memoryPercent > 70) {
      healthCheck.checks.memory = 'warning';
      healthCheck.status = 'degraded';
    }

    // Check Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      healthCheck.details.supabaseConfigured = true;
      
      try {
        // Test Supabase connection
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.from('puck_projects').select('count').limit(1);
        
        if (!error) {
          healthCheck.checks.database = 'healthy';
          healthCheck.details.supabaseReachable = true;
        } else {
          healthCheck.checks.database = 'unhealthy';
          healthCheck.status = 'degraded';
          healthCheck.details.supabaseError = error.message;
        }
      } catch (dbError: any) {
        healthCheck.checks.database = 'unhealthy';
        healthCheck.status = 'degraded';
        healthCheck.details.supabaseError = dbError.message;
      }
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;
    healthCheck.details.responseTime = responseTime;

    // Determine overall status
    const unhealthyChecks = Object.values(healthCheck.checks).filter(
      status => status === 'unhealthy'
    ).length;
    
    const degradedChecks = Object.values(healthCheck.checks).filter(
      status => status === 'warning'
    ).length;

    if (unhealthyChecks > 0) {
      healthCheck.status = 'unhealthy';
    } else if (degradedChecks > 0) {
      healthCheck.status = 'degraded';
    }

    // Log health check
    logger.info('Health check performed', {
      traceId,
      status: healthCheck.status,
      responseTime,
      memoryPercent: Math.round(memoryPercent)
    });

    // Return appropriate HTTP status
    const statusCode = healthCheck.status === 'healthy' ? 200 :
                      healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, {
      status: statusCode,
      headers: {
        'X-Trace-Id': traceId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    logger.error('Health check failed', {
      traceId,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message,
      traceId
    }, {
      status: 503,
      headers: {
        'X-Trace-Id': traceId
      }
    });
  }
}

// Simple ping endpoint
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Check': 'ok',
      'Cache-Control': 'no-cache'
    }
  });
}