// Service Worker Conflict Resolver
// This script helps resolve conflicts between multiple service workers

// Service Worker Conflict Resolver - Updated for OneSignal Coexistence
// This script helps manage coexistence between Prayer Times SW and OneSignal SW

window.ServiceWorkerManager = {
    async analyzeServiceWorkers() {
        console.log('🔧 Analyzing service worker situation...');
        
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log(`Found ${registrations.length} service worker registrations`);
                
                let prayerSW = null;
                let oneSignalSW = null;
                let otherSWs = [];
                
                for (const registration of registrations) {
                    const scriptURL = registration.active?.scriptURL || 
                                   registration.installing?.scriptURL || 
                                   registration.waiting?.scriptURL;
                    
                    console.log('Registration scope:', registration.scope);
                    console.log('Active SW script URL:', scriptURL);
                    
                    if (scriptURL) {
                        if (scriptURL.includes('/sw.js')) {
                            prayerSW = registration;
                            console.log('✅ Prayer Times SW found:', registration.scope);
                        } else if (scriptURL.includes('OneSignal')) {
                            oneSignalSW = registration;
                            console.log('✅ OneSignal SW found:', registration.scope);
                        } else {
                            otherSWs.push(registration);
                            console.log('❓ Other SW found:', registration.scope);
                        }
                    }
                }
                
                const status = {
                    prayerSW: prayerSW ? 'Found' : 'Not found',
                    oneSignalSW: oneSignalSW ? 'Found' : 'Not found',
                    otherSWs: otherSWs.length,
                    totalRegistrations: registrations.length,
                    registrations: { prayerSW, oneSignalSW, otherSWs }
                };
                
                console.log('📊 Service Workers Status:', status);
                
                // Determine strategy
                if (prayerSW && oneSignalSW) {
                    console.log('🤝 COEXISTENCE MODE: Both Prayer Times and OneSignal SWs found');
                    console.log('📱 OneSignal SW handles: Push notifications');
                    console.log('🔔 Prayer Times SW handles: Local notifications, caching, offline features');
                    status.strategy = 'coexistence';
                } else if (prayerSW && !oneSignalSW) {
                    console.log('🙏 PRAYER-ONLY MODE: Only Prayer Times SW found');
                    console.log('🔔 Local notifications will work, push notifications when OneSignal registers');
                    status.strategy = 'prayer-only';
                } else if (!prayerSW && oneSignalSW) {
                    console.log('📱 ONESIGNAL-ONLY MODE: Only OneSignal SW found');
                    console.log('⚠️ Prayer Times SW should register for full functionality');
                    status.strategy = 'onesignal-only';
                } else {
                    console.log('❌ NO-SW MODE: No relevant service workers found');
                    status.strategy = 'none';
                }
                
                return status;
                
            } catch (error) {
                console.error('Error analyzing service workers:', error);
                return { error: error.message };
            }
        } else {
            console.warn('Service Worker not supported');
            return { error: 'Service Worker not supported' };
        }
    },

    async setupCoexistence() {
        console.log('🔗 Setting up Prayer Times and OneSignal SW coexistence...');
        
        const analysis = await this.analyzeServiceWorkers();
        
        if (analysis.strategy === 'coexistence') {
            const { prayerSW, oneSignalSW } = analysis.registrations;
            
            // Setup communication bridge
            window.swBridge = {
                prayer: prayerSW,
                oneSignal: oneSignalSW,
                
                sendToPrayerSW: (message) => {
                    if (prayerSW?.active) {
                        prayerSW.active.postMessage(message);
                        console.log('📤 Sent to Prayer SW:', message.type);
                    }
                },
                
                sendToOneSignalSW: (message) => {
                    if (oneSignalSW?.active) {
                        oneSignalSW.active.postMessage(message);
                        console.log('📤 Sent to OneSignal SW:', message.type);
                    }
                },
                
                sendToBoth: (message) => {
                    this.sendToPrayerSW(message);
                    this.sendToOneSignalSW(message);
                }
            };
            
            // Notify both SWs about coexistence
            if (prayerSW?.active) {
                prayerSW.active.postMessage({
                    type: 'ONESIGNAL_SW_COEXISTENCE',
                    oneSignalScope: oneSignalSW?.scope,
                    message: 'OneSignal SW detected - coordinating notifications'
                });
            }
            
            if (oneSignalSW?.active) {
                oneSignalSW.active.postMessage({
                    type: 'PRAYER_SW_COEXISTENCE',
                    prayerScope: prayerSW?.scope,
                    message: 'Prayer Times SW detected - coordinating notifications'
                });
            }
            
            console.log('✅ SW coexistence bridge established');
            return true;
            
        } else {
            console.log(`ℹ️ Coexistence not needed - strategy: ${analysis.strategy}`);
            return false;
        }
    },
    
    async forceActivateLatestWorker() {
        console.log('🚀 Force activating latest service worker...');
        
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration('/sw.js');
                
                if (registration) {
                    if (registration.waiting) {
                        console.log('📨 Sending SKIP_WAITING to waiting service worker...');
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                        
                        // Wait for activation
                        await new Promise(resolve => {
                            const channel = new MessageChannel();
                            channel.port1.onmessage = () => resolve();
                            
                            setTimeout(resolve, 2000); // Fallback timeout
                        });
                    }
                    
                    if (registration.active) {
                        console.log('✅ Service worker is now active');
                        return true;
                    }
                } else {
                    console.warn('No registration found for /sw.js');
                    return false;
                }
            } catch (error) {
                console.error('Error activating service worker:', error);
                return false;
            }
        }
        
        return false;
    },
    
    async restartNotificationSystem() {
        console.log('🔄 Restarting notification system with coexistence support...');
        
        // Analyze current situation
        const analysis = await this.analyzeServiceWorkers();
        
        if (analysis.strategy === 'coexistence') {
            console.log('🤝 Setting up coexistence mode...');
            await this.setupCoexistence();
        }
        
        // Force activation of Prayer Times SW if waiting
        if (analysis.registrations?.prayerSW?.waiting) {
            console.log('🚀 Activating waiting Prayer Times SW...');
            await this.forceActivateLatestWorker();
        }
        
        // Wait for activation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Restart prayer notifications if app is available
        if (window.prayerTimesApp && window.prayerTimesApp.scheduleOfflineNotifications) {
            console.log('📅 Rescheduling prayer notifications...');
            window.prayerTimesApp.scheduleOfflineNotifications();
        }
        
        // Check OneSignal status
        if (window.oneSignalManager) {
            console.log('📱 OneSignal status:', {
                initialized: window.oneSignalManager.isInitialized,
                subscribed: window.oneSignalManager.isSubscribed,
                userId: window.oneSignalManager.userId
            });
        }
        
        console.log('✅ Notification system restart complete');
        return analysis;
    },

    // Clear specific warnings and errors
    async suppressKnownWarnings() {
        console.log('🔇 Setting up warning suppression for known OneSignal/SW conflicts...');
        
        // Override console.warn to filter OneSignal worker messenger warnings
        const originalWarn = console.warn;
        console.warn = function(...args) {
            const message = args.join(' ');
            
            // Filter out known OneSignal warnings that are harmless in our setup
            if (message.includes('Could not get ServiceWorkerRegistration to postMessage') ||
                message.includes('Event handler of \'message\' event must be added')) {
                // These are expected when using multiple service workers
                return;
            }
            
            // Allow all other warnings through
            originalWarn.apply(console, args);
        };
        
        console.log('✅ Warning suppression configured');
    }
};

// Auto-run conflict resolution and setup coexistence
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for other scripts to load
    setTimeout(async () => {
        // Suppress known warnings first
        await window.ServiceWorkerManager.suppressKnownWarnings();
        
        // Analyze the situation
        const analysis = await window.ServiceWorkerManager.analyzeServiceWorkers();
        
        if (analysis.strategy === 'coexistence') {
            console.log('🤝 Setting up automatic coexistence...');
            await window.ServiceWorkerManager.setupCoexistence();
        } else if (analysis.totalRegistrations > 1) {
            console.log('⚠️ Multiple service worker registrations detected');
            console.log('💡 Run ServiceWorkerManager.restartNotificationSystem() to optimize');
        }
        
        // Global status function
        window.checkSWStatus = () => window.ServiceWorkerManager.analyzeServiceWorkers();
        
    }, 2000);
});

// Enhanced global functions
window.fixServiceWorkerConflicts = () => window.ServiceWorkerManager.restartNotificationSystem();
window.setupSWCoexistence = () => window.ServiceWorkerManager.setupCoexistence();
window.checkServiceWorkers = () => window.ServiceWorkerManager.analyzeServiceWorkers();
