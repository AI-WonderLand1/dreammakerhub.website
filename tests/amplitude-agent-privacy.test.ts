import { describe, expect, it, vi } from 'vitest';

const recorded = vi.hoisted(() => ({
  user: vi.fn(),
  ai: vi.fn(),
  flush: vi.fn(async () => {}),
}));

vi.mock('@amplitude/ai', () => ({
  AmplitudeAI: class {
    agent() {
      return {
        session() {
          return {
            run: async (callback: (session: { trackUserMessage: typeof recorded.user; trackAiMessage: typeof recorded.ai }) => Promise<void>) =>
              callback({ trackUserMessage: recorded.user, trackAiMessage: recorded.ai }),
          };
        },
      };
    }
    flush = recorded.flush;
  },
}));

import { trackAgentAnalyticsTurn } from '../engine/core/ai/amplitudeAgentAnalytics';

describe('Amplitude Agent Analytics privacy', () => {
  it('tracks useful metadata without transmitting prompt or response contents', async () => {
    vi.stubEnv('AMPLITUDE_AI_API_KEY', 'public-project-key-for-test');
    const prompt = 'Sensitive prompt containing PRIVATE_CANARY_PROMPT';
    const response = 'Sensitive answer containing PRIVATE_CANARY_RESPONSE';

    await trackAgentAnalyticsTurn({
      agentId: 'test-agent', sessionId: 'test-session',
      prompt, response, model: 'test-model', provider: 'test-provider', latencyMs: 234,
    });

    expect(recorded.user).toHaveBeenCalledTimes(1);
    expect(recorded.ai).toHaveBeenCalledTimes(1);
    expect(recorded.flush).toHaveBeenCalledTimes(1);
    const calls = JSON.stringify([recorded.user.mock.calls, recorded.ai.mock.calls]);
    expect(calls).not.toContain('PRIVATE_CANARY_PROMPT');
    expect(calls).not.toContain('PRIVATE_CANARY_RESPONSE');
    expect(recorded.user.mock.calls[0][0]).toBe('[content redacted]');
    expect(recorded.ai.mock.calls[0][0]).toBe('[content redacted]');
    expect(recorded.ai.mock.calls[0][1]).toBe('test-model');
    expect(recorded.ai.mock.calls[0][2]).toBe('test-provider');
    expect(recorded.ai.mock.calls[0][3]).toBe(234);
    vi.unstubAllEnvs();
  });
});
