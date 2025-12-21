// Service Worker for Web Push Notifications

self.addEventListener('push', function(event) {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'StayBuki Notification';
  const options = {
    body: data.message || data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: data.url,
      type: data.type,
      referenceId: data.referenceId
    },
    requireInteraction: true,
    tag: data.type + '-' + data.referenceId
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data;
  let targetUrl = '/';

  // Determine the target URL based on notification type
  // Use paths that match actual routing (mobile uses different paths)
  if (data.url) {
    targetUrl = data.url;
  } else if (data.type) {
    switch(data.type) {
      case 'visit_request':
        targetUrl = '/owner-visit-requests';
        break;
      case 'onboarding_request':
        targetUrl = '/owner-onboarding-requests';
        break;
      case 'payment':
        targetUrl = '/payments';
        break;
      case 'complaint':
        targetUrl = '/complaints';
        break;
      default:
        targetUrl = '/dashboard';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(client => {
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
