/**
 * Storage Safeguard
 * Prevents common data corruption issues when saving and retrieving data from localStorage
 */

(function() {
    console.log("Initializing Storage Safeguard...");
    
    // Save original methods
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    
    // Keys that should be treated as numeric
    const numericKeys = [
        'prayerMethod',
        'prayerSchool',
        'notificationMode',
        'qazaCount'
    ];
    
    // Define default values for critical keys
    const defaultValues = {
        'language': 'en',
        'theme': 'dark',
        'notificationMode': '0',
        'prayerMethod': '3',
        'prayerSchool': '0',
        'timeFormat': '12h',
        'qazaCount': '0'
    };
    
    // Override localStorage.setItem to add validation
    localStorage.setItem = function(key, value) {
        // Special handling for null values
        if (value === null || value === 'null' || value === undefined || value === 'undefined') {
            if (key in defaultValues) {
                console.warn(`Preventing null/undefined value for key ${key}. Using default ${defaultValues[key]}`);
                value = defaultValues[key];
            }
        }
        
        // Special handling for numeric keys
        if (numericKeys.includes(key)) {
            // For numeric keys, ensure we never store empty strings or invalid values
            if (value === '' || value === null || isNaN(Number(value))) {
                console.warn(`Preventing invalid numeric value for ${key}: ${value}. Using default ${defaultValues[key] || '0'}`);
                value = defaultValues[key] || '0';
            }
        }
        
        // Save to localStorage with the validated value
        originalSetItem.call(localStorage, key, value);
    };
    
    // Override localStorage.getItem to add validation
    localStorage.getItem = function(key) {
        const value = originalGetItem.call(localStorage, key);
        
        // For critical settings, never return null
        if ((value === null || value === 'null') && key in defaultValues) {
            // Check if we should suppress warnings during initial load/sync
            const suppressWarnings = shouldSuppressWarnings();
            
            if (!suppressWarnings) {
                console.warn(`Found null value for critical key ${key}. Using default ${defaultValues[key]}`);
            }
            
            // Fix the value in localStorage
            originalSetItem.call(localStorage, key, defaultValues[key]);
            return defaultValues[key];
        }
        
        return value;
    };
    
    // Function to determine if we should suppress warnings
    function shouldSuppressWarnings() {
        // Suppress warnings if:
        // 1. Page just loaded (within 5 seconds)
        // 2. User is logged in and data sync might be in progress
        // 3. Firebase is still loading
        
        const pageLoadTime = window.performance && window.performance.timing ? 
            window.performance.timing.loadEventEnd : Date.now();
        const timeSinceLoad = Date.now() - pageLoadTime;
        
        // Suppress for first 5 seconds after page load
        if (timeSinceLoad < 5000) {
            return true;
        }
        
        // Suppress if Firebase is still loading
        if (typeof window.firebaseAuth === 'undefined' || typeof window.firebaseDb === 'undefined') {
            return true;
        }
        
        // Suppress if user is logged in and sync might be in progress
        if (window.authContext && window.authContext.isUserAuthenticated()) {
            const syncInProgress = window.dataSync && window.dataSync.dataSyncInProgress;
            if (syncInProgress) {
                return true;
            }
        }
        
        return false;
    }
    
    console.log("Storage Safeguard initialized");
})();
