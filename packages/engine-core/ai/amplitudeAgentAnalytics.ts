import { randomUUID } from 'node:crypto';
import { AmplitudeAI } from '@amplitude/ai';

export type AgentAnalyticsTurn = {
  agentId: string;
  sessionId?: string;
  userId?: string;
  prompt: string;
  response: string;
  model: string;
  provider: string;
  latencyMs: number;
};

let amplitudeAI: AmplitudeAI | null | undefined;

function client(): AmplitudeAI | null {
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

// Analytics must never copy user prompts, AI responses, credentials or project
// source code into a third-party telemetry service. Keep only timing, model,
// provider and approximate token counts; the contents are deliberately absent.
const REDACTED_MESSAGE = '[content redacted]';

export async function trackAgentAnalyticsTurn(turn: AgentAnalyticsTurn): Promise<void> {
  const ai = client();
  if (!ai) return;

  const inputTokens = estimateTokens(turn.prompt);
  const outputTokens = estimateTokens(turn.response);
  const sessionId = turn.sessionId || randomUUID();

  try {
    const agent = ai.agent(turn.agentId);
    const session = agent.session(
      turn.userId
        ? { userId: turn.userId, sessionId }
        : { deviceId: `dmh-${randomUUID()}`, sessionId },
    );

    await session.run(async (s) => {
      s.trackUserMessage(REDACTED_MESSAGE);
      s.trackAiMessage(
        REDACTED_MESSAGE,
        turn.model,
        turn.provider,
        Math.max(1, Math.round(turn.latencyMs)),
        {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
      );
    });

    await ai.flush();
  } catch (error) {
    // Provider error objects may contain request URLs or credentials.
    console.warn('Amplitude Agent Analytics failed; continuing without analytics.');
  }
}
