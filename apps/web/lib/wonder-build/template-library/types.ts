export type ElementType =
  | 'section'
  | 'div'
  | 'heading'
  | 'text'
  | 'button'
  | 'image'
  | 'grid'
  | 'card'
  | 'nav'
  | 'footer';

export interface WonderBuildElement {
  id?: string;
  type: ElementType;
  styles?: Record<string, string | number>;
  content?: string;
  children?: WonderBuildElement[];
  src?: string;
  alt?: string;
  href?: string;
  icon?: string;
}

export interface WonderBuildTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  variant?: string;
  thumbnail: string;
  elements: WonderBuildElement[];
  price?: number; // 0 or positive amount in USD
  author?: {
    name: string;
    avatar?: string;
    bio?: string;
    salesCount?: number;
  };
  isCreatorTemplate?: boolean;
  tags?: string[];
}

export interface BatchDefinition {
  batchNumber: number;
  category: string;
  categorySlug: string;
  count: number;
  variants: string[];
  promptText: string;
  description: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile' | 'responsive';

export type ActiveTab =
  | 'prompts'
  | 'templates'
  | 'visual-builder'
  | 'json-editor'
  | 'concatenator'
  | 'ai-studio';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalTemplates: number;
    categoriesFound: string[];
    variantCount: number;
  };
}
