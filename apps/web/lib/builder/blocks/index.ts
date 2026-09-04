import type { BlockDefinition } from '../types';
import { FORMS_BLOCKS } from './forms';
import { TYPOGRAPHY_BLOCKS } from './typography';
import { MEDIA_BLOCKS } from './media';
import { WEB_3D_BLOCKS } from './web3d';
import { NAVIGATION_BLOCKS } from './navigation';
import { MARKETING_BLOCKS } from './marketing';
import { BLOG_BLOCKS } from './blog';
import { COMMERCE_BLOCKS } from './commerce';
import { UTILITY_BLOCKS } from './utility';
import { LAYOUT_BLOCKS } from './layout';
import { PRODUCTS_BLOCKS } from './products';
import { SOCIAL_BLOCKS } from './social';
import { ANALYTICS_BLOCKS } from './analytics';
import { WIDGETS_BLOCKS } from './widgets';
import { NOTIFICATION_BLOCKS } from './notification';
import { PAYMENT_BLOCKS } from './payment';
import { SEO_BLOCKS } from './seo';
import { FILES_BLOCKS } from './files';
import { AUTH_BLOCKS } from './auth';

export const BLOCKS: BlockDefinition[] = [
  ...FORMS_BLOCKS,
  ...TYPOGRAPHY_BLOCKS,
  ...MEDIA_BLOCKS,
  ...WEB_3D_BLOCKS,
  ...NAVIGATION_BLOCKS,
  ...MARKETING_BLOCKS,
  ...BLOG_BLOCKS,
  ...COMMERCE_BLOCKS,
  ...UTILITY_BLOCKS,
  ...LAYOUT_BLOCKS,
  ...PRODUCTS_BLOCKS,
  ...SOCIAL_BLOCKS,
  ...ANALYTICS_BLOCKS,
  ...WIDGETS_BLOCKS,
  ...NOTIFICATION_BLOCKS,
  ...PAYMENT_BLOCKS,
  ...SEO_BLOCKS,
  ...FILES_BLOCKS,
  ...AUTH_BLOCKS,
];

export { BLOCK_CATEGORIES } from './categories';
export { FORMS_BLOCKS } from './forms';
export { TYPOGRAPHY_BLOCKS } from './typography';
export { MEDIA_BLOCKS } from './media';
export { WEB_3D_BLOCKS } from './web3d';
export { NAVIGATION_BLOCKS } from './navigation';
export { MARKETING_BLOCKS } from './marketing';
export { BLOG_BLOCKS } from './blog';
export { COMMERCE_BLOCKS } from './commerce';
export { UTILITY_BLOCKS } from './utility';
export { LAYOUT_BLOCKS } from './layout';
export { PRODUCTS_BLOCKS } from './products';
export { SOCIAL_BLOCKS } from './social';
export { ANALYTICS_BLOCKS } from './analytics';
export { WIDGETS_BLOCKS } from './widgets';
export { NOTIFICATION_BLOCKS } from './notification';
export { PAYMENT_BLOCKS } from './payment';
export { SEO_BLOCKS } from './seo';
export { FILES_BLOCKS } from './files';
export { AUTH_BLOCKS } from './auth';
export * from './utils';
