const CACHE_NAME = 'prayer-times-cache-v2';
const MAX_CACHE_ENTRIES = 50; // Limit for dynamic content

// Offline Analytics Storage
const ANALYTICS_DB_NAME = 'prayer-times-analytics';
const ANALYTICS_STORE_NAME = 'offline-events';

// Initialize IndexedDB for offline analytics
async function initAnalyticsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ANALYTICS_DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ANALYTICS_STORE_NAME)) {
        const store = db.createObjectStore(ANALYTICS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Store analytics event offline
async function storeAnalyticsEvent(eventData) {
  try {
    const db = await initAnalyticsDB();
    const transaction = db.transaction([ANALYTICS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(ANALYTICS_STORE_NAME);

    const event = {
      ...eventData,
      timestamp: Date.now(),
      offline: true
    };

    await new Promise((resolve, reject) => {
      const request = store.add(event);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log('Analytics event stored offline:', event);
  } catch (error) {
    console.error('Failed to store analytics event offline:', error);
  }
}

// Sync offline analytics events
async function syncOfflineAnalytics() {
  try {
    const db = await initAnalyticsDB();
    const transaction = db.transaction([ANALYTICS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(ANALYTICS_STORE_NAME);
    const index = store.index('timestamp');

    const events = await new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (events.length > 0) {
      console.log(`Syncing ${events.length} offline analytics events`);

      // Send events to Google Analytics
      for (const event of events) {
        try {
          // Use Google Analytics Measurement Protocol for server-side sending
          const gaData = {
            v: '1',
            tid: 'G-RBE4169XBF', // Your GA4 Measurement ID
            cid: event.user_id || 'anonymous',
            t: 'event',
            ec: 'offline',
            ea: event.event_name || 'unknown',
            el: event.event_label || '',
            ev: event.event_value || 0,
            cd1: event.custom_dimension_1 || '',
            z: Date.now()
          };

          const formData = new FormData();
          Object.keys(gaData).forEach(key => {
            formData.append(key, gaData[key]);
          });

          await fetch('https://www.google-analytics.com/collect', {
            method: 'POST',
            body: formData
          });
        } catch (error) {
          console.error('Failed to send offline analytics event:', error);
        }
      }

      // Clear synced events
      const deleteTransaction = db.transaction([ANALYTICS_STORE_NAME], 'readwrite');
      const deleteStore = deleteTransaction.objectStore(ANALYTICS_STORE_NAME);

      for (const event of events) {
        await new Promise((resolve, reject) => {
          const request = deleteStore.delete(event.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      console.log('Offline analytics events synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync offline analytics:', error);
  }
}

const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/json/locations.json',
  '/images/icon.png',
  '/images/badge.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap',

  // Firebase CDN Scripts (now used on all pages)
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics-compat.js',

  // All HTML pages
  '/99-names.html',
  '/dhikr-counter.html',
  '/islamic-calendar.html',
  '/nearby-mosques.html',
  '/prayer-tracker.html',
  '/qibla.html',
  '/settings.html',
  '/manifest.json',

  // All page-specific CSS files
  '/css/99-names.css',
  '/css/dhikr-counter.css',
  '/css/islamic-calendar.css',
  '/css/nearby-mosques.css',
  '/css/prayer-tracker.css',
  '/css/qibla.css',
  '/css/settings.css',

  // All page-specific JavaScript files
  '/js/99-names.js',
  '/js/dhikr-counter.js',
  '/js/islamic-calendar.js',
  '/js/nearby-mosques.js',
  '/js/prayer-tracker.js',
  '/js/qibla.js',
  '/js/settings.js',
  '/js/shared.js', // shared.js is used by multiple pages
  '/json/dhikr-data.json', // dhikr-data.json is used by dhikr-counter.js
  '/offline.html' // Add the offline page to the cache
];

async function addResourcesToCache(resources) {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
}

async function putInCache(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
  // Call trimCache after adding a new item
  await trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
}

async function deleteOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName !== CACHE_NAME) {
        return caches.delete(cacheName);
      }
    })
  );
}

async function getFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  return await cache.match(request);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const excess = keys.length - maxEntries;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`Cache ${cacheName} trimmed. Removed ${excess} entries.`);
  }
}


// Install event: cache the app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Install complete, calling skipWaiting');
        return self.skipWaiting();
      })
  );
});

// Activate event: clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Clearing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Immediately claim all clients to avoid conflicts
      self.clients.claim().then(() => {
        console.log('Service Worker: All clients claimed');
        // Get all clients and notify them of the new service worker
        return self.clients.matchAll();
      }).then((clients) => {
        console.log(`Service Worker: Managing ${clients.length} clients`);
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'New service worker activated'
          });
        });
      })
    ])
  );
});

