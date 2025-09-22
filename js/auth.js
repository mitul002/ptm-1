import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    sendEmailVerification,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

async function sendAnalyticsEventToSW(eventName, eventParameters = {}) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'ANALYTICS_EVENT',
            eventData: {
                event_name: eventName,
                parameters: eventParameters
            }
        });
        console.log('Analytics event sent to SW:', eventName, eventParameters);
    } else {
        // Fallback to direct gtag if SW is not available (e.g., not registered or not controlled)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventParameters);
            console.log('Analytics event sent directly via gtag (SW not available):', eventName, eventParameters);
        } else {
            console.warn('Analytics event could not be sent (SW and gtag not available):', eventName, eventParameters);
        }
    }
}

// Function to handle user registration
async function registerUser(email, password, sendVerification = true) {
    try {
        const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
        console.log("User registered:", userCredential.user);

        // Send email verification if requested
        if (sendVerification) {
            try {
                await sendEmailVerification(userCredential.user);
                console.log("Email verification sent to:", email);
            } catch (verificationError) {
                console.warn("Failed to send verification email:", verificationError.message);
            }
        }

        // Track signup event with Google Analytics via SW
        sendAnalyticsEventToSW('sign_up', {
            method: 'email',
            user_id: userCredential.user.uid
        });

        // Data sync will be handled by the auth observer in app.js

        return { 
            success: true, 
            user: userCredential.user,
            verificationSent: sendVerification
        };
    } catch (error) {
        console.error("Error registering user:", error.message);

        // Track signup error with Google Analytics via SW
        sendAnalyticsEventToSW('sign_up_error', {
            error_message: error.message
        });

        return { success: false, error: error.message };
    }
}

// Function to handle user login
async function loginUser(email, password, rememberMe = true) {
    try {
        // Default to LOCAL persistence to keep users logged in across tabs and sessions
        // Only use session persistence if explicitly requested (rememberMe = false)
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(window.firebaseAuth, persistence);

        const userCredential = await signInWithEmailAndPassword(window.firebaseAuth, email, password);
        console.log("User logged in:", userCredential.user);

        // Track login event with Google Analytics via SW
        sendAnalyticsEventToSW('login', {
            method: 'email',
            user_id: userCredential.user.uid
        });

        // Data sync will be handled by the auth observer in app.js

        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Error logging in user:", error.message);

        // Track login error with Google Analytics via SW
        sendAnalyticsEventToSW('login_error', {
            error_message: error.message
        });

        return { success: false, error: error.message };
    }
}

// Function to handle user logout
async function logoutUser() {
    try {
        console.log("Starting user logout process...");
        
        // First, sign out from Firebase
        await signOut(window.firebaseAuth);
        console.log("User signed out from Firebase");

        // Complete data clearing for fresh app experience
        await performCompleteDataClear();

        // Track logout event with Google Analytics via SW
        sendAnalyticsEventToSW('logout');

        // Set a flag to indicate that a logout just occurred
        // This helps detect privacy breaches where user data persists after logout
        sessionStorage.setItem('userJustLoggedOut', 'true');
        sessionStorage.setItem('logoutTimestamp', Date.now().toString());

        // Dispatch event for components to handle logout
        document.dispatchEvent(new Event('userLoggedOut'));

        console.log("All user data cleared successfully on logout for privacy.");
        return { success: true };
    } catch (error) {
        console.error("Error logging out user:", error.message);
        return { success: false, error: error.message };
    }
}

