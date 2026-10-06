import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('agent settings', () => {
  it('separates AI WONDERLAND-provided agents from user BYO providers and endpoints', () => {
    const page = read('apps/web/app/(workspace)/dashboard/settings/agents/page.tsx');
    expect(page).toContain('Provided by AI WONDERLAND');
    expect(page).toContain('Bring your own agent/provider');
    expect(page).toContain('WonderBuild Agent');
    expect(page).toContain('3D Asset AI');
    expect(page).toContain('AI Playground');
    for (const provider of ['OpenRouter', 'OpenAI-compatible', 'Anthropic', 'Google AI', 'Groq', 'Custom agent endpoint']) {
      expect(page).toContain(provider);
    }
    expect(page).toContain('/api/ai-providers/config');
    expect(page).toContain('Keys are write-only after save');
    expect(page).not.toContain('OPENROUTER_API_KEY');
  });

  it('links dashboard settings and agent hub to the dedicated agent settings page', () => {
    const settings = read('apps/web/app/(workspace)/dashboard/settings/page.tsx');
    const agents = read('apps/web/app/(workspace)/dashboard/agents/page.tsx');
    expect(settings).toContain('href="/dashboard/settings/agents"');
    expect(settings).toContain('Agents & AI Providers');
    expect(agents).toContain('href="/dashboard/settings/agents"');
    expect(agents).toContain('Agent Settings');
  });

  it('keeps BYO keys encrypted and exposes only write-only metadata to satellite apps', () => {
    const configRoute = read('apps/web/app/api/ai-providers/config/route.ts');
    const catalogRoute = read('apps/web/app/api/ai-providers/catalog/route.ts');

    expect(configRoute).toContain('encryptSecret');
    expect(configRoute).toContain('api_key_encrypted');
    expect(configRoute).not.toContain('apiKey: row.api_key');

    expect(catalogRoute).toContain('hasApiKey');
    expect(catalogRoute).toContain('Boolean(row?.api_key_encrypted)');
    expect(catalogRoute).not.toContain('api_key_iv');
    expect(catalogRoute).not.toContain('api_key_tag');
  });
});
