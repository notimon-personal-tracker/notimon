// Service Worker for Push Notifications
const CACHE_NAME = 'notimon-v1';
const urlsToCache = [
  '/',
  '/questions',
  '/account',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Notimon',
    body: 'Time to fill in your answers!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: '/questions',
    tag: 'notimon-daily-questions',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Questions',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-192x192.png'
      }
    ]
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push notification data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: {
        url: notificationData.url || '/questions'
      }
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const action = event.action;
  const notification = event.notification;
  
  // Close the notification
  notification.close();

  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Default action or 'view' action - open the app
  const urlToOpen = notification.data?.url || '/questions';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        const baseUrl = self.registration.scope;
        const fullUrl = new URL(urlToOpen, baseUrl).href;
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// Background sync (optional - for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync if needed
      Promise.resolve()
    );
  }
});

// Fetch event - handle caching for offline functionality
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-http(s) requests (chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip requests from extensions or other unsupported schemes
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise, fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache non-200 responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Don't cache if response is not from same origin
          if (response.type !== 'basic' && response.type !== 'cors') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response safely
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Additional check before caching
              if (event.request.url.startsWith('http')) {
                cache.put(event.request, responseToCache).catch((error) => {
                  console.warn('Failed to cache request:', event.request.url, error);
                });
              }
            })
            .catch((error) => {
              console.warn('Failed to open cache:', error);
            });

          return response;
        }).catch(() => {
          // Return offline page if available
          return caches.match('/offline.html');
        });
      })
  );
});

// Handle push subscription changes (for Safari)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);
  
  event.waitUntil(
    // Re-subscribe to push notifications
    fetch('/api/user/push-notifications/vapid-key')
      .then((response) => response.json())
      .then((data) => {
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: data.publicKey
        });
      })
      .then((subscription) => {
        return fetch('/api/user/push-notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription })
        });
      })
      .catch((error) => {
        console.error('Error resubscribing to push notifications:', error);
      })
  );
}); 