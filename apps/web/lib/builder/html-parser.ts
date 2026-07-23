'use client';

import { CanvasElement } from './types';

interface ParseOptions {
  baseId?: string;
}

const TAG_MAP: Record<string, { type: string; name: string; icon: string; extractProps: (el: Element) => Record<string, any>; extractStyles?: (el: Element) => Record<string, string> }> = {
  h1: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h1', content: el.textContent || '' }) },
  h2: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h2', content: el.textContent || '' }) },
  h3: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h3', content: el.textContent || '' }) },
  h4: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h4', content: el.textContent || '' }) },
  h5: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h5', content: el.textContent || '' }) },
  h6: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h6', content: el.textContent || '' }) },
  p: { type: 'paragraph', name: 'Paragraph', icon: '📝', extractProps: (el) => ({ content: el.innerHTML }) },
  img: { type: 'image', name: 'Image', icon: '🖼️', extractProps: (el) => ({ src: el.getAttribute('src') || '', alt: el.getAttribute('alt') || '' }) },
  a: { type: 'button', name: 'Button', icon: '🔘', extractProps: (el) => ({ label: el.textContent || 'Link', url: el.getAttribute('href') || '#', variant: 'link' }) },
  ul: { type: 'list', name: 'List', icon: '📋', extractProps: (el) => ({ items: Array.from(el.querySelectorAll('li')).map((li) => li.textContent || ''), listType: 'unordered' }) },
  ol: { type: 'list', name: 'List', icon: '📋', extractProps: (el) => ({ items: Array.from(el.querySelectorAll('li')).map((li) => li.textContent || ''), listType: 'ordered' }) },
  blockquote: { type: 'quote', name: 'Quote', icon: '💬', extractProps: (el) => ({ content: el.textContent || '', citation: el.querySelector('cite')?.textContent || '' }) },
  pre: { type: 'code', name: 'Code', icon: '💻', extractProps: (el) => ({ content: el.textContent || '', language: '' }) },
  hr: { type: 'divider', name: 'Divider', icon: '➖', extractProps: () => ({}) },
  button: { type: 'button', name: 'Button', icon: '🔘', extractProps: (el) => ({ label: el.textContent || 'Button', variant: 'primary' }) },
  input: { type: 'input', name: 'Input', icon: '⌨️', extractProps: (el) => ({ label: el.getAttribute('placeholder') || 'Input', placeholder: el.getAttribute('placeholder') || '', type: el.getAttribute('type') || 'text' }) },
  textarea: { type: 'textarea', name: 'Textarea', icon: '📄', extractProps: (el) => ({ label: el.getAttribute('placeholder') || 'Textarea', placeholder: el.getAttribute('placeholder') || '' }) },
  select: { type: 'select', name: 'Select', icon: '📑', extractProps: (el) => ({ label: 'Select', options: Array.from(el.querySelectorAll('option')).map((o) => o.textContent || '') }) },
  nav: { type: 'wp-menu', name: 'WP Menu', icon: '📋', extractProps: () => ({ menuName: 'Custom', orientation: 'horizontal' }) },
  footer: { type: 'section', name: 'Section', icon: '📐', extractProps: () => ({ width: 'full', paddingY: '2rem' }) },
  header: { type: 'section', name: 'Section', icon: '📐', extractProps: () => ({ width: 'full', paddingY: '2rem' }) },
  section: { type: 'section', name: 'Section', icon: '📐', extractProps: () => ({ width: 'full', paddingY: '2rem' }) },
  form: { type: 'contact-form', name: 'Contact Form', icon: '📧', extractProps: () => ({ submitText: 'Submit', showSubject: true }) },
  table: { type: 'table', name: 'Table', icon: '📊', extractProps: (el) => {
    const headers = Array.from(el.querySelectorAll('th')).map((th) => th.textContent || '');
    const rows = Array.from(el.querySelectorAll('tr')).map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent || '')).filter((r) => r.length > 0);
    return { headers, rows };
  }},
};

function extractInlineStyles(el: Element): Record<string, string> {
  const style = el.getAttribute('style');
  if (!style) return {};
  const result: Record<string, string> = {};
  style.split(';').forEach((s) => {
    const [key, ...vals] = s.split(':');
    if (key && vals.length) {
      const k = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const v = vals.join(':').trim();
      if (k && v) result[k] = v;
    }
  });
  return result;
}

let counter = 0;
function genId(): string {
  counter += 1;
  return `html-${Date.now()}-${counter}`;
}

export function parseHtmlToElements(html: string, options?: ParseOptions): CanvasElement[] {
  counter = 0;
  const elements: CanvasElement[] = [];

  if (!html || html.trim().length === 0) return elements;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const children = Array.from(wrapper.children);
  if (children.length === 0) {
    const text = html.trim();
    if (text.length > 0) {
      elements.push({
        id: genId(),
        type: 'paragraph',
        name: 'Paragraph',
        icon: '📝',
        props: { content: text },
        styles: {},
      });
    }
    return elements;
  }

  for (const child of children) {
    const tag = child.tagName.toLowerCase();
    const mapping = TAG_MAP[tag];
    if (mapping) {
      const el: CanvasElement = {
        id: genId(),
        type: mapping.type,
        name: mapping.name,
        icon: mapping.icon,
        props: mapping.extractProps(child),
        styles: extractInlineStyles(child),
      };
      // Check for child elements that we should nest
      const innerElements = Array.from(child.children).filter((c) => !['li', 'option', 'td', 'th'].includes(c.tagName.toLowerCase()));
      if (innerElements.length > 0) {
        const nested = parseHtmlToElements(innerElements.map((c) => c.outerHTML).join(''));
        if (nested.length > 0) {
          el.children = nested;
        }
      }
      elements.push(el);
    } else {
      // Fallback: wrap unrecognized elements as custom-html
      elements.push({
        id: genId(),
        type: 'custom-html',
        name: 'HTML',
        icon: '🔧',
        props: { html: child.outerHTML },
        styles: extractInlineStyles(child),
      });
    }
  }

  return elements;
}

export function isHtmlString(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str.trim());
}
