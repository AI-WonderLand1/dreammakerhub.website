import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const timeframe = url.searchParams.get('timeframe') || '24h';

  const { data: performanceLogs } = await supabase
    .from('performance_logs')
    .select('*')
    .gte('created_at', new Date(Date.now() - (timeframe === '24h' ? 24 : 168) * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  const analytics = {
    responseTime: calculateResponseTime(performanceLogs || []),
    errorRate: calculateErrorRate(performanceLogs || []),
    throughput: calculateThroughput(performanceLogs || []),
    uptime: calculateUptime(performanceLogs || []),
    bottlenecks: identifyBottlenecks(performanceLogs || [])
  };

  return NextResponse.json({ analytics });
}

function calculateResponseTime(logs: any[]) {
  if (logs.length === 0) return { avg: 0, p95: 0, p99: 0 };

  const responseTimes = logs.map(log => log.response_time || 0).sort((a, b) => a - b);
  const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

  return { avg, p95, p99 };
}

function calculateErrorRate(logs: any[]) {
  if (logs.length === 0) return 0;

  const errors = logs.filter(log => log.error).length;
  return (errors / logs.length) * 100;
}

function calculateThroughput(logs: any[]) {
  if (logs.length < 2) return 0;

  const startTime = new Date(logs[logs.length - 1].created_at);
  const endTime = new Date(logs[0].created_at);
  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  return logs.length / hours;
}

function calculateUptime(logs: any[]) {
  if (logs.length === 0) return 100;

  const totalChecks = logs.length;
  const successfulChecks = logs.filter(log => !log.error).length;

  return (successfulChecks / totalChecks) * 100;
}

function identifyBottlenecks(logs: any[]) {
  const bottlenecks = [];

  const slowAICalls = logs.filter(log => log.service === 'ai' && (log.response_time || 0) > 5000);
  if (slowAICalls.length > logs.length * 0.1) {
    bottlenecks.push({
      service: 'AI Services',
      issue: 'Slow response times detected',
      severity: 'high'
    });
  }

  const storageErrors = logs.filter(log => log.service === 'storage' && log.error);
  if (storageErrors.length > logs.length * 0.05) {
    bottlenecks.push({
      service: 'Storage',
      issue: 'Frequent storage errors',
      severity: 'medium'
    });
  }

  return bottlenecks;
}