// Fetch event: serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and chrome-extension requests
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension:')) {
        return;
    }

    // Allow OneSignal CDN requests to bypass service worker
    if (event.request.url.includes('cdn.onesignal.com') || 
        event.request.url.includes('onesignal.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.url.includes('api.aladhan.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Only cache successful responses
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(err => console.warn('Cache put failed:', err));
                    }
                    return response;
                })
                .catch(err => {
                    console.warn('API fetch failed, trying cache:', err);
                    return caches.match(event.request);
                })
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    // Try network fetch with error handling
                    return fetch(event.request)
                        .catch(err => {
                            console.warn('Network fetch failed for:', event.request.url, err);
                            
                            // Special handling for external API requests
                            if (event.request.url.includes('nominatim.openstreetmap.org') || 
                                event.request.url.includes('api.allorigins.win')) {
                                // For geocoding APIs, return a proper error response instead of undefined
                                return new Response(JSON.stringify({
                                    error: 'CORS_ERROR',
                                    message: 'Geocoding service unavailable due to CORS policy'
                                }), {
                                    status: 500,
                                    statusText: 'CORS Error',
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            }
                            
                            // Return a basic response for failed requests to prevent uncaught errors
                            if (event.request.destination === 'document') {
                                return caches.match('/offline.html');
                            }
                            
                            // For other resources, return undefined (will result in network error)
                            return undefined;
                        });
                })
        );
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('On notification click: ', event.notification.tag);
  event.notification.close();

  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then((clientList) => {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});

// Push event listener
self.addEventListener('push', event => {
    console.log('Push event received');
    let data = {};
    if (event.data) {
        data = event.data.json();
    }

    const title = data.title || 'Prayer Times';
    const options = {
        body: data.body || 'A prayer time is here.',
        icon: '/images/icon.png',
        badge: '/images/badge.png',
        tag: 'prayer-time-reminder',
        requireInteraction: false,
        silent: false
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Scheduled notifications using cached prayer data
self.addEventListener('message', event => {
    try {
        if (event.data && event.data.type === 'SKIP_WAITING') {
            // Force service worker to activate immediately
            console.log('Service Worker: Received SKIP_WAITING message, activating...');
            self.skipWaiting();
        } else if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
            const prayerTimes = event.data.prayerTimes;
            const notificationMode = event.data.notificationMode;

            console.log('Received notification scheduling request, mode:', notificationMode);

            if (prayerTimes && Array.isArray(prayerTimes) && typeof notificationMode === 'number') {
                scheduleNotifications(prayerTimes, notificationMode);
            } else {
                console.warn('Invalid prayer data received for notification scheduling');
            }
        } else if (event.data && event.data.type === 'PRAYER_REMINDER') {
            console.log('Service Worker: Received PRAYER_REMINDER message.');
            console.log('  Title:', event.data.title);
            console.log('  Body:', event.data.body);
            const title = event.data.title || 'Prayer Reminder';
            const body = event.data.body || 'A prayer reminder is here.';

            self.registration.showNotification(title, {
                body: body,
                icon: '/images/icon.png',
                badge: '/images/badge.png'
            }).catch(err => console.warn('Failed to show prayer reminder notification:', err));
        } else if (event.data && event.data.action === 'show-onesignal-notification') {
            // Handle OneSignal-style notifications
            console.log('Service Worker: Received OneSignal-style notification request');
            const notification = event.data.notification;
            
            self.registration.showNotification(notification.title, {
                body: notification.body,
                icon: notification.icon || '/images/icon.png',
                badge: notification.badge || '/images/badge.png',
                data: notification.data || {},
                requireInteraction: true,
                actions: [
                    {
                        action: 'open',
                        title: 'View App'
                    }
                ]
            }).catch(err => console.warn('Failed to show OneSignal-style notification:', err));
        } else if (event.data && event.data.type === 'ANALYTICS_EVENT') {
            // Handle offline analytics events
            const eventData = event.data.eventData;
            console.log('Received analytics event:', eventData);

            // Always store for later sync, the client will decide if it sends online or not
            storeAnalyticsEvent(eventData);
        } else if (event.data && event.data.type === 'SYNC_ANALYTICS') {
            // Manual sync of offline analytics
            if (navigator.onLine) {
                syncOfflineAnalytics();
            }
        } else if (event.data && event.data.type === 'TEST_MESSAGE') {
            // Debug test message
            console.log('Service Worker: Received test message:', event.data);
            
            // Send response back to page
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage({
                    type: 'TEST_RESPONSE',
                    message: 'Service worker is working!',
                    timestamp: Date.now()
                });
            } else {
                // Broadcast to all clients
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'TEST_RESPONSE',
                            message: 'Service worker is working!',
                            timestamp: Date.now()
                        });
                    });
                });
            }
        } else if (event.data && event.data.type === 'SEND_MISSED_PRAYER_NOTIFICATION') {
            // Debug: manually trigger missed prayer notification
            const prayerName = event.data.prayerName || 'Test Prayer';
            console.log('Service Worker: Manual missed prayer notification triggered for:', prayerName);
            sendMissedPrayerNotification(prayerName).catch(err => 
                console.error('Error sending manual missed prayer notification:', err)
            );
        } else if (event.data && event.data.type === 'CHECK_PRAYER_STATUS') {
            // This shouldn't happen in SW, but handle gracefully
            console.log('Received CHECK_PRAYER_STATUS in service worker - ignoring');
        } else if (event.data && event.data.type === 'PRAYER_STATUS_RESPONSE') {
            // Handle prayer status response from the page
            const { prayerName, isCompleted, checkId } = event.data;
            console.log(`Prayer status response: ${prayerName} completed: ${isCompleted}`);
            
            if (!isCompleted) {
                console.log(`${prayerName} was not completed - sending missed prayer notification`);
                sendMissedPrayerNotification(prayerName).catch(err => 
                    console.error('Error sending missed prayer notification:', err)
                );
            } else {
                console.log(`${prayerName} was completed - no missed notification needed`);
            }
        } else if (event.data && event.data.type === 'SEND_ONESIGNAL_MISSED_ALERT') {
            // This will be handled by the page when it receives the message
            console.log('Received SEND_ONESIGNAL_MISSED_ALERT in service worker - this should go to page');
        } else if (event.data && event.data.type === 'ONESIGNAL_INTEGRATION_READY') {
            // OneSignal integration is ready
            console.log('Service Worker: OneSignal integration ready', event.data);
            self.oneSignalIntegrationReady = true;
        }
    } catch (err) {
        console.error('Error in message listener:', err);
    }
});

