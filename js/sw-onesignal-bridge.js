// Service Worker Bridge for OneSignal Integration
// This ensures proper coexistence between our custom SW and OneSignal SW

console.log('SW-OneSignal Bridge: Loading...');

// Function to ensure OneSignal service worker compatibility
function setupOneSignalBridge() {
    if ('serviceWorker' in navigator) {
        
        // Listen for OneSignal service worker registration
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('SW-OneSignal Bridge: Controller changed - checking active SW');
            
            if (navigator.serviceWorker.controller) {
                const swUrl = navigator.serviceWorker.controller.scriptURL;
                console.log('SW-OneSignal Bridge: Active SW URL:', swUrl);
                
                // If OneSignal SW becomes active, we need to handle messaging
                if (swUrl.includes('OneSignal')) {
                    console.log('SW-OneSignal Bridge: OneSignal SW is active - setting up messaging bridge');
                    setupOneSignalMessaging();
                }
            }
        });
        
        // Check current service worker
        navigator.serviceWorker.ready.then(registration => {
            console.log('SW-OneSignal Bridge: SW Ready:', registration.active?.scriptURL);
            
            // If we have both SWs, ensure they can communicate
            setupCommunicationBridge(registration);
        });
    }
}

// Set up messaging bridge between OneSignal SW and our app
function setupOneSignalMessaging() {
    // Listen for messages from OneSignal SW
    navigator.serviceWorker.addEventListener('message', event => {
        console.log('SW-OneSignal Bridge: Message from SW:', event.data);
        
        // Forward prayer-related messages to our app
        if (event.data && event.data.type && event.data.type.includes('PRAYER')) {
            console.log('SW-OneSignal Bridge: Forwarding prayer message to app');
            
            // Trigger app-level prayer handling
            if (window.prayerTimesApp && window.prayerTimesApp.handlePrayerStatusRequest) {
                window.prayerTimesApp.handlePrayerStatusRequest(event.data);
            }
        }
    });
}

// Set up communication bridge between SWs
function setupCommunicationBridge(registration) {
    if (!registration.active) return;
    
    console.log('SW-OneSignal Bridge: Setting up communication bridge');
    
    // Create a unified messaging system
    const sendToServiceWorker = (message) => {
        if (registration.active) {
            registration.active.postMessage(message);
        }
    };
    
    // Make it globally available
    window.swBridge = {
        sendMessage: sendToServiceWorker,
        sendPrayerNotification: (data) => {
            sendToServiceWorker({
                action: 'show-prayer-notification',
                notification: data
            });
        },
        scheduleNotifications: (prayerTimes, mode) => {
            sendToServiceWorker({
                type: 'SCHEDULE_NOTIFICATIONS',
                prayerTimes: prayerTimes,
                notificationMode: mode
            });
        }
    };
    
    console.log('SW-OneSignal Bridge: Bridge setup complete');
}

// Handle OneSignal initialization completion
function onOneSignalReady() {
    console.log('SW-OneSignal Bridge: OneSignal ready, ensuring compatibility...');
    
    // Make sure our service worker can handle OneSignal-style notifications
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'ONESIGNAL_READY',
            timestamp: Date.now()
        });
    }
}

// Initialize the bridge
document.addEventListener('DOMContentLoaded', () => {
    console.log('SW-OneSignal Bridge: DOM loaded, setting up bridge...');
    setupOneSignalBridge();
    
    // Wait for OneSignal to be ready
    const checkOneSignalReady = () => {
        if (window.oneSignalManager && window.oneSignalManager.isInitialized) {
            onOneSignalReady();
        } else {
            setTimeout(checkOneSignalReady, 100);
        }
    };
    
    setTimeout(checkOneSignalReady, 1000);
});

// Export for global use
window.swOneSignalBridge = {
    setupBridge: setupOneSignalBridge,
    onReady: onOneSignalReady
};

console.log('SW-OneSignal Bridge: Module loaded');
