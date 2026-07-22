import { MarketplaceItem, MarketplaceCategory } from './types';

export class MarketplaceClient {
  private items: MarketplaceItem[] = [
    {
      id: 'mp_1',
      name: 'SEO Suite Extension',
      slug: 'seo-suite',
      version: '1.2.0',
      category: 'plugin',
      description: 'Automated meta tags, sitemaps, and Schema.org markup generation for WordPress.',
      author: 'AI Wonderland Team',
      rating: 4.9,
      downloads: 12400,
      price: 0,
      downloadUrl: '/api/marketplace/download/seo-suite.zip',
    },
    {
      id: 'mp_2',
      name: 'Cyberpunk Theme',
      slug: 'cyberpunk-theme',
      version: '2.0.1',
      category: 'theme',
      description: 'Futuristic dark neon theme built natively for AI Wonderland visual builder.',
      author: 'CyberStudio',
      rating: 4.8,
      downloads: 8500,
      price: 19.99,
      downloadUrl: '/api/marketplace/download/cyberpunk-theme.zip',
    },
    {
      id: 'mp_3',
      name: '3D Interactive Canvas Block',
      slug: '3d-canvas-block',
      version: '1.0.0',
      category: 'block',
      description: 'PlayCanvas and Three.js embed block with visual shader controls.',
      author: '3D Labs',
      rating: 5.0,
      downloads: 4100,
      price: 0,
      downloadUrl: '/api/marketplace/download/3d-canvas-block.zip',
    },
  ];

  public async getItems(category?: MarketplaceCategory): Promise<MarketplaceItem[]> {
    if (category) {
      return this.items.filter((item) => item.category === category);
    }
    return this.items;
  }

  public async installItem(slug: string, targetWpUrl?: string): Promise<{ success: boolean; message: string }> {
    const item = this.items.find((i) => i.slug === slug);
    if (!item) {
      throw new Error(`Item ${slug} not found in Marketplace.`);
    }

    if (targetWpUrl) {
      const res = await fetch(`${targetWpUrl}/wp-json/aiw/v1/marketplace/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: item.category, name: item.slug }),
      });
      if (!res.ok) {
        throw new Error(`Failed to install on WordPress target: ${res.statusText}`);
      }
    }

    return { success: true, message: `Successfully installed ${item.name} v${item.version}` };
  }
}

export const marketplaceClient = new MarketplaceClient();
