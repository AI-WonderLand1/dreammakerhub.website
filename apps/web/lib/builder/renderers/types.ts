import type { ReactNode } from 'react';
import type { CanvasElement } from '../types';

export interface RendererCtx {
  el: CanvasElement;
  selectedId: string | null;
  selectElement: (id: string | null) => void;
  baseProps: Record<string, any>;
  children: ReactNode;
}

export type BlockRenderer = (ctx: RendererCtx) => ReactNode;
