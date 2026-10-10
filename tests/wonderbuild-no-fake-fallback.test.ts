import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(
  join(process.cwd(), 'apps/web/lib/builder/components/AIAssistantPanel.tsx'),
  'utf8',
);

describe('WonderBuild failure transparency', () => {
  it('does not silently add placeholder blocks when a model request fails', () => {
    expect(source).not.toContain('FALLBACK_BLOCKS');
    expect(source).not.toContain('addFallbackBlock(');
    expect(source).not.toContain('applyQuickLocalEdit(');
    expect(source).not.toContain('so I used the safe local fallback');
    expect(source).toContain('No AI-generated changes were applied.');
    expect(source).toContain('setInput(promptText);');
  });

  it('only reports live builder actions after the provider returned valid actions', () => {
    expect(source).toContain('const actions = extractActions(reply)');
    expect(source).toContain("if (applied.length === 0) throw new Error");
    expect(source).toContain('confirmedChanges++');
  });
});
