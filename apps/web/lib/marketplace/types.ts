export type MarketplaceCategory = 'plugin' | 'theme' | 'block' | 'template' | 'ai-model' | 'integration';

export interface MarketplaceItem {
  id: string;
  name: string;
  slug: string;
  version: string;
  category: MarketplaceCategory;
  description: string;
  author: string;
  rating: number;
  downloads: number;
  price: number; // 0 for free
  downloadUrl: string;
  dependencies?: string[];
}
