'use client';
import React from 'react';
import { CanvasElement } from '@/lib/builder/types';

function renderBlockContent(el: CanvasElement): React.ReactNode {
  const p = el.props || {};
  switch (el.type) {
    case 'heading': {
      const Tag = (p.level || 'h2') as keyof React.JSX.IntrinsicElements;
      return <Tag>{p.content || 'Heading'}</Tag>;
    }
    case 'paragraph':
      return <p>{p.content || 'Paragraph'}</p>;
    case 'rich-text':
      return <div dangerouslySetInnerHTML={{ __html: p.content || '' }} />;
    case 'list': {
      const ListTag = p.listType === 'ordered' ? 'ol' : 'ul';
      return (
        <ListTag>
          {(p.items || []).map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    }
    case 'quote':
      return (
        <blockquote>
          <p>{p.content}</p>
          {p.citation && <cite>— {p.citation}</cite>}
        </blockquote>
      );
    case 'code':
      return (
        <pre>
          <code>{p.content}</code>
        </pre>
      );
    case 'preformatted':
      return <pre>{p.content}</pre>;
    case 'image':
      return (
        <figure>
          {p.src && <img src={p.src} alt={p.alt || ''} style={{ maxWidth: '100%' }} />}
          {p.caption && <figcaption>{p.caption}</figcaption>}
        </figure>
      );
    case 'video':
      return (
        <figure>
          <iframe
            src={p.src}
            style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: '0.5rem' }}
            allowFullScreen
          />
          {p.caption && <figcaption>{p.caption}</figcaption>}
        </figure>
      );
    case 'cover':
      return (
        <div
          style={{
            backgroundImage: p.src ? `url(${p.src})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundColor: p.overlay || 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>{p.content}</div>
        </div>
      );
    case 'button':
      return <a href={p.url || '#'}>{p.label || 'Button'}</a>;
    case 'gallery':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns || 3}, 1fr)`, gap: '0.75rem' }}>
          {(p.images || []).map((src: string, i: number) => (
            <img key={i} src={src} alt="" style={{ width: '100%', borderRadius: '0.5rem' }} />
          ))}
        </div>
      );
    case 'spacer':
      return <div style={{ height: p.height || '100px' }} />;
    case 'separator':
    case 'divider':
      return <hr />;
    case 'icon':
      return <div style={{ fontSize: p.size || '2rem', textAlign: 'center' }}>{p.icon || '✨'}</div>;
    case 'custom-html':
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: p.html || '' }} />;
    case 'accordion':
    case 'faq':
      return (
        <div>
          {(p.items || []).map((item: any, i: number) => (
            <details key={i}>
              <summary>{item.q || item.title}</summary>
              <p>{item.a || item.content}</p>
            </details>
          ))}
        </div>
      );
    case 'hero':
    case 'cta':
      return (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <h2>{p.title}</h2>
          <p>{p.subtitle}</p>
          <button>{p.cta || p.buttonText}</button>
        </div>
      );
    case 'testimonial':
      return (
        <figure>
          <blockquote>{p.quote}</blockquote>
          <figcaption>
            — {p.author}
            {p.role ? `, ${p.role}` : ''}
          </figcaption>
        </figure>
      );
    case 'card':
      return (
        <div>
          {p.image && <img src={p.image} alt="" style={{ width: '100%', borderRadius: '0.5rem' }} />}
          <h4>{p.title}</h4>
          <p>{p.content}</p>
        </div>
      );
    case 'stats-section':
      return (
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>
          {(p.stats || []).map((s: any, i: number) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.number}</p>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      );
    case 'navbar':
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>{p.logo}</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(p.links || []).map((l: any, i: number) => (
              <span key={i}>{l.label}</span>
            ))}
          </div>
        </div>
      );
    case 'login-form':
    case 'register-form':
    case 'password-reset':
      return (
        <div style={{ maxWidth: '320px', margin: '0 auto', textAlign: 'center' }}>
          <h4>{p.title}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.75rem 0' }}>
            <input placeholder="Email" style={inputStyle} />
            <input placeholder="Password" type="password" style={inputStyle} />
          </div>
          <button>{p.submitText}</button>
        </div>
      );
    case 'contact-form':
    case 'newsletter':
      return (
        <div style={{ textAlign: 'center' }}>
          {p.title && <h4>{p.title}</h4>}
          <input placeholder={p.placeholder || 'your@email.com'} style={inputStyle} />
          <button>{p.buttonText || p.submitText || 'Subscribe'}</button>
        </div>
      );
    case 'map':
      return (
        <div style={{ height: '100%' }}>
          <div style={{ height: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <iframe
              src={p.src || 'https://www.openstreetmap.org/export/embed.html?bbox=-0.004%2C51.476%2C0.005%2C51.480&layer=mapnik'}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      );
    case 'audio':
      return <audio controls src={p.src} style={{ width: '100%' }} />;
    case 'search':
    case 'wp-search':
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input placeholder={p.placeholder || 'Search...'} style={inputStyle} />
          <button>{p.buttonText || 'Search'}</button>
        </div>
      );
    default:
      return null;
  }
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: '0.375rem',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(0,0,0,0.4)',
  color: 'inherit',
  width: '100%',
};

export function WpBlockRenderer({ element }: { element: CanvasElement }) {
  const style: React.CSSProperties = {
    ...(element.styles || {}) as React.CSSProperties,
    position: 'relative',
    pointerEvents: 'none',
  };
  const content = renderBlockContent(element);
  const children = element.children?.map((child) => <WpBlockRenderer key={child.id} element={child} />);

  if (content === null && !children) {
    return <div style={style}>{element.icon} {element.name}</div>;
  }

  return (
    <div style={style}>
      {content}
      {children}
    </div>
  );
}
