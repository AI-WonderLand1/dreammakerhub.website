import { imageSource } from '../image-source';

export function BlockImage({ src, alt = '', height = 180 }: { src: unknown; alt?: string; height?: number }) {
  const url = imageSource(src);
  return url ? (
    <img src={url} alt={alt} draggable={false} loading="lazy"
      style={{ display: 'block', width: '100%', height, objectFit: 'cover', borderRadius: 'inherit' }} />
  ) : (
    <div role="img" aria-label={alt || 'No image selected'}
      style={{ width: '100%', height, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 'inherit', fontSize: 12 }}>
      No image selected
    </div>
  );
}
