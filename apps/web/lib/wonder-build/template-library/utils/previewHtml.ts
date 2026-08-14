import { WonderBuildElement } from '../types';

// Convert camelCase CSS keys to kebab-case for inline styles.
function toCss(styles?: Record<string, string | number>): string {
  if (!styles) return '';
  return Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
    .join(';');
}

const GENERIC_IMAGE_HOSTS = /picsum|placehold\.co|dummyimage|via\.placeholder|unsplash/;

function renderElement(el: WonderBuildElement): string {
  const style = toCss(el.styles);
  const children = (el.children || []).map(renderElement).join('\n');

  switch (el.type) {
    case 'heading': {
      const size = typeof el.styles?.fontSize === 'number' ? el.styles.fontSize : 0;
      const tag = size > 28 ? 'h1' : size > 20 ? 'h2' : 'h3';
      return `<${tag} style="${style}">${el.content || ''}</${tag}>`;
    }
    case 'text':
      return `<p style="${style}">${el.content || ''}</p>`;
    case 'button':
      return `<button style="${style}">${el.icon || ''}${el.content || ''}</button>`;
    case 'image': {
      if (!el.src || GENERIC_IMAGE_HOSTS.test(el.src)) return '';
      return `<img src="${el.src}" alt="${el.alt || ''}" style="max-width:100%;${style}" />`;
    }
    case 'grid': {
      const gridStyle = el.styles?.display ? style : `display:grid;${style}`;
      return `<div style="${gridStyle}">${children}</div>`;
    }
    case 'nav':
      return `<nav style="${style}">${children}</nav>`;
    case 'footer':
      return `<footer style="${style}">${children}</footer>`;
    case 'card':
      return `<div style="border-radius:12px;${style}">${children}</div>`;
    case 'section':
      return `<section style="${style}">${children}</section>`;
    default:
      return `<div style="${style}">${children}</div>`;
  }
}

export function templateElementsToHTML(elements: WonderBuildElement[]): string {
  const body = (elements || []).map(renderElement).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1280" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1280px; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f1f5f9; }
    img { display: block; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}
