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
  const timeframe = url.searchParams.get('timeframe') || '30d';

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: usage } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000).toISOString());

  const analytics = {
    subscription: subscription,
    usage: calculateUsageMetrics(usage || [], subscription),
    predictions: predictFutureUsage(usage || []),
    recommendations: generateRecommendations(usage || [], subscription)
  };

  return NextResponse.json({ analytics });
}

function calculateUsageMetrics(usage: any[], subscription: any) {
  const currentPeriod = {
    aiTokens: usage.reduce((sum, log) => sum + (log.ai_tokens || 0), 0),
    storage: usage.reduce((sum, log) => sum + (log.storage_used || 0), 0),
    projects: usage.reduce((sum, log) => sum + (log.projects_count || 0), 0),
    collaborators: usage.reduce((sum, log) => sum + (log.collaborators_count || 0), 0)
  };

  return {
    currentPeriod,
    limits: subscription?.plan_limits || {},
    usagePercentage: {
      aiTokens: (currentPeriod.aiTokens / (subscription?.plan_limits?.ai_tokens || 1)) * 100,
      storage: (currentPeriod.storage / (subscription?.plan_limits?.storage || 1)) * 100,
      projects: (currentPeriod.projects / (subscription?.plan_limits?.projects || 1)) * 100
    }
  };
}

function predictFutureUsage(usage: any[]) {
  if (usage.length < 2) return { trend: 'stable', prediction: 0 };

  const currentUsage = usage[usage.length - 1];
  const previousUsage = usage[usage.length - 2];

  const aiTokensGrowth = ((currentUsage.ai_tokens || 0) - (previousUsage.ai_tokens || 0)) / (previousUsage.ai_tokens || 1);
  const storageGrowth = ((currentUsage.storage_used || 0) - (previousUsage.storage_used || 0)) / (previousUsage.storage_used || 1);

  return {
    aiTokensTrend: aiTokensGrowth > 0.1 ? 'increasing' : aiTokensGrowth < -0.1 ? 'decreasing' : 'stable',
    storageTrend: storageGrowth > 0.1 ? 'increasing' : storageGrowth < -0.1 ? 'decreasing' : 'stable',
    nextPeriodPrediction: {
      aiTokens: (currentUsage.ai_tokens || 0) * (1 + aiTokensGrowth),
      storage: (currentUsage.storage_used || 0) * (1 + storageGrowth)
    }
  };
}

function generateRecommendations(usage: any[], subscription: any) {
  const recommendations = [];

  const currentUsage = usage[usage.length - 1] || {};
  const limits = subscription?.plan_limits || {};

  if ((currentUsage.ai_tokens || 0) / (limits.ai_tokens || 1) > 0.8) {
    recommendations.push({
      type: 'upgrade',
      message: 'You are approaching your AI token limit. Consider upgrading your plan.',
      action: 'Upgrade Plan'
    });
  }

  if ((currentUsage.storage_used || 0) / (limits.storage || 1) > 0.8) {
    recommendations.push({
      type: 'cleanup',
      message: 'Your storage is nearly full. Consider cleaning up old projects.',
      action: 'Manage Storage'
    });
  }

  return recommendations;
}
