'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useBuilderStore } from '../store';
import { extractHeadings, checkHeadingHierarchy, checkFormLabels, getContrastRatio, getContrastGrade } from '../a11y-utils';

async function generateAltText(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an accessibility expert. Generate concise, descriptive alt text for an image (max 120 characters). Respond with only the alt text, no quotes or explanation.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || data?.content || data?.text || 'Image description.';
  } catch {
    return 'AI-generated description of this image.';
  }
}

interface A11yIssue {
  id: string;
  elementName: string;
  elementType: string;
  category: 'alt-text' | 'heading-order' | 'contrast' | 'form-label' | 'missing-heading';
  severity: 'error' | 'warning' | 'info';
  message: string;
  fixLabel: string;
  onFix: () => void;
}

export default function AccessibilityCheckerPanel() {
  const { elements, selectedId, selectElement, updateElementProps, updateElementStyles } = useBuilderStore();
  const [open, setOpen] = useState(false);
  const [aiWorking, setAiWorking] = useState(false);
  const [altTextCache, setAltTextCache] = useState<Record<string, string>>({});

  const issues = useMemo<A11yIssue[]>(() => {
    const result: A11yIssue[] = [];

    function walk(els: typeof elements) {
      for (const el of els) {
        if (el.type === 'image' || el.type === 'avatar') {
          if (!el.props?.alt || el.props.alt === '') {
            result.push({
              id: el.id, elementName: el.name, elementType: el.type,
              category: 'alt-text', severity: 'error',
              message: `${el.name} is missing alt text. Screen readers cannot describe this image.`,
              fixLabel: 'Add placeholder alt text',
              onFix: () => updateElementProps(el.id, { alt: `Description of ${el.name}` }),
            });
          }
        }
        if (el.type === 'heading') {
          const level = parseInt(el.props?.level?.replace('h', '') || '2', 10);
          if (level < 1 || level > 6) {
            result.push({
              id: el.id, elementName: el.name, elementType: 'heading',
              category: 'heading-order', severity: 'error',
              message: `Invalid heading level "${el.props?.level}". Use H1 through H6.`,
              fixLabel: 'Set to H2',
              onFix: () => updateElementProps(el.id, { level: 'h2' }),
            });
          }
        }
        if (el.type === 'input' || el.type === 'textarea' || el.type === 'select') {
          if (!el.props?.label && !el.props?.['aria-label']) {
            result.push({
              id: el.id, elementName: el.name, elementType: el.type,
              category: 'form-label', severity: 'error',
              message: `${el.name} form field has no label. Screen readers cannot identify this field.`,
              fixLabel: 'Add label from field name',
              onFix: () => updateElementProps(el.id, { label: el.name.replace(/-/g, ' ') }),
            });
          }
        }
        if (el.styles?.color && el.styles?.backgroundColor) {
          const bg = el.styles.backgroundColor;
          const fg = el.styles.color;
          if (fg !== 'transparent' && bg !== 'transparent') {
            try {
              const ratio = getContrastRatio(fg, bg);
              const grade = getContrastGrade(ratio);
              if (grade === 'fail') {
                result.push({
                  id: el.id, elementName: el.name, elementType: el.type,
                  category: 'contrast', severity: 'error',
                  message: `Low color contrast (${ratio.toFixed(1)}:1) on ${el.name}. Text may be hard to read.`,
                  fixLabel: 'Fix to white on dark bg',
                  onFix: () => updateElementStyles(el.id, { color: '#ffffff', backgroundColor: '#0f172a' }),
                });
              }
            } catch {}
          }
        }
        if (el.children) walk(el.children as any);
      }
    }
    walk(elements);

    const headings = extractHeadings(elements);
    const headingIssues = checkHeadingHierarchy(headings);
    for (const hi of headingIssues) {
      const element = elements.find((e) => e.id === hi.id);
      result.push({
        id: hi.id, elementName: element?.name || 'Heading', elementType: 'heading',
        category: 'heading-order', severity: hi.severity,
        message: hi.message,
        fixLabel: 'Fix heading level',
        onFix: () => {
          if (element) {
            const currentLevel = parseInt(element.props?.level?.replace('h', '') || '2', 10);
            const suggested = Math.max(1, currentLevel - 1);
            updateElementProps(element.id, { level: `h${suggested}` });
          }
        },
      });
    }

    if (headings.length === 0 && elements.length > 0) {
      result.push({
        id: 'no-h1', elementName: 'Page', elementType: 'page',
        category: 'missing-heading', severity: 'warning',
        message: 'Page has no headings. Consider adding a heading structure for screen reader navigation.',
        fixLabel: 'Dismiss',
        onFix: () => {},
      });
    }

    return result;
  }, [elements, updateElementProps, updateElementStyles]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1 rounded text-[10px] font-semibold transition-colors text-white/40 hover:text-white hover:bg-white/5"
        title="Accessibility Checker"
        aria-label="Open accessibility checker"
      >
        ♿️ Check
      </button>
    );
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-white/10 bg-[#0c101d] text-white flex flex-col shadow-2xl">
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div>
          <h2 className="text-sm font-bold">♿️ Accessibility Checker</h2>
          <p className="text-[10px] text-white/40">
            {errorCount > 0 || warningCount > 0
              ? `${errorCount} error${errorCount !== 1 ? 's' : ''}, ${warningCount} warning${warningCount !== 1 ? 's' : ''} found`
              : 'No issues found — great job!'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {issues.length > 0 && (
            <button
              onClick={async () => {
                setAiWorking(true);
                for (const issue of issues) {
                  if (issue.category === 'alt-text' && !altTextCache[issue.id]) {
                    const alt = await generateAltText(`Generate alt text for a ${issue.elementName} block.`);
                    setAltTextCache((c) => ({ ...c, [issue.id]: alt }));
                    issue.onFix = () => updateElementProps(issue.id, { alt });
                  }
                  issue.onFix();
                }
                setAiWorking(false);
              }}
              disabled={aiWorking}
              className="rounded bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50 text-white px-2 py-0.5 text-[9px] font-semibold transition-colors"
            >
              {aiWorking ? '⏳ Fixing...' : '✨ Fix All with AI'}
            </button>
          )}
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70 text-xs px-1" aria-label="Close checker">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {issues.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm text-emerald-400 font-semibold">All accessibility checks passed!</p>
            <p className="text-xs text-white/40 mt-1">Your page is ready for publishing.</p>
          </div>
        )}
        {issues.map((issue) => (
          <div
            key={`${issue.id}-${issue.category}`}
            className={`rounded-lg border p-3 transition-colors cursor-pointer hover:bg-white/5 ${
              issue.severity === 'error'
                ? 'border-red-500/30 bg-red-500/5'
                : issue.severity === 'warning'
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-blue-500/30 bg-blue-500/5'
            }`}
            onClick={() => selectElement(issue.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') selectElement(issue.id); }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-semibold uppercase ${
                    issue.severity === 'error' ? 'text-red-400' : issue.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                    {issue.severity === 'error' ? '🔴 Error' : issue.severity === 'warning' ? '🟡 Warning' : '🔵 Info'}
                  </span>
                  <span className="text-[10px] text-white/30">·</span>
                  <span className="text-[10px] text-white/50 truncate">{issue.elementName}</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">{issue.message}</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); issue.onFix(); }}
              className="mt-1.5 rounded bg-purple-600/80 hover:bg-purple-600 text-white px-2 py-0.5 text-[10px] font-semibold transition-colors"
            >
              {issue.fixLabel}
            </button>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-white/10 px-4 py-2 text-center text-[10px] text-white/30">
        Click an issue to select the element · Click fix to apply suggestion
      </div>
    </div>
  );
}
