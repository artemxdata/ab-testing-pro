// public/sw.js - Service Worker for A/B Testing Pro PWA
const CACHE_NAME = 'ab-testing-pro-v2.0.0';
const DATA_CACHE_NAME = 'ab-testing-pro-data-v1.0.0';

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/statistics',
  '/api/ml-predictions',
  '/api/export'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Service Worker: App shell cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (API_CACHE_URLS.some(apiUrl => request.url.includes(apiUrl))) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // If the request was successful, clone and cache the response
            if (response.status === 200) {
              cache.put(request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // If network fails, try to get from cache
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Handle app shell with cache-first strategy
  if (FILES_TO_CACHE.includes(url.pathname) || request.destination === 'document') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            console.log('📦 Service Worker: Serving from cache', request.url);
            return response;
          }
          
          console.log('🌐 Service Worker: Fetching from network', request.url);
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Handle other requests with network-first, fallback to cache
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📧 Service Worker: Push notification received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'A/B Testing Pro notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/action-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('A/B Testing Pro', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Service Worker: Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Share target handling
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(handleSharedData(event.request));
  }
});

// Handle file imports
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/import' && event.request.method === 'POST') {
    event.respondWith(handleFileImport(event.request));
  }
});

// Utility functions
async function syncOfflineData() {
  try {
    console.log('🔄 Service Worker: Syncing offline data...');
    
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData();
    
    if (offlineData.length > 0) {
      // Send data to server
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      });
      
      if (response.ok) {
        console.log('✅ Service Worker: Offline data synced successfully');
        await clearOfflineData();
      }
    }
  } catch (error) {
    console.error('❌ Service Worker: Sync failed', error);
  }
}

async function getOfflineData() {
  // Implement IndexedDB or localStorage retrieval
  try {
    const stored = localStorage.getItem('ab-testing-pro-offline-data');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting offline data:', error);
    return [];
  }
}

async function clearOfflineData() {
  try {
    localStorage.removeItem('ab-testing-pro-offline-data');
    console.log('🗑️ Service Worker: Offline data cleared');
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}

async function handleSharedData(request) {
  const formData = await request.formData();
  const title = formData.get('title');
  const text = formData.get('text');
  const url = formData.get('url');
  const files = formData.getAll('data_file');

  console.log('📤 Service Worker: Handling shared data', { title, text, url, files });

  // Process shared data and redirect to app
  const params = new URLSearchParams();
  if (title) params.set('title', title);
  if (text) params.set('text', text);
  if (url) params.set('url', url);

  return Response.redirect(`/?share=true&${params.toString()}`, 303);
}

async function handleFileImport(request) {
  const formData = await request.formData();
  const files = formData.getAll('file');

  console.log('📁 Service Worker: Handling file import', files);

  // Process files and redirect to app with file data
  const fileData = [];
  
  for (const file of files) {
    if (file.type === 'text/csv' || file.type === 'application/json') {
      const content = await file.text();
      fileData.push({
        name: file.name,
        type: file.type,
        content: content
      });
    }
  }

  // Store file data temporarily
  await storeImportedFiles(fileData);

  return Response.redirect('/?import=true', 303);
}

async function storeImportedFiles(fileData) {
  try {
    localStorage.setItem('ab-testing-pro-imported-files', JSON.stringify(fileData));
    console.log('📁 Service Worker: Files stored for import');
  } catch (error) {
    console.error('Error storing imported files:', error);
  }
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Service Worker: Periodic sync triggered', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    console.log('🔄 Service Worker: Syncing content...');
    
    // Update cache with fresh content
    const cache = await caches.open(CACHE_NAME);
    
    // Fetch fresh versions of key files
    const urlsToUpdate = [
      '/',
      '/manifest.json'
    ];
    
    for (const url of urlsToUpdate) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`✅ Service Worker: Updated cache for ${url}`);
        }
      } catch (error) {
        console.warn(`⚠️ Service Worker: Failed to update ${url}`, error);
      }
    }
  } catch (error) {
    console.error('❌ Service Worker: Content sync failed', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.payload)
    );
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  
  for (const url of urls) {
    try {
      await cache.add(url);
      console.log(`✅ Service Worker: Cached ${url}`);
    } catch (error) {
      console.warn(`⚠️ Service Worker: Failed to cache ${url}`, error);
    }
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker: Unhandled promise rejection', event.reason);
});

console.log('🚀 Service Worker: Loaded successfully');