function scheduleNotifications(prayerTimes, notificationMode) {
    console.log('=== SW: scheduleNotifications called ===');
    console.log('Prayer times count:', prayerTimes ? prayerTimes.length : 0);
    console.log('Notification mode:', notificationMode);
    console.log('Current time:', new Date().toLocaleString());
    
    // Clear existing timeouts
    if (self.notificationTimeouts) {
        console.log('Clearing', self.notificationTimeouts.length, 'existing timeouts');
        self.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
    }
    self.notificationTimeouts = [];

    // If notifications are off (mode 0), just clear timeouts and return
    if (notificationMode === 0) {
        console.log("Notifications turned off - clearing all scheduled notifications");
        return;
    }

    const now = new Date();
    
    prayerTimes.forEach(prayer => {
        let shouldSchedule = false;
        
        // Check notification mode
        if (notificationMode === 1 && prayer.type === 'prayer') {
            shouldSchedule = true; // Only obligatory prayers
        } else if (notificationMode === 2 && (prayer.type === 'prayer' || prayer.type === 'optional')) {
            shouldSchedule = true; // All prayers including optional
        }
        
        if (shouldSchedule) {
            try {
                const startTime = new Date(prayer.startParsed);
                const endTime = new Date(prayer.endParsed);
                
                // Validate times
                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    console.warn('Invalid prayer time data for:', prayer.name);
                    return;
                }
                
                // Schedule notification 1 minute before start
                const oneMinuteBefore = new Date(startTime.getTime() - 60000);
                if (oneMinuteBefore > now) {
                    const timeout1 = setTimeout(() => {
                        try {
                            self.registration.showNotification(`${prayer.name} Time Soon`, {
                                body: `${prayer.name} prayer will start in 1 minute.`,
                                icon: '/images/icon.png',
                                badge: '/images/badge.png',
                                tag: 'prayer-time-reminder'
                            }).catch(err => console.warn('Failed to show start notification:', err));
                        } catch (err) {
                            console.warn('Error in start notification timeout:', err);
                        }
                    }, Math.min(oneMinuteBefore.getTime() - now.getTime(), 2147483647)); // Max setTimeout value
                    
                    self.notificationTimeouts.push(timeout1);
                }
                
                // Schedule notification 15 minutes before end
                const fifteenMinutesBefore = new Date(endTime.getTime() - 900000);
                if (fifteenMinutesBefore > now) {
                    const timeout2 = setTimeout(() => {
                        try {
                            self.registration.showNotification(`${prayer.name} Ending Soon`, {
                                body: `${prayer.name} prayer will end in 15 minutes.`,
                                icon: '/images/icon.png',
                                badge: '/images/badge.png',
                                tag: 'prayer-time-reminder'
                            }).catch(err => console.warn('Failed to show end notification:', err));
                        } catch (err) {
                            console.warn('Error in end notification timeout:', err);
                        }
                    }, Math.min(fifteenMinutesBefore.getTime() - now.getTime(), 2147483647)); // Max setTimeout value
                    
                    self.notificationTimeouts.push(timeout2);
                }

                // Schedule missed prayer check - 5 minutes after prayer ends
                const missedCheckTime = new Date(endTime.getTime() + 300000); // 5 minutes after end
                if (missedCheckTime > now) {
                    const timeout3 = setTimeout(() => {
                        try {
                            checkForMissedPrayer(prayer.name, endTime);
                        } catch (err) {
                            console.warn('Error in missed prayer check timeout:', err);
                        }
                    }, Math.min(missedCheckTime.getTime() - now.getTime(), 2147483647));
                    
                    self.notificationTimeouts.push(timeout3);
                    console.log(`Scheduled missed prayer check for ${prayer.name} at ${missedCheckTime.toLocaleTimeString()}`);
                }
            } catch (err) {
                console.warn('Error scheduling notifications for prayer:', prayer.name, err);
            }
        }
    });
    
    console.log(`Scheduled ${self.notificationTimeouts.length} notifications for mode ${notificationMode}`);
}

