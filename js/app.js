
// No Firebase SDK imports needed for client-side only notifications

class PrayerTimesApp {
    constructor() {
        this.user = null; // Firebase user object
        this.preferencesLoaded = false; // Flag to ensure preferences are loaded once
        this.authSetupPending = false; // Flag to track if auth setup needs to be retried

        this.currentLang = 'en';
        this.currentTheme = 'dark';
        this.notificationMode = 0;
        this.calculationSettings = { method: 3, school: 0 };

        this.prayerData = null;
        this.currentLocation = null;
        this.updateInterval = null;
        this.allPrayers = []; // To store all prayer and banned times in order
        this.allSearchableLocations = []; // This will be loaded from JSON

        // Set up service worker message listener for missed prayer checks
        this.setupServiceWorkerMessageListener();

        this.translations = {
            en: {
                'app-title': 'Prayer Times',
                'lang-text': 'BN',
                'loading-text': 'Loading prayer times...',
                'error-message': 'Unable to load prayer times. Please try again.',
                'notification-message': 'Enable notifications to get prayer reminders',
                'enable-notifications-text': 'Enable Notifications',
                'notification-off': 'Notifications Off',
                'notification-obligatory': 'Obligatory Prayers Only',
                'notification-all': 'All Prayers',
                'fajr': 'Fajr',
                'sunrise': 'Sunrise',
                'forbidden_fajr_sunrise': 'Forbidden: Fajr End to Sunrise',
                'ishraq': 'Ishraq',
                'chasht': 'Chasht (Duha)',
                'dhuhr': 'Dhuhr',
                'zawal': 'Forbidden: Zawal (Noon)',
                'asr': 'Asr',
                'forbidden_asr_sunset': 'Forbidden: Asr End to Sunset',
                'maghrib': 'Maghrib',
                'awwabin': 'Awwabin',
                'isha': 'Isha',
                'tahajjud': 'Tahajjud',
                'banned': 'Forbidden Time',
                'start-time': 'Start Time',
                'end-time': 'End Time',
                'active': 'Active Now',
                'upcoming': 'Upcoming',
                'passed': 'Passed',
                'time-remaining': 'Remaining',
                'upcoming-in': 'Upcoming in',
                'hijri-date': 'Hijri Date',
                'next-prayer-label': 'Next:',
                'location-denied': 'Location access denied. Using default location.',
                'location-unavailable': 'Location unavailable. Using default location.',
                'location-timeout': 'Location request timed out. Using default location.',
                'description': 'Description',
                'location_current_time_label': 'Current Time:', 
                'location_input_placeholder': 'Enter city name',
                'timezone_not_available': 'Timezone not available for this location.',
                'cached': 'Cached',
                'current': 'Current'
            },
            bn: {
                'app-title': 'নামাজের সময়সূচী',
                'lang-text': 'EN',
                'loading-text': 'নামাজের সময় লোড হচ্ছে...',
                'error-message': 'নামাজের সময় লোড করতে পারছি না। দয়া করে আবার চেষ্টা করুন।',
                'notification-message': 'নামাজের অনুস্মারক পেতে নোটিফিকেশন চালু করুন',
                'enable-notifications-text': 'নোটিফিকেশন চালু করুন',
                'notification-off': 'নোটিফিকেশন বন্ধ',
                'notification-obligatory': 'শুধুমাত্র ফরজ নামাজ',
                'notification-all': 'সকল নামাজ',
                'fajr': 'ফজর',
                'sunrise': 'সূর্যোদয়',
                'forbidden_fajr_sunrise': 'নিষিদ্ধ: ফজর শেষ থেকে সূর্যোদয়',
                'ishraq': 'ইশরাক',
                'chasht': 'চাশত (দুহা)',
                'dhuhr': 'যুহর',
                'zawal': 'নিষিদ্ধ: যাওয়াল (মধ্যাহ্ন)',
                'asr': 'আসর',
                'forbidden_asr_sunset': 'নিষিদ্ধ: আসর শেষ থেকে সূর্যাস্ত',
                'maghrib': 'মাগরিব',
                'awwabin': 'আওয়াবীন',
                'isha': 'এশা',
                'tahajjud': 'তাহাজ্জুদ',
                'banned': 'নিষিদ্ধ সময়',
                'start-time': 'শুরুর সময়',
                'end-time': 'শেষ সময়',
                'active': 'চলমান',
                'upcoming': 'আসছে',
                'passed': 'শেষ',
                'time-remaining': 'বাকি',
                'upcoming-in': 'আসন্ন',
                'hijri-date': 'হিজরি তারিখ',
                'next-prayer-label': 'পরবর্তী:',
                'location-denied': 'অবস্থান অ্যাক্সেস অস্বীকার করা হয়েছে। ডিফল্ট অবস্থান ব্যবহার করা হচ্ছে।',
                'location-unavailable': 'অবস্থান অনুপলব্ধ। ডিফল্ট অবস্থান ব্যবহার করা হচ্ছে।',
                'location-timeout': 'অবস্থান অনুরোধ সময় শেষ হয়েছে। ডিফল্ট অবস্থান ব্যবহার করা হচ্ছে।',
                'description': 'বিবরণ',
                'location_current_time_label': 'বর্তমান সময়:',
                'location_input_placeholder': 'শহরের নাম লিখুন',
                'timezone_not_available': 'এই অবস্থানের জন্য সময় অঞ্চল উপলব্ধ নেই।',
                'cached': 'ক্যাশড',
                'current': 'বর্তমান'
            }
        };

        this.prayerIcons = {
            fajr: 'fa-cloud-moon', 
            sunrise: 'fa-sun-rise', 
            ishraq: 'fa-sun',
            chasht: 'fa-sun',
            dhuhr: 'fa-sun',
            zawal: 'fa-ban', 
            asr: 'fa-cloud-sun',
            maghrib: 'fa-cloud-sun', 
            awwabin: 'fa-moon',
            isha: 'fa-moon',
            tahajjud: 'fa-star',
            forbidden_fajr_sunrise: 'fa-ban',
            forbidden_asr_sunset: 'fa-ban',
            banned: 'fa-ban'
        };

        // Track which notifications have been shown for the current day
        try {
            this.notificationsShownToday = JSON.parse(localStorage.getItem('notificationsShownToday')) || {};
            this.lastNotificationCheckDate = localStorage.getItem('lastNotificationCheckDate');
        } catch (error) {
            console.error("Error loading notification data from cache:", error);
            this.notificationsShownToday = {};
            this.lastNotificationCheckDate = null;
        }

        // Initialize logging flags to prevent console spam
        this.islamicMidnightLogged = null;
        this.tahajjudTimeLogged = null;
        this.lastTimezoneLog = null;

        this.loadLocationsAndInit(); // Call new method to load locations first
    }

    _loadPreferences() {
        // Check if we should wait for data sync to complete
        const isLoggedIn = window.authContext && window.authContext.isUserAuthenticated();
        const syncInProgress = window.dataSync && window.dataSync.dataSyncInProgress;
        
        if (isLoggedIn && syncInProgress) {
            console.log("User is logged in and sync is in progress. Delaying preference loading...");
            // Set up a listener for when sync completes
            const checkSyncComplete = setInterval(() => {
                if (!window.dataSync.dataSyncInProgress) {
                    clearInterval(checkSyncComplete);
                    console.log("Data sync completed. Loading preferences now...");
                    this._actuallyLoadPreferences();
                }
            }, 100);
            
            // Fallback: load preferences after 3 seconds even if sync doesn't complete
            setTimeout(() => {
                clearInterval(checkSyncComplete);
                console.log("Fallback: Loading preferences after timeout...");
                this._actuallyLoadPreferences();
            }, 3000);
            
            return; // Exit early, preferences will be loaded after sync
        }
        
        // If not logged in or sync not in progress, load immediately
        this._actuallyLoadPreferences();
    }

    _actuallyLoadPreferences() {
        // Load from localStorage first as a fallback and for initial display
        const savedLang = this.getSafeStorageItem('language', 'en');
        this.currentLang = (savedLang === null || savedLang === 'null') ? 'en' : savedLang;
        this.currentTheme = this.getSafeStorageItem('theme', 'dark');
        this.notificationMode = parseInt(this.getSafeStorageItem('notificationMode', '0')) || 0;
        this.calculationSettings = {
            method: parseInt(this.getSafeStorageItem('prayerMethod', '3')),
            school: parseInt(this.getSafeStorageItem('prayerSchool', '0'))
        };
        console.log("Preferences loaded from localStorage.", this.currentLang, this.currentTheme, this.notificationMode, this.calculationSettings);
        this.preferencesLoaded = true;
        
        // Apply the loaded preferences immediately
        this.applyTheme();
        this.applyLanguage();
    }

    setupAuthListener() {
        if (window.setupAuthObserver && window.dataSync) { // Ensure dataSync is available
            // Track login state at class level for better persistence
            this.wasLoggedIn = this.wasLoggedIn || false;
            
            window.setupAuthObserver(async (user) => {
                this.user = user;
                if (user) {
                    console.log("User auth state changed - logged in:", user.uid);
                    this.wasLoggedIn = true; // Mark that user was logged in
                    
                    // Only trigger sync if no session flag exists for this user
                    // This handles cases like page refresh where user is already logged in
                    const sessionSyncKey = `syncCompleted_${user.uid}`;
                    if (!sessionStorage.getItem(sessionSyncKey)) {
                        console.log("No sync flag found, initiating sync check...");
                        // Small delay to ensure auth state is stable
                        setTimeout(() => {
                            window.dataSync.handleLoginDataSync(user.uid);
                        }, 200);
                    } else {
                        console.log("Sync already completed for this user session.");
                    }
                } else {
                    console.log("User auth state changed - logged out or guest mode.");
                    
                    // Always clear data on logout for privacy, but be smart about it
                    if (this.wasLoggedIn) {
                        console.log("User was previously logged in, clearing all user data for privacy...");
                        
                        // Comprehensive data clearing for privacy
                        this.clearAllUserDataOnLogout();
                        
                        this.wasLoggedIn = false; // Reset the flag
                        
                        console.log("All user data cleared. Initializing fresh app state...");
                        
                        // Reload the page to ensure clean state
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                        
                    } else {
                        console.log("Guest mode detected, preserving local data during navigation.");
                        // For guests, we don't clear data but we still need to initialize
                        // modules with existing local data
                        if (window.dhikrCounter) window.dhikrCounter.init();
                        if (window.prayerTracker) window.prayerTracker.init();
                    }
                }
            });
        } else {
            console.warn("setupAuthObserver or dataSync not available. Authentication/Sync features may not work.");
            // Store that we need to retry auth setup when Firebase becomes available
            this.authSetupPending = true;
        }
    }

    

