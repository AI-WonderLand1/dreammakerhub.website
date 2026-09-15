import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { commerceRenderers } from '../apps/web/lib/builder/renderers/commerce';
import { mediaRenderers } from '../apps/web/lib/builder/renderers/media';
import { imageBlockHtml } from '../apps/web/lib/builder/image-block-html';
import type { RendererCtx } from '../apps/web/lib/builder/renderers/types';

vi.mock('@/lib/security/sanitize-html.client', () => ({ sanitizeBuilderSvg: (v: string) => v, sanitizeEmbedUrl: (v: string) => v, sanitizeYouTubeVideoId: (v: string) => v }));
const url = 'https://example.com/coffee.jpg';
function render(type: string, props: Record<string, unknown>) {
  const ctx: RendererCtx = { el: { id: 'coffee', type, name: type, props, styles: {} }, selectedId: null, selectElement: () => {}, baseProps: {}, style: {}, children: null };
  return renderToStaticMarkup((commerceRenderers[type] || mediaRenderers[type])(ctx));
}

describe('saved builder images', () => {
  it('renders the actual product image and title', () => {
    const html = render('product-card', { name: 'Latte', image: url, price: '$3.50' });
    expect(html).toContain(`src="${url}"`);
    expect(html).toContain('alt="Latte"');
    expect(html).toContain('$3.50');
  });
  it('renders product data instead of skeletons', () => {
    expect(render('product-grid', { products: [{ name: 'Espresso', image: url }] })).toContain(`src="${url}"`);
  });
  it.each(['ai-image', 'product-card'])('supports inline generated images in %s', (type) => {
    const inline = 'data:image/png;base64,iVBORw0KGgo=';
    expect(render(type, { src: inline })).toContain(`src="${inline}"`);
  });
  it('shows carousel and comparison images', () => {
    expect(render('image-carousel', { images: [url, `${url}?second`] })).toContain(`${url}?second`);
    expect(render('image-compare', { before: url, after: `${url}?after` })).toContain(`${url}?after`);
  });
  it('does not create unsafe or empty image sources', () => {
    expect(render('product-card', { image: 'javascript:alert(1)' })).not.toContain('<img');
    expect(render('ai-image', { src: '' })).not.toContain('<img');
  });
  it.each(['product-card', 'product-grid', 'ai-image', 'image-carousel', 'image-compare'])('preserves %s images in HTML exports', (type) => {
    const props = { image: url, products: [{ image: url, name: '<Latte>' }], images: [url], before: url };
    expect(imageBlockHtml(type, props)).toContain(`src="${url}"`);
  });
  it('escapes product text and image attributes in exported HTML', () => {
    const html = imageBlockHtml('product-card', { image: `${url}" onerror="bad`, name: '<script>bad</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&quot; onerror=&quot;bad');
  });
});
