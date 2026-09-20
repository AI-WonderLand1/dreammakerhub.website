import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { templateToCanvasElements, buildBuilderStatePayload } from '../apps/web/lib/wonder-build/template-library/utils/builderAdapter';
import { layoutRenderers } from '../apps/web/lib/builder/renderers/layout';
import type { WonderBuildTemplate } from '../apps/web/lib/wonder-build/template-library/types';

const template: WonderBuildTemplate = {
  id: 'test-template',
  name: 'Test template',
  description: 'Test template fidelity',
  category: 'Test',
  thumbnail: '',
  elements: [
    {
      type: 'div',
      styles: { width: '100%', maxWidth: '900px', margin: '12px 0' },
      children: [{ type: 'heading', content: 'Welcome', styles: { fontSize: '42px' } }],
    },
    { type: 'grid', children: [{ type: 'text', content: 'First' }] },
    { type: 'footer', styles: { backgroundColor: '#010203' }, children: [{ type: 'text', content: 'Copyright' }] },
  ],
};

describe('WonderBuild template import fidelity', () => {
  it('preserves authored container geometry, heading levels, grid layout and footer identity', () => {
    const [container, grid, footer] = templateToCanvasElements(template);
    expect(container.props.preserveTemplateLayout).toBe(true);
    expect(container.styles).toMatchObject({ width: '100%', maxWidth: '900px', margin: '12px 0' });
    expect(container.children?.[0]).toMatchObject({ type: 'heading', props: { content: 'Welcome', level: 'h1' } });
    expect(grid.styles.display).toBe('grid');
    expect(footer).toMatchObject({ type: 'section', name: 'Footer', props: { semanticTag: 'footer' } });
    expect(footer.children?.[0].props.content).toBe('Copyright');
    expect(new Set([container.id, container.children?.[0].id, grid.id, footer.id]).size).toBe(4);
  });

  it('renders imported container styles without imposing native 1200px defaults', () => {
    const container = templateToCanvasElements(template)[0];
    const markup = renderToStaticMarkup(layoutRenderers.container({
      el: container,
      baseProps: { style: container.styles },
      style: container.styles,
      children: React.createElement('span', null, 'Welcome'),
    } as any));
    expect(markup).toContain('max-width:900px');
    expect(markup).toContain('margin:12px 0');
    expect(markup).not.toContain('1200px');
  });

  it('renders imported footers as semantic footer elements', () => {
    const footer = templateToCanvasElements(template)[2];
    const markup = renderToStaticMarkup(layoutRenderers.section({
      el: footer,
      baseProps: { style: footer.styles },
      style: footer.styles,
      children: React.createElement('span', null, 'Copyright'),
    } as any));
    expect(markup).toMatch(/^<footer\b/);
    expect(markup).toContain('Copyright');
  });

  it('serializes a stable imported state without losing nested content', () => {
    const seeded = JSON.parse(buildBuilderStatePayload(template));
    expect(seeded.elements[0].children[0].props.content).toBe('Welcome');
    expect(seeded.elements[2].props.semanticTag).toBe('footer');
    expect(seeded.version).toBe(1);
  });
});
