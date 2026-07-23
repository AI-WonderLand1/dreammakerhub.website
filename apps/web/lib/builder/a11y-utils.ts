'use client';

/**
 * Calculate relative luminance from a hex or RGB color string.
 */
export function getLuminance(color: string): number {
  let r = 0, g = 0, b = 0;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    }
  }
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG).
 */
export function getContrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text.
 */
export function meetsWCAGAA(ratio: number, largeText = false): boolean {
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

export function meetsWCAGAAA(ratio: number, largeText = false): boolean {
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

export function getContrastGrade(ratio: number): 'pass-aaa' | 'pass-aa' | 'fail' {
  if (ratio >= 7) return 'pass-aaa';
  if (ratio >= 4.5) return 'pass-aa';
  return 'fail';
}

/**
 * Extract heading levels from elements to check hierarchy.
 */
export interface HeadingNode {
  id: string;
  level: number;
  text: string;
  depth: number;
}

export function extractHeadings(elements: any[]): HeadingNode[] {
  const result: HeadingNode[] = [];
  function walk(els: any[], depth: number) {
    for (const el of els) {
      if (el.type === 'heading') {
        const level = parseInt(el.props?.level?.replace('h', '') || '2', 10);
        result.push({ id: el.id, level, text: el.props?.content || '', depth });
      }
      if (el.children) walk(el.children, depth + 1);
    }
  }
  walk(elements, 0);
  return result;
}

export interface HeadingIssue {
  id: string;
  message: string;
  severity: 'error' | 'warning';
}

export function checkHeadingHierarchy(headings: HeadingNode[]): HeadingIssue[] {
  const issues: HeadingIssue[] = [];
  if (headings.length === 0) return issues;
  if (headings[0].level !== 1) {
    issues.push({ id: headings[0].id, message: 'Page should start with an H1 heading.', severity: 'warning' });
  }
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr.level > prev.level + 1) {
      issues.push({ id: curr.id, message: `Heading jumps from H${prev.level} to H${curr.level}. Use H${prev.level + 1} instead.`, severity: 'error' });
    }
  }
  return issues;
}

/**
 * Check if form elements have associated labels.
 */
export interface FormLabelIssue {
  id: string;
  type: string;
  name: string;
  hasLabel: boolean;
}

export function checkFormLabels(elements: any[]): FormLabelIssue[] {
  const formTypes = ['input', 'textarea', 'select', 'file-upload', 'checkbox', 'radio', 'toggle'];
  const issues: FormLabelIssue[] = [];
  function walk(els: any[]) {
    for (const el of els) {
      if (formTypes.includes(el.type)) {
        const hasLabel = !!el.props?.label || !!el.props?.['aria-label'];
        issues.push({ id: el.id, type: el.type, name: el.name, hasLabel });
      }
      if (el.children) walk(el.children);
    }
  }
  walk(elements);
  return issues;
}
