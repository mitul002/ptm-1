const db = window.firebaseDb;

// Define the keys for data stored in localStorage that we want to sync
const SYNC_KEYS = [
    'language',
    'theme',
    'notificationMode',
    'prayerMethod',
    'prayerSchool',
    'userLocation',
    'timeFormat',
    'dhikr-session', // Added dhikr-session to SYNC_KEYS
    'dhikr-settings',
    'dhikr-stats',
    'prayerTrackerData',
    'obligatoryPrayers',
    'missedPrayerReminders',
    'notificationSound',
    'qazaCount',
    'missedPrayerSortOrder',
    'lastVisitDate', // Added lastVisitDate to SYNC_KEYS
    '99-names-favorites', // Added 99-names-favorites for Firebase sync
    'mosque_favorites' // Fixed: use underscore to match localStorage key
];

// Key mapping between localStorage and Firebase
// Some keys need different formats for Firebase storage
const KEY_MAPPING = {
    // localStorage key -> Firebase key
    'mosque_favorites': 'mosque-favorites',
    '99-names-favorites': '99-names-favorites', // Already using dash format
    // Add other mappings as needed
};

// Function to get Firebase key from localStorage key
function getFirebaseKey(localKey) {
    return KEY_MAPPING[localKey] || localKey;
}

// Function to get localStorage key from Firebase key
function getLocalStorageKey(firebaseKey) {
    // Reverse lookup in KEY_MAPPING
    for (const [localKey, fbKey] of Object.entries(KEY_MAPPING)) {
        if (fbKey === firebaseKey) {
            return localKey;
        }
    }
    return firebaseKey;
}

// Define keys that are basic preferences/settings
// These will always be loaded from cloud without triggering conflicts
const PREFERENCE_KEYS = [
    'language',
    'theme',
    'notificationMode',
    'prayerMethod',
    'prayerSchool',
    'timeFormat',
    'missedPrayerReminders',
    'notificationSound',
    'missedPrayerSortOrder'
];

// Flag to prevent multiple sync operations for the same user session
let dataSyncInProgress = false;
let lastSyncedUserId = null;
let syncCompleted = false;

// Lock to prevent race conditions during login/sync
let dataSyncLock = false;
let dataReadInProgress = false;
let dataWriteInProgress = false;

// --- NEW DATA CONFLICT HANDLING LOGIC ---

/**
 * Checks if there is any syncable data in local storage.
 * @returns {boolean} True if any syncable data exists, false otherwise.
 */
function hasLocalData() {
    for (const key of SYNC_KEYS) {
        const value = localStorage.getItem(key);
        if (value !== null) {
            // If any SYNC_KEY has a non-null value, consider it as existing local data.
            return true;
        }
    }
    console.log("No local data found for SYNC_KEYS.");
    return false;
}

/**
 * Main function to handle data synchronization on login.
 * It detects conflicts and prompts the user for a resolution.
 * @param {string} userId - The UID of the current authenticated user.
 */
