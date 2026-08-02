export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface CanvasElementStyles {
  // Layout
  width?: string;
  height?: string;
  minHeight?: string;
  maxWidth?: string;
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  display?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
  gridTemplateColumns?: string;
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textTransform?: string;
  textDecoration?: string;
  // Color
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  // Border
  border?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderRadius?: string;
  // Effects
  opacity?: string;
  boxShadow?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  // Position
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;
  overflow?: string;
  [key: string]: any;
}

export interface CanvasElement {
  id: string;
  type: string;
  name: string;
  icon?: string;
  props: Record<string, any>;
  styles: CanvasElementStyles;
  responsiveStyles?: Partial<Record<Breakpoint, CanvasElementStyles>>;
  children?: CanvasElement[];
  locked?: boolean;
  hidden?: boolean;
}

export interface BlockDefinition {
  name: string;
  type: string;
  icon: string;
  category: BlockCategory;
  description: string;
  defaultProps: Record<string, any>;
  defaultStyles: CanvasElementStyles;
  editableProps: EditableProp[];
  allowedChildren?: string[];
}

export type BlockCategory = 'forms' | 'typography' | 'media' | 'navigation' | 'marketing' | 'blog' | 'commerce' | 'products' | 'utility' | 'layout' | 'social' | 'analytics' | 'widgets' | 'notification' | 'payment' | 'seo' | 'files' | 'auth';

export interface EditableProp {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'number' | 'select' | 'image' | 'video' | 'font' | 'range' | 'toggle';
  options?: { label: string; value: string }[];
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
  showGrid: boolean;
  snapToGrid: boolean;
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

export type LeftPanelTab = 'blocks' | 'layers' | 'templates' | 'files';
export type RightPanelTab = 'content' | 'layout' | 'style' | 'effects' | 'responsive' | 'advanced' | 'interactions' | 'data' | 'visibility' | 'accessibility' | 'ai' | 'import-export' | 'history';
