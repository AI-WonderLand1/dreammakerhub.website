'use client';

import { CanvasElement } from './types';

interface ParseOptions {
  baseId?: string;
}

type TagMapping = {
  type: string;
  name: string;
  icon: string;
  extractProps: (el: Element) => Record<string, any>;
};

function safeUrlAttribute(value: string | null, fallback: string): string {
  const url = (value || '').trim();
  if (!url) return fallback;

  if (/^(?:javascript|vbscript|data:text\/html|file):/i.test(url)) {
    return fallback;
  }

  return url;
}

const TAG_MAP: Record<string, TagMapping> = {
  h1: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h1', content: el.textContent || '' }) },
  h2: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h2', content: el.textContent || '' }) },
  h3: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h3', content: el.textContent || '' }) },
  h4: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h4', content: el.textContent || '' }) },
  h5: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h5', content: el.textContent || '' }) },
  h6: { type: 'heading', name: 'Heading', icon: '🔤', extractProps: (el) => ({ level: 'h6', content: el.textContent || '' }) },
  p: { type: 'paragraph', name: 'Paragraph', icon: '📝', extractProps: (el) => ({ content: el.textContent || '' }) },
  img: {
    type: 'image',
    name: 'Image',
    icon: '🖼️',
    extractProps: (el) => ({
      src: safeUrlAttribute(el.getAttribute('src'), ''),
      alt: el.getAttribute('alt') || '',
    }),
  },
  a: {
    type: 'button',
    name: 'Button',
    icon: '🔘',
    extractProps: (el) => ({
      label: el.textContent || 'Link',
      url: safeUrlAttribute(el.getAttribute('href'), '#'),
      variant: 'link',
    }),
  },
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
  table: {
    type: 'table',
    name: 'Table',
    icon: '📊',
    extractProps: (el) => {
      const headers = Array.from(el.querySelectorAll('th')).map((th) => th.textContent || '');
      const rows = Array.from(el.querySelectorAll('tr'))
        .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent || ''))
        .filter((row) => row.length > 0);
      return { headers, rows };
    },
  },
};

function extractInlineStyles(el: Element): Record<string, string> {
  const style = el.getAttribute('style');
  if (!style) return {};

  const result: Record<string, string> = {};
  style.split(';').forEach((entry) => {
    const [key, ...values] = entry.split(':');
    if (!key || values.length === 0) return;

    const normalizedKey = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = values.join(':').trim();

    if (!normalizedKey || !value) return;
    if (/expression\s*\(|javascript\s*:|data:text\/html/i.test(value)) return;

    result[normalizedKey] = value;
  });

  return result;
}

let counter = 0;

function genId(baseId = 'html'): string {
  counter += 1;
  return `${baseId}-${Date.now()}-${counter}`;
}

function elementToCanvasElement(element: Element, baseId: string): CanvasElement {
  const tag = element.tagName.toLowerCase();
  const mapping = TAG_MAP[tag];

  if (!mapping) {
    return {
      id: genId(baseId),
      type: 'paragraph',
      name: 'Paragraph',
      icon: '📝',
      props: { content: element.textContent || '' },
      styles: extractInlineStyles(element),
    };
  }

  const canvasElement: CanvasElement = {
    id: genId(baseId),
    type: mapping.type,
    name: mapping.name,
    icon: mapping.icon,
    props: mapping.extractProps(element),
    styles: extractInlineStyles(element),
  };

  const nestedChildren = Array.from(element.children).filter(
    (child) => !['li', 'option', 'td', 'th'].includes(child.tagName.toLowerCase()),
  );

  if (nestedChildren.length > 0) {
    canvasElement.children = nestedChildren.map((child) =>
      elementToCanvasElement(child, baseId),
    );
  }

  return canvasElement;
}

export function parseHtmlToElements(html: string, options?: ParseOptions): CanvasElement[] {
  counter = 0;

  if (!html || html.trim().length === 0) return [];

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const children = Array.from(parsed.body.children);
  const baseId = options?.baseId || 'html';

  if (children.length === 0) {
    const text = parsed.body.textContent?.trim() || '';
    if (!text) return [];

    return [{
      id: genId(baseId),
      type: 'paragraph',
      name: 'Paragraph',
      icon: '📝',
      props: { content: text },
      styles: {},
    }];
  }

  return children.map((child) => elementToCanvasElement(child, baseId));
}

export function isHtmlString(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str.trim());
}
