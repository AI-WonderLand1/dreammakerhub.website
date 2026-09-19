import { describe, expect, it, vi } from 'vitest';

vi.mock('../apps/web/lib/builder/store', () => ({ useBuilderStore: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { FileFolderManager } from '../apps/web/lib/builder/pipeline/FileFolderManager';

const generateHtml = (elements: unknown[]) =>
  (new FileFolderManager() as unknown as { generateHtml: (elements: unknown[]) => string }).generateHtml(elements);

describe('WonderBuild generated site HTML', () => {
  it('publishes imported footers as footer elements, not sections', () => {
    const html = generateHtml([{
      id: 'footer-1',
      type: 'section',
      name: 'Footer',
      props: { semanticTag: 'footer' },
      styles: {},
      children: [{ id: 'text-1', type: 'paragraph', props: { content: 'Copyright' }, styles: {} }],
    }]);
    expect(html).toContain('<footer id="footer-1"');
    expect(html).toContain('</footer>');
    expect(html).toContain('Copyright');
  });

  it('cannot terminate its inline state script with user-controlled content', () => {
    const attack = '</script><script>alert(1)</script>';
    const html = generateHtml([{
      id: 'text-1', type: 'paragraph', props: { content: attack }, styles: {},
    }]);
    expect(html).not.toContain(attack);
    expect((html.match(/<script>/g) || []).length).toBe(1);
    expect((html.match(/<\/script>/g) || []).length).toBe(1);
    const serialized = html.match(/window\.__BUILDER_STATE__ = ([\s\S]*?);<\/script>/)?.[1];
    expect(serialized).toBeDefined();
    expect(serialized).toContain('\\u003c/script>');
    expect(JSON.parse(serialized!).elements[0].props.content).toBe(attack);
  });
});