async function handleLoginDataSync(userId) {
    if (!userId) {
        console.warn("No user ID provided for login sync.");
        return;
    }

    // Prevent multiple sync operations for the same user session
    if (dataSyncInProgress) {
        console.log("Data sync already in progress, skipping.");
        return;
    }

    // Check if sync was already completed for this user in this session
    const sessionSyncKey = `syncCompleted_${userId}`;
    if (sessionStorage.getItem(sessionSyncKey) === 'true') {
        console.log("Data sync already completed for this user in this session.");
        return;
    }

    // Check if this is the same user as last time and sync was completed
    if (lastSyncedUserId === userId && syncCompleted) {
        console.log("Data sync already completed for this user.");
        return;
    }

    console.log("Starting data sync process for user:", userId);
    dataSyncInProgress = true;
    lastSyncedUserId = userId;

    try {
        const userDocRef = window.firebaseDoc(window.firebaseDb, "users", userId);
        const docSnap = await window.firebaseGetDoc(userDocRef);
        const cloudDataExists = docSnap.exists();
        
        // Get cloud data for processing
        let cloudData = {};
        if (cloudDataExists) {
            cloudData = docSnap.data();
        }
        
        // FIRST: Always load basic preferences from cloud if they exist
        if (cloudDataExists) {
            console.log("Loading basic preferences from cloud...");
            PREFERENCE_KEYS.forEach(key => {
                if (cloudData[key] !== undefined) {
                    const value = typeof cloudData[key] === 'object' ? JSON.stringify(cloudData[key]) : cloudData[key];
                    localStorage.setItem(key, value);
                    console.log(`Preference '${key}' loaded from cloud.`);
                }
            });
        }
        
        // NOW: Check for conflicts only on non-preference data
        const localDataExists = hasLocalData();

        console.log(`Sync check: localDataExists=${localDataExists}, cloudDataExists=${cloudDataExists}`);

        // If no local data and cloud data exists, this is likely a cleared browser scenario
        // In this case, just download the data without showing conflict modal
        if (!localDataExists && cloudDataExists) {
            console.log("Case: No local data, cloud data exists. Downloading cloud data.");
            await downloadFirebaseDataToLocal(userId);
            
            // Ensure all necessary data is properly initialized
            ensureDataIntegrity();
            
            syncCompleted = true;
            sessionStorage.setItem(sessionSyncKey, 'true');
            document.dispatchEvent(new Event('dataSyncComplete')); // Dispatch event after sync
            
            // Trigger preference reloading in the app without full page reload
            if (window.prayerTimesApp && typeof window.prayerTimesApp._actuallyLoadPreferences === 'function') {
                console.log("Triggering preference reload after sync completion...");
                window.prayerTimesApp._actuallyLoadPreferences();
            }

            // Reload the page to apply the downloaded data
            console.log("Cloud data downloaded successfully. Reloading page to apply changes.");
            location.reload();
            return;
        }

        if (localDataExists && cloudDataExists) {
            // CONFLICT: Data exists both locally and in the cloud.
            console.log("Data conflict detected. Showing resolution modal.");
            // Await user's choice and data resolution
            await showDataConflictModal(userId);
            // Sync completion is now handled within resolveDataConflict
            // No need for page reload as components will reload via events
        } else if (localDataExists && !cloudDataExists) {
            // No conflict: Only local data exists, so upload it.
            console.log("No cloud data found. Uploading local data to Firebase.");
            await uploadLocalDataToFirebase(userId);
            // Mark sync as completed
            syncCompleted = true;
            sessionStorage.setItem(sessionSyncKey, 'true');
            document.dispatchEvent(new Event('dataSyncComplete')); // Dispatch event after sync
            // Reload app state after sync
            location.reload();
        } else {
            // No data anywhere, do nothing.
            console.log("No local or cloud data found. Nothing to sync.");
            // Mark sync as completed even if no data to sync
            syncCompleted = true;
            sessionStorage.setItem(sessionSyncKey, 'true');
            document.dispatchEvent(new Event('dataSyncComplete')); // Dispatch event after sync
        }
    } catch (error) {
        console.error("Error during handleLoginDataSync:", error);
        // As a fallback on error, only download cloud data if it actually exists
        const cloudExists = await checkCloudDataExists(userId);
        if (cloudExists) {
            console.log("Error occurred but cloud data exists. Downloading as fallback.");
            await downloadFirebaseDataToLocal(userId);
            ensureDataIntegrity();
            location.reload();
        } else {
            console.log("Error occurred and no cloud data exists. Continuing without sync.");
        }
        syncCompleted = true;
        sessionStorage.setItem(sessionSyncKey, 'true');
        document.dispatchEvent(new Event('dataSyncComplete')); // Dispatch event after sync
    } finally {
        dataSyncInProgress = false;
        // RESUME real-time sync now that the main sync process is complete.
        if (window.realtimeSync) {
            window.realtimeSync.resume();
        }
    }
}

/**
 * Helper function to check if cloud data exists for a user
 */
