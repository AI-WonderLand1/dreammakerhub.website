import { MarketplaceItem, MarketplaceCategory } from './types';

export class MarketplaceClient {
  private items: MarketplaceItem[] = [
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
    {
      id: 'mp_5',
      name: 'shadcn/ui CLI',
      slug: 'shadcn-cli',
      version: '1.0.0',
      category: 'integration',
      description: 'Beautifully designed component CLI for React. Adds shadcn/ui components to your AI Wonderland projects with Tailwind CSS and Radix UI primitives.',
      author: 'shadcn / AI Wonderland',
      rating: 5.0,
      downloads: 28900,
      price: 0,
      downloadUrl: '/api/marketplace/download/shadcn-cli.zip',
      dependencies: ['@radix-ui/*', 'tailwindcss', 'class-variance-authority'],
    },
  ];

  public async getItems(category?: MarketplaceCategory): Promise<MarketplaceItem[]> {
    if (category) {
      return this.items.filter((item) => item.category === category);
    }
    return this.items;
  }

  public async installItem(slug: string): Promise<{ success: boolean; message: string }> {
    const item = this.items.find((i) => i.slug === slug);
    if (!item) {
      throw new Error(`Item ${slug} not found in Marketplace.`);
    }

    return { success: true, message: `Successfully installed ${item.name} v${item.version}` };
  }
}

export const marketplaceClient = new MarketplaceClient();
