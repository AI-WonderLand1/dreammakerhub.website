// Service Worker for PlayCanvas Isolation
// This file will be served from /playcanvas-isolation-sw.js

const USER_CONTAINER_MAP = new Map();
const REQUEST_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Authentication helper
async function extractUserId(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId || null;
    } catch (error) {
      console.error('[ServiceWorker] Failed to parse token:', error);
    }
  }

  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/playcanvas-isolated\/([^\/]+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }

  return null;
}

// Cache management
function addToCache(url, response, userId) {
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

function getFromCache(url) {
  const entry = REQUEST_CACHE.get(url);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.ttl) {
    REQUEST_CACHE.delete(url);
    return null;
  }

  return entry.response.clone();
}

// Container URL mapping
async function getContainerUrl(userId, path) {
  const containerId = USER_CONTAINER_MAP.get(userId) || 'default';
  return `http://localhost:3000${path}`;
}

// Request routing
async function routeRequest(request) {
  const userId = await extractUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  
  const cachedResponse = getFromCache(url.href);
  if (cachedResponse) {
    return cachedResponse;
  }

  const containerUrl = await getContainerUrl(userId, url.pathname + url.search);
  
  try {
    const containerRequest = new Request(containerUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      duplex: 'half',
    });

    const response = await fetch(containerRequest);
    
    if (request.method === 'GET' && response.ok) {
      addToCache(url.href, response, userId);
    }

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
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/playcanvas-isolated/') || 
      url.pathname.startsWith('/api/playcanvas-isolation/')) {
    event.respondWith(routeRequest(event.request));
  }
});

self.addEventListener('message', (event) => {
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