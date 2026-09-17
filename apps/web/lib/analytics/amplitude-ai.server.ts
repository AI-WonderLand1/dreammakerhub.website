import 'server-only';

import { randomUUID } from 'node:crypto';
import { AmplitudeAI } from '@amplitude/ai';
import { logger } from '@/lib/logger';

type AgentTurnInput = {
  agentId: string;
  userId?: string;
  sessionId?: string;
  prompt: string;
  response: string;
  model: string;
  provider: string;
  latencyMs: number;
};

let amplitudeAI: AmplitudeAI | null | undefined;

function getAmplitudeAI(): AmplitudeAI | null {
  if (amplitudeAI !== undefined) return amplitudeAI;

  const apiKey = process.env.AMPLITUDE_AI_API_KEY;
  if (!apiKey) {
    amplitudeAI = null;
    return null;
  }

  amplitudeAI = new AmplitudeAI({ apiKey });
  return amplitudeAI;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Tracks one user-visible AI turn with Amplitude Agent Analytics.
 * Missing configuration is intentionally a no-op so analytics can never break AI responses.
 */
export async function trackAmplitudeAgentTurn({
  agentId,
  userId,
  sessionId,
  prompt,
  response,
  model,
  provider,
  latencyMs,
}: AgentTurnInput): Promise<void> {
  const ai = getAmplitudeAI();
  if (!ai) return;

  const resolvedSessionId = sessionId || randomUUID();
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens(response);

  try {
    const agent = ai.agent(agentId);
    const session = agent.session(
      userId
        ? { userId, sessionId: resolvedSessionId }
        : { deviceId: `dmh-${randomUUID()}`, sessionId: resolvedSessionId },
    );

    await session.run(async (s) => {
      s.trackUserMessage(prompt);
      s.trackAiMessage(response, model, provider, Math.max(1, latencyMs), {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      });
    });

    // Next.js route handlers can freeze quickly after returning, so flush explicitly.
    await ai.flush();
  } catch (error) {
    logger.warn('Amplitude Agent Analytics failed; AI response will continue normally.', error);
  }
}
