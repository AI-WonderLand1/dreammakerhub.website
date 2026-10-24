import { describe, expect, it } from 'vitest';
import { buildAssistantRequest } from '../apps/web/lib/ai/assistant-request';

const base = {
  agent: 'spirit-guide', message: 'what billing?', modelId: 'alice',
  page: '/dashboard/npc', history: [{ role: 'user' as const, content: 'Hello' }],
};

describe('Universal AI assistant request routing', () => {
  it('sends default chat to a real metered AI endpoint, including model and conversation', () => {
    expect(buildAssistantRequest(base)).toEqual({ url: '/api/chat', body: {
      message: 'what billing?', modelId: 'alice',
      context: { page: '/dashboard/npc' }, history: base.history,
    } });
  });

  it('honors a premium model selection instead of returning scripted support', () => {
    const request = buildAssistantRequest({ ...base, modelId: 'simplerick' });
    expect(request.url).toBe('/api/chat');
    expect(request.body).toMatchObject({ modelId: 'simplerick' });
  });

  it('uses scripted help only when explicitly selected', () => {
    const request = buildAssistantRequest({ ...base, agent: 'guided-support', message: 'x'.repeat(1300) });
    expect(request.url).toBe('/api/support/help');
    expect(request.body).toEqual({ message: 'x'.repeat(1200) });
  });

  it('preserves real specialized-agent routing', () => {
    expect(buildAssistantRequest({ ...base, agent: 'builder' })).toEqual({
      url: '/api/unified-ai', body: { action: 'agent', agent: 'builder',
        message: 'what billing?', context: { page: '/dashboard/npc' }, history: base.history },
    });
  });
});
