import { imageFromProps, imageSource } from './image-source';

const escape = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const image = (src: unknown, alt: unknown = '') => {
  const url = imageSource(src);
  return url ? `<img src="${escape(url)}" alt="${escape(alt)}" style="display:block;width:100%;height:180px;object-fit:cover;border-radius:inherit" />` : '';
};

/** Shared content for both HTML export paths; null delegates to the generic renderer. */
export function imageBlockHtml(type: string, props: Record<string, any>): string | null {
  const product = (item: Record<string, any>) => `${image(imageFromProps(item), item.alt || item.name)}<p>${escape(item.name)}</p><p>${escape(item.price)}</p>`;
  switch (type) {
    case 'product-card': return product(props);
    case 'product-grid': return (Array.isArray(props.products) ? props.products : [])
      .filter((item: unknown) => item && typeof item === 'object')
      .map((item: Record<string, any>) => `<div>${product(item)}</div>`).join('');
    case 'ai-image': return image(imageFromProps(props), props.alt || props.prompt);
    case 'image-carousel': return (Array.isArray(props.images) ? props.images : [])
      .map((src: unknown) => image(src, props.alt)).join('');
    case 'image-compare': return image(props.before || props.beforeSrc, props.labelBefore || 'Before')
      + image(props.after || props.afterSrc, props.labelAfter || 'After');
    default: return null;
  }
}
