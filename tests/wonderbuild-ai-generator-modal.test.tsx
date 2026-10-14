// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AiGeneratorModal } from '../apps/web/lib/wonder-build/template-library/components/AiGeneratorModal';
import type { BatchDefinition } from '../apps/web/lib/wonder-build/template-library/types';
const batch: BatchDefinition = { batchNumber: 1, category: 'SaaS', categorySlug: 'saas', count: 2, variants: ['Minimal', 'Bold'], promptText: 'Generate two complete websites.', description: 'Two templates' };
const template = { id: 't1', name: 'Site', category: 'SaaS', description: '', thumbnail: '', elements: [{ type: 'section', content: 'Site' }] };
let root: Root | null = null;
async function renderDialog(onGeneratedSuccess: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  await act(async () => { root!.render(<AiGeneratorModal batch={batch} isOpen onClose={vi.fn()} onGeneratedSuccess={onGeneratedSuccess} />); });
  const run = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('Run Batch #1'))!;
  await act(async () => { run.click(); }); return container;
}
afterEach(async () => { if (root) await act(async () => root?.unmount()); root = null; document.body.innerHTML = ''; vi.unstubAllGlobals(); });
describe('Alice batch template dialog', () => {
  it('sends the requested size and adds a complete batch after the server succeeds', async () => {
    const fetchMock = vi.fn(async (_url: string, _options?: RequestInit) => Response.json({ success: true, templates: [template, { ...template, id: 't2' }] })); vi.stubGlobal('fetch', fetchMock);
    const onGeneratedSuccess = vi.fn(); const container = await renderDialog(onGeneratedSuccess);
    expect(onGeneratedSuccess).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toMatchObject({ templateCount: 2, variants: batch.variants });
    expect(container.textContent).toContain('Successfully Generated 2 Templates!'); expect(container.textContent).not.toContain('Gemini 3.6');
  });
  it('shows an incomplete response without adding it to the collection', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ success: true, templates: [template] })));
    const onGeneratedSuccess = vi.fn(); const container = await renderDialog(onGeneratedSuccess);
    expect(container.textContent).toContain('Alice did not return all 2'); expect(onGeneratedSuccess).not.toHaveBeenCalled(); expect(container.textContent).not.toContain('Successfully Generated');
  });
  it('keeps provider-unavailable errors visible and leaves the collection unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'Website generation is unavailable.' }, { status: 503 })));
    const onGeneratedSuccess = vi.fn(); const container = await renderDialog(onGeneratedSuccess);
    expect(container.textContent).toContain('Website generation is unavailable.'); expect(onGeneratedSuccess).not.toHaveBeenCalled();
  });
});
