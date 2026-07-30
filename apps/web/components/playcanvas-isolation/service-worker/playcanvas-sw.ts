import type { RouteRequest, RouteResponse, CacheEntry } from '../types/isolation';

// Service Worker State - using 'any' for service worker global scope
declare const self: any;
const USER_CONTAINER_MAP = new Map<string, string>(); // userId -> containerId
const REQUEST_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Authentication helper (simplified - would integrate with your auth system)
async function extractUserId(request: Request): Promise<string | null> {
  // Extract from JWT token in Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // In a real implementation, you would verify the JWT
      // For now, we'll use a simple base64 decode (NOT SECURE - for demo only)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId || null;
    } catch (error) {
      console.error('[ServiceWorker] Failed to parse token:', error);
    }
  }

  // Extract from URL path (alternative method)
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/playcanvas-isolated\/([^\/]+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }

  return null;
}

// Cache management
function addToCache(url: string, response: Response, userId: string): void {
  // Clean old entries if cache is full
  if (REQUEST_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = REQUEST_CACHE.keys().next().value;
    if (oldestKey) {
      REQUEST_CACHE.delete(oldestKey);
    }
  }

  REQUEST_CACHE.set(url, {
    url,
    response: response.clone(),
    userId,
    timestamp: Date.now(),
    ttl: CACHE_TTL,
  });
}

function getFromCache(url: string): Response | null {
  const entry = REQUEST_CACHE.get(url);
  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    REQUEST_CACHE.delete(url);
    return null;
  }

  return entry.response.clone();
}

// Container URL mapping
async function getContainerUrl(userId: string, path: string): Promise<string> {
  const containerId = USER_CONTAINER_MAP.get(userId) || 'default';
  return `http://localhost:3000${path}`;
}

// Request routing
async function routeRequest(request: Request): Promise<Response> {
  const userId = await extractUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  
  // Check cache first
  const cachedResponse = getFromCache(url.href);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Route to container
  const containerUrl = await getContainerUrl(userId, url.pathname + url.search);
  
  try {
    const containerRequest = new Request(containerUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      // @ts-expect-error - duplex is needed for streaming
      duplex: 'half',
    });

    const response = await fetch(containerRequest);
    
    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      addToCache(url.href, response, userId);
    }

    // Add CORS headers
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('[ServiceWorker] Failed to route request:', error);
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Service Worker event handlers
export function setupServiceWorker(): void {
  if (typeof self === 'undefined') return;

  // Install event
  self.addEventListener('install', (event: any) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(self.skipWaiting());
  });

  // Activate event
  self.addEventListener('activate', (event: any) => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
      Promise.all([
        self.clients.claim(),
        // Clear old caches
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheName.includes('playcanvas-isolation')) {
                return caches.delete(cacheName);
              }
            })
          );
        }),
      ])
    );
  });

  // Fetch event
  self.addEventListener('fetch', (event: any) => {
    const url = new URL(event.request.url);
    
    // Only intercept PlayCanvas isolation routes
    if (url.pathname.startsWith('/playcanvas-isolated/') || 
        url.pathname.startsWith('/api/playcanvas-isolation/')) {
      event.respondWith(routeRequest(event.request));
    }
  });

  // Message event for container management
  self.addEventListener('message', (event: any) => {
    const { type, data } = event.data || {};
    
    switch (type) {
      case 'REGISTER_CONTAINER':
        if (data.userId && data.containerId) {
          USER_CONTAINER_MAP.set(data.userId, data.containerId);
          console.log(`[ServiceWorker] Registered container for user ${data.userId.substring(0, 8)}...`);
        }
        break;
        
      case 'UNREGISTER_CONTAINER':
        if (data.userId) {
          USER_CONTAINER_MAP.delete(data.userId);
          console.log(`[ServiceWorker] Unregistered container for user ${data.userId.substring(0, 8)}...`);
        }
        break;
        
      case 'CLEAR_CACHE':
        REQUEST_CACHE.clear();
        console.log('[ServiceWorker] Cleared request cache');
        break;
    }
  });
}

// Client-side registration helper
export async function registerPlayCanvasServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/playcanvas-isolation-sw.js',
      { scope: '/' }
    );
    
    console.log('[ServiceWorker] Registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[ServiceWorker] Registration failed:', error);
    return null;
  }
}

// Client-side container registration
export async function registerContainer(userId: string, containerId: string): Promise<void> {
  if (typeof window === 'undefined' || !navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'REGISTER_CONTAINER',
    data: { userId, containerId },
  });
}

export { USER_CONTAINER_MAP, REQUEST_CACHE };