// Check if a prayer was missed and send notification
async function checkForMissedPrayer(prayerName, prayerEndTime) {
    try {
        console.log(`Checking if ${prayerName} prayer was missed (ended at ${prayerEndTime.toLocaleTimeString()})`);
        
        // Get prayer completion status from localStorage
        const today = new Date().toDateString();
        const storageKey = `prayerData_${today}`;
        
        // We can't directly access localStorage from service worker, so we'll message the page
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        
        if (clients.length > 0) {
            // Send message to active page to check prayer status
            clients[0].postMessage({
                type: 'CHECK_PRAYER_STATUS',
                prayerName: prayerName,
                prayerEndTime: prayerEndTime.toISOString(),
                checkId: Date.now()
            });
        } else {
            // No active page - assume prayer was missed and send notification
            console.log(`No active page found - assuming ${prayerName} was missed`);
            await sendMissedPrayerNotification(prayerName);
        }
        
    } catch (error) {
        console.error('Error checking for missed prayer:', error);
    }
}

// Send missed prayer notification (both local and OneSignal)
async function sendMissedPrayerNotification(prayerName) {
    try {
        console.log(`Sending missed prayer notification for ${prayerName}`);
        
        // Send local notification
        await self.registration.showNotification('Prayer Missed', {
            body: `You have missed the ${prayerName} prayer.`,
            icon: '/images/icon.png',
            badge: '/images/badge.png',
            tag: 'missed-prayer-' + prayerName,
            requireInteraction: true,
            actions: [
                {
                    action: 'mark-completed',
                    title: 'Mark as Completed'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        });
        
        // Try to send OneSignal notification if available
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        
        if (clients.length > 0) {
            clients[0].postMessage({
                type: 'SEND_ONESIGNAL_MISSED_ALERT',
                prayerName: prayerName
            });
        }
        
        console.log(`Missed prayer notification sent for ${prayerName}`);
        
    } catch (error) {
        console.error('Error sending missed prayer notification:', error);
    }
}

// Background Sync event listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-failed-data') {
    console.log('Service Worker: Background sync initiated for send-failed-data');
    event.waitUntil(
      // Here you would typically fetch data from IndexedDB
      // and attempt to send it to the server.
      // For demonstration, just a placeholder.
      new Promise((resolve) => {
        console.log('Service Worker: Attempting to send failed data...');
        // Simulate an async operation
        setTimeout(() => {
          console.log('Service Worker: Failed data sent (simulated).');
          resolve();
        }, 2000);
      })
    );
  } else if (event.tag === 'sync-analytics') {
    console.log('Service Worker: Background sync initiated for analytics');
    event.waitUntil(syncOfflineAnalytics());
  }
});

// Online/Offline event listeners for analytics sync
self.addEventListener('online', () => {
  console.log('Service Worker: Connection restored, syncing offline analytics');
  syncOfflineAnalytics();
});

self.addEventListener('offline', () => {
  console.log('Service Worker: Connection lost, analytics will be stored offline');
});
