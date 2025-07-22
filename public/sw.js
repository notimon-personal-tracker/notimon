// Service Worker for Push Notifications

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  self.clients.claim();
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