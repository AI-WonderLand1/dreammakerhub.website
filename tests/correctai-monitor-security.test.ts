import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const monitor = readFileSync(new URL('../apps/web/public/correctai-monitor.js', import.meta.url), 'utf8');

describe('CorrectAI browser diagnostics security', () => {
  it('purges legacy events and never stores OAuth codes, access tokens or URL query strings', async () => {
    const leaked = 'DO_NOT_STORE_THIS_SECRET';
    const storage = new Map<string, string>([
      ['correctai_events', JSON.stringify([{ url: `https://dreammakerhub.website/api/auth/callback?code=${leaked}`, message: leaked, stack: leaked }])],
    ]);
    const handlers = new Map<string, (...args: any[]) => void>();
    const fetch = vi.fn(async () => ({ ok: false, status: 502 }));
    const window = {
      location: { href: `https://dreammakerhub.website/api/auth/callback?code=${leaked}#${leaked}` },
      fetch,
      addEventListener: (name: string, handler: (...args: any[]) => void) => handlers.set(name, handler),
      PerformanceObserver: undefined,
    };
    const document = {
      readyState: 'complete',
      body: {},
      title: 'DreamMakerHub',
      styleSheets: [],
      querySelectorAll: () => [],
      querySelector: () => ({}),
    };
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    };
    const broadcast = vi.fn();
    class BroadcastChannel {
      postMessage(value: unknown) { broadcast(value); }
      close() {}
    }
    runInNewContext(monitor, {
      window, document, localStorage, BroadcastChannel, URL, Date, Math,
      console: { info() {}, warn() {}, error() {} },
      setInterval() {}, MutationObserver: undefined, Request: undefined, XMLHttpRequest: undefined,
    });

    await window.fetch(`https://pod-19-sunco-ws.zendesk.com/sc/faye?sessionToken=${leaked}`);
    handlers.get('unhandledrejection')?.({ reason: new Error(leaked) });
    handlers.get('error')?.({ target: window, message: leaked, filename: `https://example.com/?token=${leaked}`, error: new Error(leaked), lineno: 5, colno: 2 });
    const saved = storage.get('correctai_events') || '';
    expect(saved).not.toContain(leaked);
    expect(saved).not.toContain('sessionToken');
    expect(saved).not.toContain('?code=');
    expect(saved).not.toContain('#');
    expect(saved).toContain('502');
    expect(broadcast.mock.calls.map(call => JSON.stringify(call[0])).join('\n')).not.toContain(leaked);
    expect(saved).not.toContain('stack');
  });
});
