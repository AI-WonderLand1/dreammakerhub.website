/**
 * Navigation Registry & Utilities
 * Centralized management of all pages and navigation paths
 */

export interface PageConfig {
  path: string;
  label: string;
  icon: string;
  category: 'builder' | 'workspace' | 'tools' | 'community' | 'settings' | 'docs';
  description: string;
}

// Comprehensive page registry
export const PAGES: PageConfig[] = [
  // Builders
  {
    path: '/builder-ai',
    label: 'AI Builder',
    icon: '🤖',
    category: 'builder',
    description: 'Quad-Engine AI Builder - Full-stack development platform',
  },
  {
    path: '/builder',
    label: 'Standard Builder',
    icon: '🔨',
    category: 'builder',
    description: 'Traditional builder interface',
  },

  // Workspaces
  {
    path: '/(workspace)/projects',
    label: 'Projects',
    icon: '📁',
    category: 'workspace',
    description: 'Your project files and assets',
  },
  {
    path: '/(workspace)/dashboard',
    label: 'Dashboard',
    icon: '📊',
    category: 'workspace',
    description: 'Project overview and statistics',
  },

  // Play & Preview
  {
    path: '/play',
    label: 'Play',
    icon: '▶️',
    category: 'tools',
    description: 'Test and preview your creations',
  },
  {
    path: '/(preview)',
    label: 'Preview Mode',
    icon: '👁️',
    category: 'tools',
    description: 'Live preview of projects',
  },

  // Tools
  {
    path: '/(tools)',
    label: 'Tools',
    icon: '⚙️',
    category: 'tools',
    description: 'Development tools and utilities',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: '⚡',
    category: 'settings',
    description: 'Configure your workspace',
  },
  {
    path: '/connect-storage',
    label: 'Storage',
    icon: '☁️',
    category: 'settings',
    description: 'Manage cloud storage and BYOC settings',
  },

  // Community & Support
  {
    path: '/community',
    label: 'Community',
    icon: '👥',
    category: 'community',
    description: 'Connect with other creators',
  },
  {
    path: '/marketplace',
    label: 'Marketplace',
    icon: '🛍️',
    category: 'community',
    description: 'Assets, templates, and plugins',
  },
  {
    path: '/tutorials',
    label: 'Tutorials',
    icon: '📚',
    category: 'docs',
    description: 'Learning resources and guides',
  },
  {
    path: '/docs',
    label: 'Documentation',
    icon: '📖',
    category: 'docs',
    description: 'API reference and documentation',
  },
  {
    path: '/support',
    label: 'Support',
    icon: '💬',
    category: 'community',
    description: 'Get help and report issues',
  },
];

export function getPagesByCategory(category: PageConfig['category']): PageConfig[] {
  return PAGES.filter((page) => page.category === category);
}

export function getPageByPath(path: string): PageConfig | undefined {
  return PAGES.find((page) => page.path === path);
}

export function getAllCategories(): PageConfig['category'][] {
  const categories = new Set<PageConfig['category']>();
  PAGES.forEach((page) => categories.add(page.category));
  return Array.from(categories);
}

export function navigateTo(path: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
}

export function navigateToNewTab(path: string): void {
  if (typeof window !== 'undefined') {
    window.open(path, '_blank');
  }
}
