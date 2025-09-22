// Custom OneSignal Service Worker with Prayer Times Integration
// This file combines OneSignal functionality with custom prayer notification features

// Import OneSignal SDK
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

console.log('OneSignal SW: Custom service worker with prayer times integration loaded');

// Prayer Times Integration Variables
const CACHE_NAME = 'prayer-times-cache-v2';
const MAX_CACHE_ENTRIES = 50;
const ANALYTICS_DB_NAME = 'prayer-times-analytics';
const ANALYTICS_STORE_NAME = 'offline-events';

// Initialize arrays for notification timeouts
self.notificationTimeouts = self.notificationTimeouts || [];

// Add message event listener at the top level (fixes OneSignal warning)
self.addEventListener('message', event => {
    try {
        // Only log and handle messages that are meant for our custom functionality
        if (event.data && typeof event.data === 'object' && event.data.type) {
            console.log('OneSignal SW: Received custom message:', event.data.type);
            
            if (event.data.type === 'SCHEDULE_NOTIFICATIONS') {
                const prayerTimes = event.data.prayerTimes;
                const notificationMode = event.data.notificationMode;

                console.log('OneSignal SW: Received notification scheduling request, mode:', notificationMode);

                if (prayerTimes && Array.isArray(prayerTimes) && typeof notificationMode === 'number') {
                    scheduleNotifications(prayerTimes, notificationMode);
                } else {
                    console.warn('OneSignal SW: Invalid prayer data received for notification scheduling');
                }
            } else if (event.data.type === 'PRAYER_REMINDER') {
                console.log('OneSignal SW: Received PRAYER_REMINDER message');
                const title = event.data.title || 'Prayer Reminder';
                const body = event.data.body || 'A prayer reminder is here.';

                self.registration.showNotification(title, {
                    body: body,
                    icon: '/images/icon.png',
                    badge: '/images/badge.png'
                }).catch(err => console.warn('Failed to show prayer reminder notification:', err));
            } else if (event.data.type === 'TEST_MESSAGE') {
                console.log('OneSignal SW: Received test message:', event.data);
                
                // Send response back to page
                if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({
                        type: 'TEST_RESPONSE',
                        message: 'OneSignal service worker is working!',
                        timestamp: Date.now()
                    });
                } else {
                    // Broadcast to all clients
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'TEST_RESPONSE',
                                message: 'OneSignal service worker is working!',
                                timestamp: Date.now()
                            });
                        });
                    });
                }
            } else if (event.data.type === 'SEND_MISSED_PRAYER_NOTIFICATION') {
                const prayerName = event.data.prayerName || 'Test Prayer';
                console.log('OneSignal SW: Manual missed prayer notification triggered for:', prayerName);
                sendMissedPrayerNotification(prayerName).catch(err => 
                    console.error('Error sending manual missed prayer notification:', err)
                );
            } else if (event.data.type === 'PRAYER_STATUS_RESPONSE') {
                const { prayerName, isCompleted, checkId } = event.data;
                console.log(`OneSignal SW: Prayer status response: ${prayerName} completed: ${isCompleted}`);
                
                if (!isCompleted) {
                    console.log(`${prayerName} was not completed - sending missed prayer notification`);
                    sendMissedPrayerNotification(prayerName).catch(err => 
                        console.error('Error sending missed prayer notification:', err)
                    );
                } else {
                    console.log(`${prayerName} was completed - no missed prayer notification needed`);
                }
            } else if (event.data.type === 'ANALYTICS_EVENT') {
                const eventData = event.data.eventData;
                console.log('OneSignal SW: Received analytics event:', eventData);
                storeAnalyticsEvent(eventData);
            } else if (event.data.type === 'SYNC_ANALYTICS') {
                if (navigator.onLine) {
                    syncOfflineAnalytics();
                }
            }
            // Only handle messages with our custom types - let OneSignal handle its own messages
        }
        // Let other messages pass through to OneSignal
    } catch (err) {
        console.error('OneSignal SW: Error in message listener:', err);
    }
});

