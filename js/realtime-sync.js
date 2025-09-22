/**
 * Real-time Data Synchronization System
 * Automatically syncs data to Firebase when online, queues when offline
 */

class RealtimeDataSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.currentUser = null;
        this.syncInProgress = false;
        this.observers = new Map(); // Storage change observers
        this.lastSyncTime = Date.now();
        
        this.init();
    }

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('Device is now online - processing sync queue');
            this.isOnline = true;
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            console.log('Device is now offline - queueing changes');
            this.isOnline = false;
        });

        // Listen for Firebase auth state changes
        this.setupAuthListener();

        // Set up storage change monitoring
        this.setupStorageMonitoring();

        // Process any queued items from previous session
        this.loadSyncQueue();
    }

    setupAuthListener() {
        const checkAuth = () => {
            if (window.firebaseAuth && window.firebaseAuth.onAuthStateChanged) {
                window.firebaseAuth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    if (user && this.isOnline) {
                        // Wait for main data sync to complete before processing realtime queue
                        this.waitForMainSyncThenProcess(user.uid);
                    }
                });
            } else {
                setTimeout(checkAuth, 100);
            }
        };
        checkAuth();
    }

    async waitForMainSyncThenProcess(userId) {
        const sessionSyncKey = `syncCompleted_${userId}`;
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds max wait
        
        const checkSync = () => {
            if (sessionStorage.getItem(sessionSyncKey) === 'true') {
                console.log('Main data sync completed, now processing realtime sync queue');
                this.processSyncQueue();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkSync, 200);
            } else {
                console.log('Main data sync timeout, proceeding with realtime sync anyway');
                this.processSyncQueue();
            }
        };
        
        // Start checking after a small delay to let the main sync begin
        setTimeout(checkSync, 300);
    }

    setupStorageMonitoring() {
        // Monitor localStorage changes
        const originalSetItem = localStorage.setItem;
        const originalRemoveItem = localStorage.removeItem;

        localStorage.setItem = (key, value) => {
            originalSetItem.call(localStorage, key, value);
            this.onStorageChange(key, value, 'set');
        };

        localStorage.removeItem = (key) => {
            originalRemoveItem.call(localStorage, key);
            this.onStorageChange(key, null, 'remove');
        };

        // Also listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key && this.shouldSync(e.key)) {
                this.onStorageChange(e.key, e.newValue, e.newValue ? 'set' : 'remove');
            }
        });
    }

    onStorageChange(key, value, operation) {
        if (!this.shouldSync(key)) return;

        // Validate language values before syncing
        if (key === 'language' && (value === null || value === 'null' || value === undefined)) {
            console.warn('Preventing sync of invalid language value:', value);
            // Set a valid default language instead
            localStorage.setItem('language', 'en');
            value = 'en';
        }

        const syncItem = {
            key,
            value,
            operation,
            timestamp: Date.now(),
            page: window.location.pathname
        };

        if (this.currentUser && this.isOnline) {
            // Sync immediately
            this.syncToFirebase(syncItem);
        } else {
            // Queue for later
            this.addToSyncQueue(syncItem);
        }
    }

    shouldSync(key) {
        const syncKeys = [
            'language', 'theme', 'notificationMode', 'prayerMethod', 'prayerSchool',
            'userLocation', 'timeFormat', 'dhikr-session', 'dhikr-settings', 'dhikr-stats',
            'prayerTrackerData', 'obligatoryPrayers', 'missedPrayerReminders',
            'notificationSound', 'qazaCount', 'missedPrayerSortOrder', 'lastVisitDate',
            'missedPrayerOption', 'ninety-nine-names-progress', 'islamic-calendar-settings'
        ];
        return syncKeys.includes(key);
    }

    async syncToFirebase(syncItem) {
        if (!this.currentUser || this.syncInProgress) return;

        this.syncInProgress = true;
        try {
            const userDocRef = window.firebaseDoc(window.firebaseDb, "users", this.currentUser.uid);
            
            const updateData = {
                [syncItem.key]: syncItem.operation === 'remove' ? null : 
                    this.parseValue(syncItem.value),
                lastSync: new Date().toISOString(),
                syncSource: syncItem.page || 'unknown'
            };

            await window.firebaseSetDoc(userDocRef, updateData, { merge: true });
            
            console.log(`✅ Synced ${syncItem.key} to Firebase:`, syncItem.value);

            // Track sync event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'realtime_sync', {
                    sync_key: syncItem.key,
                    sync_operation: syncItem.operation,
                    page: syncItem.page
                });
            }

        } catch (error) {
            console.error(`❌ Failed to sync ${syncItem.key}:`, error);
            // Re-add to queue if failed
            this.addToSyncQueue(syncItem);
        } finally {
            this.syncInProgress = false;
        }
    }

    addToSyncQueue(syncItem) {
        // Remove any existing item with the same key to avoid duplicates
        this.syncQueue = this.syncQueue.filter(item => item.key !== syncItem.key);
        this.syncQueue.push(syncItem);
        this.saveSyncQueue();
        
        console.log(`📋 Queued ${syncItem.key} for sync (${this.syncQueue.length} items in queue)`);
    }

    async processSyncQueue() {
        if (!this.currentUser || !this.isOnline || this.syncQueue.length === 0) return;

        console.log(`🔄 Processing sync queue: ${this.syncQueue.length} items`);
        
        const queueCopy = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of queueCopy) {
            await this.syncToFirebase(item);
            // Small delay to avoid overwhelming Firebase
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.clearSyncQueue();
        console.log('✅ Sync queue processed successfully');
    }

    parseValue(value) {
        if (value === null || value === undefined) return null;
        
        try {
            // First try to parse as JSON
            const parsed = JSON.parse(value);
            
            // Handle null values for specific keys
            if (parsed === null) {
                console.warn('Parsed value is null, will be handled by validation rules');
                return null;
            }
            
            // Special validation for string values in parsed objects
            if (typeof parsed === 'object' && parsed !== null) {
                // No manipulation needed for valid objects
                return parsed;
            }
            
            // Special validation for numeric values that might be "0" string
            if (parsed === 0 || parsed === "0") {
                // Zero is a valid value for some settings
                return parsed;
            }
            
            // Handle other parsed values
            return parsed;
            
        } catch (e) {
            // Value is not valid JSON, treat as raw value
            
            // Special validation for string values
            if (value === 'null') {
                console.warn('String "null" detected, preventing data corruption');
                return null;
            }
            
            // Special handling for numeric strings to prevent 0 issues
            if (value === "0") {
                return 0;  // Ensure "0" string becomes numeric 0
            }
            
            // Handle empty strings
            if (value === "") {
                console.warn('Empty string detected, setting to null to prevent data corruption');
                return null;
            }
            
            return value;
        }
    }

    saveSyncQueue() {
        try {
            sessionStorage.setItem('realtimeSyncQueue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.warn('Failed to save sync queue:', error);
        }
    }

    loadSyncQueue() {
        try {
            const saved = sessionStorage.getItem('realtimeSyncQueue');
            if (saved) {
                this.syncQueue = JSON.parse(saved);
                console.log(`📋 Loaded ${this.syncQueue.length} items from sync queue`);
            }
        } catch (error) {
            console.warn('Failed to load sync queue:', error);
            this.syncQueue = [];
        }
    }

    clearSyncQueue() {
        this.syncQueue = [];
        sessionStorage.removeItem('realtimeSyncQueue');
    }

    // Force sync all current data
    async forceSyncAll() {
        if (!this.currentUser || !this.isOnline) {
            console.warn('Cannot force sync: user not logged in or offline');
            return;
        }

        console.log('🔄 Force syncing all data...');
        
        const syncKeys = [
            'language', 'theme', 'notificationMode', 'prayerMethod', 'prayerSchool',
            'userLocation', 'timeFormat', 'dhikr-session', 'dhikr-settings', 'dhikr-stats',
            'prayerTrackerData', 'obligatoryPrayers', 'missedPrayerReminders',
            'notificationSound', 'qazaCount', 'missedPrayerSortOrder', 'lastVisitDate',
            'missedPrayerOption'
        ];

        const userData = {};
        syncKeys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item !== null) {
                userData[key] = this.parseValue(item);
            }
        });

        userData.lastSync = new Date().toISOString();
        userData.syncSource = 'force_sync';

        try {
            const userDocRef = window.firebaseDoc(window.firebaseDb, "users", this.currentUser.uid);
            await window.firebaseSetDoc(userDocRef, userData, { merge: true });
            console.log('✅ Force sync completed');
            
            // Track force sync event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'force_sync_all', {
                    data_keys_count: Object.keys(userData).length
                });
            }

        } catch (error) {
            console.error('❌ Force sync failed:', error);
            throw error;
        }
    }

    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isLoggedIn: !!this.currentUser,
            queueLength: this.syncQueue.length,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime
        };
    }
}

// Initialize the real-time sync system
const realtimeSync = new RealtimeDataSync();
window.realtimeSync = realtimeSync;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeDataSync;
}