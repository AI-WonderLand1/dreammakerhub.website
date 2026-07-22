export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface CanvasElement {
  id: string;
  type: string;
  name: string;
  props: Record<string, any>;
  styles: Record<string, any>;
  children?: CanvasElement[];
  locked?: boolean;
  hidden?: boolean;
}

export interface BuilderTheme {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
}

export interface BuilderState {
  elements: CanvasElement[];
  selectedId: string | null;
  activeBreakpoint: Breakpoint;
  zoom: number;
  pan: { x: number; y: number };
  theme: BuilderTheme;
  history: {
    past: CanvasElement[][];
    future: CanvasElement[][];
  };
}

export interface Extension {
  id: string;
  name: string;
  version: string;
  components?: Record<string, React.ComponentType<any>>;
  initialize?: (store: any) => void;
}
