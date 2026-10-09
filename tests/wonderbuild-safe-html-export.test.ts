import { beforeEach, describe, expect, it, vi } from 'vitest';

const events = vi.hoisted(() => ({ emit: vi.fn(), on: vi.fn(() => () => {}) }));
const model = vi.hoisted(() => ({ elements: [] as any[] }));

vi.mock('../apps/web/lib/builder/pipeline/EventBus', () => ({ getEventBus: () => events }));
vi.mock('../apps/web/lib/builder/store', () => ({
  useBuilderStore: { getState: () => ({ elements: model.elements }) },
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

import { FileFolderManager } from '../apps/web/lib/builder/pipeline/FileFolderManager';
import { CodeGenerationService } from '../apps/web/lib/builder/pipeline/CodeGenerationService';
import { EventNames } from '../apps/web/lib/builder/pipeline/types';
import {
  safeCssDeclarations, safeExportAttributes, safeExportUrl,
} from '../apps/web/lib/builder/safe-export-html';

const generateFiles = (elements: any[]) => {
  const manager = new FileFolderManager() as any;
  return { html: manager.generateHtml(elements) as string, css: manager.generateCss(elements) as string };
};

const generatePreview = (elements: any[]) => {
  model.elements = elements;
  const service = new CodeGenerationService() as any;
  service.emitPreviewUpdate();
  const event = events.emit.mock.calls.find(([name]) => name === EventNames.PREVIEW_UPDATED);
  expect(event).toBeDefined();
  return event![1] as { html: string; css: string };
};

beforeEach(() => {
  events.emit.mockClear();
  model.elements = [];
});

describe('untrusted builder HTML export serialization', () => {
  it('keeps common safe absolute and relative links', () => {
    for (const url of [
      'https://example.com/a?q=1&b=2',
      'http://example.org',
      '/about', './about', '../contact', '#pricing',
      'features/page.html', 'mailto:hello@example.org', 'tel:+12025550123',
    ]) expect(safeExportUrl(url, 'link')).toBe(url);
    expect(safeExportUrl('data:image/png;base64,AA==', 'image'))
      .toBe('data:image/png;base64,AA==');
  });

  it.each([
    'javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\nscript:alert(1)',
    'data:text/html,<svg onload=alert(1)>',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'vbscript:msgbox(1)', '//evil.example.org/path', 'https://',
    'https://user:pass@example.org/', 'x:evil', 'https:\\evil.example.org',
  ])('rejects unsafe links and malformed sources: %s', (url) => {
    expect(safeExportUrl(url, 'link')).toBe('');
    expect(safeExportUrl(url, 'image')).toBe('');
  });

  it('escapes event-handler injection in all dynamic attributes', () => {
    const attr = safeExportAttributes({
      id: 'x" onclick="alert(1)',
      type: 'button" onmouseover="alert(1)',
      props: {
        'aria-label': 'hey" onfocus="alert(1)',
        href: 'javascript:alert(1)',
        alt: 'a"><script>alert(1)</script>',
      },
      styles: { fontFamily: '"Open Sans"', color: 'red" onfocus="alert(1)' },
    }, [0], 'files');
    expect(attr).not.toMatch(/\s(?:onclick|onfocus|onmouseover)="/);
    expect(attr).toContain('id="x&quot; onclick=&quot;alert(1)"');
    expect(attr).toContain('class="builder-block block-button-onmouseover-alert-1 aw-scope-0"');
    expect(attr).not.toContain('href=');
    expect(attr).not.toContain('<script>');
    expect(attr).toContain('font-family: &quot;Open Sans&quot;');
  });

  it('rejects dangerous CSS declarations but retains normal typography', () => {
    const css = safeCssDeclarations({
      color: '#fff',
      fontSize: '1.25rem',
      background: 'linear-gradient(90deg, red, blue)',
      fontFamily: '"Open Sans", sans-serif',
      backgroundImage: 'url(https://bad.example/collect)',
      borderColor: 'red; } body { display:none',
      '-moz-binding': 'url(https://bad.example/x)',
      'x}{body': 'display:none',
      width: 'expression(alert(1))',
      height: '10px\ncolor:red',
    }).join('; ');
    expect(css).toContain('font-size: 1.25rem');
    expect(css).toContain('linear-gradient');
    expect(css).not.toContain('url(');
    expect(css).not.toContain('expression(');
    expect(css).not.toContain('display:none');
    expect(css).not.toContain('-moz-binding');
  });

  it('escapes hostile nested HTML in file export and code preview', () => {
    const elements = [{
      id: 'parent" autofocus onfocus="alert(1)',
      type: 'section',
      props: { href: 'javascript:alert(1)' },
      styles: { backgroundColor: '#123456' },
      children: [{
        id: 'child-1',
        type: 'button',
        props: { content: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)' },
        styles: { color: 'pink' },
      }],
    }];
    const files = generateFiles(elements);
    const preview = generatePreview(elements);
    for (const html of [files.html, preview.html]) {
      expect(html).not.toMatch(/\shref="javascript:/);
      // Escaped attribute *values* may contain the literal text "onfocus=",
      // but must never produce a quoted, executable event-handler attribute.
      expect(html).not.toMatch(/\sonfocus\s*=\s*["']/);
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).toContain('aw-scope-0-0');
    }
    expect(files.css).toContain('.aw-scope-0-0');
    expect(preview.css).toContain('.aw-scope-0-0');
  });

  it('maintains separate styling for sibling elements of the same type', () => {
    const elements = [
      { id: 'one', type: 'paragraph', props: { content: 'First' }, styles: { color: 'red' } },
      { id: 'two', type: 'paragraph', props: { content: 'Second' }, styles: { color: 'blue' } },
    ];
    const files = generateFiles(elements);
    const preview = generatePreview(elements);
    for (const generated of [files, preview]) {
      expect(generated.css).toContain('.aw-scope-0 {\n  color: red;');
      expect(generated.css).toContain('.aw-scope-1 {\n  color: blue;');
      expect(generated.html).toContain('aw-scope-0');
      expect(generated.html).toContain('aw-scope-1');
    }
  });

  it('does not execute user-provided custom HTML as real markup in preview', () => {
    const preview = generatePreview([{
      id: 'custom',
      type: 'custom-html',
      props: { html: '<script>alert(1)</script><img src=x onerror=alert(2)>' },
      styles: {},
    }]);
    expect(preview.html).not.toContain('<script>alert(1)</script>');
    expect(preview.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(preview.html).not.toContain('<img src=x onerror=alert(2)>');
  });
});