// Initialize analytics database
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
    const events = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (events.length > 0) {
      console.log(`Syncing ${events.length} offline analytics events`);
      
      for (const event of events) {
        try {
          // Attempt to send to analytics
          const response = await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
          });

          if (response.ok) {
            // Remove from offline storage
            const deleteTransaction = db.transaction([ANALYTICS_STORE_NAME], 'readwrite');
            const deleteStore = deleteTransaction.objectStore(ANALYTICS_STORE_NAME);
            deleteStore.delete(event.id);
          }
        } catch (error) {
          console.warn('Failed to sync analytics event:', event.id, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync offline analytics:', error);
  }
}

// Cache management
async function addResourcesToCache(resources) {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
}

async function putInCache(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}

async function deleteOldCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames
    .filter(name => name !== CACHE_NAME)
    .map(name => caches.delete(name));
  await Promise.all(deletePromises);
}

async function getFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  return await cache.match(request);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
  }
}

// Prayer notification scheduling
function scheduleNotifications(prayerTimes, notificationMode) {
    console.log('=== OneSignal SW: scheduleNotifications called ===');
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
                    }, Math.min(oneMinuteBefore.getTime() - now.getTime(), 2147483647));
                    
                    self.notificationTimeouts.push(timeout1);
                    console.log(`Scheduled start notification for ${prayer.name} at ${oneMinuteBefore.toLocaleTimeString()}`);
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
                    }, Math.min(fifteenMinutesBefore.getTime() - now.getTime(), 2147483647));
                    
                    self.notificationTimeouts.push(timeout2);
                    console.log(`Scheduled end notification for ${prayer.name} at ${fifteenMinutesBefore.toLocaleTimeString()}`);
                }

                // Schedule missed prayer check - 5 minutes after prayer ends
                const missedCheckTime = new Date(endTime.getTime() + 300000);
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
        
        // Send message to all clients to check prayer status
        const clients = await self.clients.matchAll();
        console.log(`Found ${clients.length} active clients`);
        
        if (clients.length === 0) {
            console.log('No active clients - assuming prayer was missed, sending notification');
            await sendMissedPrayerNotification(prayerName);
        } else {
            // Ask active clients about prayer status
            const checkId = Date.now().toString();
            const prayerDate = prayerEndTime.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            clients.forEach(client => {
                console.log('Sending prayer status check to client');
                client.postMessage({
                    type: 'CHECK_PRAYER_STATUS',
                    prayerName: prayerName,
                    prayerDate: prayerDate,
                    checkId: checkId
                });
            });
            
            // Wait for response, if no response in 10 seconds, assume missed
            setTimeout(async () => {
                console.log(`No response received for ${prayerName} status check - assuming missed`);
                await sendMissedPrayerNotification(prayerName);
            }, 10000);
        }
    } catch (error) {
        console.error('Error in checkForMissedPrayer:', error);
    }
}

// Send missed prayer notification via OneSignal
async function sendMissedPrayerNotification(prayerName) {
    console.log(`Sending missed prayer notification for ${prayerName}`);
    
    try {
        // Send local notification
        await self.registration.showNotification(`${prayerName} Prayer Missed`, {
            body: `You missed the ${prayerName} prayer. Don't forget to make it up!`,
            icon: '/images/icon.png',
            badge: '/images/badge.png',
            tag: 'missed-prayer',
            requireInteraction: true,
            actions: [
                {
                    action: 'mark_completed',
                    title: 'Mark as Complete'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        });
        
        console.log(`Local missed prayer notification sent for ${prayerName}`);
        
        // Send OneSignal push notification - this SHOULD work when browser is closed!
        try {
            // Method 1: Try to send via OneSignal SDK (if available in SW context)
            if (typeof self.OneSignal !== 'undefined' && self.OneSignal.Notifications) {
                console.log('Sending OneSignal push notification from service worker...');
                
                // This should send a real push notification
                await self.OneSignal.Notifications.show({
                    title: `${prayerName} Prayer Missed`,
                    text: `You missed the ${prayerName} prayer. Don't forget to make it up!`,
                    icon: '/images/icon.png',
                    data: {
                        type: 'missed-prayer',
                        prayer: prayerName,
                        timestamp: Date.now()
                    }
                });
                
                console.log('✅ OneSignal push notification sent via SW SDK');
                return;
            }
            
            // Method 2: Use the push event mechanism that OneSignal sets up
            // This is the correct way for background notifications
            const clients = await self.clients.matchAll({ includeUncontrolled: true });
            
            if (clients.length > 0) {
                // If clients exist, ask them to send OneSignal notification
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SEND_ONESIGNAL_MISSED_PRAYER',
                        prayerName: prayerName
                    });
                });
                console.log(`OneSignal notification request sent to ${clients.length} clients`);
            } else {
                // No clients - this is where OneSignal should still work via push events
                console.log('No active clients - OneSignal should still work via push subscription');
                
                // The local notification will definitely show
                // OneSignal push notifications should also work if user is subscribed
                // This is handled by OneSignal's own service worker logic
            }
            
        } catch (error) {
            console.error('Error sending OneSignal notification:', error);
        }
        
    } catch (error) {
        console.error('Error sending missed prayer notification:', error);
    }
}

