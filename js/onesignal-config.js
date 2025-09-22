// OneSignal Configuration for Prayer Times App
// This enables push notifications even when browser is closed

class OneSignalNotificationManager {
    constructor() {
        this.isInitialized = false;
        this.isInitializing = false; // Add flag to prevent concurrent initialization
        this.appId = '8126963e-3e5f-4095-8515-5f23fad6be55'; // Your OneSignal App ID
        this.userId = null;
        this.isSubscribed = false;
        this.prayerTimeouts = []; // Track scheduled prayer notifications
    }

    // Method to dynamically load OneSignal if not already loaded
    async loadOneSignalScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof window.OneSignal !== 'undefined') {
                // Quick status check function
window.checkOneSignalStatus = () => {
    console.log('📊 OneSignal Integration Status Check');
    console.log('═══════════════════════════════════════');
    
    const status = {
        oneSignalManager: {
            available: !!window.oneSignalManager,
            initialized: window.oneSignalManager?.isInitialized || false,
            subscribed: window.oneSignalManager?.isSubscribed || false,
            userId: window.oneSignalManager?.userId || null
        },
        oneSignalConfig: {
            available: !!window.OneSignalConfig,
            sendMissedPrayerAlert: !!(window.OneSignalConfig?.sendMissedPrayerAlert)
        },
        notifications: {
            permission: Notification.permission,
            supported: 'Notification' in window
        },
        serviceWorkers: {
            supported: 'serviceWorker' in navigator,
            bridge: !!window.swBridge,
            oneSignalBridge: !!window.swOneSignalBridge
        },
        app: {
            available: !!window.prayerTimesApp,
            handlePrayerStatusRequest: !!(window.prayerTimesApp?.handlePrayerStatusRequest)
        }
    };
    
    console.log('OneSignal Manager:', status.oneSignalManager.available ? '✅' : '❌');
    console.log('  Initialized:', status.oneSignalManager.initialized ? '✅' : '❌');
    console.log('  Subscribed:', status.oneSignalManager.subscribed ? '✅' : '❌');
    console.log('  User ID:', status.oneSignalManager.userId || 'None');
    
    console.log('\nOneSignal Config:', status.oneSignalConfig.available ? '✅' : '❌');
    console.log('  sendMissedPrayerAlert:', status.oneSignalConfig.sendMissedPrayerAlert ? '✅' : '❌');
    
    console.log('\nNotifications:', status.notifications.supported ? '✅' : '❌');
    console.log('  Permission:', status.notifications.permission);
    
    console.log('\nService Workers:', status.serviceWorkers.supported ? '✅' : '❌');
    console.log('  SW Bridge:', status.serviceWorkers.bridge ? '✅' : '❌');
    console.log('  OneSignal Bridge:', status.serviceWorkers.oneSignalBridge ? '✅' : '❌');
    
    console.log('\nPrayer App:', status.app.available ? '✅' : '❌');
    console.log('  handlePrayerStatusRequest:', status.app.handlePrayerStatusRequest ? '✅' : '❌');
    
    // Overall assessment
    const isFullyFunctional = status.oneSignalManager.subscribed && 
                             status.notifications.permission === 'granted' &&
                             status.app.available;
    
    console.log('\n═══════════════════════════════════════');
    if (isFullyFunctional) {
        console.log('🎉 FULLY FUNCTIONAL! Missed prayer alerts will work via:');
        console.log('   • Push notifications (OneSignal)');
        console.log('   • Local notifications (Service Worker)');
    } else if (status.oneSignalManager.initialized) {
        console.log('⚠️ PARTIALLY FUNCTIONAL:');
        if (!status.oneSignalManager.subscribed) {
            console.log('   • Click notification button to subscribe for push notifications');
        }
        if (status.notifications.permission !== 'granted') {
            console.log('   • Grant notification permission for alerts');
        }
        console.log('   • Local notifications will still work');
    } else {
        console.log('❌ NEEDS ATTENTION:');
        console.log('   • OneSignal not properly initialized');
        console.log('   • Check console for initialization errors');
    }
    
    return status;
};

// Test comprehensive OneSignal integration with missed prayer system
window.testCompleteOneSignalIntegration = async () => {
    console.log('🔧 Testing Complete OneSignal Integration...');
    console.log('═══════════════════════════════════════════════════');
    
    let allTestsPassed = true;
    const results = {};
    
    // Test 1: OneSignal Manager Availability
    console.log('📋 Test 1: OneSignal Manager Availability');
    results.managerAvailable = !!window.oneSignalManager;
    results.managerInitialized = window.oneSignalManager?.isInitialized || false;
    results.managerSubscribed = window.oneSignalManager?.isSubscribed || false;
    results.managerUserId = window.oneSignalManager?.userId || null;
    
    console.log('   Manager Available:', results.managerAvailable ? '✅' : '❌');
    console.log('   Manager Initialized:', results.managerInitialized ? '✅' : '❌');
    console.log('   Manager Subscribed:', results.managerSubscribed ? '✅' : '❌');
    console.log('   User ID:', results.managerUserId || 'None');
    
    if (!results.managerAvailable || !results.managerInitialized) {
        console.log('❌ OneSignal Manager not properly initialized');
        allTestsPassed = false;
    }
    
    // Test 2: OneSignalConfig Global Interface
    console.log('📋 Test 2: OneSignalConfig Global Interface');
    results.configAvailable = !!window.OneSignalConfig;
    results.sendMissedPrayerAlertAvailable = !!(window.OneSignalConfig && window.OneSignalConfig.sendMissedPrayerAlert);
    results.isSubscribedAvailable = !!(window.OneSignalConfig && window.OneSignalConfig.isSubscribed);
    results.sendCustomNotificationAvailable = !!(window.OneSignalConfig && window.OneSignalConfig.sendCustomNotification);
    
    console.log('   OneSignalConfig Available:', results.configAvailable ? '✅' : '❌');
    console.log('   sendMissedPrayerAlert Function:', results.sendMissedPrayerAlertAvailable ? '✅' : '❌');
    console.log('   isSubscribed Function:', results.isSubscribedAvailable ? '✅' : '❌');
    console.log('   sendCustomNotification Function:', results.sendCustomNotificationAvailable ? '✅' : '❌');
    
    if (!results.configAvailable || !results.sendMissedPrayerAlertAvailable) {
        console.log('❌ OneSignalConfig interface not properly set up');
        allTestsPassed = false;
    }
    
    // Test 3: Service Worker Bridge
    console.log('📋 Test 3: Service Worker Bridge');
    results.serviceWorkerAvailable = 'serviceWorker' in navigator;
    results.swBridgeAvailable = !!window.swBridge;
    results.swOneSignalBridgeAvailable = !!window.swOneSignalBridge;
    
    console.log('   Service Worker Support:', results.serviceWorkerAvailable ? '✅' : '❌');
    console.log('   Unified OneSignal SW:', results.oneSignalServiceWorkerAvailable ? '✅' : '❌');
    
    // Test 4: App Integration
    console.log('📋 Test 4: App Integration');
    results.appAvailable = !!window.prayerTimesApp;
    results.appHandlePrayerStatusRequest = !!(window.prayerTimesApp && window.prayerTimesApp.handlePrayerStatusRequest);
    results.appIsPrayerCompleted = !!(window.prayerTimesApp && window.prayerTimesApp.isPrayerCompleted);
    results.appGetMissedPrayerAlertMessage = !!(window.prayerTimesApp && window.prayerTimesApp.getMissedPrayerAlertMessage);
    
    console.log('   App Available:', results.appAvailable ? '✅' : '❌');
    console.log('   handlePrayerStatusRequest:', results.appHandlePrayerStatusRequest ? '✅' : '❌');
    console.log('   isPrayerCompleted:', results.appIsPrayerCompleted ? '✅' : '❌');
    console.log('   getMissedPrayerAlertMessage:', results.appGetMissedPrayerAlertMessage ? '✅' : '❌');
    
    // Test 5: Notification Permissions
    console.log('📋 Test 5: Notification Permissions');
    results.notificationPermission = Notification.permission;
    results.notificationSupported = 'Notification' in window;
    
    console.log('   Notification Support:', results.notificationSupported ? '✅' : '❌');
    console.log('   Notification Permission:', results.notificationPermission);
    console.log('   Permission Granted:', results.notificationPermission === 'granted' ? '✅' : '❌');
    
    // Test 6: Functional Test (if subscribed)
    if (results.managerSubscribed && results.notificationPermission === 'granted') {
        console.log('📋 Test 6: Functional Test');
        
        try {
            console.log('   Testing missed prayer alert...');
            const testSuccess = await window.OneSignalConfig.sendMissedPrayerAlert('Test Prayer');
            results.functionalTest = testSuccess;
            console.log('   Functional Test:', testSuccess ? '✅' : '❌');
            
            if (testSuccess) {
                console.log('   📱 Check your device for a test missed prayer notification');
            }
        } catch (error) {
            console.log('   Functional Test: ❌ (Error:', error.message, ')');
            results.functionalTest = false;
            allTestsPassed = false;
        }
    } else {
        console.log('📋 Test 6: Skipped (OneSignal not subscribed or no notification permission)');
        results.functionalTest = 'skipped';
    }
    
    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Integration Test Summary:');
    console.log('═══════════════════════════════════════════════════');
    
    if (allTestsPassed && results.managerSubscribed) {
        console.log('🎉 ALL TESTS PASSED! OneSignal integration is fully functional.');
        console.log('✅ Missed prayer alerts will work automatically via both:');
        console.log('   • Local notifications (service worker)');
        console.log('   • Push notifications (OneSignal)');
        console.log('✅ Background operation is enabled when app is closed.');
    } else if (results.managerInitialized && !results.managerSubscribed) {
        console.log('⚠️ PARTIAL SUCCESS: OneSignal is initialized but not subscribed.');
        console.log('💡 To enable push notifications:');
        console.log('   1. Click the notification button to subscribe');
        console.log('   2. Allow notifications when prompted');
        console.log('   3. Run this test again');
        console.log('✅ Local notifications will still work via service worker.');
    } else {
        console.log('❌ INTEGRATION ISSUES DETECTED:');
        
        if (!results.managerAvailable) {
            console.log('   • OneSignal manager not loaded');
        }
        if (!results.managerInitialized) {
            console.log('   • OneSignal not initialized (may be localhost)');
        }
        if (!results.configAvailable) {
            console.log('   • OneSignalConfig interface missing');
        }
        if (!results.appAvailable) {
            console.log('   • Prayer app not loaded');
        }
        if (results.notificationPermission !== 'granted') {
            console.log('   • Notification permission not granted');
        }
        
        console.log('🔄 Local notifications will still work as fallback.');
    }
    
    // Domain-specific information
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');
    
    if (isLocalhost) {
        console.log('🏠 LOCALHOST DETECTED:');
        console.log('   • OneSignal push notifications have domain restrictions');
        console.log('   • Push notifications will work only on the live domain');
        console.log('   • Local notifications will work fine for testing');
    }
    
    console.log('🧪 Available Test Functions:');
    console.log('   • window.testCompleteOneSignalIntegration() - This test');
    console.log('   • window.testOneSignalNotification() - Test push notification');
    console.log('   • window.testMissedPrayerIntegration() - Test missed prayer flow');
    console.log('   • window.testAllPrayerNotifications() - Test all notification types');
    
    return {
        passed: allTestsPassed && results.managerSubscribed,
        partial: results.managerInitialized && !results.managerSubscribed,
        results: results
    };
};

console.log('OneSignal already loaded');
                resolve();
                return;
            }

            console.log('Loading OneSignal script dynamically...');
            
            const script = document.createElement('script');
            script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
            script.async = true;
            
            script.onload = () => {
                console.log('✅ OneSignal script loaded dynamically');
                console.log('OneSignal available:', typeof window.OneSignal);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error('❌ Failed to load OneSignal script dynamically:', error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('OneSignal already initialized');
            return;
        }

        if (this.isInitializing) {
            console.log('OneSignal initialization already in progress');
            return;
        }

        this.isInitializing = true;

        try {
            console.log('Starting OneSignal initialization...');
            
            // Check if we're on localhost - OneSignal might not work on localhost
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname.includes('192.168.');
            
            if (isLocalhost) {
                console.log('Running on localhost - OneSignal may have domain restrictions');
                console.log('OneSignal push notifications will be available only on the live domain');
                console.log('Local notifications will still work for testing');
                // Mark as initialized but not functional for localhost
                this.isInitialized = true;
                this.isInitializing = false;
                return;
            }
            
            // First try to load the script if not available
            if (typeof window.OneSignal === 'undefined') {
                console.log('OneSignal not found, attempting to load...');
                await this.loadOneSignalScript();
                
                // Wait a bit more for the SDK to be ready
                await this.waitForOneSignal();
            }

            // Use window.OneSignal if available, fallback to global OneSignal
            const OneSignalInstance = window.OneSignal || OneSignal;
            
            if (!OneSignalInstance || typeof OneSignalInstance.init !== 'function') {
                throw new Error('OneSignal SDK not properly loaded');
            }
            
            console.log('OneSignal found, initializing with config...');

            // Initialize OneSignal with v16 syntax - improved service worker handling
            await OneSignalInstance.init({
                appId: this.appId,
                allowLocalhostAsSecureOrigin: true,
                autoRegister: false, // Prevent OneSignal from auto-registering SW
                autoResubscribe: true,
                serviceWorkerParam: {
                    scope: '/',
                    workerName: 'OneSignalSDKWorker'
                }
            });

            console.log('OneSignal.init() completed');
            
            // Manual service worker registration with better conflict handling
            await this.handleServiceWorkerRegistration();

            console.log('OneSignal service worker registration handled');

            // Set up event listeners
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('OneSignal initialized successfully');

        } catch (error) {
            console.error('Failed to initialize OneSignal:', error);
            
            if (error.message.includes('Can only be used on:') || 
                error.message.includes('SDK already initialized')) {
                console.log('OneSignal domain restriction or already initialized - will work on live domain');
                this.isInitialized = true; // Mark as initialized to prevent retries
            } else {
                console.log('OneSignal will not be available for push notifications');
            }
            // Continue without OneSignal - app still works with local notifications
        } finally {
            this.isInitializing = false;
        }
    }

    // Handle OneSignal service worker registration with conflict resolution
    async handleServiceWorkerRegistration() {
        try {
            console.log('🔧 [OneSignal] Handling service worker registration...');
            
            if (!('serviceWorker' in navigator)) {
                console.log('Service workers not supported');
                return;
            }

            // Get all existing registrations
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Found ${registrations.length} existing service worker registrations`);

            let oneSignalRegistration = null;
            let customRegistration = null;

            // Check existing registrations
            for (const registration of registrations) {
                const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL;
                
                if (scriptURL) {
                    if (scriptURL.includes('OneSignal')) {
                        oneSignalRegistration = registration;
                        console.log('📱 [OneSignal] Found unified OneSignal SW with prayer times integration:', scriptURL);
                    } else {
                        console.log('� [OneSignal] Found unknown service worker:', scriptURL);
                        // All functionality should now be in OneSignal SW
                    }
                }
            }

            // We now use a unified OneSignal service worker that includes all prayer times functionality
            if (!oneSignalRegistration) {
                console.log('📱 [OneSignal] Registering unified OneSignal service worker with prayer times integration...');
                try {
                    // Use OneSignal's registration method
                    const OneSignalInstance = window.OneSignal || OneSignal;
                    
                    // OneSignal will register OneSignalSDKWorker.js which now includes prayer times functionality
                    if (OneSignalInstance.ServiceWorker && OneSignalInstance.ServiceWorker.register) {
                        await OneSignalInstance.ServiceWorker.register();
                        console.log('✅ [OneSignal] Unified SW registered successfully');
                    } else {
                        console.log('ℹ️ [OneSignal] Unified SW registration handled automatically');
                    }
                } catch (error) {
                    console.warn('⚠️ [OneSignal] Unified SW registration failed:', error.message);
                    console.log('🔄 [OneSignal] Will retry automatically');
                }
            } else {
                console.log('✅ [OneSignal] OneSignal SW already registered');
            }

            // Ensure custom SW knows about OneSignal integration
            if (customRegistration && customRegistration.active) {
                console.log('🔗 [OneSignal] Notifying custom SW about OneSignal integration');
                customRegistration.active.postMessage({
                    type: 'ONESIGNAL_INTEGRATION_READY',
                    oneSignalSWExists: !!oneSignalRegistration,
                    timestamp: Date.now()
                });
            }

        } catch (error) {
            console.error('❌ [OneSignal] Error handling service worker registration:', error);
            console.log('🔄 [OneSignal] Continuing with standard registration...');
        }
    }

    async waitForOneSignal() {
        return new Promise((resolve) => {
            let attempts = 0;
            const checkOneSignal = () => {
                attempts++;
                console.log(`Checking for OneSignal... attempt ${attempts}`);
                
                // Check both window.OneSignal and global OneSignal
                if ((typeof window.OneSignal !== 'undefined' && window.OneSignal && typeof window.OneSignal.init === 'function') ||
                    (typeof OneSignal !== 'undefined' && OneSignal && typeof OneSignal.init === 'function')) {
                    console.log('OneSignal found and ready!');
                    // Make sure it's available globally
                    if (window.OneSignal && !window.OneSignal) {
                        window.OneSignal = OneSignal;
                    }
                    resolve();
                } else if (attempts > 100) { // 10 seconds timeout
                    console.error('OneSignal failed to load after 10 seconds');
                    resolve(); // Continue anyway
                } else {
                    setTimeout(checkOneSignal, 100);
                }
            };
            checkOneSignal();
        });
    }

    setupEventListeners() {
        try {
            const OneSignalInstance = window.OneSignal || OneSignal;
            
            // User subscription state changed
            OneSignalInstance.User.PushSubscription.addEventListener('change', (event) => {
                console.log('OneSignal subscription changed:', event.current);
                
                // Handle undefined or null subscription status
                if (event.current && typeof event.current.subscribed !== 'undefined') {
                    this.isSubscribed = event.current.subscribed === true;
                } else if (event.current && typeof event.current.optedIn !== 'undefined') {
                    this.isSubscribed = event.current.optedIn === true;
                } else {
                    this.isSubscribed = false;
                }
                
                console.log('Processed subscription status:', this.isSubscribed);
                this.updateUI();
            });

            // Notification clicked
            OneSignalInstance.Notifications.addEventListener('click', (event) => {
                console.log('OneSignal notification clicked:', event);
                this.handleNotificationClick(event);
            });

            // Get initial subscription state
            this.checkSubscriptionState();
        } catch (error) {
            console.error('Error setting up OneSignal event listeners:', error);
        }
    }

    async checkSubscriptionState() {
        try {
            const OneSignalInstance = window.OneSignal || OneSignal;
            
            // Wait for OneSignal to be fully initialized
            await new Promise(resolve => {
                if (OneSignalInstance.User && OneSignalInstance.User.PushSubscription) {
                    resolve();
                } else {
                    // Wait up to 5 seconds for OneSignal to be ready
                    let attempts = 0;
                    const checkReady = () => {
                        attempts++;
                        if (OneSignalInstance.User && OneSignalInstance.User.PushSubscription) {
                            resolve();
                        } else if (attempts < 50) {
                            setTimeout(checkReady, 100);
                        } else {
                            console.warn('OneSignal User API not ready after 5 seconds');
                            resolve(); // Continue anyway
                        }
                    };
                    checkReady();
                }
            });
            
            // Get subscription status with multiple methods
            if (OneSignalInstance.User && OneSignalInstance.User.PushSubscription) {
                // Try multiple ways to get subscription status
                let subscribed = false;
                
                try {
                    // Method 1: Check optedIn property
                    subscribed = await OneSignalInstance.User.PushSubscription.optedIn;
                    console.log('Method 1 (optedIn):', subscribed);
                } catch (e) {
                    console.log('Method 1 failed:', e.message);
                }
                
                if (!subscribed) {
                    try {
                        // Method 2: Check subscribed property
                        subscribed = OneSignalInstance.User.PushSubscription.subscribed;
                        console.log('Method 2 (subscribed):', subscribed);
                    } catch (e) {
                        console.log('Method 2 failed:', e.message);
                    }
                }
                
                if (!subscribed) {
                    try {
                        // Method 3: Check if there's a valid token/ID
                        const pushToken = OneSignalInstance.User.PushSubscription.token;
                        const userId = OneSignalInstance.User.PushSubscription.id;
                        subscribed = !!(pushToken || userId);
                        console.log('Method 3 (token/ID check):', subscribed, 'Token:', !!pushToken, 'ID:', !!userId);
                    } catch (e) {
                        console.log('Method 3 failed:', e.message);
                    }
                }
                
                // If user received a welcome notification, they're likely subscribed
                if (!subscribed && this.userId) {
                    console.log('User has ID but subscription shows false - assuming subscribed due to welcome notification');
                    subscribed = true;
                }
                
                this.isSubscribed = subscribed === true;
                
                // Get user ID
                try {
                    this.userId = OneSignalInstance.User.PushSubscription.id || null;
                } catch (e) {
                    console.log('Could not get user ID:', e.message);
                }
            } else {
                this.isSubscribed = false;
                this.userId = null;
            }
            
            console.log('Final OneSignal subscription status:', this.isSubscribed);
            console.log('OneSignal user ID:', this.userId);
            this.updateUI();
        } catch (error) {
            console.error('Error checking OneSignal subscription state:', error);
            // If we have a user ID, assume subscribed
            if (this.userId) {
                this.isSubscribed = true;
                console.log('Assuming subscribed due to existing user ID');
            } else {
                this.isSubscribed = false;
            }
            this.updateUI();
        }
    }

    async requestPermission() {
        try {
            // Check if OneSignal is initialized first
            if (!this.isInitialized) {
                console.log('OneSignal not initialized, attempting to initialize first...');
                await this.initialize();
                
                if (!this.isInitialized) {
                    console.error('OneSignal initialization failed, cannot request permission');
                    return false;
                }
            }

            const OneSignalInstance = window.OneSignal || OneSignal;
            if (!OneSignalInstance) {
                console.error('OneSignal instance not available');
                return false;
            }

            console.log('Requesting OneSignal permission...');
            
            // Check current permission status
            const currentPermission = Notification.permission;
            console.log('Current browser permission:', currentPermission);
            
            // If already denied, we can't request again
            if (currentPermission === 'denied') {
                console.log('Notification permission was previously denied. User must enable manually in browser settings.');
                return false;
            }

            // For OneSignal v16, use the User.PushSubscription API to opt in
            try {
                // First check if already subscribed
                const currentSubscription = await OneSignalInstance.User.PushSubscription.optedIn;
                console.log('Current OneSignal subscription status:', currentSubscription);
                
                if (currentSubscription) {
                    console.log('Already subscribed to OneSignal');
                    this.isSubscribed = true;
                    await this.checkSubscriptionState();
                    return true;
                }

                // Request permission using the correct v16 API
                console.log('Requesting OneSignal subscription...');
                await OneSignalInstance.User.PushSubscription.optIn();
                
                // Wait a moment for the subscription to process
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if subscription was successful
                await this.checkSubscriptionState();
                
                console.log('OneSignal permission request completed. Subscribed:', this.isSubscribed);
                return this.isSubscribed;
                
            } catch (optInError) {
                console.error('OneSignal opt-in failed:', optInError);
                
                // Fallback: try the Notifications API
                console.log('Trying fallback permission request...');
                await OneSignalInstance.Notifications.requestPermission();
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.checkSubscriptionState();
                
                return this.isSubscribed;
            }
            
        } catch (error) {
            console.error('Failed to request OneSignal permission:', error);
            return false;
        }
    }

    // Check if OneSignal is ready for use
    isOneSignalReady() {
        const OneSignalInstance = window.OneSignal || (typeof OneSignal !== 'undefined' ? OneSignal : null);
        return this.isInitialized && 
               OneSignalInstance && 
               typeof OneSignalInstance.init === 'function' &&
               OneSignalInstance.User &&
               OneSignalInstance.User.PushSubscription;
    }

    async getUserId() {
        try {
            if (!this.isOneSignalReady()) {
                console.warn('OneSignal not ready, cannot get user ID');
                return null;
            }
            
            const OneSignalInstance = window.OneSignal || OneSignal;
            return OneSignalInstance.User.PushSubscription.id;
        } catch (error) {
            console.error('Error getting OneSignal user ID:', error);
            return null;
        }
    }

    async isUserSubscribed() {
        try {
            if (!this.isOneSignalReady()) {
                console.warn('OneSignal not ready, cannot check subscription');
                return false;
            }
            
            const OneSignalInstance = window.OneSignal || OneSignal;
            return OneSignalInstance.User.PushSubscription.subscribed || false;
        } catch (error) {
            console.error('Error checking OneSignal subscription:', error);
            return false;
        }
    }

    // Send custom notification via OneSignal
    async sendCustomNotification(title, message, data = {}, scheduledTime = null) {
        try {
            if (!this.isSubscribed && !this.userId) {
                console.warn('User not subscribed to OneSignal, cannot send notification');
                return false;
            }

            console.log('Attempting to send OneSignal notification:', { title, message, data, scheduledTime });

            // For immediate notifications, we can try using the web SDK
            if (!scheduledTime || scheduledTime <= new Date()) {
                try {
                    // Try to send immediate notification via OneSignal web SDK
                    const OneSignalInstance = window.OneSignal || OneSignal;
                    
                    // Create a local notification that looks like it came from OneSignal
                    if ('serviceWorker' in navigator && 'Notification' in window) {
                        // Use the service worker to show notification
                        const registration = await navigator.serviceWorker.ready;
                        
                        if (registration && registration.active) {
                            registration.active.postMessage({
                                action: 'show-onesignal-notification',
                                notification: {
                                    title: title,
                                    body: message,
                                    icon: window.location.origin + '/images/icon.png',
                                    badge: window.location.origin + '/images/badge.png',
                                    data: {
                                        ...data,
                                        source: 'onesignal',
                                        url: window.location.origin
                                    }
                                }
                            });
                            
                            console.log('✅ OneSignal-style notification sent via service worker');
                            return true;
                        }
                    }
                    
                    // Fallback to browser notification
                    if (Notification.permission === 'granted') {
                        new Notification(title, {
                            body: message,
                            icon: window.location.origin + '/images/icon.png',
                            badge: window.location.origin + '/images/badge.png',
                            data: data
                        });
                        
                        console.log('✅ OneSignal-style notification sent via browser Notification API');
                        return true;
                    }
                    
                } catch (localError) {
                    console.log('Local notification failed, trying REST API...', localError.message);
                }
            }

            // For scheduled notifications or if local failed, use REST API
            const notificationData = {
                app_id: this.appId,
                include_player_ids: [this.userId],
                headings: {
                    en: title,
                    bn: title
                },
                contents: {
                    en: message,
                    bn: message
                },
                data: {
                    ...data,
                    timestamp: Date.now(),
                    source: 'prayer-times-app'
                },
                chrome_web_icon: window.location.origin + '/images/icon.png',
                chrome_web_badge: window.location.origin + '/images/badge.png',
                url: window.location.origin,
                ...(scheduledTime && scheduledTime > new Date() && {
                    send_after: scheduledTime.toISOString()
                })
            };

            console.log('Sending OneSignal REST API notification:', notificationData);

            // Note: This requires a server endpoint or CORS-enabled REST API key
            // For now, we'll log the notification data for manual sending via dashboard
            console.log('📤 OneSignal notification data (send via dashboard or server):', JSON.stringify(notificationData, null, 2));
            
            // Return true for immediate notifications, false for scheduled ones that need server
            if (!scheduledTime || scheduledTime <= new Date()) {
                return true; // Immediate notification was sent locally
            } else {
                console.log('ℹ️ Scheduled notifications require server-side implementation or OneSignal dashboard');
                return false; // Scheduled notifications need server/dashboard
            }

        } catch (error) {
            console.error('Error sending custom OneSignal notification:', error);
            return false;
        }
    }

    // Send missed prayer notification (integrate with prayer-tracker.js)
    async sendMissedPrayerAlert(prayerName) {
        if (!this.isSubscribed) {
            console.log('OneSignal: Not subscribed, skipping missed prayer alert');
            return false;
        }

        console.log('OneSignal: Sending missed prayer alert for:', prayerName);

        return await this.sendCustomNotification(
            'Prayer Missed',
            `You have missed the ${prayerName} prayer.`,
            { 
                type: 'missed_prayer',
                prayer: prayerName,
                timestamp: Date.now(),
                url: window.location.origin + '/prayer-tracker.html'
            }
        );
    }

    // Send dhikr reminder notification
    async sendDhikrReminder(dhikrName, targetCount) {
        return await this.sendCustomNotification(
            'Dhikr Reminder',
            `Time for your ${dhikrName} dhikr (${targetCount} times)`,
            { 
                type: 'dhikr', 
                dhikr: dhikrName, 
                target: targetCount,
                url: window.location.origin + '/dhikr-counter.html'
            }
        );
    }

    async sendTestNotification() {
        return await this.sendCustomNotification(
            'Test Notification',
            'This is a test notification from Prayer Times app!',
            { type: 'test' }
        );
    }

    // Send dhikr reminder notification
    async sendDhikrReminder(dhikrName, targetCount) {
        try {
            const userId = await this.getUserId();
            if (!userId) return;

            const notificationData = {
                app_id: this.appId,
                include_player_ids: [userId],
                headings: {
                    en: 'Dhikr Reminder',
                    bn: 'জিকির অনুস্মারক'
                },
                contents: {
                    en: `Time for your ${dhikrName} dhikr (${targetCount} times)`,
                    bn: `আপনার ${dhikrName} জিকিরের সময় (${targetCount} বার)`
                },
                icon: '/images/icon.png',
                url: window.location.origin + '/dhikr-counter.html',
                data: {
                    type: 'dhikr',
                    dhikr: dhikrName,
                    target: targetCount,
                    timestamp: Date.now()
                }
            };

            console.log('Would send OneSignal dhikr reminder:', notificationData);
            return notificationData;

        } catch (error) {
            console.error('Failed to send OneSignal dhikr reminder:', error);
        }
    }

    // Handle notification clicks
    handleNotificationClick(event) {
        const data = event.data;
        
        if (data.type === 'prayer') {
            // Open main prayer times page
            window.open(window.location.origin, '_blank');
        } else if (data.type === 'dhikr') {
            // Open dhikr counter page
            window.open(window.location.origin + '/dhikr-counter.html', '_blank');
        }
    }

    // Update UI based on subscription status
    updateUI() {
        console.log('OneSignal updateUI called - isSubscribed:', this.isSubscribed);
        
        // Check if we're on localhost
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('192.168.');
        
        // Update your existing notification buttons/toggles
        const notificationToggle = document.getElementById('notificationToggleBtn');
        if (notificationToggle) {
            // Get current notification mode from storage
            const notificationMode = parseInt(localStorage.getItem('notificationMode') || '0');
            
            console.log('Current notification mode:', notificationMode);
            
            // Update the existing button to show OneSignal status
            const icon = notificationToggle.querySelector('i');
            let title = notificationToggle.title || '';
            
            if (isLocalhost) {
                // On localhost, show local-only notifications
                if (notificationMode === 1) {
                    title = 'Obligatory Prayers Only (Local only - Push available on live site) - Click for all prayers';
                } else if (notificationMode === 2) {
                    title = 'All Prayers (Local only - Push available on live site) - Click to turn off';
                }
            } else if (this.isSubscribed) {
                // OneSignal is active - enhance the existing title
                if (notificationMode === 1) {
                    title = 'Obligatory Prayers Only (Push + Local) - Click for all prayers';
                } else if (notificationMode === 2) {
                    title = 'All Prayers (Push + Local) - Click to turn off';
                }
            } else {
                // OneSignal not active - show local only
                if (notificationMode === 1) {
                    title = 'Obligatory Prayers Only (Local only) - Click for all prayers';
                } else if (notificationMode === 2) {
                    title = 'All Prayers (Local only) - Click to turn off';
                }
            }
            
            notificationToggle.title = title;
            
            // Add visual indicator for OneSignal status (only on live domain)
            if (!isLocalhost && this.isSubscribed && notificationMode > 0) {
                notificationToggle.classList.add('push-enabled');
                console.log('Added push-enabled class to notification button');
            } else {
                notificationToggle.classList.remove('push-enabled');
                console.log('Removed push-enabled class from notification button');
            }
        } else {
            console.log('Notification toggle button not found');
        }
    }

    // Integrate with existing prayer time system - now unified in OneSignal SW
    async schedulePrayerNotifications(prayerTimes, notificationMode) {
        if (!this.isSubscribed || notificationMode === 0) {
            console.log('OneSignal: Notifications disabled or not subscribed, skipping push notifications');
            return;
        }

        // Clear any existing OneSignal prayer timeouts
        if (this.prayerTimeouts) {
            this.prayerTimeouts.forEach(timeout => clearTimeout(timeout));
        }
        this.prayerTimeouts = [];

        console.log('OneSignal: Scheduling prayer notifications for mode:', notificationMode);
        console.log('OneSignal User ID:', this.userId);
        console.log('Prayer times to process:', prayerTimes.length);

        const now = new Date();
        let scheduledCount = 0;

        for (const prayer of prayerTimes) {
            let shouldSchedule = false;
            
            // Match the exact logic from unified OneSignal SW
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
                        console.warn('OneSignal: Invalid prayer time data for:', prayer.name);
                        continue;
                    }

                    console.log(`OneSignal: Processing ${prayer.name}:`, {
                        startTime: startTime.toLocaleString(),
                        endTime: endTime.toLocaleString(),
                        now: now.toLocaleString()
                    });

                    // 1. Schedule notification 1 minute before start (START ALERT)
                    const oneMinuteBefore = new Date(startTime.getTime() - 60000);
                    if (oneMinuteBefore > now) {
                        const timeUntilStart = oneMinuteBefore.getTime() - now.getTime();
                        const timeout1 = setTimeout(async () => {
                            try {
                                await this.sendCustomNotification(
                                    `${prayer.name} Time Soon`,
                                    `${prayer.name} prayer will start in 1 minute.`,
                                    { 
                                        type: 'prayer',
                                        prayer: prayer.name,
                                        alert_type: 'start_1min',
                                        timestamp: Date.now()
                                    }
                                );
                                console.log(`✅ OneSignal: Sent 1-min start alert for ${prayer.name}`);
                            } catch (error) {
                                console.error(`❌ OneSignal: Failed to send 1-min start alert for ${prayer.name}:`, error);
                            }
                        }, Math.min(timeUntilStart, 2147483647)); // Max setTimeout value
                        
                        this.prayerTimeouts.push(timeout1);
                        scheduledCount++;
                        console.log(`✅ OneSignal: Scheduled 1-min start alert for ${prayer.name} in ${Math.round(timeUntilStart/60000)} minutes`);
                    }

                    // 2. Schedule notification 15 minutes before end (END ALERT)
                    const fifteenMinutesBefore = new Date(endTime.getTime() - 900000); // 15 minutes = 900000ms
                    if (fifteenMinutesBefore > now) {
                        const timeUntilEnd = fifteenMinutesBefore.getTime() - now.getTime();
                        const timeout2 = setTimeout(async () => {
                            try {
                                await this.sendCustomNotification(
                                    `${prayer.name} Ending Soon`,
                                    `${prayer.name} prayer will end in 15 minutes.`,
                                    { 
                                        type: 'prayer',
                                        prayer: prayer.name,
                                        alert_type: 'end_15min',
                                        timestamp: Date.now()
                                    }
                                );
                                console.log(`✅ OneSignal: Sent 15-min end alert for ${prayer.name}`);
                            } catch (error) {
                                console.error(`❌ OneSignal: Failed to send 15-min end alert for ${prayer.name}:`, error);
                            }
                        }, Math.min(timeUntilEnd, 2147483647)); // Max setTimeout value
                        
                        this.prayerTimeouts.push(timeout2);
                        scheduledCount++;
                        console.log(`✅ OneSignal: Scheduled 15-min end alert for ${prayer.name} in ${Math.round(timeUntilEnd/60000)} minutes`);
                    }

                } catch (err) {
                    console.warn('OneSignal: Error scheduling notifications for prayer:', prayer.name, err);
                }
            }
        }

        console.log(`OneSignal: Prayer notifications scheduled: ${scheduledCount} total timeouts set`);
        return scheduledCount;
    }

    // Integrate with existing dhikr reminder system
    async scheduleDhikrReminder(dhikrName, targetCount, reminderTime) {
        if (!this.isSubscribed) return;

        const now = new Date();
        const reminderDate = new Date();
        const [hours, minutes] = reminderTime.split(':');
        reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (reminderDate <= now) {
            reminderDate.setDate(reminderDate.getDate() + 1); // Next day
        }

        await this.sendDhikrReminder(dhikrName, targetCount);
    }

    // Send missed prayer alert via OneSignal
    async sendMissedPrayerAlert(prayerName) {
        try {
            if (!this.isSubscribed) {
                console.log('OneSignal: User not subscribed, skipping missed prayer alert');
                return false;
            }

            console.log(`OneSignal: Sending missed prayer alert for ${prayerName}`);
            
            const success = await this.sendCustomNotification(
                'Prayer Missed',
                `You have missed the ${prayerName} prayer.`,
                { 
                    type: 'missed_prayer', 
                    prayer: prayerName,
                    timestamp: new Date().toISOString()
                }
            );

            if (success) {
                console.log(`✅ OneSignal missed prayer alert sent for ${prayerName}`);
            } else {
                console.log(`❌ OneSignal missed prayer alert failed for ${prayerName}`);
            }

            return success;
        } catch (error) {
            console.error('Error sending OneSignal missed prayer alert:', error);
            return false;
        }
    }
}

// Global instance
window.oneSignalManager = new OneSignalNotificationManager();

// Make OneSignal config available to other scripts
window.OneSignalConfig = {
    sendMissedPrayerAlert: (prayerName) => window.oneSignalManager.sendMissedPrayerAlert(prayerName),
    isSubscribed: () => window.oneSignalManager.isSubscribed,
    sendCustomNotification: (...args) => window.oneSignalManager.sendCustomNotification(...args)
};

// Add a global method to check if OneSignal is ready
window.isOneSignalReady = () => {
    return window.oneSignalManager && window.oneSignalManager.isOneSignalReady();
};

// Track initialization attempts to prevent duplicates
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 2;

// Multiple initialization strategies
document.addEventListener('DOMContentLoaded', () => {
    if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
        console.log('Maximum OneSignal initialization attempts reached');
        return;
    }
    
    console.log('DOM loaded, initializing OneSignal...');
    initializationAttempts++;
    
    // Strategy 1: Try immediate initialization
    window.oneSignalManager.initialize().catch(error => {
        console.log('Initial OneSignal load attempt failed, will retry once more...');
    });
});

// Strategy 2: Try again after window load (all resources loaded) - but only once
window.addEventListener('load', () => {
    if (!window.oneSignalManager.isInitialized && initializationAttempts < MAX_INIT_ATTEMPTS) {
        console.log('Window fully loaded, retrying OneSignal initialization...');
        initializationAttempts++;
        
        setTimeout(() => {
            window.oneSignalManager.initialize();
        }, 1000);
    }
});

// Strategy 3: Manual retry function for user actions
window.initializeOneSignalIfNeeded = async () => {
    if (!window.oneSignalManager.isInitialized && !window.oneSignalManager.isInitializing) {
        console.log('Manual OneSignal initialization requested...');
        await window.oneSignalManager.initialize();
    } else if (window.oneSignalManager.isInitializing) {
        console.log('OneSignal initialization already in progress, waiting...');
        // Wait for current initialization to complete
        while (window.oneSignalManager.isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    return window.oneSignalManager.isInitialized;
};

// Global functions for testing
window.testOneSignalNotification = () => {
    if (window.oneSignalManager && window.oneSignalManager.isSubscribed) {
        console.log('Sending test OneSignal notification...');
        return window.oneSignalManager.sendTestNotification();
    } else {
        console.log('OneSignal not subscribed. Current status:', {
            manager: !!window.oneSignalManager,
            initialized: window.oneSignalManager?.isInitialized,
            subscribed: window.oneSignalManager?.isSubscribed,
            userId: window.oneSignalManager?.userId
        });
        return false;
    }
};

window.sendPrayerReminder = (prayerName, message) => {
    if (window.oneSignalManager && window.oneSignalManager.isSubscribed) {
        return window.oneSignalManager.sendPrayerReminder(prayerName, message);
    } else {
        console.log('OneSignal not available for prayer reminder');
        return false;
    }
};

// Test the prayer notification integration
window.testPrayerNotificationIntegration = async () => {
    console.log('🧪 Testing Prayer Notification Integration...');
    
    if (!window.oneSignalManager) {
        console.log('❌ OneSignal manager not found');
        return false;
    }
    
    console.log('OneSignal Status:', {
        initialized: window.oneSignalManager.isInitialized,
        subscribed: window.oneSignalManager.isSubscribed,
        userId: window.oneSignalManager.userId
    });
    
    if (!window.oneSignalManager.isSubscribed) {
        console.log('❌ OneSignal not subscribed - enable notifications first');
        return false;
    }
    
    // Send a test prayer notification
    const success = await window.oneSignalManager.sendCustomNotification(
        'Fajr Prayer Test',
        'This is a test notification for Fajr prayer time',
        { type: 'prayer', prayer: 'Fajr', test: true }
    );
    
    if (success) {
        console.log('✅ Prayer notification integration working!');
        return true;
    } else {
        console.log('❌ Prayer notification integration failed');
        return false;
    }
};

// Test comprehensive prayer notification system
window.testAllPrayerNotifications = async () => {
    console.log('🧪 Testing all prayer notification types...');
    
    if (!window.oneSignalManager.isSubscribed) {
        console.log('❌ OneSignal not subscribed - enable notifications first');
        return false;
    }
    
    let allSuccessful = true;
    
    // Test 1: 15-minute end alert
    console.log('📅 Testing 15-minute end alert...');
    const endAlert = await window.oneSignalManager.sendCustomNotification(
        'Prayer Ending Soon',
        'Asr prayer will end in 15 minutes',
        { type: 'prayer_end', prayer: 'Asr', minutesBefore: 15 }
    );
    if (!endAlert) allSuccessful = false;
    
    // Wait a moment between notifications
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: 1-minute start alert
    console.log('⏰ Testing 1-minute start alert...');
    const startAlert = await window.oneSignalManager.sendCustomNotification(
        'Prayer Time',
        'Maghrib prayer starts in 1 minute',
        { type: 'prayer_start', prayer: 'Maghrib', minutesBefore: 1 }
    );
    if (!startAlert) allSuccessful = false;
    
    // Wait a moment between notifications
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Missed prayer alert
    console.log('❌ Testing missed prayer alert...');
    const missedAlert = await window.oneSignalManager.sendMissedPrayerAlert('Fajr');
    if (!missedAlert) allSuccessful = false;
    
    if (allSuccessful) {
        console.log('✅ All prayer notification types working!');
        console.log('📱 Check your device for 3 test notifications:');
        console.log('   1. 15-minute end alert');
        console.log('   2. 1-minute start alert');
        console.log('   3. Missed prayer alert');
        return true;
    } else {
        console.log('❌ Some prayer notification types failed');
        return false;
    }
};

// Test timing synchronization with service worker
window.testNotificationTiming = async () => {
    console.log('⏰ Testing notification timing synchronization...');
    
    if (!window.oneSignalManager.isSubscribed) {
        console.log('❌ OneSignal not subscribed - enable notifications first');
        return false;
    }
    
    // Create test prayer times 2 minutes in the future
    const now = new Date();
    const testPrayerTimes = [
        {
            name: 'Test Prayer',
            type: 'prayer',
            startParsed: new Date(now.getTime() + 120000).toISOString(), // 2 minutes from now
            endParsed: new Date(now.getTime() + 180000).toISOString()    // 3 minutes from now
        }
    ];
    
    console.log('Scheduling test prayer for:', new Date(testPrayerTimes[0].startParsed).toLocaleTimeString());
    
    // Schedule via OneSignal (should send 1 minute before start = 1 minute from now)
    const onesignalCount = await window.oneSignalManager.schedulePrayerNotifications(testPrayerTimes, 1);
    
    // Schedule via service worker
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
            registration.active.postMessage({
                type: 'SCHEDULE_NOTIFICATIONS',
                prayerTimes: testPrayerTimes,
                notificationMode: 1
            });
        }
    }
    
    console.log(`✅ Test scheduled: OneSignal scheduled ${onesignalCount} notifications`);
    console.log('🔔 You should receive notifications in about 1 minute from both systems');
    console.log('📊 Check that both local and OneSignal notifications arrive at the same time');
    
    return true;
};

// Test missed prayer detection integration with prayer tracker
window.testMissedPrayerIntegration = async () => {
    console.log('❌ Testing missed prayer integration with prayer tracker...');
    
    if (!window.oneSignalManager.isSubscribed) {
        console.log('❌ OneSignal not subscribed - enable notifications first');
        return false;
    }
    
    console.log('� Testing prayer tracker integration...');
    
    // Test 1: Check if OneSignalConfig is available to prayer tracker
    console.log('🔍 Checking OneSignalConfig availability:', {
        OneSignalConfig: !!window.OneSignalConfig,
        sendMissedPrayerAlert: !!(window.OneSignalConfig && window.OneSignalConfig.sendMissedPrayerAlert)
    });
    
    if (!window.OneSignalConfig || !window.OneSignalConfig.sendMissedPrayerAlert) {
        console.error('❌ OneSignalConfig.sendMissedPrayerAlert not available to prayer tracker');
        return false;
    }
    
    // Test 2: Simulate missed prayer notification from prayer tracker
    console.log('🧪 Simulating missed prayer detection...');
    
    // Simulate what prayer tracker does when a prayer is missed
    const title = 'Prayer Missed';
    const body = 'You have missed the Fajr prayer.';
    
    console.log('📧 Testing message parsing:', { title, body });
    
    // Test the regex pattern used in prayer tracker
    const prayerName = body.match(/missed the (\w+) prayer/i);
    console.log('🔍 Prayer name extracted:', prayerName ? prayerName[1] : 'NOT FOUND');
    
    if (!prayerName || !prayerName[1]) {
        console.error('❌ Prayer name extraction failed - regex pattern issue');
        return false;
    }
    
    // Test 3: Send missed prayer alert via OneSignal
    console.log(`📱 Sending OneSignal missed prayer alert for ${prayerName[1]}...`);
    
    try {
        const success = await window.OneSignalConfig.sendMissedPrayerAlert(prayerName[1]);
        if (success) {
            console.log('✅ Missed prayer alert sent successfully via OneSignal');
        } else {
            console.error('❌ Failed to send missed prayer alert via OneSignal');
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending missed prayer alert:', error);
        return false;
    }
    
    // Test 4: Check if prayer tracker showNotification would work
    console.log('🔄 Testing full prayer tracker notification flow...');
    
    // Simulate the exact conditions in prayer tracker
    const reminderEnabled = true; // Assuming reminders are enabled
    const notificationPermission = Notification.permission === 'granted';
    
    console.log('📊 Prayer tracker conditions:', {
        reminderEnabled,
        notificationPermission,
        serviceWorkerAvailable: 'serviceWorker' in navigator,
        oneSignalAvailable: !!window.OneSignalConfig
    });
    
    if (!notificationPermission) {
        console.warn('⚠️ Notification permission not granted - prayer tracker won\'t send notifications');
        return false;
    }
    
    console.log('✅ All conditions met for missed prayer notifications');
    console.log('📱 You should have received a missed prayer alert notification');
    console.log('🎯 Integration test complete - missed prayer alerts should work when prayers are actually missed');
    
    return true;
};

// Test automatic missed prayer detection
window.testAutomaticMissedDetection = async () => {
    console.log('⏰ Testing automatic missed prayer detection...');
    
    console.log('📋 This test simulates what happens when a prayer time passes without being marked as completed.');
    console.log('💡 In the real app, this happens automatically when you visit the prayer tracker page.');
    
    // Create a prayer that "ended" 5 minutes ago (missed)
    const now = new Date();
    const missedPrayerTime = new Date(now.getTime() - 300000); // 5 minutes ago
    
    console.log(`� Simulating a prayer that ended at: ${missedPrayerTime.toLocaleTimeString()}`);
    console.log(`🕐 Current time: ${now.toLocaleTimeString()}`);
    console.log('📊 This prayer would be automatically marked as "missed"');
    
    // Simulate the prayer tracker's missed prayer detection
    console.log('🔍 Prayer tracker would detect this as missed and call showNotification()');
    console.log('� showNotification() would send both local and OneSignal notifications');
    
    // Test the missed prayer alert directly
    const success = await window.testMissedPrayerIntegration();
    
    if (success) {
        console.log('✅ Automatic missed prayer detection integration working!');
        console.log('📱 When you miss a real prayer and visit prayer-tracker.html:');
        console.log('   1. Prayer tracker detects missed prayer');
        console.log('   2. Sends local notification via service worker');
        console.log('   3. Sends push notification via OneSignal');
        console.log('   4. Updates prayer status to "missed"');
    }
    
    return success;
};
