import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSmokeUserIdFromRequest } from '@lib/smokeAuth';

// Validation schema
const UnifiedAIRequestSchema = z.object({
  action: z.enum(['chat', 'agent', 'runner', 'worker', 'dashboard']).default('chat'),
  message: z.string().min(1).max(10000),
  agent: z.string().optional(),
  runner: z.string().optional(),
  context: z.object({
    page: z.string().optional(),
    userId: z.string().optional(),
    projectId: z.string().optional(),
    timestamp: z.number().optional(),
  }).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
});

// Agent mapping to existing endpoints
const AGENT_ENDPOINTS = {
  builder: '/api/agent',
  designer: '/api/agent', 
  debugger: '/api/agent',
  'spirit-guide': '/api/spirit-guide/chat',
  'project-runner': '/api/platform/options',
  'data-processor': '/api/platform/options',
};

// Runner mapping
const RUNNER_ENDPOINTS = {
  'ai-worker': '/api/ai/chat',
  'auth-worker': '/api/auth/verify',
  'file-worker': '/api/files/process',
  'data-worker': '/api/data/process',
};

// Dashboard actions
const DASHBOARD_ACTIONS = {
  'get-agents': '/api/platform/options',
  'get-status': '/api/platform/options',
  'manage-agent': '/api/agent',
  'execute-task': '/api/platform/options',
};

export async function POST(req: Request) {
  try {
    // Parse and validate input
    const jsonBody = await req.json();
    const result = UnifiedAIRequestSchema.safeParse(jsonBody);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }

    // Validate authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const smokeUserId = getSmokeUserIdFromRequest(req);

    if (!user && !smokeUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check subscription status for premium features
    const isPaid = Boolean(user?.app_metadata?.plan === "pro" || smokeUserId);
    const { action, message, agent, runner, context, history } = result.data;

    // Gate premium features based on subscription
    if ((action === 'agent' || action === 'runner') && !isPaid) {
      return NextResponse.json(
        { 
          error: 'Subscription required',
          message: 'This feature requires a Pro subscription',
          upgradeUrl: '/subscription'
        },
        { status: 402 } // Payment Required
      );
    }

    // Route to appropriate endpoint based on action
    switch (action) {
      case 'agent':
        return await handleAgentRequest(agent || 'builder', message, context, req);
      
      case 'runner':
        return await handleRunnerRequest(runner || 'ai-worker', message, context, req);
      
      case 'dashboard':
        return await handleDashboardRequest(message, context, req);
      
      case 'chat':
      default:
        return await handleChatRequest(message, agent, history, context, req);
    }

  } catch (error) {
    console.error('[Unified AI API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleAgentRequest(agent: string, command: string, context?: any, req?: Request) {
  // Validate agent exists
  if (!AGENT_ENDPOINTS[agent as keyof typeof AGENT_ENDPOINTS]) {
    return NextResponse.json(
      { error: `Unknown agent: ${agent}` },
      { status: 400 }
    );
  }

  try {
    // Forward to agent endpoint with authentication headers
    const agentEndpoint = AGENT_ENDPOINTS[agent as keyof typeof AGENT_ENDPOINTS];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Forward authentication headers
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };
    
    // Forward authorization header if present
    if (req) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        headers['authorization'] = authHeader;
      }
    }
    
    const response = await fetch(`${baseUrl}${agentEndpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agent: agent,
        command: command,
        context: context,
      }),
    });

    const data = await response.json();
    
    // Check if downstream endpoint returned an error
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || `Agent ${agent} returned an error` },
        { status: response.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      agent: agent,
      response: data.response || data.code || data.answer,
      suggestions: data.suggestions || [],
      dashboard: data.suggestDashboard || agent === 'builder',
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error(`[Unified AI] Agent ${agent} error:`, error);
    return NextResponse.json(
      { error: `Agent ${agent} unavailable` },
      { status: 503 }
    );
  }
}

async function handleRunnerRequest(runner: string, task: string, context?: any, req?: Request) {
  // Validate runner exists
  if (!RUNNER_ENDPOINTS[runner as keyof typeof RUNNER_ENDPOINTS]) {
    return NextResponse.json(
      { error: `Unknown runner: ${runner}` },
      { status: 400 }
    );
  }

  try {
    // Forward to runner endpoint with authentication headers
    const runnerEndpoint = RUNNER_ENDPOINTS[runner as keyof typeof RUNNER_ENDPOINTS];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };
    
    // Forward authorization header if present
    if (req) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        headers['authorization'] = authHeader;
      }
    }
    
    const response = await fetch(`${baseUrl}${runnerEndpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        task: task,
        runner: runner,
        context: context,
      }),
    });

    const data = await response.json();
    
    // Check if downstream endpoint returned an error
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || `Runner ${runner} returned an error` },
        { status: response.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      runner: runner,
      result: data.result || data.output,
      status: data.status || 'completed',
      logs: data.logs || [],
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error(`[Unified AI] Runner ${runner} error:`, error);
    return NextResponse.json(
      { error: `Runner ${runner} unavailable` },
      { status: 503 }
    );
  }
}

async function handleDashboardRequest(action: string, context?: any, req?: Request) {
  try {
    // Map dashboard actions to platform options API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    let endpoint = '/api/platform/options';
    let body: any = { action: 'list' };
    
    // Parse action string
    if (action.includes('status') || action.includes('get')) {
      body = { action: 'status' };
    } else if (action.includes('manage') || action.includes('agent')) {
      body = { action: 'manage' };
    } else if (action.includes('execute') || action.includes('run')) {
      body = { action: 'execute', task: action };
    }

    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };
    
    // Forward authorization header if present
    if (req) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        headers['authorization'] = authHeader;
      }
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      dashboard: true,
      data: data,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('[Unified AI] Dashboard request error:', error);
    return NextResponse.json(
      { error: 'Dashboard unavailable' },
      { status: 503 }
    );
  }
}

async function handleChatRequest(message: string, agent: string = 'spirit-guide', history?: any[], context?: any, req?: Request) {
  try {
    // Use spirit-guide as default chat endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };
    
    // Forward authorization header if present
    if (req) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        headers['authorization'] = authHeader;
      }
    }
    
    const response = await fetch(`${baseUrl}/api/spirit-guide/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: message,
        history: history || [],
        context: context,
      }),
    });

    const data = await response.json();
    
    // Determine if we should suggest dashboard
    const suggestDashboard = 
      message.toLowerCase().includes('dashboard') ||
      message.toLowerCase().includes('manage') ||
      message.toLowerCase().includes('settings') ||
      message.toLowerCase().includes('agent');

    return NextResponse.json({
      success: true,
      response: data.response || data.answer,
      suggestDashboard: suggestDashboard,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('[Unified AI] Chat error:', error);
    return NextResponse.json(
      { error: 'Chat service unavailable' },
      { status: 503 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'unified-ai',
    version: '1.0.0',
    endpoints: {
      chat: '/api/unified-ai (action: chat)',
      agent: '/api/unified-ai (action: agent)',
      runner: '/api/unified-ai (action: runner)',
      dashboard: '/api/unified-ai (action: dashboard)',
    },
    agents: Object.keys(AGENT_ENDPOINTS),
    runners: Object.keys(RUNNER_ENDPOINTS),
    timestamp: Date.now(),
  });
}