// Custom notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('OneSignal SW: Notification clicked:', event.notification.tag, event.action);
    
    // Handle prayer-specific notifications
    if (event.notification.tag === 'missed-prayer') {
        event.notification.close();
        
        if (event.action === 'mark_completed') {
            // Handle mark as completed action
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'MARK_PRAYER_COMPLETED',
                        prayerName: event.notification.title.replace(' Prayer Missed', ''),
                        timestamp: Date.now()
                    });
                });
            });
        } else {
            // Open the app
            event.waitUntil(
                self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
                    for (const client of clients) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    if (self.clients.openWindow) {
                        return self.clients.openWindow('/');
                    }
                })
            );
        }
    }
    // Let OneSignal handle other notifications
});

// Background sync for analytics
self.addEventListener('sync', (event) => {
    console.log('OneSignal SW: Background sync triggered:', event.tag);
    
    if (event.tag === 'analytics-sync') {
        event.waitUntil(syncOfflineAnalytics());
    }
});

// Cache management events
self.addEventListener('install', (event) => {
    console.log('OneSignal SW: Installing with prayer times integration...');
    
    event.waitUntil((async () => {
        console.log('OneSignal SW: Caching prayer times resources');
        try {
            await addResourcesToCache([
                '/',
                '/index.html',
                '/css/style.css',
                '/js/app.js',
                '/js/shared.js',
                '/images/icon.png',
                '/images/badge.png',
                '/manifest.json'
            ]);
        } catch (error) {
            console.warn('OneSignal SW: Failed to cache some resources:', error);
        }
    })());
});

self.addEventListener('activate', (event) => {
    console.log('OneSignal SW: Activating with prayer times integration...');
    
    event.waitUntil((async () => {
        await deleteOldCaches();
        
        const clients = await self.clients.matchAll();
        console.log('OneSignal SW: Managing', clients.length, 'clients');
        
        // Notify clients that service worker is ready
        clients.forEach(client => {
            client.postMessage({
                type: 'SW_ACTIVATED',
                timestamp: Date.now()
            });
        });
    })());
});

// Basic fetch handler for caching
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and external URLs
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Don't interfere with OneSignal requests
    if (event.request.url.includes('onesignal') || event.request.url.includes('OneSignal')) {
        return;
    }

    event.respondWith((async () => {
        try {
            // Try network first for API calls
            if (event.request.url.includes('/api/')) {
                const networkResponse = await fetch(event.request);
                return networkResponse;
            }

            // For other resources, try cache first, then network
            const cachedResponse = await getFromCache(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            const networkResponse = await fetch(event.request);
            if (networkResponse.ok) {
                await putInCache(event.request, networkResponse.clone());
                await trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
            }
            return networkResponse;
        } catch (error) {
            // Return cached response if available
            const cachedResponse = await getFromCache(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }
            throw error;
        }
    })());
});

// Online/offline events
self.addEventListener('online', () => {
    console.log('OneSignal SW: Online - syncing analytics');
    syncOfflineAnalytics();
});

self.addEventListener('offline', () => {
    console.log('OneSignal SW: Offline mode');
});

console.log('OneSignal SW: Custom service worker with prayer times integration loaded');