'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { CanvasElement } from '../types';
import { renderElement } from '../renderers';

function renderPublishedElement(el: CanvasElement): ReactNode {
  const style = { ...(el.styles as CSSProperties) };
  const children = el.children?.map((child) => (
    <PublishedElement key={child.id} element={child} />
  ));

  return renderElement({
    el,
    selectedId: null,
    selectElement: () => {},
    baseProps: {
      style,
      className: `builder-element type-${el.type}`,
    },
    style,
    children,
  });
}

function PublishedElement({ element }: { element: CanvasElement }) {
  return <>{renderPublishedElement(element)}</>;
}

export default function PublishedBuilderPage({ elements }: { elements: CanvasElement[] }) {
  return (
    <main className="min-h-screen w-full bg-white text-slate-950">
      {elements.map((element) => (
        <PublishedElement key={element.id} element={element} />
      ))}
    </main>
  );
}
