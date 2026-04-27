import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

// Error response format
export interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  traceId?: string;
  timestamp: string;
}

/**
 * Global error handler middleware for API routes
 * Wrap your API route handlers with this function
 */
export function withErrorHandler<T = any>(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // Log request
      logger.debug('API Request', {
        traceId,
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      
      // Execute handler
      const response = await handler(req, ...args);
      
      // Log successful response
      const duration = Date.now() - startTime;
      logger.debug('API Response', {
        traceId,
        method: req.method,
        url: req.url,
        status: response.status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Add trace ID to response headers
      response.headers.set('X-Trace-Id', traceId);
      
      return response;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Handle known error types
      if (error instanceof AppError) {
        logger.warn('Handled API Error', {
          traceId,
          errorCode: error.code,
          statusCode: error.statusCode,
          message: error.message,
          url: req.url,
          duration: `${duration}ms`,
          details: error.details
        });
        
        const errorResponse: ErrorResponse = {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          },
          traceId,
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(errorResponse, {
          status: error.statusCode,
          headers: {
            'X-Trace-Id': traceId
          }
        });
      }
      
      // Handle unexpected errors
      logger.error('Unhandled API Error', {
        traceId,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        url: req.url,
        method: req.method,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Don't leak internal error details in production
      const isProduction = process.env.NODE_ENV === 'production';
      const errorMessage = isProduction 
        ? 'An unexpected error occurred'
        : error.message;
      
      const errorResponse: ErrorResponse = {
        ok: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
          details: isProduction ? undefined : { stack: error.stack }
        },
        traceId,
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(errorResponse, {
        status: 500,
        headers: {
          'X-Trace-Id': traceId
        }
      });
    }
  };
}

/**
 * Utility to create standardized error responses
 */
export function createErrorResponse(
  error: ApiError | Error,
  traceId?: string
): NextResponse<ErrorResponse> {
  const statusCode = (error as ApiError).statusCode || 500;
  const code = (error as ApiError).code || 'INTERNAL_ERROR';
  
  const errorResponse: ErrorResponse = {
    ok: false,
    error: {
      code,
      message: error.message,
      details: (error as ApiError).details
    },
    traceId,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(errorResponse, {
    status: statusCode,
    headers: traceId ? { 'X-Trace-Id': traceId } : undefined
  });
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: any
): Promise<T> {
  try {
    const body = await req.json();
    const result = await schema.safeParseAsync(body);
    
    if (!result.success) {
      throw new ValidationError('Invalid request body', result.error.errors);
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid JSON body');
  }
}

/**
 * Rate limiting middleware
 */
export function createRateLimiter(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  
  // Clean up old entries periodically
  cleanupIntervalId = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }
  }, 60 * 1000); // Clean every minute
  
  const cleanup = () => {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
      cleanupIntervalId = null;
    }
    requests.clear();
  };
  
  return {
    limiter: (identifier: string): { allowed: boolean; remaining: number } => {
      const now = Date.now();
      const requestData = requests.get(identifier);
      
      if (!requestData || now > requestData.resetTime) {
        // First request or window expired
        requests.set(identifier, {
          count: 1,
          resetTime: now + windowMs
        });
        return { allowed: true, remaining: maxRequests - 1 };
      }
      
      if (requestData.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
      }
      
      requestData.count++;
      return { allowed: true, remaining: maxRequests - requestData.count };
    },
    cleanup
  };
}