    checkPrivacyAfterLogout() {
        const userJustLoggedOut = sessionStorage.getItem('userJustLoggedOut');
        const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');
        
        if (userJustLoggedOut === 'true') {
            console.log("Detected recent logout, performing privacy validation...");
            
            // Check if any sensitive user data still exists
            const sensitiveKeys = [
                'prayerTrackerData', 'dhikr-session', 'dhikr-stats', 'qazaCount',
                'userLocation', '99-names-favorites', 'mosque-favorites'
            ];
            
            let privacyBreach = false;
            const foundKeys = [];
            
            sensitiveKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value && value !== 'null' && value !== '{}' && value !== '[]') {
                    privacyBreach = true;
                    foundKeys.push(key);
                }
            });
            
            if (privacyBreach) {
                console.error("PRIVACY BREACH DETECTED! User data still present after logout:", foundKeys);
                console.log("Emergency cleaning of remaining user data...");
                
                // Emergency cleanup
                sensitiveKeys.forEach(key => localStorage.removeItem(key));
                
                // Clear any remaining user-specific data
                const allKeys = Object.keys(localStorage);
                allKeys.forEach(key => {
                    const value = localStorage.getItem(key);
                    if (value && (
                        key.includes('user') || 
                        key.includes('prayer') || 
                        key.includes('dhikr') ||
                        key.includes('qaza') ||
                        key.includes('tracker')
                    )) {
                        localStorage.removeItem(key);
                        console.log(`Emergency removed: ${key}`);
                    }
                });
                
                console.log("Emergency cleanup completed.");
            } else {
                console.log("Privacy validation passed - no user data found after logout.");
            }
            
            // Clear the logout flags now that we've checked
            sessionStorage.removeItem('userJustLoggedOut');
            sessionStorage.removeItem('logoutTimestamp');
        }
    }

    clearAllUserDataOnLogout() {
        console.log("Starting comprehensive user data clearing for privacy...");
        
        try {
            // 1. Clear Firebase sync data
            if (window.dataSync) {
                window.dataSync.resetDataSyncState();
                window.dataSync.clearLocalUserData(true); // Use comprehensive clearing
            }
            
            // 2. Clear prayer times cache and location data
            const prayerDataKeys = [
                'prayerData',
                'tomorrowPrayerData', 
                'prayerDataCacheDate',
                'multiDayPrayerCache',
                'currentLocation',
                'userLocation',
                'locationCache',
                'cachedTimezone',
                'hijriDate',
                'lastLocationUpdate'
            ];
            
            prayerDataKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`Cleared prayer data key: ${key}`);
                }
            });
            
            // 3. Clear notification tracking data
            const notificationKeys = [
                'notificationsShownToday',
                'lastNotificationCheckDate'
            ];
            
            notificationKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`Cleared notification key: ${key}`);
                }
            });
            
            // 4. Clear session storage for user-specific data
            const sessionKeys = Object.keys(sessionStorage);
            sessionKeys.forEach(key => {
                if (key.startsWith('syncCompleted_') || key.startsWith('user_')) {
                    sessionStorage.removeItem(key);
                    console.log(`Cleared session key: ${key}`);
                }
            });
            
            // 5. Reset app state variables
            this.user = null;
            this.prayerData = null;
            this.currentLocation = null;
            this.allPrayers = [];
            this.notificationsShownToday = {};
            this.lastNotificationCheckDate = null;
            
            console.log("Comprehensive user data clearing completed.");
            
        } catch (error) {
            console.error("Error during user data clearing:", error);
            // Fallback: Clear everything to be safe
            try {
                localStorage.clear();
                sessionStorage.clear();
                console.log("Fallback: Cleared all storage due to error.");
            } catch (fallbackError) {
                console.error("Even fallback clearing failed:", fallbackError);
            }
        }
    }

    getSafeStorageItem(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? item : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key '${key}':`, error);
            return defaultValue;
        }
    }

    setSafeStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
            // The dataSync module will handle syncing to Firebase when data changes.
            // No direct Firebase sync needed here for individual items.
        } catch (error) {
            console.error(`Error writing to localStorage key '${key}':`, error);
        }
    }

    async loadLocationsAndInit() {
        // Try to load cached locations first
        let shouldShowError = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        try {
            // Check if we have cached location data
            const cachedLocations = localStorage.getItem('cachedLocationsData');
            if (cachedLocations) {
                try {
                    this.allSearchableLocations = JSON.parse(cachedLocations);
                    console.log("Using cached locations data:", this.allSearchableLocations.length, "entries");
                    // Start the app immediately with cached data
                    this.init();
                    
                    // Then try to refresh in the background
                    this.refreshLocationsInBackground();
                    return;
                } catch (cacheError) {
                    console.error("Error parsing cached locations data:", cacheError);
                    // Continue to fetch fresh data
                }
            }
            
            // No valid cache, fetch fresh
            await this.fetchLocationsWithRetry(maxRetries);
            
        } catch (error) {
            console.error("Failed to load locations data after retries:", error);
            // Only show error if we don't have any locations at all
            if (!this.allSearchableLocations || this.allSearchableLocations.length === 0) {
                // Fallback to a very minimal default if locations can't be loaded
                this.allSearchableLocations = [{ name: "Dhaka", country: "Bangladesh", lat: 23.8103, lon: 90.4125 }];
                console.warn("Using fallback default location data due to all load failures.");
                shouldShowError = true;
            }
            // Init the app anyway with what we have
            this.init();
            
            // If appropriate, show the error message after app is initialized
            if (shouldShowError) {
                setTimeout(() => {
                    this.showError("Failed to load location data. Please try again or check your internet connection.");
                }, 1000);
            }
        }
    }

    async fetchLocationsWithRetry(maxRetries) {
        let retryCount = 0;
        let error;
        
        while (retryCount < maxRetries) {
            try {
                console.log(`Attempting to load locations.json (attempt ${retryCount + 1}/${maxRetries})...`);
                const response = await fetch('json/locations.json'); 
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                this.allSearchableLocations = data;
                
                // Cache the successfully loaded data
                localStorage.setItem('cachedLocationsData', JSON.stringify(data));
                
                console.log("Locations loaded successfully:", this.allSearchableLocations.length, "entries.");
                this.init(); // Proceed with initialization once locations are loaded
                return; // Success! Exit the function
            } catch (e) {
                console.error(`Failed to load locations data (attempt ${retryCount + 1}/${maxRetries}):`, e);
                error = e;
                retryCount++;
                // Add exponential backoff delay between retries
                if (retryCount < maxRetries) {
                    const delay = Math.pow(2, retryCount) * 500; // 1s, 2s, 4s
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // If we're here, all retries failed
        throw error;
    }
    
    async refreshLocationsInBackground() {
        try {
            console.log("Refreshing locations data in background...");
            const response = await fetch('json/locations.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const freshData = await response.json();
            
            // Update the data in memory
            this.allSearchableLocations = freshData;
            
            // Update the cache
            localStorage.setItem('cachedLocationsData', JSON.stringify(freshData));
            console.log("Locations data refreshed successfully:", freshData.length, "entries");
        } catch (error) {
            console.error("Failed to refresh locations data in background:", error);
            // No need to show UI error for background refresh
        }
    }

    init() {
        try {
            // PRIVACY CHECK: Ensure no user data persists after logout
            this.checkPrivacyAfterLogout();
            
            // Make sure we're on a page that has the necessary elements before attempting operations
            const isMainPrayerPage = document.getElementById('prayerGrid') !== null;
            
            this.setupEventListeners();
            this.setupAuthListener(); // New: Listen for auth state changes
            this._loadPreferences(); // New: Load preferences based on auth state
            
            // Only execute prayer-page specific functions if we're on the main prayer page
            if (isMainPrayerPage) {
                this.updateNotificationButtonIcon();
                this.checkNotificationPermission(); // Check permission status
                this.loadUserLocation();
                this.startTimeUpdater();
                // Reset notificationsShownToday at midnight
                this.resetNotificationsDaily();
            } else {
                console.log("Not on main prayer page - skipping prayer-specific initializations");
            }
            
            // Dispatch event that app is initialized
            document.dispatchEvent(new Event('prayerTimesAppInitialized'));
        } catch (error) {
            console.error("Error during app initialization:", error);
            // Prevent showing errors on pages where elements don't exist
            if (document.getElementById('errorState') !== null) {
                this.showError("An error occurred during initialization. Please refresh the page.");
            }
        }
    }

    // Automatically select the best calculation method based on location
    getOptimalCalculationMethod(location) {
        // Define optimal methods for different regions
        const regionMethods = {
            // North America - ISNA (Method 2) works well
            'north_america': { method: 2, school: 0 },
            // Europe - Muslim World League (Method 3) 
            'europe': { method: 3, school: 0 },
            // Middle East & Gulf - Umm al-Qura (Method 4)
            'middle_east': { method: 4, school: 0 },
            // South Asia - Karachi (Method 1)
            'south_asia': { method: 1, school: 1 },
            // Default fallback
            'default': { method: 3, school: 0 }
        };

        if (!location || !location.lat || !location.lon) {
            return regionMethods.default;
        }

        const lat = location.lat;
        const lon = location.lon;

        // North America (USA, Canada, Mexico)
        if (lat >= 25 && lat <= 70 && lon >= -170 && lon <= -50) {
            return regionMethods.north_america;
        }
        
        // Europe
        if (lat >= 35 && lat <= 72 && lon >= -25 && lon <= 50) {
            return regionMethods.europe;
        }
        
        // Middle East & Gulf
        if (lat >= 15 && lat <= 45 && lon >= 25 && lon <= 75) {
            return regionMethods.middle_east;
        }
        
        // South Asia (India, Pakistan, Bangladesh)
        if (lat >= 5 && lat <= 40 && lon >= 60 && lon <= 100) {
            return regionMethods.south_asia;
        }

        // Default to Muslim World League for other regions
        return regionMethods.default;
    }

    // Debug function to force fresh data fetch
    forceFreshDataFetch() {
        console.log("Forcing fresh data fetch - clearing all cache");
        this.clearPrayerDataCache();
        localStorage.clear(); // Clear everything to be sure
        if (this.currentLocation) {
            console.log("Fetching fresh data for:", this.currentLocation.name);
            this.fetchPrayerTimes();
        } else {
            console.log("No current location set, using default");
            this.useDefaultLocation();
        }
    }

    clearPrayerDataCache() {
        // Clear all cached prayer data
        localStorage.removeItem('prayerData');
        localStorage.removeItem('tomorrowPrayerData');
        localStorage.removeItem('prayerDataCacheDate');
        localStorage.removeItem('multiDayPrayerCache');
        localStorage.removeItem('multiDayCacheDate');
        localStorage.removeItem('userLocation');
        console.log("All cache cleared - will fetch fresh data");
    }

    clearCorruptedCache() {
        try {
            localStorage.removeItem('userLocation');
            localStorage.removeItem('prayerData');
            localStorage.removeItem('tomorrowPrayerData');
            localStorage.removeItem('prayerDataCacheDate');
            localStorage.removeItem('multiDayPrayerCache');
            localStorage.removeItem('multiDayCacheDate');
            localStorage.removeItem('notificationsShownToday');
            localStorage.removeItem('lastNotificationCheckDate');
            console.log("Corrupted cache cleared successfully");
        } catch (error) {
            console.error("Error clearing corrupted cache:", error);
        }
    }

    setupEventListeners() {
        try {
            // Only setup drawer if the hamburger menu exists
            if (document.getElementById('hamburgerMenu')) {
                this.setupDrawer();
            }
            
            // Add event listeners only if elements exist
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());

            const langToggle = document.getElementById('langToggle');
            if (langToggle) langToggle.addEventListener('click', () => this.toggleLanguage());

            const locationBtn = document.getElementById('locationBtn');
            if (locationBtn) locationBtn.addEventListener('click', () => this.getCurrentLocation());

            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn) searchBtn.addEventListener('click', () => this.searchLocation());

            const enableNotifications = document.getElementById('enableNotifications');
            if (enableNotifications) enableNotifications.addEventListener('click', () => this.enableNotifications());

            const notificationToggleBtn = document.getElementById('notificationToggleBtn');
            if (notificationToggleBtn) notificationToggleBtn.addEventListener('click', () => this.toggleNotifications());
            
            const locationInput = document.getElementById('locationInput');
            if (locationInput) {
                locationInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.searchLocation();
                });
                locationInput.addEventListener('input', () => this.showSuggestions());
                locationInput.addEventListener('focus', () => {
                    if (locationInput.value.length > 0) {
                        this.showSuggestions();
                    }
                });
                
                // Only set up the suggestions container click handler if both elements exist
                const suggestionsContainer = document.getElementById('suggestionsContainer');
                if (suggestionsContainer) {
                    document.addEventListener('click', (e) => {
                        if (!e.target.closest('.location-input-container')) {
                            suggestionsContainer.style.display = 'none';
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error setting up event listeners:", error);
            // Don't show UI errors for this - it's not critical
        }
    }

    setupDrawer() {
        const hamburger = document.getElementById('hamburgerMenu');
        const drawer = document.getElementById('sideDrawer');
        const overlay = document.getElementById('drawerOverlay');
        const closeBtn = document.getElementById('closeDrawer');

        if (hamburger && drawer && overlay) {
            hamburger.addEventListener('click', () => this.toggleDrawer());
            overlay.addEventListener('click', () => this.closeDrawer());
            closeBtn?.addEventListener('click', () => this.closeDrawer());

            // Close drawer when clicking menu items
            document.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    setTimeout(() => this.closeDrawer(), 150);
                });
            });
        }
    }

    toggleDrawer() {
        const hamburger = document.getElementById('hamburgerMenu');
        const drawer = document.getElementById('sideDrawer');
        const overlay = document.getElementById('drawerOverlay');

        hamburger.classList.toggle('open');
        drawer.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    closeDrawer() {
        const hamburger = document.getElementById('hamburgerMenu');
        const drawer = document.getElementById('sideDrawer');
        const overlay = document.getElementById('drawerOverlay');

        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        overlay.classList.remove('active');
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setSafeStorageItem('theme', this.currentTheme);
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        // Update theme toggle button in settings.html if present
        const themeToggleLeft = document.querySelector('.theme-toggle-left');
        const themeToggleRight = document.querySelector('.theme-toggle-right');

        if (themeToggleLeft && themeToggleRight) {
            if (this.currentTheme === 'light') {
                themeToggleLeft.classList.add('active');
                themeToggleRight.classList.remove('active');
            } else {
                themeToggleLeft.classList.remove('active');
                themeToggleRight.classList.add('active');
            }
        }
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'en' ? 'bn' : 'en';
        this.setSafeStorageItem('language', this.currentLang);
        this.applyLanguage();
        if (this.prayerData) this.renderPrayerCards();

        if (window.islamicCalendar) {
            window.islamicCalendar.updateDateDisplay();
        }
    }

    applyLanguage() {
        // Ensure currentLang is valid
        if (!this.currentLang || this.currentLang === 'null') {
            this.currentLang = 'en';
            localStorage.setItem('language', 'en');
        }
        
        const translations = this.translations[this.currentLang];
        if (!translations || typeof translations !== 'object') {
            console.warn('Translations not available for language:', this.currentLang, 'falling back to English');
            this.currentLang = 'en';
            localStorage.setItem('language', 'en');
            const fallbackTranslations = this.translations['en'];
            if (!fallbackTranslations) {
                console.error('Even English translations are not available!');
                return;
            }
            Object.keys(fallbackTranslations).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.textContent = fallbackTranslations[key];
                }
            });
            // Update placeholder with fallback
            const locationInput = document.getElementById('locationInput');
            if (locationInput && fallbackTranslations['location_input_placeholder']) {
                locationInput.placeholder = fallbackTranslations['location_input_placeholder'];
            }
            this.updateNotificationButtonIcon();
            return;
        }
        
        Object.keys(translations).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = translations[key];
            }
        });
        
        // Update placeholder specifically
        const locationInput = document.getElementById('locationInput');
        if (locationInput && translations['location_input_placeholder']) {
            locationInput.placeholder = translations['location_input_placeholder'];
        }
        
        this.updateNotificationButtonIcon();
    }

    updateText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    // Helper function to format numbers based on the current language
    formatNumberForLanguage(number) {
        if (this.currentLang === 'bn') {
            // Use 'bn-BD' locale for Bengali digits
            return new Intl.NumberFormat('bn-BD').format(number);
        }
        // Default to English (Western Arabic numerals)
        return new Intl.NumberFormat('en-US').format(number);
    }

    // Helper function to get current time in the location's timezone
    getCurrentTimeInLocationTimezone() {
        if (this.currentLocation && this.currentLocation.timeZone) {
            // Get the current time in the location's timezone
            const now = new Date();
            
            // Use Intl.DateTimeFormat to get the exact time in the location's timezone
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: this.currentLocation.timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const parts = formatter.formatToParts(now);
            const year = parseInt(parts.find(p => p.type === 'year').value);
            const month = parseInt(parts.find(p => p.type === 'month').value) - 1; // Month is 0-indexed
            const day = parseInt(parts.find(p => p.type === 'day').value);
            const hour = parseInt(parts.find(p => p.type === 'hour').value);
            const minute = parseInt(parts.find(p => p.type === 'minute').value);
            const second = parseInt(parts.find(p => p.type === 'second').value);
            
            // Create a Date object representing the location's current time
            const locationTime = new Date(year, month, day, hour, minute, second);
            
            return locationTime;
        }
        // Fallback to browser's local time if timezone is not available
        return new Date();
    }

    showSuggestions() {
        const input = document.getElementById('locationInput').value.toLowerCase();
        const suggestionsContainer = document.getElementById('suggestionsContainer');
        
        if (input.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        // Filter from the combined list
        const filteredLocations = this.allSearchableLocations.filter(loc => 
            loc.name.toLowerCase().includes(input) || 
            (loc.country && loc.country.toLowerCase().includes(input))
        );
        
        if (filteredLocations.length === 0) {
            suggestionsContainer.innerHTML = `<div class="suggestion-item">No suggestions found. Try searching for a city or country.</div>`;
            suggestionsContainer.style.display = 'block';
            return;
        }
        
        suggestionsContainer.innerHTML = '';
        filteredLocations.slice(0, 10).forEach(loc => { // Show up to 10 suggestions
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = loc.country ? `${loc.name}, ${loc.country}` : loc.name;
            suggestionItem.addEventListener('click', () => {
                document.getElementById('locationInput').value = loc.name;
                this.currentLocation = loc;
                this.fetchPrayerTimes();
                suggestionsContainer.style.display = 'none';
            });
            suggestionsContainer.appendChild(suggestionItem);
        });
        
        suggestionsContainer.style.display = 'block';
    }

    async getCurrentLocation() {
        if (!window.sharedApp) {
            this.showError('Shared app not available');
            this.useDefaultLocation();
            return;
        }

        this.showLoading();
        
        try {
            const locationData = await window.sharedApp.getCurrentLocationWithPermissionCheck();

            console.log("Geolocation successful:", locationData.lat, locationData.lng);

            const newLocation = {
                lat: locationData.lat,
                lon: locationData.lng
            };

            const savedLocation = JSON.parse(localStorage.getItem('userLocation'));

            if (savedLocation && savedLocation.lat === newLocation.lat && savedLocation.lon === newLocation.lon) {
                this.loadUserLocation();
                return;
            }

            this.clearPrayerDataCache();

            try {
                // Try direct fetch first
                let response;
                let data;
                
                try {
                    response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.lat}&lon=${locationData.lng}&zoom=10`,
                        {
                            mode: 'cors',
                            headers: {
                                'User-Agent': 'Prayer-Times-App/1.0'
                            }
                        }
                    );
                    data = await response.json();
                } catch (corsError) {
                    console.warn("Direct Nominatim fetch failed due to CORS, trying fallback:", corsError);
                    
                    // CORS fallback: Try using a CORS proxy for development
                    try {
                        response = await fetch(
                            `https://api.allorigins.win/get?url=${encodeURIComponent(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.lat}&lon=${locationData.lng}&zoom=10`)}`
                        );
                        
                        if (response.ok) {
                            const proxyData = await response.json();
                            data = JSON.parse(proxyData.contents);
                        } else {
                            throw new Error('Proxy request failed');
                        }
                    } catch (proxyError) {
                        console.warn("CORS proxy also failed:", proxyError);
                        throw new Error('All geocoding methods failed');
                    }
                }
                
                console.log("Nominatim reverse geocoding response:", data);
                
                this.currentLocation = {
                    lat: locationData.lat,
                    lon: locationData.lng,
                    name: data.address?.city || data.address?.town || data.address?.village || data.address?.country || 'Current Location',
                    country: data.address?.country || '' 
                };
                
                document.getElementById('locationInput').value = this.currentLocation.name;
            } catch (error) {
                console.error("Nominatim reverse geocoding failed:", error);
                
                // Provide intelligent fallback based on coordinates
                let locationName = 'Current Location';
                if (locationData.lat >= 20.5 && locationData.lat <= 26.6 && locationData.lng >= 88.0 && locationData.lng <= 92.7) {
                    locationName = 'Bangladesh';
                } else if (locationData.lat >= 23.6 && locationData.lat <= 27.3 && locationData.lng >= 68.1 && locationData.lng <= 97.4) {
                    locationName = 'Pakistan';
                } else if (locationData.lat >= 8.0 && locationData.lat <= 37.1 && locationData.lng >= 68.1 && locationData.lng <= 97.4) {
                    locationName = 'India';
                } else if (locationData.lat >= 24.0 && locationData.lat <= 42.0 && locationData.lng >= 34.0 && locationData.lng <= 45.0) {
                    locationName = 'Middle East';
                }
                
                this.currentLocation = {
                    lat: locationData.lat,
                    lon: locationData.lng,
                    name: locationName,
                    country: locationName !== 'Current Location' ? locationName : ''
                };
                document.getElementById('locationInput').value = this.currentLocation.name;
                console.log('Using coordinates without city name due to reverse geocoding failure.');
            }

            await this.fetchPrayerTimes();
        } catch (error) {
            console.error("Error in getCurrentLocation:", error);
            
            let errorMessage = error;
            if (error.message === 'Location permission denied') {
                errorMessage = this.translations[this.currentLang]['location-denied'] || 'Location access denied';
            } else if (error.code === 1) { // PERMISSION_DENIED
                errorMessage = this.translations[this.currentLang]['location-denied'] || 'Location access denied';
            } else if (error.code === 3) { // TIMEOUT
                errorMessage = this.translations[this.currentLang]['location-timeout'] || 'Location request timed out';
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else {
                errorMessage = this.translations[this.currentLang]['location-unavailable'] || 'Unable to get location';
            }
            
            this.showError(errorMessage);
            this.useDefaultLocation();
        }
    }

    // Load prayer data for a specific date from multi-day cache
    loadPrayerDataForDate(dateString) {
        try {
            const multiDayCache = localStorage.getItem('multiDayPrayerCache');
            
            if (!multiDayCache) {
                console.log("No multi-day cache found");
                return false;
            }
            
            const cache = JSON.parse(multiDayCache);
            const dateData = cache[dateString];
            
            if (!dateData || !dateData.today) {
                console.log(`No cached data found for date: ${dateString}`);
                return false;
            }
            
            // Set the prayer data
            this.prayerData = dateData.today;
            this.tomorrowPrayerData = dateData.tomorrow || null;
            
            // Restore timezone from cache if available
            if (dateData.timezone && this.currentLocation) {
                this.currentLocation.timeZone = dateData.timezone;
                console.log(`Restored timezone from cache: ${dateData.timezone}`);
            }
            
            console.log(`Loaded prayer data for ${dateString} from multi-day cache`);
            return true;
            
        } catch (error) {
            console.error("Error loading prayer data for date:", error);
            return false;
        }
    }

    // Cache multiple days of prayer data at once
    cacheMultipleDaysData(allData, baseDate) {
        try {
            const multiDayCache = JSON.parse(localStorage.getItem('multiDayPrayerCache')) || {};
            
            // Use location timezone for consistent date handling
            const baseDateTime = this.getCurrentTimeInLocationTimezone() || new Date();
            
            // Cache all 7 days of data
            for (let i = 0; i < allData.length; i++) {
                const data = allData[i];
                if (data.code === 200 && data.status === 'OK') {
                    const targetDate = new Date(baseDateTime);
                    targetDate.setDate(baseDateTime.getDate() + i);
                    const dateString = targetDate.toDateString(); // Use location-based date
                    
                    // For tomorrow's data, look at the next day's data (if exists)
                    const nextDayIndex = i + 1;
                    const tomorrowData = (nextDayIndex < allData.length && 
                                        allData[nextDayIndex].code === 200 && 
                                        allData[nextDayIndex].status === 'OK') 
                        ? allData[nextDayIndex].data 
                        : null;
                    
                    multiDayCache[dateString] = {
                        today: data.data,
                        tomorrow: tomorrowData,
                        cached: new Date().toISOString(),
                        timezone: data.data.meta.timezone // Store timezone for each entry
                    };
                    
                    console.log(`Cached prayer data for: ${dateString} with timezone: ${data.data.meta.timezone}`);
                }
            }
            
            // Clean old cache entries (keep only last 7 days)
            this.cleanOldCacheEntries(multiDayCache);
            
            // Save updated cache
            this.setSafeStorageItem('multiDayPrayerCache', JSON.stringify(multiDayCache));
            this.setSafeStorageItem('multiDayCacheDate', baseDate);
            
            console.log(`Successfully cached ${Object.keys(multiDayCache).length} days of prayer data`);
            
        } catch (error) {
            console.error("Error caching multiple days prayer data:", error);
        }
    }

    // Clean old cache entries to prevent localStorage from growing too large
    cleanOldCacheEntries(cache) {
        const currentDate = this.getCurrentTimeInLocationTimezone() || new Date();
        const cutoffDate = new Date(currentDate);
        cutoffDate.setDate(currentDate.getDate() - 7); // Keep last 7 days for extended offline capability
        
        const keysToDelete = [];
        const currentDateStr = currentDate.toDateString();
        
        for (const dateString in cache) {
            // Skip internal cache metadata fields
            if (dateString.startsWith('_')) continue;
            
            const cacheDate = new Date(dateString);
            const cacheEntry = cache[dateString];
            
            // Delete if older than cutoff or cache entry is invalid
            if (cacheDate < cutoffDate || 
                !cacheEntry || 
                !cacheEntry.today || 
                !cacheEntry.cached) {
                keysToDelete.push(dateString);
                console.log(`Marking cache entry for deletion: ${dateString}`);
            }
        }
        
        keysToDelete.forEach(key => {
            delete cache[key];
        });
        
        if (keysToDelete.length > 0) {
            console.log(`Cleaned ${keysToDelete.length} old or invalid cache entries`);
        }
        
        // Add a timestamp for cache validation
        cache._lastCleaned = new Date().toISOString();
    }

    useDefaultLocation() {
        // Default to Dhaka, Bangladesh
        this.currentLocation = { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125 };
        document.getElementById('locationInput').value = 'Dhaka';
        this.fetchPrayerTimes();
    }

    async searchLocation() {
        const cityName = document.getElementById('locationInput').value.trim();
        if (!cityName) return;

        // Don't search for generic location names that will cause CORS issues
        if (cityName.toLowerCase() === 'your location' || cityName.toLowerCase() === 'current location') {
            console.log("Ignoring search for generic location name:", cityName);
            return;
        }

        this.showLoading();

        try {
            // First, try to find in our predefined list
            const predefinedLocation = this.allSearchableLocations.find(loc => 
                loc.name.toLowerCase() === cityName.toLowerCase() ||
                (loc.country && loc.country.toLowerCase() === cityName.toLowerCase())
            );
            
            if (predefinedLocation) {
                console.log("Location found in predefined list:", predefinedLocation.name);
                this.clearPrayerDataCache(); // Clear cache when changing location
                this.currentLocation = predefinedLocation;
                await this.fetchPrayerTimes();
                return;
            }
            
            // If not in predefined, use Nominatim API with better error handling
            console.log("Location not in predefined list, attempting Nominatim search for:", cityName);
            
            // Add timeout and better error handling for the fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            let response;
            let data;
            
            try {
                // Try direct fetch first
                response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`,
                    {
                        signal: controller.signal,
                        mode: 'cors',
                        headers: {
                            'User-Agent': 'PrayerTimesApp/1.0'
                        }
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                data = await response.json();
            } catch (corsError) {
                console.warn("Direct Nominatim search failed due to CORS, trying proxy:", corsError);
                
                // CORS fallback: Try using a CORS proxy
                try {
                    response = await fetch(
                        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`)}`,
                        { signal: controller.signal }
                    );
                    
                    if (response.ok) {
                        const proxyData = await response.json();
                        data = JSON.parse(proxyData.contents);
                    } else {
                        throw new Error('Proxy request failed');
                    }
                } catch (proxyError) {
                    console.warn("CORS proxy also failed:", proxyError);
                    throw new Error('All geocoding methods failed');
                }
            }
            
            clearTimeout(timeoutId);
            console.log("Nominatim search raw response data[0]:", data[0]); 
            
            if (data && data.length > 0) {
                this.clearPrayerDataCache(); // Clear cache when changing location
                this.currentLocation = {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                    name: data[0].name || data[0].address?.city || data[0].address?.town || data[0].address?.village || data[0].display_name.split(',')[0], 
                    country: data[0].address?.country || '' 
                };
                console.log("Nominatim search successful. Processed currentLocation:", this.currentLocation);
                await this.fetchPrayerTimes();
            } else {
                console.warn(`Nominatim search found no results for "${cityName}".`);
                this.showError(`City/Country "${cityName}" not found. Please try another name or check the spelling.`);
            }
        } catch (error) {
            console.error("Error during searchLocation:", error);
            if (error.name === 'AbortError') {
                this.showError('Location search timed out. Please try again or check your connection.');
            } else if (error.message.includes('CORS') || error.message.includes('403')) {
                this.showError('Location search temporarily unavailable. Please try a location from the suggestions or use GPS.');
            } else {
                this.showError('Unable to search location. Please check your connection or try using GPS location.');
            }
        }
    }

    loadUserLocation() {
        try {
            const savedLocation = localStorage.getItem('userLocation');
            
            if (savedLocation) {
                this.currentLocation = JSON.parse(savedLocation);
                
                // Try to load prayer data from multi-day cache first
                const currentDateInLocation = this.getCurrentTimeInLocationTimezone().toDateString();
                
                if (this.loadPrayerDataForDate(currentDateInLocation)) {
                    console.log("Using cached prayer data for current date");
                    document.getElementById('locationInput').value = this.currentLocation.name;
                    this.allPrayers = this.calculateAllTimes();
                    this.renderPrayerCards();
                    this.updateProgress();
                    this.hideLoading();
                    return;
                }
                
                // Fallback to old cache system for backward compatibility
                const cachedPrayerData = localStorage.getItem('prayerData');
                const cachedTomorrowPrayerData = localStorage.getItem('tomorrowPrayerData');
                const cacheDate = localStorage.getItem('prayerDataCacheDate');
                
                const isCacheValid = cacheDate === currentDateInLocation && 
                                   this.currentLocation.timeZone && 
                                   cachedPrayerData && 
                                   cachedTomorrowPrayerData;

                if (!isCacheValid) {
                    console.log("Cache invalid or expired (date changed), fetching fresh data");
                    document.getElementById('locationInput').value = this.currentLocation.name;
                    this.fetchPrayerTimes();
                } else {
                    console.log("Using old cache system for backward compatibility");
                    this.prayerData = JSON.parse(cachedPrayerData);
                    this.tomorrowPrayerData = JSON.parse(cachedTomorrowPrayerData);
                    document.getElementById('locationInput').value = this.currentLocation.name;
                    this.allPrayers = this.calculateAllTimes();
                    this.renderPrayerCards();
                    this.updateProgress();
                    this.hideLoading();
                }
            } else {
                this.useDefaultLocation();
            }
        } catch (error) {
            console.error("Error loading user location from cache:", error);
            console.log("Cache corrupted, clearing and using default location");
            this.clearCorruptedCache();
            this.useDefaultLocation();
        }
    }

    async fetchPrayerTimes() {
        if (!this.currentLocation || this.currentLocation.lat === undefined || this.currentLocation.lon === undefined) {
            console.error("Cannot fetch prayer times without location coordinates.");
            this.showError("Location coordinates are missing. Please select a location.");
            return;
        }

        this.showLoading();
        // We save userLocation here initially to persist the name/lat/lon even if the API fails
        this.setSafeStorageItem('userLocation', JSON.stringify(this.currentLocation));

        try {
            console.log("Fetching prayer times for:", this.currentLocation.name, "Lat:", this.currentLocation.lat, "Lon:", this.currentLocation.lon);
            
            // Get optimal calculation method for this location
            const optimalMethod = this.getOptimalCalculationMethod(this.currentLocation);
            console.log(`Using optimal method for region: Method ${optimalMethod.method}, School ${optimalMethod.school}`);
            
            // Fetch 7 days of data for robust offline capability
            const fetchPromises = [];
            const dateLabels = [];
            
            // Use consistent timezone for both API calls and cache keys
            const baseDateTime = new Date();
            
            for (let i = 0; i < 7; i++) {
                const targetDate = new Date(baseDateTime);
                targetDate.setDate(baseDateTime.getDate() + i);
                const dateString = targetDate.toISOString().split('T')[0];
                dateLabels.push(dateString);
                
                const url = i === 0 
                    ? `https://api.aladhan.com/v1/timings?latitude=${this.currentLocation.lat}&longitude=${this.currentLocation.lon}&method=${optimalMethod.method}&school=${optimalMethod.school}`
                    : `https://api.aladhan.com/v1/timings/${dateString}?latitude=${this.currentLocation.lat}&longitude=${this.currentLocation.lon}&method=${optimalMethod.method}&school=${optimalMethod.school}`;
                
                fetchPromises.push(fetch(url));
            }
            
            console.log("Fetching 7 days of prayer data for offline capability:", dateLabels);
            const responses = await Promise.all(fetchPromises);
            const allData = await Promise.all(responses.map(response => response.json()));
            
            // Extract today's and tomorrow's data (for backward compatibility)
            const todayData = allData[0];
            const tomorrowResponseData = allData[1];
            const dayAfterTomorrowData = allData[2];
            
            console.log("Fetched 7 days of prayer data successfully");
            console.log("Today's API response:", todayData);
            console.log("Tomorrow's API response:", tomorrowResponseData);
            // DEBUG: Log the actual timings we're getting from API
            console.log("API TODAY TIMINGS:", todayData.data.timings);
            console.log("API TIMEZONE:", todayData.data.meta.timezone);

            if (todayData.code === 200 && todayData.status === 'OK' && 
                tomorrowResponseData.code === 200 && tomorrowResponseData.status === 'OK') {
                
                this.prayerData = todayData.data;
                this.tomorrowPrayerData = tomorrowResponseData.data;
                
                // The timezone is returned in the meta object, which is crucial for the clock
                this.currentLocation.timeZone = todayData.data.meta.timezone; 
                
                // Use location timezone for cache date (proper timezone handling)
                const todayInLocation = this.getCurrentTimeInLocationTimezone().toDateString();
                
                // Cache all 7 days of data
                this.cacheMultipleDaysData(allData, todayInLocation);
                
                // Backward compatibility: Keep old cache system for now
                this.setSafeStorageItem('prayerData', JSON.stringify(this.prayerData));
                this.setSafeStorageItem('tomorrowPrayerData', JSON.stringify(this.tomorrowPrayerData));
                this.setSafeStorageItem('prayerDataCacheDate', todayInLocation);
                this.setSafeStorageItem('userLocation', JSON.stringify(this.currentLocation));

                console.log("Prayer times fetched and cached successfully. Timezone:", this.currentLocation.timeZone);
                this.allPrayers = this.calculateAllTimes();
                this.renderPrayerCards();
                this.updateProgress(); // This will now have the correct timezone
                this.scheduleOfflineNotifications(); // Schedule notifications in service worker
                this.hideLoading();
                document.dispatchEvent(new Event('prayerDataUpdated')); // Dispatch event here
            } else {
                console.error("Aladhan API returned an error:", todayData.data || todayData.message || tomorrowResponseData.data || tomorrowResponseData.message || 'Unknown error');
                this.showError('Failed to fetch prayer times for this location. Please try another one.');
            }
        } catch (error) {
            console.error('Error fetching prayer times:', error);
            this.showError('Failed to fetch prayer times. Please check your connection.');
        }
    }

    calculateIslamicMidnight() {
        if (!this.prayerData || !this.tomorrowPrayerData) {
            console.warn("Cannot calculate Islamic midnight without both today's and tomorrow's prayer data");
            // Fallback calculation: Assume 6 hours after Maghrib (rough estimate)
            if (this.prayerData && this.prayerData.timings.Maghrib) {
                const parseTime = (timeString) => {
                    const [hours, minutes] = timeString.split(':').map(Number);
                    return { hours, minutes };
                };
                
                const maghribTime = parseTime(this.prayerData.timings.Maghrib);
                const fallbackHours = (maghribTime.hours + 6) % 24;
                const fallbackMidnight = `${fallbackHours.toString().padStart(2, '0')}:${maghribTime.minutes.toString().padStart(2, '0')}`;
                
                console.log(`Using fallback Islamic midnight calculation: ${fallbackMidnight} (Maghrib + 6 hours)`);
                return fallbackMidnight;
            }
            return '00:00'; // Ultimate fallback
        }

        const parseTime = (timeString) => {
            const [hours, minutes] = timeString.split(':').map(Number);
            return { hours, minutes };
        };

        const maghribTime = parseTime(this.prayerData.timings.Maghrib);
        const nextFajrTime = parseTime(this.tomorrowPrayerData.timings.Fajr);

        // Convert to total minutes for easier calculation
        const maghribMinutes = maghribTime.hours * 60 + maghribTime.minutes;
        const nextFajrMinutes = (nextFajrTime.hours + 24) * 60 + nextFajrTime.minutes; // Add 24 hours for next day

        // Calculate midpoint (Islamic midnight)
        const midpointMinutes = Math.round((maghribMinutes + nextFajrMinutes) / 2);
        const hours = Math.floor(midpointMinutes / 60) % 24;
        const minutes = midpointMinutes % 60;

        const islamicMidnight = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Only log once per day to avoid console spam
        if (!this.islamicMidnightLogged || this.islamicMidnightLogged !== new Date().toDateString()) {
            console.log(`Islamic midnight calculation: Maghrib ${this.prayerData.timings.Maghrib} + Next Fajr ${this.tomorrowPrayerData.timings.Fajr} = Midnight ${islamicMidnight}`);
            this.islamicMidnightLogged = new Date().toDateString();
        }
        
        return islamicMidnight;
    }

    calculateTahajjudTime() {
        if (!this.prayerData || !this.tomorrowPrayerData) {
            console.warn("Cannot calculate Tahajjud time without both today's and tomorrow's prayer data");
            // Fallback calculation: Assume 4 hours after Maghrib for Last Third start
            if (this.prayerData && this.prayerData.timings.Maghrib) {
                const parseTime = (timeString) => {
                    const [hours, minutes] = timeString.split(':').map(Number);
                    return { hours, minutes };
                };
                
                const maghribTime = parseTime(this.prayerData.timings.Maghrib);
                const fallbackHours = (maghribTime.hours + 4) % 24;
                const fallbackTahajjud = `${fallbackHours.toString().padStart(2, '0')}:${maghribTime.minutes.toString().padStart(2, '0')}`;
                
                console.log(`Using fallback Tahajjud calculation: ${fallbackTahajjud} (Maghrib + 4 hours)`);
                return fallbackTahajjud;
            }
            return null; // Return null if calculation is not possible
        }

        const parseTime = (timeString) => {
            const [hours, minutes] = timeString.split(':').map(Number);
            return { hours, minutes };
        };

        const maghribTime = parseTime(this.prayerData.timings.Maghrib);
        const nextFajrTime = parseTime(this.tomorrowPrayerData.timings.Fajr);

        // Convert to total minutes for easier calculation
        const maghribMinutes = maghribTime.hours * 60 + maghribTime.minutes;
        const nextFajrMinutes = (nextFajrTime.hours + 24) * 60 + nextFajrTime.minutes; // Add 24 hours for next day

        // Calculate night duration
        const nightDurationMinutes = nextFajrMinutes - maghribMinutes;
        
        // Last third starts at 2/3 of the night from Maghrib
        const lastThirdStartMinutes = maghribMinutes + Math.round((nightDurationMinutes * 2) / 3);
        
        // Convert back to time format
        const hours = Math.floor(lastThirdStartMinutes / 60) % 24;
        const minutes = lastThirdStartMinutes % 60;

        const tahajjudTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Only log once per day to avoid console spam
        if (!this.tahajjudTimeLogged || this.tahajjudTimeLogged !== new Date().toDateString()) {
            console.log(`Tahajjud time calculation (Last Third): Maghrib ${this.prayerData.timings.Maghrib} + Next Fajr ${this.tomorrowPrayerData.timings.Fajr} = Last Third starts at ${tahajjudTime}`);
            this.tahajjudTimeLogged = new Date().toDateString();
        }
        
        return tahajjudTime;
    }

    calculateAllTimes() {
        const timings = this.prayerData.timings;
        // Get current time in the location's timezone instead of browser's local timezone
        const now = this.getCurrentTimeInLocationTimezone();
        const date = new Date(now);
        
        const parseTime = (timeString) => {
            const [hours, minutes] = timeString.split(':').map(Number);
            // The API returns times in local timezone for the location
            // Create a Date object using the same date as 'now' but with the prayer time
            const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
            return newDate;
        };

        const addMinutes = (time, mins) => {
            const newTime = new Date(time.getTime() + mins * 60000);
            return `${newTime.getHours().toString().padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`;
        };

        const subtractMinutes = (time, mins) => {
            const newTime = new Date(time.getTime() - mins * 60000);
            return `${newTime.getHours().toString().padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`;
        };
        
        const fajrTime = parseTime(timings.Fajr);
        const sunriseTime = parseTime(timings.Sunrise);
        const dhuhrTime = parseTime(timings.Dhuhr);
        const asrTime = parseTime(timings.Asr);
        const maghribTime = parseTime(timings.Maghrib);
        const sunsetTime = parseTime(timings.Sunset);
        const ishaTime = parseTime(timings.Isha);

        // Calculate Islamic midnight for Isha end time
        const islamicMidnight = this.calculateIslamicMidnight();
        
        // Calculate dynamic Tahajjud time (Last Third of the Night)
        const tahajjudStartTime = this.calculateTahajjudTime();

        const prayers = [];
        
        // Only add Tahajjud if we can calculate it properly
        if (tahajjudStartTime) {
            prayers.push({ name: 'tahajjud', type: 'optional', start: tahajjudStartTime, end: subtractMinutes(fajrTime, 1) });
        }
        
        // Add the rest of the prayers
        prayers.push(
            { name: 'fajr', type: 'prayer', start: timings.Fajr, end: timings.Sunrise },
            { name: 'forbidden_fajr_sunrise', type: 'banned', start: timings.Sunrise, end: addMinutes(sunriseTime, 15) },
            { name: 'ishraq', type: 'optional', start: addMinutes(sunriseTime, 20), end: addMinutes(sunriseTime, 99) },
            { name: 'chasht', type: 'optional', start: addMinutes(sunriseTime, 100), end: subtractMinutes(dhuhrTime, 16) },
            { name: 'zawal', type: 'banned', start: subtractMinutes(dhuhrTime, 15), end: subtractMinutes(dhuhrTime, 1) },
            { name: 'dhuhr', type: 'prayer', start: timings.Dhuhr, end: timings.Asr },
            { name: 'asr', type: 'prayer', start: timings.Asr, end: subtractMinutes(sunsetTime, 15) },
            { name: 'forbidden_asr_sunset', type: 'banned', start: subtractMinutes(sunsetTime, 15), end: subtractMinutes(maghribTime, 0) },
            { name: 'maghrib', type: 'prayer', start: timings.Maghrib, end: addMinutes(maghribTime, 25) },
            { name: 'awwabin', type: 'optional', start: addMinutes(maghribTime, 25), end: timings.Isha },
            { name: 'isha', type: 'prayer', start: timings.Isha, end: islamicMidnight }
        );

        return prayers.map(p => {
            let start = parseTime(p.start);
            let end = parseTime(p.end);

            if (p.name === 'tahajjud') {
                if (now.getHours() >= 18 && now.getHours() < 24) {
                    start.setDate(start.getDate() + 1);
                    end.setDate(end.getDate() + 1);
                } else if (now.getHours() >= 0 && now.getHours() < start.getHours()) {
                    // Tahajjud times are for today
                } else if (now.getHours() >= start.getHours() && now.getHours() < end.getHours()) {
                    // We're in Tahajjud time
                } else if (now.getHours() >= end.getHours()) {
                    // Tahajjud has passed for today
                }
            }

            if (now >= start && now < end) {
                p.status = 'active';
            } else if (now < start) {
                p.status = 'upcoming';
            } else {
                p.status = 'passed';
            }

            p.startParsed = start;
            p.endParsed = end;
            return p;
        }).sort((a, b) => {
            const order = ['tahajjud', 'fajr', 'forbidden_fajr_sunrise', 'ishraq', 'chasht', 'zawal', 'dhuhr', 'asr', 'forbidden_asr_sunset', 'maghrib', 'awwabin', 'isha'];
            return order.indexOf(a.name) - order.indexOf(b.name);
        });
    }

    renderPrayerCards() {
        const grid = document.getElementById('prayerGrid');
        grid.innerHTML = '';
        
        const orderedNames = [
             'fajr', 'forbidden_fajr_sunrise', 'ishraq', 'chasht', 'zawal', 'dhuhr', 
            'asr', 'forbidden_asr_sunset', 'maghrib', 'awwabin', 'isha', 'tahajjud', 
        ];

        const prayerMap = new Map(this.allPrayers.map(p => [p.name, p]));

        orderedNames.forEach(name => {
            const prayer = prayerMap.get(name);
            if (prayer) {
                let card;
                if (prayer.type === 'banned') {
                    card = this.createBannedTimeCard(prayer);
                } else {
                    card = this.createPrayerCard(prayer);
                }
                grid.appendChild(card);
            }
        });

        this.renderHijriDate();
        grid.style.display = 'grid';
    }

    createPrayerCard(prayer) {
        const card = document.createElement('div');
        card.className = `prayer-card ${prayer.status === 'active' ? 'active' : ''}`;
        
        const prayerName = this.translations[this.currentLang][prayer.name];
        const statusText = this.translations[this.currentLang][prayer.status];
        
        card.innerHTML = `
            <div class="prayer-header">
                <div class="prayer-name">
                    <div class="prayer-icon">
                        <i class="fas ${this.prayerIcons[prayer.name]}"></i>
                    </div>
                    ${prayerName}
                </div>
                <div class="prayer-status status-${prayer.status}">
                    ${statusText}
                </div>
            </div>
            <div class="prayer-times">
                <div class="time-block">
                    <div class="time-label">${this.translations[this.currentLang]['start-time']}</div>
                    <div class="time-value">${this.formatTime(prayer.start)}</div>
                </div>
                <div class="time-block">
                    <div class="time-label">${this.translations[this.currentLang]['end-time']}</div>
                    <div class="time-value">${this.formatTime(prayer.end)}</div>
                </div>
            </div>
            ${prayer.status === 'active' ? `<div class="countdown" id="countdown-${prayer.name}"></div>` : ''}
        `;

        return card;
    }
    
    createBannedTimeCard(bannedTime) {
        const card = document.createElement('div');
        card.className = `prayer-card banned-time ${bannedTime.status === 'active' ? 'active' : ''}`;
        
        const statusText = this.translations[this.currentLang][bannedTime.status];
        const bannedText = this.translations[this.currentLang]['banned'];
        
        card.innerHTML = `
            <div class="prayer-header">
                <div class="prayer-name">
                    <div class="prayer-icon">
                        <i class="fas ${this.prayerIcons.banned}"></i>
                    </div>
                    ${this.translations[this.currentLang][bannedTime.name] || bannedText}
                </div>
                <div class="prayer-status status-${bannedTime.status}">
                    ${statusText}
                </div>
            </div>
            <div class="prayer-times">
                <div class="time-block">
                    <div class="time-label">${this.translations[this.currentLang]['start-time']}</div>
                    <div class="time-value">${this.formatTime(bannedTime.start)}</div>
                </div>
                <div class="time-block">
                    <div class="time-label">${this.translations[this.currentLang]['end-time']}</div>
                    <div class="time-value">${this.formatTime(bannedTime.end)}</div>
                </div>
            </div>
            ${bannedTime.status === 'active' ? `<div class="countdown" id="countdown-${bannedTime.name}"></div>` : ''}
        `;

        return card;
    }

    renderHijriDate() {
        const hijriDiv = document.getElementById('hijriDate');
        
        // Always use current date in location's timezone for Gregorian display
        const currentLocationTime = this.getCurrentTimeInLocationTimezone();
        
        // Get the cached hijri data for reference
        const hijriDate = this.prayerData.date.hijri;
        const cachedGregorianDate = this.prayerData.date.gregorian;
        
        // Better date comparison - normalize both dates for comparison
        const currentDate = new Date(currentLocationTime);
        
        // Parse the cached date properly (API returns DD-MM-YYYY format)
        const dateParts = cachedGregorianDate.date.split('-');
        const cachedDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
        
        // Check if it's the same day (year, month, day)
        const currentDateMatches = currentDate.getFullYear() === cachedDate.getFullYear() &&
                                  currentDate.getMonth() === cachedDate.getMonth() &&
                                  currentDate.getDate() === cachedDate.getDate();
        
        // Format current date for display
        const currentGregorianDateForDisplay = currentLocationTime.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        
        let displayContent;
        if (currentDateMatches) {
            // Current date matches cached date - show normal display
            let formattedHijriDate = hijriDate.date;
            if (this.currentLang === 'bn') {
                formattedHijriDate = formattedHijriDate.replace(/\d+/g, match => this.formatNumberForLanguage(parseInt(match)));
            }

            // Get current English day name
            const currentEnglishDayName = currentLocationTime.toLocaleDateString('en-US', { weekday: 'long' });

            displayContent = `
                <h3>${this.translations[this.currentLang]['hijri-date']}</h3>
                <p>${formattedHijriDate} | ${currentGregorianDateForDisplay}</p>
                <p>${hijriDate.weekday[this.currentLang] || hijriDate.weekday.en} | ${currentEnglishDayName}</p>
            `;
        } else {
            // Date has changed - show current Gregorian date with note about Hijri
            const currentEnglishDayName = currentLocationTime.toLocaleDateString('en-US', { weekday: 'long' });
            
            displayContent = `
                <h3>${this.translations[this.currentLang]['hijri-date']}</h3>
                <p>${hijriDate.date} (${this.translations[this.currentLang]['cached']}) | ${currentGregorianDateForDisplay} (${this.translations[this.currentLang]['current']})</p>
                <p>${hijriDate.weekday[this.currentLang] || hijriDate.weekday.en} | ${currentEnglishDayName}</p>
            `;
        }
        
        hijriDiv.innerHTML = displayContent;
        hijriDiv.style.display = 'block';
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const savedTimeFormat = this.getSafeStorageItem('timeFormat', '12h'); // Get saved format

        let displayHours = hours;
        let period = '';

        if (savedTimeFormat === '12h') {
            period = hours >= 12 ? 'PM' : 'AM';
            displayHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
        }

        const formattedHours = this.formatNumberForLanguage(displayHours);

        let formattedMinutes;
        if (this.currentLang === 'bn') {
            formattedMinutes = new Intl.NumberFormat('bn-BD', { minimumIntegerDigits: 2 }).format(minutes);
        } else {
            formattedMinutes = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 }).format(minutes);
        }

        return `${formattedHours}:${formattedMinutes}${period ? ' ' + period : ''}`;
    }

    updateProgress() {
        // Get current time in the location's timezone instead of browser's local timezone
        const now = this.getCurrentTimeInLocationTimezone();
        
        this.allPrayers = this.calculateAllTimes();
        this.renderPrayerCards(); 

        const orderedPrayers = [
            'fajr', 'forbidden_fajr_sunrise', 'ishraq', 'chasht', 'zawal', 'dhuhr',
            'asr', 'forbidden_asr_sunset', 'maghrib', 'awwabin', 'isha', 'tahajjud'
        ];

        let currentEvent = null;
        let nextEvent = null;

        for (let i = 0; i < orderedPrayers.length; i++) {
            const eventName = orderedPrayers[i];
            const event = this.allPrayers.find(p => p.name === eventName);
            
            if (!event) continue;

            let startTime = new Date(event.startParsed);
            let endTime = new Date(event.endParsed);

            if (startTime > endTime) { 
                let adjustedEndTime = new Date(endTime);
                if (adjustedEndTime < startTime) {
                    adjustedEndTime.setDate(adjustedEndTime.getDate() + 1);
                }
                let totalDuration = adjustedEndTime.getTime() - startTime.getTime();
                let elapsed;
                
                if (now >= startTime && now <= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)) { 
                   elapsed = now.getTime() - startTime.getTime();
                   currentEvent = event;
                   break;
                } else if (now < endTime && now >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)) { 
                    let startToMidnight = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 23, 59, 59, 999).getTime() - startTime.getTime();
                    elapsed = startToMidnight + (now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime());
                    currentEvent = event;
                    break;
                }
            } else if (now >= startTime && now < endTime) {
                currentEvent = event;
                break;
            }
        }

        if (currentEvent) {
            const currentIndex = orderedPrayers.indexOf(currentEvent.name);
            for (let i = currentIndex + 1; i < orderedPrayers.length; i++) {
                const eventName = orderedPrayers[i];
                const event = this.allPrayers.find(p => p.name === eventName);
                if (event) {
                    nextEvent = event;
                    break;
                }
            }
            if (!nextEvent) { 
                nextEvent = this.allPrayers.find(p => p.name === orderedPrayers[0]);
                if (nextEvent) {
                    if (nextEvent.startParsed < currentEvent.startParsed && nextEvent.name === 'tahajjud') {
                        nextEvent.startParsed.setDate(nextEvent.startParsed.getDate() + 1);
                        nextEvent.endParsed.setDate(nextEvent.endParsed.getDate() + 1);
                    }
                    if (nextEvent.startParsed < now) { 
                        nextEvent.startParsed.setDate(nextEvent.startParsed.getDate() + 1);
                        nextEvent.endParsed.setDate(nextEvent.endParsed.getDate() + 1);
                    }
                }
            }
        } else { 
            // No current event is active, find the next upcoming event
            
            // First check if Tahajjud is upcoming (special case since it can be after midnight)
            const tahajjudEvent = this.allPrayers.find(p => p.name === 'tahajjud');
            if (tahajjudEvent) {
                console.log('Tahajjud debug - Current time:', now.toLocaleString());
                console.log('Tahajjud debug - Tahajjud start:', tahajjudEvent.startParsed.toLocaleString());
                console.log('Tahajjud debug - Tahajjud end:', tahajjudEvent.endParsed.toLocaleString());
                
                // Check if we're in the period after Isha but before Tahajjud starts
                const ishaEvent = this.allPrayers.find(p => p.name === 'isha');
                if (ishaEvent) {
                    console.log('Isha debug - Isha end:', ishaEvent.endParsed.toLocaleString());
                    console.log('Is after Isha end?', now >= ishaEvent.endParsed);
                    console.log('Is before Tahajjud start?', now < tahajjudEvent.startParsed);
                }
                
                // Case 1: We're between Isha end and Tahajjud start (same day)
                if (ishaEvent && now >= ishaEvent.endParsed && now < tahajjudEvent.startParsed) {
                    nextEvent = tahajjudEvent;
                    console.log('Setting Tahajjud as next event - Case 1');
                }
                // Case 2: Tahajjud spans midnight - we're after Isha but Tahajjud is tomorrow
                else if (ishaEvent && now >= ishaEvent.endParsed && tahajjudEvent.startParsed.getDate() > now.getDate()) {
                    nextEvent = tahajjudEvent;
                    console.log('Setting Tahajjud as next event - Case 2 (spans midnight)');
                }
                // Case 3: We're in early morning hours before Tahajjud starts (if it's set for today)
                else if (now.getHours() >= 0 && now.getHours() <= 6 && now < tahajjudEvent.startParsed && tahajjudEvent.startParsed.getDate() === now.getDate()) {
                    nextEvent = tahajjudEvent;
                    console.log('Setting Tahajjud as next event - Case 3 (early morning)');
                }
            }
            
            // If Tahajjud is not the next event, look for other upcoming events
            if (!nextEvent) {
                console.log('Tahajjud not next, checking other prayers...');
                for (const eventName of orderedPrayers) {
                    const event = this.allPrayers.find(p => p.name === eventName);
                    if (event && now < event.startParsed) {
                        nextEvent = event;
                        console.log('Found next event:', eventName);
                        break;
                    }
                }
            }
            
            // If still no next event found, it means we're past all prayers for today
            // The next event should be Fajr tomorrow
            if (!nextEvent) { 
                nextEvent = this.allPrayers.find(p => p.name === 'fajr');
                if (nextEvent) {
                     nextEvent.startParsed.setDate(nextEvent.startParsed.getDate() + 1);
                     nextEvent.endParsed.setDate(nextEvent.endParsed.getDate() + 1);
                     console.log('Setting Fajr tomorrow as next event');
                }
            }
        }

        if (currentEvent) {
            let totalDuration, elapsed;
            if (currentEvent.startParsed > currentEvent.endParsed) { 
                let adjustedEndTime = new Date(currentEvent.endParsed);
                if (adjustedEndTime < currentEvent.startParsed) { 
                    adjustedEndTime.setDate(adjustedEndTime.getDate() + 1);
                }
                totalDuration = adjustedEndTime.getTime() - currentEvent.startParsed.getTime();
                
                if (now >= currentEvent.startParsed && now.getDate() === currentEvent.startParsed.getDate()) { 
                    elapsed = now.getTime() - currentEvent.startParsed.getTime();
                } else if (now.getDate() === adjustedEndTime.getDate() && now < adjustedEndTime) { 
                    let startToMidnight = new Date(currentEvent.startParsed.getFullYear(), currentEvent.startParsed.getMonth(), currentEvent.startParsed.getDate(), 23, 59, 59, 999).getTime() - currentEvent.startParsed.getTime();
                    elapsed = startToMidnight + (now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime());
                } else {
                    elapsed = 0;
                }
                
            } else {
                totalDuration = currentEvent.endParsed.getTime() - currentEvent.startParsed.getTime();
                elapsed = now.getTime() - currentEvent.startParsed.getTime();
            }
            
            const progress = Math.min((elapsed / totalDuration) * 100, 100);
            document.getElementById('progressFill').style.width = `${progress}%`;

            const countdownEl = document.getElementById(`countdown-${currentEvent.name}`);
            if (countdownEl) {
                let remaining = currentEvent.endParsed.getTime() - now.getTime();
                if (currentEvent.startParsed > currentEvent.endParsed) {
                    let adjustedEndTimeForCountdown = new Date(currentEvent.endParsed);
                    if (adjustedEndTimeForCountdown < now) { 
                        adjustedEndTimeForCountdown.setDate(adjustedEndTimeForCountdown.getDate() + 1);
                    }
                    remaining = adjustedEndTimeForCountdown.getTime() - now.getTime();
                }


                if (remaining > 0) {
                    const { hours, minutes, seconds } = this.getTimeRemaining(remaining);
                    countdownEl.textContent = `${this.translations[this.currentLang]['time-remaining']}: ${hours}h ${minutes}m ${seconds}s`;
                } else {
                    countdownEl.textContent = ''; 
                }
            }

            document.getElementById('currentTime').textContent = this.translations[this.currentLang][currentEvent.name];
            const remaining = currentEvent.endParsed.getTime() - now.getTime();
            if (remaining > 0) {
                const { hours, minutes, seconds } = this.getTimeRemaining(remaining);
                document.getElementById('nextPrayer').textContent = `${this.translations[this.currentLang]['time-remaining']}: ${hours}h ${minutes}m ${seconds}s`;
            } else {
                document.getElementById('nextPrayer').textContent = ''; 
            }

        } else if (nextEvent) { 
            document.getElementById('currentTime').textContent = `${this.translations[this.currentLang]['next-prayer-label']} ${this.translations[this.currentLang][nextEvent.name]}`;
            const remaining = nextEvent.startParsed.getTime() - now.getTime();
            if (remaining > 0) {
                const { hours, minutes, seconds } = this.getTimeRemaining(remaining);
                document.getElementById('nextPrayer').textContent = `${this.translations[this.currentLang]['upcoming-in']}: ${hours}h ${minutes}m ${seconds}s`;
            } else {
                document.getElementById('nextPrayer').textContent = '';
            }
            document.getElementById('progressFill').style.width = '0%'; 
        } else { 
            document.getElementById('currentTime').textContent = now.toLocaleTimeString();
            document.getElementById('nextPrayer').textContent = '';
            document.getElementById('progressFill').style.width = '0%';
        }
        
        // Update location current time display
        const locationCurrentTimeEl = document.getElementById('locationCurrentTime');
        // Only log timezone info once per minute to reduce console spam
        const currentTime = new Date();
        const shouldLog = !this.lastTimezoneLog || (currentTime.getTime() - this.lastTimezoneLog) > 60000;
        
        if (locationCurrentTimeEl && this.currentLocation && this.currentLocation.timeZone) {
            if (shouldLog) {
                console.log("Timezone available:", this.currentLocation.timeZone);
                this.lastTimezoneLog = currentTime.getTime();
            }
            const nowInLocationTime = new Date().toLocaleTimeString(this.currentLang === 'bn' ? 'bn-BD' : 'en-US', { 
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: this.currentLocation.timeZone
            });
            locationCurrentTimeEl.textContent = `${this.currentLocation.name}, ${this.translations[this.currentLang]['location_current_time_label']} ${nowInLocationTime}`;
        } else if (locationCurrentTimeEl) {
            if (shouldLog) {
                console.warn("Timezone not available for current location.");
                this.lastTimezoneLog = currentTime.getTime();
            }
            locationCurrentTimeEl.textContent = `${this.currentLocation?.name || 'Unknown Location'}, ${this.translations[this.currentLang]['timezone_not_available']}`;
        }

        // Check for client-side notifications
        this.checkPrayerNotifications();
    }

    getTimeRemaining(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        
        // Format remaining time components using the helper
        const formattedHours = this.formatNumberForLanguage(hours);
        const formattedMinutes = this.formatNumberForLanguage(minutes);
        const formattedSeconds = this.formatNumberForLanguage(seconds);

        return { hours: formattedHours, minutes: formattedMinutes, seconds: formattedSeconds };
    }

    startTimeUpdater() {
        this.updateInterval = setInterval(() => {
            if (this.prayerData) {
                // Check if date has changed and refresh data if needed
                this.checkForDateChange();
                this.updateProgress();
            }
        }, 1000);
    }

    // Check if the date has changed and refresh prayer times if necessary
    checkForDateChange() {
        const currentDateInLocation = this.getCurrentTimeInLocationTimezone().toDateString();
        const cacheDate = localStorage.getItem('prayerDataCacheDate');
        
        if (cacheDate && cacheDate !== currentDateInLocation) {
            console.log(`Date changed from ${cacheDate} to ${currentDateInLocation}, refreshing prayer times...`);
            
            if (navigator.onLine !== false) {
                // Online: Clear cache and fetch fresh data
                this.clearPrayerDataCache();
                this.fetchPrayerTimes();
            } else {
                // Offline: Try to use cached data from multiDayPrayerCache
                console.log("Offline: Attempting to load prayer data from 7-day cache");
                
                if (this.loadPrayerDataForDate(currentDateInLocation)) {
                    console.log("Offline: Successfully loaded prayer data from multi-day cache");
                    this.allPrayers = this.calculateAllTimes();
                    this.renderPrayerCards();
                } else {
                    // Fallback to old cache system for backward compatibility
                    const cachedTomorrowPrayerData = localStorage.getItem('tomorrowPrayerData');
                    
                    if (cachedTomorrowPrayerData) {
                        console.log("Offline: Using old cached tomorrow's data as today's data");
                        
                        // Move tomorrow's data to today's data
                        this.prayerData = JSON.parse(cachedTomorrowPrayerData);
                        
                        // Clear tomorrow's data since we don't have day+2 cached
                        this.tomorrowPrayerData = null;
                        localStorage.removeItem('tomorrowPrayerData');
                        
                        // Update cache with the new data
                        this.setSafeStorageItem('prayerData', JSON.stringify(this.prayerData));
                        this.setSafeStorageItem('prayerDataCacheDate', currentDateInLocation);
                        
                        // Re-calculate all times and re-render
                        this.allPrayers = this.calculateAllTimes();
                        this.renderPrayerCards();
                        
                        console.log("Successfully updated to use old cached prayer data");
                    } else {
                        console.log("Offline: No cached data available, keeping old data but updating display date");
                        // Update the cache date anyway to prevent continuous checking
                        this.setSafeStorageItem('prayerDataCacheDate', currentDateInLocation);
                        // Re-render with updated current date display
                        this.renderPrayerCards();
                    }
                }
            }
        }
    }

    // Client-side notification logic
    checkPrayerNotifications() {
        if (this.notificationMode === 0 || !this.prayerData) {
            return; // Notifications are off
        }

        // Use location's timezone for notifications too
        const now = this.getCurrentTimeInLocationTimezone();
        const todayDateString = now.toDateString();

        // Reset notificationsShownToday if it's a new day
        if (this.lastNotificationCheckDate !== todayDateString) {
            this.notificationsShownToday = {};
            try {
                this.setSafeStorageItem('notificationsShownToday', JSON.stringify(this.notificationsShownToday));
                this.lastNotificationCheckDate = todayDateString;
                this.setSafeStorageItem('lastNotificationCheckDate', todayDateString);
            } catch (error) {
                console.error("Error updating notification cache:", error);
            }
        }

        this.allPrayers.forEach(prayer => {
            // Check notification mode
            let shouldNotify = false;
            if (this.notificationMode === 1) {
                // Only obligatory prayers (type === 'prayer')
                shouldNotify = prayer.type === 'prayer';
            } else if (this.notificationMode === 2) {
                // All prayers including optional ones
                shouldNotify = prayer.type === 'prayer' || prayer.type === 'optional';
            }

            if (!shouldNotify) {
                return;
            }

            const prayerName = this.translations[this.currentLang][prayer.name];
            const startParsed = prayer.startParsed;
            const endParsed = prayer.endParsed;

            // Notification for 1 minute before start
            const oneMinuteBeforeStart = new Date(startParsed.getTime() - 60 * 1000);
            const startNotificationKey = `${prayer.name}-start`;
            
            if (now >= oneMinuteBeforeStart && now < startParsed && !this.notificationsShownToday[startNotificationKey]) {
                this.showNotification(
                    `${prayerName} Time Soon`,
                    `${prayerName} prayer will start in 1 minute.`
                );
                this.notificationsShownToday[startNotificationKey] = true;
                try {
                    this.setSafeStorageItem('notificationsShownToday', JSON.stringify(this.notificationsShownToday));
                } catch (error) {
                    console.error("Error saving notification state:", error);
                }
            }

            // Notification for 15 minutes before end
            const fifteenMinutesBeforeEnd = new Date(endParsed.getTime() - 15 * 60 * 1000);
            const endNotificationKey = `${prayer.name}-end`;

            if (now >= fifteenMinutesBeforeEnd && now < endParsed && !this.notificationsShownToday[endNotificationKey]) {
                this.showNotification(
                    `${prayerName} Ending Soon`,
                    `${prayerName} prayer will end in 15 minutes.`
                );
                this.notificationsShownToday[endNotificationKey] = true;
                try {
                    this.setSafeStorageItem('notificationsShownToday', JSON.stringify(this.notificationsShownToday));
                } catch (error) {
                    console.error("Error saving notification state:", error);
                }
            }
        });
    }

    // Handles permission check and updates UI
    checkNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported by this browser.');
            document.getElementById('notificationBanner').style.display = 'none'; // Hide banner if not supported
            this.notificationMode = 0;
            this.setSafeStorageItem('notificationMode', '0');
            this.updateNotificationButtonIcon();
            return;
        }

        const currentPermission = Notification.permission;
        if (currentPermission === 'granted') {
            document.getElementById('notificationBanner').style.display = 'none';
            // Keep current notification mode if permission is granted
        } else if (currentPermission === 'default') {
            document.getElementById('notificationBanner').style.display = 'block';
            this.notificationMode = 0; // Not enabled until user grants
        } else { // 'denied'
            document.getElementById('notificationBanner').style.display = 'none';
            this.notificationMode = 0;
            this.setSafeStorageItem('notificationMode', '0');
        }
        this.updateNotificationButtonIcon();
    }

    // Requests notification permission from the user
    async enableNotifications() {
        if (!('Notification' in window)) {
            alert('Notifications are not supported in your browser.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.notificationMode = 1; // Default to obligatory prayers only
                this.setSafeStorageItem('notificationMode', '1');
                document.getElementById('notificationBanner').style.display = 'none';
                this.updateNotificationButtonIcon();
                this.scheduleOfflineNotifications(); // Schedule offline notifications
                this.showNotification('Notifications Enabled', 'You will now receive prayer time reminders for obligatory prayers!');
            } else if (permission === 'denied') {
                this.notificationMode = 0;
                this.setSafeStorageItem('notificationMode', '0');
                document.getElementById('notificationBanner').style.display = 'none';
                this.updateNotificationButtonIcon();
                alert('Notification permission denied. Please enable it in your browser settings.');
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            alert('Error enabling notifications. Please check console.');
        }
    }

    // Cycles through notification states (0 -> 1 -> 2 -> 0)
    toggleNotifications() {
        if (Notification.permission !== 'granted') {
            // If permission not granted, request it first
            this.enableNotifications();
            return;
        }

        // Cycle through notification modes: 0 -> 1 -> 2 -> 0
        this.notificationMode = (this.notificationMode + 1) % 3;
        this.setSafeStorageItem('notificationMode', this.notificationMode.toString());
        this.updateNotificationButtonIcon();
        
        // Reschedule offline notifications with new mode
        this.scheduleOfflineNotifications();

        // Show feedback to user
        let message = '';
        if (this.notificationMode === 0) {
            message = 'Notifications turned off';
        } else if (this.notificationMode === 1) {
            message = 'Notifications enabled for obligatory prayers only';
        } else if (this.notificationMode === 2) {
            message = 'Notifications enabled for all prayers';
        }
        
        this.showNotification('Notification Settings', message);
    }

    updateNotificationButtonIcon() {
        const notificationIcon = document.querySelector('#notificationToggleBtn i');
        const notificationBtn = document.getElementById('notificationToggleBtn');
        
        if (notificationIcon && notificationBtn) {
            let iconClass, title;
            
            switch (this.notificationMode) {
                case 0: // Off
                    iconClass = 'fas fa-bell-slash';
                    title = this.translations[this.currentLang]['notification-off'];
                    break;
                case 1: // Obligatory prayers only
                    iconClass = 'fas fa-bell';
                    title = this.translations[this.currentLang]['notification-obligatory'];
                    break;
                case 2: // All prayers
                    iconClass = 'fas fa-bell';
                    title = this.translations[this.currentLang]['notification-all'];
                    break;
                default:
                    iconClass = 'fas fa-bell-slash';
                    title = this.translations[this.currentLang]['notification-off'];
            }
            
            notificationIcon.className = iconClass;
            notificationBtn.title = title;
            
            // Add visual indicator for different states
            notificationBtn.classList.remove('notification-off', 'notification-obligatory', 'notification-all');
            if (this.notificationMode === 0) {
                notificationBtn.classList.add('notification-off');
            } else if (this.notificationMode === 1) {
                notificationBtn.classList.add('notification-obligatory');
            } else if (this.notificationMode === 2) {
                notificationBtn.classList.add('notification-all');
            }
        }
    }

    // Displays a notification via the service worker
    showNotification(title, body) {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                // Check if service worker is active before showing notification
                if (registration.active) {
                    registration.showNotification(title, {
                        body: body,
                        icon: '/images/icon.png',
                        badge: '/images/badge.png',
                        tag: 'prayer-time-reminder',
                        renotify: true
                    });
                } else {
                    console.warn('Service Worker not active, using fallback notification');
                    // Use direct browser notification as fallback
                    try {
                        new Notification(title, { 
                            body: body, 
                            icon: '/images/icon.png',
                            tag: 'prayer-time-reminder'
                        });
                    } catch (e) {
                        console.error('Fallback notification failed:', e);
                    }
                }
            }).catch(err => {
                console.error('Service Worker not ready for notification:', err);
                // Fallback for when SW isn't ready
                try {
                    new Notification(title, { 
                        body: body, 
                        icon: '/images/icon.png',
                        tag: 'prayer-time-reminder'
                    });
                } catch (e) {
                    console.error('Fallback notification failed:', e);
                }
            });
        } else if (Notification.permission === 'granted') {
            // Direct notification when service worker is not available
            try {
                new Notification(title, { 
                    body: body, 
                    icon: '/images/icon.png',
                    tag: 'prayer-time-reminder'
                });
            } catch (e) {
                console.error('Direct notification failed:', e);
            }
        }
    }

    // Schedule notifications in service worker for offline capability
    scheduleOfflineNotifications() {
        if ('serviceWorker' in navigator && this.allPrayers) {
            navigator.serviceWorker.ready.then(registration => {
                // Check if service worker is active before sending message
                if (registration.active) {
                    const message = {
                        type: 'SCHEDULE_NOTIFICATIONS',
                        prayerTimes: this.allPrayers.map(prayer => ({
                            name: this.translations[this.currentLang][prayer.name],
                            type: prayer.type,
                            startParsed: prayer.startParsed.toISOString(),
                            endParsed: prayer.endParsed.toISOString()
                        })),
                        notificationMode: this.notificationMode
                    };
                    
                    registration.active.postMessage(message);
                    console.log(`Scheduling offline notifications for mode ${this.notificationMode}`);

                    // Also schedule OneSignal notifications if available
                    console.log('Checking OneSignal availability...', {
                        manager: !!window.oneSignalManager,
                        initialized: window.oneSignalManager?.isInitialized,
                        subscribed: window.oneSignalManager?.isSubscribed,
                        userId: window.oneSignalManager?.userId
                    });
                    
                    if (window.oneSignalManager && window.oneSignalManager.isSubscribed) {
                        console.log('✅ OneSignal available - scheduling push notifications');
                        window.oneSignalManager.schedulePrayerNotifications(
                            this.allPrayers.map(prayer => ({
                                name: this.translations[this.currentLang][prayer.name],
                                type: prayer.type,
                                startParsed: prayer.startParsed.toISOString(),
                                endParsed: prayer.endParsed.toISOString()
                            })),
                            this.notificationMode
                        );
                        console.log('Prayer notifications also scheduled via OneSignal');
                    } else {
                        console.log('⚠️ OneSignal not available for push notifications (using local notifications only)');
                    }
                } else {
                    console.warn('Service Worker not active, cannot schedule offline notifications');
                }
            }).catch(err => {
                console.error('Error scheduling offline notifications:', err);
            });
        }
    }

    // Resets notification flags at the start of a new day
    resetNotificationsDaily() {
        try {
            // Use location's timezone for daily reset
            const todayDateString = this.getCurrentTimeInLocationTimezone().toDateString();
            if (this.lastNotificationCheckDate !== todayDateString) {
                this.notificationsShownToday = {};
                this.setSafeStorageItem('notificationsShownToday', JSON.stringify(this.notificationsShownToday));
                this.lastNotificationCheckDate = todayDateString;
                this.setSafeStorageItem('lastNotificationCheckDate', todayDateString);
            }
        } catch (error) {
            console.error("Error resetting daily notifications:", error);
            this.notificationsShownToday = {};
            this.lastNotificationCheckDate = null;
        }
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('prayerGrid').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('hijriDate').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showError(message) {
        console.error("App Error:", message);
        
        // Check if we're on the main prayer page by looking for essential elements
        const errorState = document.getElementById('errorState');
        const errorMessageElement = document.getElementById('error-message');
        const loadingState = document.getElementById('loadingState');
        const prayerGrid = document.getElementById('prayerGrid');
        const hijriDate = document.getElementById('hijriDate');
        
        // If we're on the main prayer page (has prayerGrid), show error in UI
        if (prayerGrid) {
            if (errorState) errorState.style.display = 'block';
            if (errorMessageElement) errorMessageElement.textContent = message;
            if (loadingState) loadingState.style.display = 'none';
            if (prayerGrid) prayerGrid.style.display = 'none';
            if (hijriDate) hijriDate.style.display = 'none';
        } 
        // If we're on a different page that includes app.js, don't use alert or show UI error
        else {
            // Log error but don't show to user unless it's a critical error
            // that requires user attention (which we don't have here)
            console.warn("Error occurred but not showing UI notification:", message);
            
            // Display a small notification instead of an alert if sharedApp exists
            if (window.sharedApp && window.sharedApp.showNotification) {
                try {
                    window.sharedApp.showNotification(message, 'error');
                } catch (e) {
                    console.error("Failed to show notification:", e);
                }
            }
        }
    }

    async resetAllUserData(clearFirebase = false) {
        console.log("Attempting to reset all user data...");
        
        // Clear all synchronized local storage items using dataSync
        if (window.dataSync) {
            window.dataSync.clearLocalUserData();
        } else {
            // Fallback if dataSync is not available (shouldn't happen in production)
            localStorage.clear(); // Clear everything as a last resort
        }

        // Delete user data from Firebase if logged in AND clearFirebase is true
        if (clearFirebase && this.user && window.dataSync) {
            await window.dataSync.deleteUserDataFromFirebase(this.user.uid);
        }

        // Re-initialize the app to reflect cleared data
        console.log("Local data cleared. Re-initializing app.");
        this._loadPreferences(); // Load default preferences
        this.applyTheme();
        this.applyLanguage();
        this.updateNotificationButtonIcon();
        this.useDefaultLocation(); // Reset location to default
        this.fetchPrayerTimes(); // Fetch prayer times for default location
        alert("All data has been reset.");
    }

    getMissedPrayerAlertMessage(prayerName) {
        const messages = {
            en: `Don't forget to pray ${prayerName}! The time is ending soon.`,
            ar: `لا تنس صلاة ${prayerName}! الوقت ينتهي قريباً.`
        };
        return messages[this.currentLang] || messages.en;
    }

    // Setup service worker message listener for missed prayer checks
    setupServiceWorkerMessageListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                // Only log and handle messages that have our custom types
                if (event.data && typeof event.data === 'object' && event.data.type) {
                    console.log('📨 [App] Received custom message from SW:', event.data.type);
                    
                    if (event.data.type === 'CHECK_PRAYER_STATUS') {
                        this.handlePrayerStatusRequest(event.data);
                    }
                }
                // Let OneSignal handle its own internal messages silently
            });
        }
    }

    // Handle prayer status request from service worker
    async handlePrayerStatusRequest(data) {
        const { prayerName, prayerDate, checkId } = data;
        console.log(`🔍 [App] Checking prayer status for ${prayerName} on ${prayerDate}`);
        
        try {
            // Check if prayer is completed
            const isCompleted = await this.isPrayerCompleted(prayerName, prayerDate);
            
            // Send response back to service worker
            const response = {
                type: 'PRAYER_STATUS_RESPONSE',
                prayerName,
                prayerDate,
                checkId,
                isCompleted
            };
            
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage(response);
                console.log('📤 [App] Sent prayer status response to SW:', response);
            }
            
            // If prayer is not completed, also trigger OneSignal missed prayer alert
            if (!isCompleted) {
                console.log(`⚠️ [App] Prayer ${prayerName} is not completed, triggering OneSignal alert`);
                
                // Trigger OneSignal missed prayer alert with better error handling
                try {
                    if (window.OneSignalConfig && typeof window.OneSignalConfig.sendMissedPrayerAlert === 'function') {
                        const message = this.getMissedPrayerAlertMessage(prayerName);
                        const oneSignalSuccess = await window.OneSignalConfig.sendMissedPrayerAlert(prayerName, message);
                        
                        if (oneSignalSuccess) {
                            console.log(`✅ [App] OneSignal missed prayer alert sent for ${prayerName}`);
                        } else {
                            console.log(`⚠️ [App] OneSignal missed prayer alert failed for ${prayerName} - local notification will still work`);
                        }
                    } else {
                        console.warn('⚠️ [App] OneSignal config not available for missed prayer alert - using local notifications only');
                    }
                } catch (error) {
                    console.error('❌ [App] Error sending OneSignal missed prayer alert:', error);
                    console.log('🔄 [App] Continuing with local notifications only');
                }
            }
            
        } catch (error) {
            console.error('❌ [App] Error handling prayer status request:', error);
        }
    }

    // Check if a prayer is completed for a specific date
    async isPrayerCompleted(prayerName, prayerDate) {
        try {
            // Get prayer tracker data from localStorage
            const prayerTrackerDataJSON = localStorage.getItem('prayerTrackerData');
            let prayerTrackerData = {};
            
            if (prayerTrackerDataJSON) {
                prayerTrackerData = JSON.parse(prayerTrackerDataJSON);
            }
            
            // Check if prayer is completed for the given date
            const dateKey = prayerDate; // Format: YYYY-MM-DD
            const prayerStatus = prayerTrackerData[dateKey] && prayerTrackerData[dateKey][prayerName];
            
            // Prayer is completed if status is 'completed' or 'qaza' (made up)
            const isCompleted = prayerStatus === 'completed' || prayerStatus === 'qaza';
            
            console.log(`🔍 [App] Prayer ${prayerName} on ${prayerDate} status: ${prayerStatus}, completed: ${isCompleted}`);
            return Boolean(isCompleted);
            
        } catch (error) {
            console.error('❌ [App] Error checking prayer completion:', error);
            return false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is loaded before initializing the app, but don't wait forever
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds max wait (30 * 100ms)
    
    const checkFirebaseAndInit = () => {
        if (window.firebaseAuth && window.firebaseDb) {
            console.log('Firebase loaded successfully');
            window.prayerTimesApp = new PrayerTimesApp();
            window.app = window.prayerTimesApp; // Alias for consistency
            
            // If auth setup was pending due to Firebase not being available, retry it now
            if (window.prayerTimesApp.authSetupPending) {
                console.log('Retrying auth setup now that Firebase is available');
                window.prayerTimesApp.setupAuthListener();
                window.prayerTimesApp.authSetupPending = false;
            }
            
            document.dispatchEvent(new Event('prayerTimesAppInitialized'));
            
            // Add event listener for sync completion to refresh app data
            document.addEventListener('dataSyncComplete', () => {
                console.log('App: Data sync completed, refreshing preferences and data');
                if (window.prayerTimesApp) {
                    // Reload app preferences and settings
                    window.prayerTimesApp.loadPreferences();
                    // Force refresh of current data
                    if (typeof window.prayerTimesApp.updatePrayerTimes === 'function') {
                        window.prayerTimesApp.updatePrayerTimes();
                    }
                    console.log('App data refreshed after sync');
                }
            });
        } else {
            attempts++;
            if (attempts >= maxAttempts) {
                // Firebase failed to load, but initialize app anyway for offline users
                console.warn('Firebase failed to load - initializing app without Firebase (offline/guest mode)');
                window.prayerTimesApp = new PrayerTimesApp();
                window.app = window.prayerTimesApp; // Alias for consistency
                
                // Set up a listener for when Firebase might become available later
                const checkForLateFirebase = () => {
                    if (window.firebaseAuth && window.firebaseDb && window.prayerTimesApp.authSetupPending) {
                        console.log('Firebase became available later - setting up auth');
                        window.prayerTimesApp.setupAuthListener();
                        window.prayerTimesApp.authSetupPending = false;
                    } else if (window.prayerTimesApp.authSetupPending) {
                        // Check again in 5 seconds
                        setTimeout(checkForLateFirebase, 5000);
                    }
                };
                
                // Start checking for late Firebase availability
                setTimeout(checkForLateFirebase, 5000);
                
                document.dispatchEvent(new Event('prayerTimesAppInitialized'));
                
                // Add event listener for sync completion to refresh app data (offline init)
                document.addEventListener('dataSyncComplete', () => {
                    console.log('App: Data sync completed, refreshing preferences and data');
                    if (window.prayerTimesApp) {
                        // Reload app preferences and settings
                        window.prayerTimesApp.loadPreferences();
                        // Force refresh of current data
                        if (typeof window.prayerTimesApp.updatePrayerTimes === 'function') {
                            window.prayerTimesApp.updatePrayerTimes();
                        }
                        console.log('App data refreshed after sync');
                    }
                });
            } else {
                // Firebase not ready yet, wait a bit more
                setTimeout(checkFirebaseAndInit, 100);
            }
        }
    };
    
    checkFirebaseAndInit();
});