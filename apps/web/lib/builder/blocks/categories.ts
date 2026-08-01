import type { BlockCategory } from '../types';

export const BLOCK_CATEGORIES: { key: BlockCategory; label: string; icon: string }[] = [
  { key: 'forms', label: 'Forms', icon: '📋' },
  { key: 'typography', label: 'Typography', icon: '🔤' },
  { key: 'media', label: 'Media', icon: '🎬' },
  { key: 'navigation', label: 'Navigation', icon: '🧭' },
  { key: 'marketing', label: 'Marketing', icon: '📢' },
  { key: 'blog', label: 'Blog', icon: '📝' },
  { key: 'commerce', label: 'Commerce', icon: '🛒' },
  { key: 'products', label: 'Products', icon: '🛍️' },
  { key: 'utility', label: 'Utility', icon: '🔧' },
  { key: 'layout', label: 'Layout', icon: '🔲' },
  { key: 'social', label: 'Social', icon: '📱' },
  { key: 'analytics', label: 'Analytics', icon: '📊' },
  { key: 'widgets', label: 'Widgets', icon: '🧩' },
  { key: 'notification', label: 'Notifications', icon: '🔔' },
  { key: 'payment', label: 'Payment', icon: '💳' },
  { key: 'seo', label: 'SEO', icon: '🔍' },
  { key: 'files', label: 'Files', icon: '📁' },
  { key: 'auth', label: 'Auth', icon: '🔐' },
];