// Complete data clearing function for fresh app experience
async function performCompleteDataClear() {
    console.log("Performing complete data clear for fresh app experience...");
    
    // 1. Use dataSync comprehensive clearing if available
    if (window.dataSync) {
        console.log("Using dataSync comprehensive clearing...");
        window.dataSync.resetDataSyncState();
        window.dataSync.clearAllLocalData(); // Use the most comprehensive clear
    }
    
    // 2. Manual clearing of ALL possible app data
    console.log("Performing manual comprehensive data clearing...");
    
    // Prayer Times specific data
    const prayerKeys = [
        'prayerData', 'tomorrowPrayerData', 'prayerTimesCache', 'prayerDataCacheDate',
        'multiDayPrayerCache', 'currentLocation', 'userLocation', 'locationCache',
        'hijriDate', 'lastLocationUpdate', 'cachedTimezone', 'cachedLocationsData'
    ];
    
    // Dhikr Counter data
    const dhikrKeys = [
        'dhikr-session', 'dhikr-settings', 'dhikr-stats', 'dhikr-counter-data',
        'dhikr-presets', 'dhikr-history'
    ];
    
    // Prayer Tracker data
    const trackerKeys = [
        'prayerTrackerData', 'prayer-tracker-settings', 'prayer-tracker-stats',
        'missed-prayers', 'prayer-reminders'
    ];
    
    // 99 Names data
    const namesKeys = [
        '99-names-progress', '99-names-favorites', '99-names-settings',
        'allah-names-data', 'recitation-progress'
    ];
    
    // App settings and preferences
    const settingsKeys = [
        'userPreferences', 'app-settings', 'language-preference', 'theme-preference',
        'notification-settings', 'location-permission', 'app-permissions'
    ];
    
    // Notifications and alerts
    const notificationKeys = [
        'notifications', 'notificationsShownToday', 'lastNotificationCheckDate',
        'notification-queue', 'alert-settings', 'reminder-settings'
    ];
    
    // Cache and temporary data
    const cacheKeys = [
        'appVersion', 'lastUpdate', 'offlineQueue', 'tempData', 'cache-timestamp',
        'api-cache', 'location-api-cache', 'weather-cache'
    ];
    
    // Auth and sync data
    const authKeys = [
        'firebase-user-data', 'auth-token', 'refresh-token', 'user-profile',
        'sync-status', 'last-sync', 'pending-sync'
    ];
    
    // Combine all keys for comprehensive clearing
    const allKeysToCheck = [
        ...prayerKeys, ...dhikrKeys, ...trackerKeys, ...namesKeys,
        ...settingsKeys, ...notificationKeys, ...cacheKeys, ...authKeys
    ];
    
    // Remove specific keys
    allKeysToCheck.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
            console.log(`Cleared key: ${key}`);
        }
    });
    
    // 3. Clear keys by patterns/prefixes for any missed data
    console.log("Clearing data by patterns...");
    const prefixesToClear = [
        'prayer_', 'dhikr_', 'user_', 'cache_', 'temp_', 'sync_',
        'firebase_', 'auth_', 'location_', 'notification_', 'app_',
        'tracker_', 'names_', 'mosque_', 'qibla_', 'calendar_'
    ];
    
    const allStorageKeys = Object.keys(localStorage);
    allStorageKeys.forEach(key => {
        if (prefixesToClear.some(prefix => key.startsWith(prefix))) {
            localStorage.removeItem(key);
            console.log(`Cleared prefixed key: ${key}`);
        }
    });
    
    // 4. Clear app-specific state variables
    if (window.prayerTimesApp) {
        console.log("Resetting app state variables...");
        window.prayerTimesApp.wasLoggedIn = false;
        window.prayerTimesApp.currentUser = null;
        window.prayerTimesApp.userLocation = null;
        window.prayerTimesApp.prayerData = null;
    }
    
    // 5. Clear IndexedDB data if any (for offline storage)
    try {
        if ('indexedDB' in window) {
            // Clear any IndexedDB databases that might contain user data
            const databases = await indexedDB.databases?.() || [];
            for (const db of databases) {
                if (db.name?.includes('prayer') || db.name?.includes('user') || db.name?.includes('app')) {
                    indexedDB.deleteDatabase(db.name);
                    console.log(`Cleared IndexedDB: ${db.name}`);
                }
            }
        }
    } catch (error) {
        console.warn("Could not clear IndexedDB:", error);
    }
    
    // 6. Clear service worker cache if needed
    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
                if (cacheName.includes('user') || cacheName.includes('prayer-data')) {
                    await caches.delete(cacheName);
                    console.log(`Cleared cache: ${cacheName}`);
                }
            }
        }
    } catch (error) {
        console.warn("Could not clear service worker caches:", error);
    }
    
    // 7. Clear sessionStorage of app-specific data (keep browser essentials)
    console.log("Clearing relevant sessionStorage data...");
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
            key.includes('prayer') || key.includes('dhikr') || key.includes('user') ||
            key.includes('sync') || key.includes('auth') || key.includes('firebase') ||
            key.includes('location') || key.includes('notification') || key.includes('app')
        )) {
            sessionKeysToRemove.push(key);
        }
    }
    sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`Cleared session key: ${key}`);
    });
    
    console.log("Complete data clear finished - app ready for fresh user experience!");
}

// Function to send password reset email
async function resetPassword(email) {
    try {
        // Configure action code settings for password reset
        const actionCodeSettings = {
            // URL you want to redirect back to after the password reset
            url: window.location.origin + '/login.html?mode=passwordReset',
            handleCodeInApp: false // Set to true if you want to handle the reset in your app
        };

        // Use the globally available Firebase function with custom settings
        await window.firebaseSendPasswordResetEmail(window.firebaseAuth, email, actionCodeSettings);
        console.log("Password reset email sent to:", email);

        // Track password reset event with Google Analytics via SW
        sendAnalyticsEventToSW('password_reset_request');

        return { success: true };
    } catch (error) {
        console.error("Error sending password reset email:", error.message);

        // Track password reset error with Google Analytics via SW
        sendAnalyticsEventToSW('password_reset_error', {
            error_message: error.message
        });

        return { success: false, error: error.message };
    }
}

// Listen for authentication state changes
function setupAuthObserver(callback) {
    onAuthStateChanged(window.firebaseAuth, (user) => {
        callback(user);
    });
}

// Function to resend email verification
async function resendEmailVerification() {
    try {
        const user = window.firebaseAuth.currentUser;
        if (user && !user.emailVerified) {
            await sendEmailVerification(user);
            console.log("Email verification resent to:", user.email);
            return { success: true };
        } else {
            return { success: false, error: "No unverified user found" };
        }
    } catch (error) {
        console.error("Error resending verification email:", error.message);
        return { success: false, error: error.message };
    }
}

// Function to check password strength
function checkPasswordStrength(password) {
    const strength = {
        score: 0,
        feedback: [],
        level: 'weak'
    };

    if (password.length >= 8) {
        strength.score += 1;
    } else {
        strength.feedback.push('Use at least 8 characters');
    }

    if (/[a-z]/.test(password)) {
        strength.score += 1;
    } else {
        strength.feedback.push('Include lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
        strength.score += 1;
    } else {
        strength.feedback.push('Include uppercase letters');
    }

    if (/[0-9]/.test(password)) {
        strength.score += 1;
    } else {
        strength.feedback.push('Include numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
        strength.score += 1;
    } else {
        strength.feedback.push('Include special characters');
    }

    // Determine strength level
    if (strength.score <= 2) {
        strength.level = 'weak';
    } else if (strength.score <= 3) {
        strength.level = 'medium';
    } else if (strength.score <= 4) {
        strength.level = 'strong';
    } else {
        strength.level = 'very-strong';
    }

    return strength;
}

// Make functions globally available
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.resetPassword = resetPassword;
window.setupAuthObserver = setupAuthObserver;
window.resendEmailVerification = resendEmailVerification;
window.checkPasswordStrength = checkPasswordStrength;