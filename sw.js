// Service Worker for ZestFlow AI
const CACHE_NAME = 'zestflow-v2';
const urlsToCache = [
  '/',
  '/consistent-styles.css',
  '/global-styles.css',
  '/favicon.svg',
  '/favicon.ico',
  '/index.html',
  '/demo.html',
  '/widget-demo.html',
  '/pricing.html',
  '/book-install.html',
  '/contact.html',
  '/calculator.html',
  '/testimonials.html',
  '/compare.html',
  '/help.html',
  '/blog.html',
  '/resources.html',
  '/integrations.html',
  '/tutorials.html',
  '/status.html',
  '/changelog.html',
  '/about.html',
  '/press.html',
  '/service-areas.html',
  '/accessibility.html',
  '/privacy.html',
  '/terms.html',
  '/cookies.html',
  '/refund.html',
  '/free-revenue-calculator.html',
  '/case-studies.html',
  '/careers.html',
  '/api-docs.html',
  '/manifest.json',
  '/js/cookie-consent.js',
  '/js/analytics.js',
  '/js/form-handler.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache failed:', err);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch Event - Network First, Cache Fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background Sync for form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(
      // In production, this would retry failed form submissions
      console.log('Syncing contact form submissions...')
    );
  }
});

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New after-hours job booked!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('ZestFlow AI', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});