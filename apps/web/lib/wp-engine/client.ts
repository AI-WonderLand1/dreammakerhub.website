import {
  WPConnectionConfig,
  WPStatusInfo,
  WPProject,
  WPPage,
  WPPublishRequest,
  WPPublishResponse,
} from './types';

const API_BASE = '/api/wp-engine';

async function wpFetch<T>(path: string, config: WPConnectionConfig, init?: RequestInit): Promise<T> {
  const payload = init?.body ? JSON.parse(init.body as string) : {};
  const body = JSON.stringify({ wpUrl: config.wpUrl, apiKey: config.apiKey, ...payload });

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const wpEngine = {
  checkStatus(config: WPConnectionConfig): Promise<WPStatusInfo> {
    return wpFetch<WPStatusInfo>('/status', config, { method: 'POST' });
  },

  listProjects(config: WPConnectionConfig): Promise<{ ok: boolean; projects: WPProject[] }> {
    return wpFetch<{ ok: boolean; projects: WPProject[] }>('/projects', config, { method: 'POST' });
  },

  listPages(config: WPConnectionConfig): Promise<{ ok: boolean; pages: WPPage[] }> {
    return wpFetch<{ ok: boolean; pages: WPPage[] }>('/pages', config, { method: 'POST' });
  },

  publish(config: WPConnectionConfig, payload: WPPublishRequest): Promise<WPPublishResponse> {
    return wpFetch<WPPublishResponse>('/publish', config, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
