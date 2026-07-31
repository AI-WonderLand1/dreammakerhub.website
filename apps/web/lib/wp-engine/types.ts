import { CanvasElement } from '@/lib/builder/types';

export interface WPConnectionConfig {
  wpUrl: string;
  apiKey: string;
}

export interface WPStatusInfo {
  ok: boolean;
  connected: boolean;
  version?: string;
  siteUrl?: string;
  message?: string;
  serverError?: string;
}

export interface WPSiteInfo {
  name?: string;
  description?: string;
  url?: string;
  wp_version?: string;
}

export interface WPProject {
  id: string;
  title: string;
  slug?: string;
  status?: string;
  date?: string;
  modified?: string;
  content?: string;
  meta?: Record<string, any>;
}

export interface WPPage {
  id: string;
  title: string;
  slug: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  date: string;
  modified?: string;
  content?: string;
  link?: string;
}

export interface WPPublishRequest {
  title: string;
  status?: 'publish' | 'draft';
  content?: string;
  elements?: CanvasElement[];
  postId?: string | null;
}

export interface WPPublishResponse {
  ok: boolean;
  message: string;
  id?: string;
  link?: string;
  permalink?: string;
  raw?: any;
}