async function checkCloudDataExists(userId) {
    try {
        const userDocRef = window.firebaseDoc(window.firebaseDb, "users", userId);
        const docSnap = await window.firebaseGetDoc(userDocRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking cloud data:", error);
        return false;
    }
}

/**
 * Shows the data conflict resolution modal and returns a Promise that resolves when a choice is made.
 * @param {string} userId - The UID of the user.
 * @returns {Promise<void>} A Promise that resolves after the chosen data operation is complete.
 */
function showDataConflictModal(userId) {
    return new Promise((resolve) => {
        const modal = document.getElementById('dataConflictModal');
        const useLocalBtn = document.getElementById('useLocalData');
        const mergeBtn = document.getElementById('mergeData');
        const useCloudBtn = document.getElementById('useCloudData'); // New line

        if (!modal || !useLocalBtn || !mergeBtn || !useCloudBtn) { // Modified line
            console.error("Data conflict modal elements not found!");
            // Fallback to default behavior (use local data) and resolve immediately
            resolveDataConflict('local', userId, resolve);
            return;
        }

        // Remove existing listeners to prevent duplicates
        useLocalBtn.replaceWith(useLocalBtn.cloneNode(true));
        mergeBtn.replaceWith(mergeBtn.cloneNode(true));
        useCloudBtn.replaceWith(useCloudBtn.cloneNode(true)); // New line

        // Add new event listeners, passing the resolve function
        document.getElementById('useLocalData').addEventListener('click', () => resolveDataConflict('local', userId, resolve));
        document.getElementById('mergeData').addEventListener('click', () => resolveDataConflict('merge', userId, resolve));
        document.getElementById('useCloudData').addEventListener('click', () => resolveDataConflict('cloud', userId, resolve)); // New line

        modal.style.display = 'flex';
    });
}

/**
 * Hides the data conflict modal.
 */
function hideDataConflictModal() {
    const modal = document.getElementById('dataConflictModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Resolves the data conflict based on user's choice.
 * @param {'local' | 'merge'} choice - The user's selected resolution.
 * @param {string} userId - The UID of the user.
 * @param {Function} resolvePromise - The resolve function from the Promise in showDataConflictModal.
 */
async function resolveDataConflict(choice, userId, resolvePromise) {
    console.log(`Resolving data conflict with choice: ${choice}`);
    hideDataConflictModal();

    try {
        switch (choice) {
            case 'local':
                await uploadLocalDataToFirebase(userId);
                
                // Mark sync as completed and dispatch event
                syncCompleted = true;
                const sessionSyncKeyLocal = `syncCompleted_${userId}`;
                sessionStorage.setItem(sessionSyncKeyLocal, 'true');
                document.dispatchEvent(new Event('dataSyncComplete'));
                
                console.log("Local data upload completed with sync event dispatch");
                break;
                
            case 'merge':
                await smartMergeData(userId);
                
                // Mark sync as completed and dispatch event
                syncCompleted = true;
                const sessionSyncKeyMerge = `syncCompleted_${userId}`;
                sessionStorage.setItem(sessionSyncKeyMerge, 'true');
                document.dispatchEvent(new Event('dataSyncComplete'));
                
                console.log("Smart merge completed with sync event dispatch");
                break;
                
            case 'cloud': // Cloud data only
                await downloadFirebaseDataToLocal(userId);
                
                // Ensure data integrity after cloud download
                ensureDataIntegrity();
                
                // Mark sync as completed and dispatch event
                syncCompleted = true;
                const sessionSyncKeyCloud = `syncCompleted_${userId}`;
                sessionStorage.setItem(sessionSyncKeyCloud, 'true');
                document.dispatchEvent(new Event('dataSyncComplete'));
                
                console.log("Cloud data download completed with sync event dispatch");
                break;
                
            default:
                console.error("Invalid conflict resolution choice.");
                await uploadLocalDataToFirebase(userId);
                
                // Mark sync as completed even for fallback
                syncCompleted = true;
                const sessionSyncKeyDefault = `syncCompleted_${userId}`;
                sessionStorage.setItem(sessionSyncKeyDefault, 'true');
                document.dispatchEvent(new Event('dataSyncComplete'));
                break;
        }
    } catch (error) {
        console.error("Error during data conflict resolution:", error);
        // Still mark as completed to avoid infinite sync loops
        syncCompleted = true;
        const sessionSyncKeyError = `syncCompleted_${userId}`;
        sessionStorage.setItem(sessionSyncKeyError, 'true');
        document.dispatchEvent(new Event('dataSyncComplete'));
    }

    // Resolve the promise after the data operation is complete
    resolvePromise();
}


// --- CORE DATA FUNCTIONS (upload, download, etc.) ---

/**
 * Uploads local data to Firebase for the current user.
 * @param {string} userId - The UID of the current authenticated user.
 */
async function uploadLocalDataToFirebase(userId) {
    if (!userId) {
        console.warn("No user ID provided for data upload.");
        return;
    }

    console.log("Attempting to upload local data to Firebase for user:", userId);
    const userData = {};
    let itemCount = 0;
    
    // First, collect all available data with proper key mapping
    SYNC_KEYS.forEach(key => {
        const item = localStorage.getItem(key);
        if (item !== null) {
            try {
                // Use Firebase-appropriate key name
                const firebaseKey = getFirebaseKey(key);
                userData[firebaseKey] = JSON.parse(item);
                console.log(`Prepared for upload: ${key} -> ${firebaseKey}`);
            } catch (e) {
                const firebaseKey = getFirebaseKey(key);
                userData[firebaseKey] = item;
                console.log(`Prepared for upload (as string): ${key} -> ${firebaseKey}`);
            }
            itemCount++;
        }
    });
    
    // Add metadata about this upload
    userData.lastSync = new Date().toISOString();
    userData.syncSource = window.location.pathname;
    userData.syncVersion = '3.0'; // Version tracking for sync algorithm
    
    console.log(`Uploading ${itemCount} data items to Firebase...`);
    
    // Log all the keys being uploaded to help with debugging
    console.log(`Uploading keys: ${Object.keys(userData).join(', ')}`);
    if (userData['99-names-favorites']) {
        console.log('99-names-favorites being uploaded:', userData['99-names-favorites']);
    }

    try {
        const userDocRef = window.firebaseDoc(window.firebaseDb, "users", userId);
        
        // First, check if there's existing data in Firebase to avoid overwriting it
        const docSnap = await window.firebaseGetDoc(userDocRef);
        
        // Use merge: true to ensure we don't overwrite existing data
        await window.firebaseSetDoc(userDocRef, userData, { merge: true });
        
        console.log("Local data uploaded to Firebase successfully.");
        return { success: true, itemCount };
    } catch (error) {
        console.error("Error uploading local data to Firebase:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Downloads user data from Firebase and applies it to local storage.
 * @param {string} userId - The UID of the current authenticated user.
 */
async function downloadFirebaseDataToLocal(userId) {
    if (!userId) {
        console.warn("No user ID provided for data download.");
        return;
    }

    console.log("Attempting to download Firebase data for user:", userId);
    try {
        const userDocRef = window.firebaseDoc(window.firebaseDb, "users", userId);
        const docSnap = await window.firebaseGetDoc(userDocRef);

        if (docSnap.exists()) {
            const firebaseData = docSnap.data();
            console.log("Firebase data downloaded:", firebaseData);
            if (firebaseData['99-names-favorites']) {
                console.log('99-names-favorites downloaded:', firebaseData['99-names-favorites']);
            }
            if (firebaseData['mosque-favorites']) {
                console.log('mosque-favorites downloaded count:', firebaseData['mosque-favorites'].length);
            }
            
            // Check if we received minimal data and log a warning
            const receivedKeys = Object.keys(firebaseData);
            console.log(`Received ${receivedKeys.length} keys from Firebase: ${receivedKeys.join(', ')}`);
            
            if (receivedKeys.length < 3) {
                console.warn("WARNING: Very limited data received from Firebase. Data may be incomplete.");
            }
            
            // Track keys that were missing in the cloud data
            const missingKeys = [];
            
            // Clear existing local data before applying cloud data
            clearLocalUserData();
            
            SYNC_KEYS.forEach(localKey => {
                // Get the corresponding Firebase key
                const firebaseKey = getFirebaseKey(localKey);
                
                if (firebaseData[firebaseKey] !== undefined) {
                    // Validate numeric values to prevent them from becoming 0
                    if (typeof firebaseData[firebaseKey] === 'number' && firebaseData[firebaseKey] === 0) {
                        // Check if 0 is a valid value for this key
                        const validZeroKeys = ['notificationMode', 'prayerSchool', 'qazaCount'];
                        if (!validZeroKeys.includes(localKey)) {
                            console.warn(`Warning: Found zero value for key ${localKey}. Using default instead.`);
                            missingKeys.push(localKey);
                            return; // Skip this key
                        }
                    }
                    
                    // Validate string values
                    if (firebaseData[firebaseKey] === 'null' || firebaseData[firebaseKey] === null) {
                        // Default values for critical settings
                        if (localKey === 'language') {
                            console.warn(`Found null value for language. Using default 'en'.`);
                            firebaseData[firebaseKey] = 'en';
                        } else if (localKey === 'theme') {
                            console.warn(`Found null value for theme. Using default 'dark'.`);
                            firebaseData[firebaseKey] = 'dark';
                        } else if (localKey === 'prayerMethod') {
                            console.warn(`Found null value for prayerMethod. Using default '3'.`);
                            firebaseData[firebaseKey] = '3';
                        }
                    }
                    
                    // Special handling for numeric preference keys
                    if (['prayerMethod', 'prayerSchool', 'timeFormat', 'notificationMode'].includes(localKey)) {
                        if (firebaseData[firebaseKey] === 0 || firebaseData[firebaseKey] === '0') {
                            // 0 is a valid value for these keys
                        } else if (!firebaseData[firebaseKey] && firebaseData[firebaseKey] !== 0) {
                            // If the value is null, undefined, or falsy (but not 0)
                            const defaults = {
                                'prayerMethod': '3',
                                'prayerSchool': '0',
                                'timeFormat': '12h',
                                'notificationMode': '0'
                            };
                            console.warn(`Found invalid value for ${localKey}. Using default ${defaults[localKey]}.`);
                            firebaseData[firebaseKey] = defaults[localKey];
                        }
                    }
                    
                    const value = typeof firebaseData[firebaseKey] === 'object' ? JSON.stringify(firebaseData[firebaseKey]) : firebaseData[firebaseKey];
                    localStorage.setItem(localKey, value);
                    console.log(`Applied cloud data: ${firebaseKey} -> ${localKey}, value type: ${typeof firebaseData[firebaseKey]}`);
                } else {
                    missingKeys.push(localKey);
                }
            });
            
            if (missingKeys.length > 0) {
                console.warn(`Missing data for keys: ${missingKeys.join(', ')}`);
                console.warn("These keys will be initialized with default values if needed.");
            }
            
            console.log("Firebase data applied to local storage.");
            
            // Save lastSync information to help with debugging
            const now = new Date().toISOString();
            localStorage.setItem('lastCloudSync', now);
            
            // Update Firebase with lastSync information
            try {
                await window.firebaseSetDoc(userDocRef, {
                    lastSync: now,
                    syncSource: window.location.pathname
                }, { merge: true });
                console.log("Updated lastSync information in Firebase");
            } catch (syncError) {
                console.error("Error updating lastSync:", syncError);
            }
            
            return { success: true, data: firebaseData };
        } else {
            console.log("No Firebase data found for user:", userId);
            return { success: true, data: {} };
        }
    } catch (error) {
        console.error("Error downloading Firebase data:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Performs a smart merge of local and cloud data.
 * @param {string} userId - The UID of the user.
 */
async function smartMergeData(userId) {
    console.log("Performing smart merge...");

    try {
        const userDocRef = window.firebaseDoc(window.firebaseDb, "users", userId);
        const docSnap = await window.firebaseGetDoc(userDocRef);
        const cloudData = docSnap.exists() ? docSnap.data() : {};

        const localData = {};
        SYNC_KEYS.forEach(key => {
            const item = localStorage.getItem(key);
            if (item !== null) {
                try {
                    localData[key] = JSON.parse(item);
                } catch (e) {
                    localData[key] = item;
                }
            }
        });

        const mergedData = {};

        // --- Merge Logic for each SYNC_KEY ---

        // Simple Settings (always prioritize cloud for preferences, fallback to local)
        // Use the PREFERENCE_KEYS list for consistency
        PREFERENCE_KEYS.forEach(key => {
            if (cloudData[key] !== undefined) {
                mergedData[key] = cloudData[key];
            } else if (localData[key] !== undefined) {
                mergedData[key] = localData[key];
            }
        });

        // userLocation (prioritize cloud, fallback to local)
        if (cloudData.userLocation !== undefined) {
            mergedData.userLocation = cloudData.userLocation;
        } else if (localData.userLocation !== undefined) {
            mergedData.userLocation = localData.userLocation;
        }

        // dhikr-settings (merge objects, cloud overwrites local for common keys, local adds new)
        mergedData['dhikr-settings'] = { ...localData['dhikr-settings'], ...cloudData['dhikr-settings'] };
        // Special handling for customDhikrTargets within dhikr-settings
        if (localData['dhikr-settings']?.customDhikrTargets || cloudData['dhikr-settings']?.customDhikrTargets) {
            mergedData['dhikr-settings'].customDhikrTargets = {
                ...(localData['dhikr-settings']?.customDhikrTargets || {}),
                ...(cloudData['dhikr-settings']?.customDhikrTargets || {})
            };
        }

        // dhikr-stats (cumulative data)
        const mergedDhikrStats = { ...localData['dhikr-stats'], ...cloudData['dhikr-stats'] };
        if (localData['dhikr-stats'] && cloudData['dhikr-stats']) {
            mergedDhikrStats.streak = Math.max(localData['dhikr-stats'].streak || 0, cloudData['dhikr-stats'].streak || 0);
            mergedDhikrStats.completedSessions = (localData['dhikr-stats'].completedSessions || 0) + (cloudData['dhikr-stats'].completedSessions || 0);
            mergedDhikrStats.totalCount = (localData['dhikr-stats'].totalCount || 0) + (cloudData['dhikr-stats'].totalCount || 0);

            // Merge dailyHistory (sum counts for common dates)
            mergedDhikrStats.dailyHistory = { ...(localData['dhikr-stats'].dailyHistory || {}), ...(cloudData['dhikr-stats'].dailyHistory || {}) };
            for (const date in localData['dhikr-stats'].dailyHistory) {
                if (cloudData['dhikr-stats'].dailyHistory?.[date]) {
                    mergedDhikrStats.dailyHistory[date] = (localData['dhikr-stats'].dailyHistory[date] || 0) + (cloudData['dhikr-stats'].dailyHistory[date] || 0);
                }
            }

            // Merge dailyCounts (date -> dhikrKey -> count)
            mergedDhikrStats.dailyCounts = { ...(localData['dhikr-stats'].dailyCounts || {}), ...(cloudData['dhikr-stats'].dailyCounts || {}) };
            for (const date in localData['dhikr-stats'].dailyCounts || {}) {
                if (cloudData['dhikr-stats'].dailyCounts?.[date]) {
                    // Both have data for this date, merge individual dhikr counts
                    mergedDhikrStats.dailyCounts[date] = { ...cloudData['dhikr-stats'].dailyCounts[date] };
                    for (const dhikrKey in localData['dhikr-stats'].dailyCounts[date]) {
                        const localCount = localData['dhikr-stats'].dailyCounts[date][dhikrKey] || 0;
                        const cloudCount = mergedDhikrStats.dailyCounts[date][dhikrKey] || 0;
                        mergedDhikrStats.dailyCounts[date][dhikrKey] = localCount + cloudCount;
                    }
                } else {
                    // Only local has data for this date
                    mergedDhikrStats.dailyCounts[date] = { ...localData['dhikr-stats'].dailyCounts[date] };
                }
            }
            // Handle dates that only exist in cloud data (already copied by spread operator)
        }
        mergedData['dhikr-stats'] = mergedDhikrStats;

        // dhikr-session - Enhanced smart merge with additive counting
        const localSession = localData['dhikr-session'];
        const cloudSession = cloudData['dhikr-session'];

        if (localSession && cloudSession) {
            // If both sessions exist, we need to decide how to merge them
            
            // Case 1: Same dhikr type - add counts together and use newer timestamp/settings
            if (localSession.dhikrKey === cloudSession.dhikrKey) {
                const mergedCount = (localSession.currentCount || 0) + (cloudSession.currentCount || 0);
                const newerSession = (localSession.timestamp || 0) >= (cloudSession.timestamp || 0) ? localSession : cloudSession;
                
                mergedData['dhikr-session'] = {
                    ...newerSession,
                    currentCount: mergedCount,
                    timestamp: Math.max(localSession.timestamp || 0, cloudSession.timestamp || 0)
                };
                
                console.log(`Smart merge: Combined ${localSession.dhikrKey} counts: ${localSession.currentCount} + ${cloudSession.currentCount} = ${mergedCount}`);
            } 
            // Case 2: Different dhikr types - keep the one with newer timestamp
            else {
                if ((localSession.timestamp || 0) >= (cloudSession.timestamp || 0)) {
                    mergedData['dhikr-session'] = localSession;
                    console.log(`Smart merge: Kept local session (${localSession.dhikrKey}) - newer timestamp`);
                } else {
                    mergedData['dhikr-session'] = cloudSession;
                    console.log(`Smart merge: Kept cloud session (${cloudSession.dhikrKey}) - newer timestamp`);
                }
            }
        } else if (localSession) {
            // Only local session exists
            mergedData['dhikr-session'] = localSession;
            console.log(`Smart merge: Used local session (${localSession.dhikrKey}) - only available`);
        } else if (cloudSession) {
            // Only cloud session exists
            mergedData['dhikr-session'] = cloudSession;
            console.log(`Smart merge: Used cloud session (${cloudSession.dhikrKey}) - only available`);
        }

        // prayerTrackerData (merge objects, prioritize completed > qaza > missed)
        const mergedPrayerTrackerData = { ...(localData.prayerTrackerData || {}), ...(cloudData.prayerTrackerData || {}) };
        const statusPriority = { 'completed': 3, 'qaza': 2, 'missed': 1, 'pending': 0 };

        for (const date in localData.prayerTrackerData) {
            if (cloudData.prayerTrackerData?.[date]) {
                for (const prayer in localData.prayerTrackerData[date]) {
                    const localStatus = localData.prayerTrackerData[date][prayer];
                    const cloudStatus = cloudData.prayerTrackerData[date][prayer];

                    if (localStatus && cloudStatus) {
                        if (statusPriority[localStatus] > statusPriority[cloudStatus]) {
                            mergedPrayerTrackerData[date][prayer] = localStatus;
                        } else {
                            mergedPrayerTrackerData[date][prayer] = cloudStatus;
                        }
                    } else if (localStatus) {
                        mergedPrayerTrackerData[date][prayer] = localStatus;
                    } else if (cloudStatus) {
                        mergedPrayerTrackerData[date][prayer] = cloudStatus;
                    }
                }
            }
        }
        mergedData.prayerTrackerData = mergedPrayerTrackerData;

        // obligatoryPrayers (union of arrays)
        const localObligatory = new Set(localData.obligatoryPrayers || []);
        const cloudObligatory = new Set(cloudData.obligatoryPrayers || []);
        mergedData.obligatoryPrayers = Array.from(new Set([...localObligatory, ...cloudObligatory]));

        // qazaCount (sum values)
        mergedData.qazaCount = (localData.qazaCount || 0) + (cloudData.qazaCount || 0);

        // lastVisitDate (take the latest date)
        if (localData.lastVisitDate && cloudData.lastVisitDate) {
            mergedData.lastVisitDate = new Date(localData.lastVisitDate) > new Date(cloudData.lastVisitDate) ? localData.lastVisitDate : cloudData.lastVisitDate;
        } else if (localData.lastVisitDate) {
            mergedData.lastVisitDate = localData.lastVisitDate;
        } else if (cloudData.lastVisitDate) {
            mergedData.lastVisitDate = cloudData.lastVisitDate;
        }

        // 99-names-favorites (union of arrays)
        const localNamesFavorites = new Set(localData['99-names-favorites'] || []);
        const cloudNamesFavorites = new Set(cloudData['99-names-favorites'] || []);
        
        console.log('Smart Merge - Local 99-names-favorites:', Array.from(localNamesFavorites));
        console.log('Smart Merge - Cloud 99-names-favorites:', Array.from(cloudNamesFavorites));

        mergedData['99-names-favorites'] = Array.from(new Set([...localNamesFavorites, ...cloudNamesFavorites]));
        console.log('Smart Merge - Merged 99-names-favorites:', mergedData['99-names-favorites']);
        
        // mosque_favorites (union of arrays) - handle localStorage to Firebase key mapping
        const localMosqueFavorites = localData['mosque_favorites'] || []; // localStorage uses underscore
        const cloudMosqueFavorites = cloudData['mosque-favorites'] || []; // Firebase uses dash
        
        // For mosque favorites, we need to check by place_id since they are objects
        const allMosqueFavorites = [...localMosqueFavorites];
        
        // Add cloud favorites that aren't already in local favorites
        for (const cloudFavorite of cloudMosqueFavorites) {
            if (!allMosqueFavorites.some(item => item.place_id === cloudFavorite.place_id)) {
                allMosqueFavorites.push(cloudFavorite);
            }
        }
        
        console.log('Smart Merge - Local mosque_favorites count:', localMosqueFavorites.length);
        console.log('Smart Merge - Cloud mosque-favorites count:', cloudMosqueFavorites.length);
        console.log('Smart Merge - Merged mosque favorites count:', allMosqueFavorites.length);
        
        // Store in both formats for compatibility
        mergedData['mosque_favorites'] = allMosqueFavorites; // For localStorage
        mergedData['mosque-favorites'] = allMosqueFavorites; // For Firebase

        // Upload the merged data to Firebase with proper key mapping
        const finalDataToUpload = {};
        for (const localKey of SYNC_KEYS) {
            if (mergedData[localKey] !== undefined) {
                const firebaseKey = getFirebaseKey(localKey);
                finalDataToUpload[firebaseKey] = mergedData[localKey];
                console.log(`Prepared for Firebase upload: ${localKey} -> ${firebaseKey}`);
            }
        }

        await window.firebaseSetDoc(userDocRef, finalDataToUpload, { merge: true });
        console.log("Smart merge completed and data uploaded to Firebase.");

        // Apply merged data to local storage using localStorage keys
        clearLocalUserData(); // Clear all local data first
        for (const localKey of SYNC_KEYS) {
            if (mergedData[localKey] !== undefined) {
                const value = typeof mergedData[localKey] === 'object' ? JSON.stringify(mergedData[localKey]) : mergedData[localKey];
                localStorage.setItem(localKey, value);
                console.log(`Applied to localStorage: ${localKey}`);
            }
        }

        return { success: true };

    } catch (error) {
        console.error("Error during smart merge:", error.message);
        alert("Smart Merge failed. Falling back to using cloud data.");
        await downloadFirebaseDataToLocal(userId);
        return { success: false, error: error.message };
    }
}

/**
 * Deletes all user data from Firebase. This is a destructive operation.
 * @param {string} userId - The UID of the current authenticated user.
 */
async function deleteUserDataFromFirebase(userId) {
    if (!userId) {
        console.warn("No user ID provided for data deletion.");
        return;
    }

    console.log("Attempting to delete user data from Firebase for user:", userId);
    try {
        const userDocRef = window.firebaseDoc(window.firebaseDb, "users", userId);
        await window.firebaseDeleteDoc(userDocRef);
        console.log("User data deleted from Firebase successfully.");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user data from Firebase:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Clears all synchronized user data from local storage.
 * @param {boolean} comprehensive - If true, clears additional app-specific data
 */
function clearLocalUserData(comprehensive = false) {
    console.log("Clearing synchronized data from local storage.");
    
    // Clear all SYNC_KEYS data
    SYNC_KEYS.forEach(key => {
        localStorage.removeItem(key);
    });
    
    if (comprehensive) {
        console.log("Performing comprehensive local data clear...");
        
        // Additional app-specific keys that might not be in SYNC_KEYS
        const additionalKeys = [
            'prayerTimesCache',
            'locationCache', 
            'currentLocation',
            'prayerData',
            'tomorrowPrayerData',
            'prayerDataCacheDate',
            'multiDayPrayerCache',
            'hijriDate',
            'lastLocationUpdate',
            'appVersion',
            'lastUpdate',
            'offlineQueue',
            'cachedTimezone',
            'userPreferences',
            'notifications',
            'notificationsShownToday',
            'lastNotificationCheckDate',
            'tempData',
            'cachedLocationsData'
        ];
        
        additionalKeys.forEach(key => {
            if (localStorage.getItem(key) !== null) {
                console.log(`Removing additional key: ${key}`);
                localStorage.removeItem(key);
            }
        });
        
        // Clear any keys that start with specific prefixes
        const prefixesToClear = ['prayer_', 'dhikr_', 'user_', 'cache_', 'temp_'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (prefixesToClear.some(prefix => key.startsWith(prefix))) {
                console.log(`Removing prefixed key: ${key}`);
                localStorage.removeItem(key);
            }
        });
    }
    
    console.log("Local synchronized data cleared.");
}

/**
 * Clears all local data - both localStorage and relevant sessionStorage
 */
function clearAllLocalData() {
    console.log("Clearing ALL local data...");
    
    // Clear localStorage completely
    localStorage.clear();
    
    // Clear relevant sessionStorage items (but preserve browser-specific items)
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
            key.startsWith('syncCompleted_') || 
            key.startsWith('auth') || 
            key.startsWith('firebase') ||
            key.startsWith('prayer') ||
            key.startsWith('dhikr') ||
            key.startsWith('user')
        )) {
            sessionKeysToRemove.push(key);
        }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log("All local data cleared.");
}

/**
 * Resets the data sync state to allow fresh sync on next login.
 */
function resetDataSyncState() {
    dataSyncInProgress = false;
    lastSyncedUserId = null;
    syncCompleted = false;
    // Clear all session sync flags for any user
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('syncCompleted_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log("Data sync state reset.");
}

/**
 * Ensures all necessary data is properly initialized after cloud sync
 * This prevents issues when cloud data is incomplete
 */
function ensureDataIntegrity() {
    console.log("Checking data integrity after sync...");
    
    // Define default values for essential keys
    const defaultValues = {
        'language': 'en',
                'theme': 'dark',
        'notificationMode': '0',
        'prayerMethod': '3',
        'prayerSchool': '0',
        'timeFormat': '12h',
        'qazaCount': '0',
        'missedPrayerSortOrder': 'desc'
    };
    
    // Ensure all essential data exists
    for (const [key, defaultValue] of Object.entries(defaultValues)) {
        const currentValue = localStorage.getItem(key);
        
        if (!currentValue) {
            // Missing value
            console.warn(`Missing essential data: ${key}, initializing with default: ${defaultValue}`);
            localStorage.setItem(key, defaultValue);
        } else if (currentValue === 'null' || currentValue === 'undefined') {
            // Invalid string value
            console.warn(`Invalid value '${currentValue}' for key ${key}, replacing with default: ${defaultValue}`);
            localStorage.setItem(key, defaultValue);
        } else if (['prayerMethod', 'prayerSchool', 'notificationMode', 'qazaCount'].includes(key)) {
            // Special validation for numeric keys
            if (isNaN(Number(currentValue)) && currentValue !== '0') {
                console.warn(`Non-numeric value '${currentValue}' for key ${key}, replacing with default: ${defaultValue}`);
                localStorage.setItem(key, defaultValue);
            } else if (Number(currentValue) < 0) {
                console.warn(`Negative value ${currentValue} for key ${key}, replacing with default: ${defaultValue}`);
                localStorage.setItem(key, defaultValue);
            }
        }
    }
    
    // Ensure other required objects exist with empty defaults
    const requiredObjects = {
        'dhikr-settings': '{}',
        'dhikr-stats': '{"streak":0,"completedSessions":0,"totalCount":0,"dailyHistory":{},"dailyCounts":{}}',
        'prayerTrackerData': '{}'
    };
    
    for (const [key, defaultValue] of Object.entries(requiredObjects)) {
        const currentValue = localStorage.getItem(key);
        
        if (!currentValue) {
            console.warn(`Missing required object: ${key}, initializing with default structure`);
            localStorage.setItem(key, defaultValue);
        } else {
            // Validate object structure
            try {
                const parsedValue = JSON.parse(currentValue);
                if (typeof parsedValue !== 'object' || parsedValue === null) {
                    console.warn(`Invalid object structure for ${key}, resetting to default`);
                    localStorage.setItem(key, defaultValue);
                } else if (key === 'dhikr-stats') {
                    // Validate specific dhikr-stats properties
                    if (typeof parsedValue.streak !== 'number' || parsedValue.streak < 0) {
                        console.warn(`Invalid streak value in dhikr-stats: ${parsedValue.streak}, fixing`);
                        parsedValue.streak = 0;
                    }
                    if (typeof parsedValue.totalCount !== 'number' || parsedValue.totalCount < 0) {
                        console.warn(`Invalid totalCount in dhikr-stats: ${parsedValue.totalCount}, fixing`);
                        parsedValue.totalCount = 0;
                    }
                    if (!parsedValue.dailyHistory) {
                        parsedValue.dailyHistory = {};
                    }
                    if (!parsedValue.dailyCounts) {
                        parsedValue.dailyCounts = {};
                    }
                    // Save fixed object back to localStorage
                    localStorage.setItem(key, JSON.stringify(parsedValue));
                }
            } catch (e) {
                console.warn(`Invalid JSON for ${key}, resetting to default:`, e);
                localStorage.setItem(key, defaultValue);
            }
        }
    }
    
    console.log("Data integrity check completed successfully");
}

// Export functions for use in other modules
window.dataSync = {
    handleLoginDataSync, // The new main entry point for login
    uploadLocalDataToFirebase,
    downloadFirebaseDataToLocal,
    deleteUserDataFromFirebase,
    clearLocalUserData,
    clearAllLocalData, // New comprehensive clear function
    resetDataSyncState, // Function to reset sync state
    checkCloudDataExists, // Helper function to check cloud data
    ensureDataIntegrity, // New function to ensure data integrity
    get dataSyncInProgress() { return dataSyncInProgress; } // Export sync status
};