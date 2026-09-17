import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const layout = readFileSync(join(process.cwd(), 'apps/web/app/layout.tsx'), 'utf8');
const contact = readFileSync(join(process.cwd(), 'apps/web/app/(public)/contact/page.tsx'), 'utf8');

describe('Zendesk support chat placement', () => {
  it('does not load Zendesk globally or remove the DreamMakerHub AI assistant', () => {
    expect(layout).not.toContain('static.zdassets.com/ekr/snippet.js');
    expect(layout).toContain('<UniversalAIAssistant');
  });

  it('loads the real Zendesk widget only after a support button click', () => {
    expect(contact).toContain('onClick={openSupportChat}');
    expect(contact).toContain('Contact support');
    expect(contact).toContain('Live chat');
    expect(contact).toContain('{scriptRequested && (');
    expect(contact).toContain('static.zdassets.com/ekr/snippet.js');
    expect(contact).toContain('zendesk("messenger", "open")');
  });

  it('hides the widget on navigation and retains email fallback when it cannot load', () => {
    expect(contact).toContain('window.zE?.("messenger", "hide")');
    expect(contact).toContain('onError={handleZendeskError}');
    expect(contact).toContain('mailto:${zendeskSupportEmail}');
  });
});
