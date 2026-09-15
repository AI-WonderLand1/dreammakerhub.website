/** Keep image URLs usable in the editor, published pages, and exported HTML. */
export function imageSource(value: unknown): string {
  if (typeof value !== 'string') return '';
  const source = value.trim();
  if (/^https?:\/\//i.test(source) || /^blob:/i.test(source)
    || /^data:image\/(?:png|jpeg|webp|gif|avif);base64,/i.test(source)
    || /^\/(?!\/)/.test(source)) return source;
  return '';
}

export function imageFromProps(props: Record<string, unknown>): string {
  return imageSource(props.image) || imageSource(props.src) || imageSource(props.imageUrl);
}
