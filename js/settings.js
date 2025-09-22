class Settings {
    constructor() {
        // Removed direct references to select elements, will use custom dropdowns
        this.languageSelectCustom = document.getElementById('language-select-custom');
        this.languageSelected = document.getElementById('language-selected');
        this.languageOptions = document.getElementById('language-options');

        this.timeFormatSelectCustom = document.getElementById('time-format-select-custom');
        this.timeFormatSelected = document.getElementById('time-format-selected');
        this.timeFormatOptions = document.getElementById('time-format-options');

        

        this.backupButton = document.getElementById('backup-data-button');
        this.restoreButton = document.getElementById('restore-data-button');
        this.resetButton = document.getElementById('reset-all-data-button');
        this.resetConfirmModal = document.getElementById('resetConfirmModal');
        this.closeResetConfirmModal = document.getElementById('closeResetConfirmModal');
        this.cancelReset = document.getElementById('cancelReset');
        this.confirmResetLocal = document.getElementById('confirmResetLocal');
        this.confirmResetFirebase = document.getElementById('confirmResetFirebase');
        this.genericConfirmModal = document.getElementById('genericConfirmModal');
        this.genericConfirmTitle = document.getElementById('genericConfirmTitle');
        this.genericConfirmMessage = document.getElementById('genericConfirmMessage');
        this.genericConfirmButton = document.getElementById('genericConfirmButton');
        this.genericCancelButton = document.getElementById('genericCancelButton');
        this.closeGenericConfirmModal = document.getElementById('closeGenericConfirmModal');
        this.restoreOptionsModal = document.getElementById('restoreOptionsModal');
        this.closeRestoreOptionsModal = document.getElementById('closeRestoreOptionsModal');
        this.restoreLocalDataOption = document.getElementById('restoreLocalDataOption');
        this.restoreCloudDataOption = document.getElementById('restoreCloudDataOption');
        this.cancelRestoreOptions = document.getElementById('cancelRestoreOptions');
        this.accountEmailSpan = document.getElementById('account-email');
        this.changePasswordForm = document.getElementById('change-password-form');
        this.currentPasswordInput = document.getElementById('current-password');
        this.newPasswordInput = document.getElementById('new-password');
        this.confirmNewPasswordInput = document.getElementById('confirm-new-password');
        this.passwordChangeError = document.getElementById('password-change-error');
        this.passwordChangeSuccess = document.getElementById('password-change-success');
        this.syncIndicator = document.getElementById('syncIndicator');
        this.syncText = document.getElementById('syncText');

        this.translatableElements = {
            'settings-page-title': 'Settings',
            'islamic-tools-title': 'Islamic Tools',
            'menu-prayer-times': 'Prayer Times',
            'menu-prayer-tracker': 'Prayer Tracker',
            'menu-dhikr-counter': 'Dhikr Counter',
            'menu-99-names': '99 Names of Allah',
            'menu-nearby-mosques': 'Nearby Mosques',
            'menu-islamic-calendar': 'Islamic Calendar',
            'menu-qibla-direction': 'Qibla Direction',
            'menu-settings': 'Settings',
            'app-title': 'Settings',
            'general-settings-title': 'General Settings',
            'language-setting-title': 'Language',
            'language-label': 'Select Language:',
            'lang-option-en': 'English',
            'lang-option-bn': 'বাংলা (Bengali)',
            'time-format-setting-title': 'Time Format',
            'time-format-label': 'Select Time Format:',
            'time-format-12h': '12-Hour (AM/PM)',
            'time-format-24h': '24-Hour',
            'data-management-title': 'Data Management',
            'backup-restore-title': 'Backup & Restore',
            'backup-data-button-text': 'Backup All Data',
            'restore-data-button-text': 'Restore All Data',
            'reset-data-title': 'Reset Data',
            'reset-all-data-button-text': 'Reset All Local Data',
            'reset-all-data-firebase-button-text': 'Reset All Data (Firebase & Local)',
            'account-settings-title': 'Account',
            'account-info-title': 'Account Information',
            'logged-in-as-label': 'Logged in as:',
            'change-password-title': 'Change Password',
            'change-password-label-main': 'Change Password:',
            'change-password-button-text': 'Change Password',
            'delete-account-title': 'Delete Account',
            'delete-account-button-text': 'Delete My Account',
            'sync-status-title': 'Sync Status',
            'syncText': 'Checking...',
            'reset-confirm-title': 'Confirm Reset',
            'reset-confirm-message': 'Are you absolutely sure you want to reset ALL application data?',
            'reset-confirm-warning': 'This action cannot be undone and will delete all your saved settings, prayer data, and dhikr data.',
            'reset-confirm-options-text': 'Choose an option:',
            'confirm-reset-local-button-text': 'Reset Local Data Only',
            'confirm-reset-firebase-button-text': 'Reset Firebase & Local Data',
            'cancel-reset-button-text': 'Cancel'
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.setupAuthListener();
        this.setupSyncStatusMonitoring();
        if (window.sharedApp && window.sharedApp.translations) {
            this.applyLanguage();
        } else {
            document.addEventListener('sharedAppReady', () => this.applyLanguage());
        }
    }

    bindEvents() {
        // Custom Dropdown Event Listeners
        if (this.languageSelectCustom) {
            this.languageSelectCustom.addEventListener('click', (e) => this.toggleCustomDropdown(e, 'language'));
            this.languageOptions.querySelectorAll('div').forEach(option => {
                option.addEventListener('click', () => this.selectCustomOption(option, 'language'));
            });
        }

        if (this.timeFormatSelectCustom) {
            this.timeFormatSelectCustom.addEventListener('click', (e) => this.toggleCustomDropdown(e, 'timeFormat'));
            this.timeFormatOptions.querySelectorAll('div').forEach(option => {
                option.addEventListener('click', () => this.selectCustomOption(option, 'timeFormat'));
            });
        }

        // Close custom dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (this.languageSelectCustom && !this.languageSelectCustom.contains(e.target)) {
                this.languageOptions.classList.add('select-hide');
            }
            if (this.timeFormatSelectCustom && !this.timeFormatSelectCustom.contains(e.target)) {
                this.timeFormatOptions.classList.add('select-hide');
            }
        });

        if (this.backupButton) {
            this.backupButton.addEventListener('click', () => this.backupData());
        }

        if (this.restoreButton) {
            this.restoreButton.addEventListener('click', () => this.showRestoreOptionsModal());
        }

        if (this.restoreLocalDataOption) {
            this.restoreLocalDataOption.addEventListener('click', () => {
                this.hideRestoreOptionsModal(); // Hide the restore options modal
                this.showGenericConfirmModal(
                    window.sharedApp.translations[window.sharedApp.currentLang]['Confirm Local Restore'] || 'Confirm Local Restore',
                    window.sharedApp.translations[window.sharedApp.currentLang]['Are you sure you want to restore data from local backup? This will overwrite your current local data.'] || 'Are you sure you want to restore data from local backup? This will overwrite your current local data.',
                    (confirmed) => {
                        if (confirmed) {
                            this.triggerLocalFileRestore();
                        }
                    }
                );
            });
        }

        if (this.restoreCloudDataOption) {
            this.restoreCloudDataOption.addEventListener('click', () => this.restoreCloudData());
        }

        if (this.cancelRestoreOptions) {
            this.cancelRestoreOptions.addEventListener('click', () => this.hideRestoreOptionsModal());
        }

        if (this.closeRestoreOptionsModal) {
            this.closeRestoreOptionsModal.addEventListener('click', () => this.hideRestoreOptionsModal());
        }

        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => this.showResetConfirmModal());
        }

        if (this.closeResetConfirmModal) {
            this.closeResetConfirmModal.addEventListener('click', () => this.hideResetConfirmModal());
        }

        if (this.cancelReset) {
            this.cancelReset.addEventListener('click', () => this.hideResetConfirmModal());
        }

        if (this.confirmResetLocal) {
            this.confirmResetLocal.addEventListener('click', () => this.resetLocalData());
        }

        if (this.confirmResetFirebase) {
            this.confirmResetFirebase.addEventListener('click', () => this.resetFirebaseData());
        }

        if (this.changePasswordForm) {
            this.changePasswordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }

        if (this.genericConfirmButton) {
            this.genericConfirmButton.addEventListener('click', () => {
                if (this.genericConfirmCallback) {
                    this.genericConfirmCallback(true);
                }
                this.hideGenericConfirmModal();
            });
        }

        if (this.genericCancelButton) {
            this.genericCancelButton.addEventListener('click', () => {
                if (this.genericConfirmCallback) {
                    this.genericConfirmCallback(false);
                }
                this.hideGenericConfirmModal();
            });
        }

        if (this.closeGenericConfirmModal) {
            this.closeGenericConfirmModal.addEventListener('click', () => {
                if (this.genericConfirmCallback) {
                    this.genericConfirmCallback(false);
                }
                this.hideGenericConfirmModal();
            });
        }

        const settingsThemeToggle = document.getElementById('settingsThemeToggle');
        if (settingsThemeToggle) {
            settingsThemeToggle.addEventListener('click', (e) => {
                if (window.sharedApp) {
                    window.sharedApp.toggleTheme();
                }
            });
        }

        
    }

    loadSettings() {
        const savedLanguage = localStorage.getItem('language') || 'en';
        const savedTimeFormat = localStorage.getItem('timeFormat') || '12h';

        // Set initial display for custom dropdowns
        this.setCustomDropdownDisplay(this.languageSelected, this.languageOptions, savedLanguage);
        this.setCustomDropdownDisplay(this.timeFormatSelected, this.timeFormatOptions, savedTimeFormat);
    }

    setCustomDropdownDisplay(displayElement, optionsContainer, savedValue) {
        let selectedOption = optionsContainer.querySelector(`div[data-value="${savedValue}"]`);
        if (!selectedOption) {
            // Fallback to first option if saved value not found
            selectedOption = optionsContainer.querySelector('div');
            if (selectedOption) {
                savedValue = selectedOption.dataset.value;
                localStorage.setItem(displayElement.id.includes('language') ? 'language' : 'timeFormat', savedValue);
            }
        }
        if (selectedOption) {
            displayElement.textContent = selectedOption.textContent;
            optionsContainer.querySelectorAll('div').forEach(option => {
                option.classList.remove('same-as-selected');
            });
            selectedOption.classList.add('same-as-selected');
        }
    }

    toggleCustomDropdown(event, type) {
        event.stopPropagation(); // Prevent document click from closing immediately
        let optionsContainer, selectedElement;
        if (type === 'language') {
            optionsContainer = this.languageOptions;
            selectedElement = this.languageSelected;
        } else {
            optionsContainer = this.timeFormatOptions;
            selectedElement = this.timeFormatSelected;
        }

        // Close other open dropdowns
        document.querySelectorAll('.select-items').forEach(item => {
            if (item !== optionsContainer) {
                item.classList.add('select-hide');
            }
        });

        optionsContainer.classList.toggle('select-hide');
        selectedElement.classList.toggle('select-arrow-active');

        // Adjust position if it goes out of window
        const rect = optionsContainer.getBoundingClientRect();
        if (rect.bottom > window.innerHeight || rect.top < 0) {
            optionsContainer.style.top = 'auto';
            optionsContainer.style.bottom = '100%';
        } else {
            optionsContainer.style.top = '100%';
            optionsContainer.style.bottom = 'auto';
        }
    }

    selectCustomOption(optionElement, type) {
        const newValue = optionElement.dataset.value;
        let displayElement, optionsContainer;

        if (type === 'language') {
            displayElement = this.languageSelected;
            optionsContainer = this.languageOptions;
            localStorage.setItem('language', newValue);
            if (window.sharedApp) {
                window.sharedApp.toggleLanguage(); // This will also call applyLanguage
            }
        } else {
            displayElement = this.timeFormatSelected;
            optionsContainer = this.timeFormatOptions;
            localStorage.setItem('timeFormat', newValue);
            window.dispatchEvent(new CustomEvent('timeFormatChanged', { detail: newValue }));
        }

        displayElement.textContent = optionElement.textContent;
        optionsContainer.querySelectorAll('div').forEach(option => {
            option.classList.remove('same-as-selected');
        });
        optionElement.classList.add('same-as-selected');
        optionsContainer.classList.add('select-hide');
        displayElement.classList.remove('select-arrow-active');
    }

    applyLanguage() {
        const currentLang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[currentLang];

        for (const id in this.translatableElements) {
            const element = document.getElementById(id);
            if (element) {
                const key = this.translatableElements[id];
                element.textContent = translations[key] || key;
            }
        }
        if(this.currentPasswordInput) this.currentPasswordInput.placeholder = translations['Current Password'] || 'Current Password';
        if(this.newPasswordInput) this.newPasswordInput.placeholder = translations['New Password'] || 'New Password';
        if(this.confirmNewPasswordInput) this.confirmNewPasswordInput.placeholder = translations['Confirm New Password'] || 'Confirm New Password';

        // Update custom dropdown display text after language change
        const savedLanguage = localStorage.getItem('language') || 'en';
        const savedTimeFormat = localStorage.getItem('timeFormat') || '12h';
        this.setCustomDropdownDisplay(this.languageSelected, this.languageOptions, savedLanguage);
        this.setCustomDropdownDisplay(this.timeFormatSelected, this.timeFormatOptions, savedTimeFormat);
    }

    backupData() {
        const allData = {};
        const keysToBackup = [
            'language', 'theme', 'notificationMode', 'prayerMethod', 'prayerSchool',
            'userLocation', 'dhikr-session', 'dhikr-settings', 'dhikr-stats',
            'prayerTrackerData', 'obligatoryPrayers', 'missedPrayerReminders',
            'timeFormat', 'notificationSound', 'qazaCount', 'missedPrayerSortOrder',
            'lastVisitDate', 'missedPrayerOption', '99-names-favorites', 'mosque_favorites'
        ];

        keysToBackup.forEach(key => {
            const item = localStorage.getItem(key);
            if (item !== null) {
                try {
                    allData[key] = JSON.parse(item);
                } catch (e) {
                    allData[key] = item;
                }
            }
        });

        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'app_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(window.sharedApp.translations[window.sharedApp.currentLang]['Data backed up successfully!'] || 'Data backed up successfully!');
    }

    handleFileRestore(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const restoredData = JSON.parse(e.target.result);

                    Object.keys(restoredData).forEach(key => {
                        const value = restoredData[key];
                        if (value !== null) {
                            if (typeof value === 'object') {
                                localStorage.setItem(key, JSON.stringify(value));
                            } else {
                                localStorage.setItem(key, value);
                            }
                        } else {
                            localStorage.removeItem(key);
                        }
                    });

                    if (window.realtimeSync && window.firebaseAuth.currentUser) {
                        try {
                            await window.realtimeSync.forceSyncAll();
                            alert(window.sharedApp.translations[window.sharedApp.currentLang]['Data restored and synced to Firebase successfully! Page will now reload.'] || 'Data restored and synced to Firebase successfully! Page will now reload.');
                        } catch (error) {
                            console.error('Sync error after restore:', error);
                            alert(window.sharedApp.translations[window.sharedApp.currentLang]['Data restored successfully but sync failed. Please check your connection.'] || 'Data restored successfully but sync failed. Please check your connection.');
                        }
                    } else {
                        alert(window.sharedApp.translations[window.sharedApp.currentLang]['Data restored successfully! Page will now reload.'] || 'Data restored successfully! Page will now reload.');
                    }
                    
                    location.reload();
                } catch (error) {
                    alert(window.sharedApp.translations[window.sharedApp.currentLang]['Error restoring data: Invalid file format or corrupted data.'] || 'Error restoring data: Invalid file format or corrupted data.');
                    console.error('Error parsing restored data:', error);
                }
            };
            reader.readAsText(file);
        }
    }

    triggerLocalFileRestore() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none'; // Keep it hidden

        input.addEventListener('change', (event) => {
            this.handleFileRestore(event); // Use the existing handler
            document.body.removeChild(input); // Clean up the input element
        });

        document.body.appendChild(input);
        input.click();
    }

    showResetConfirmModal() {
        if (this.resetConfirmModal) {
            this.resetConfirmModal.classList.add('visible');
        }
    }

    hideResetConfirmModal() {
        if (this.resetConfirmModal) {
            this.resetConfirmModal.classList.remove('visible');
        }
    }

   hideResetConfirmModal() {
        if (this.resetConfirmModal) {
            this.resetConfirmModal.classList.remove('visible');
        }
    }

    showGenericConfirmModal(title, message, callback) {
        if (this.genericConfirmModal) {
            this.genericConfirmTitle.textContent = title;
            this.genericConfirmMessage.textContent = message;
            this.genericConfirmModal.classList.add('visible');

            // Store the callback for later use
            this.genericConfirmCallback = callback;
        }
    }

    hideGenericConfirmModal() {
        if (this.genericConfirmModal) {
            this.genericConfirmModal.classList.remove('visible');
            this.genericConfirmCallback = null; // Clear the callback
        }
    }

    showRestoreOptionsModal() {
        if (this.restoreOptionsModal) {
            this.restoreOptionsModal.classList.add('visible');
        }
    }

    hideRestoreOptionsModal() {
        if (this.restoreOptionsModal) {
            this.restoreOptionsModal.classList.remove('visible');
        }
    }

   resetLocalData() {
        this.showGenericConfirmModal(
            window.sharedApp.translations[window.sharedApp.currentLang]['Confirm Local Reset'] || 'Confirm Local Reset',
            window.sharedApp.translations[window.sharedApp.currentLang]['Are you sure you want to reset ALL local data? This action cannot be undone.'] || 'Are you sure you want to reset ALL local data? This action cannot be undone.',
            (confirmed) => {
                if (confirmed) {
                    const keysToClear = [
                        'language', 'theme', 'notificationMode', 'prayerMethod', 'prayerSchool',
                        'userLocation', 'dhikr-session', 'dhikr-settings', 'dhikr-stats',
                        'prayerTrackerData', 'obligatoryPrayers', 'missedPrayerReminders',
                        'timeFormat', 'notificationSound', 'qazaCount', 'missedPrayerSortOrder',
                        'lastVisitDate', 'missedPrayerOption',
                        'notificationsShownToday', 'lastNotificationCheckDate',
                        'multiDayPrayerCache', 'multiDayCacheDate', 'cachedLocation',
                        '99-names-favorites', 'mosque_favorites'
                    ];

                    keysToClear.forEach(key => {
                        localStorage.removeItem(key);
                    });

                    this.hideResetConfirmModal(); // Hide the first modal
                    location.reload();
                }
            }
        );
    }

     async resetFirebaseData() {
        this.showGenericConfirmModal(
            window.sharedApp.translations[window.sharedApp.currentLang]['Confirm Firebase Reset'] || 'Confirm Firebase Reset',
            window.sharedApp.translations[window.sharedApp.currentLang]['Are you sure you want to reset ALL Firebase and local data? This action cannot be undone.'] || 'Are you sure you want to reset ALL Firebase and local data? This action cannot be undone.',
            async (confirmed) => {
                if (confirmed) {
                    if (window.firebaseAuth && window.firebaseAuth.currentUser && window.dataSync) {
                        try {
                            await window.dataSync.deleteUserDataFromFirebase(window.firebaseAuth.currentUser.uid);
                            window.dataSync.clearAllLocalData();
                            this.hideResetConfirmModal(); // Hide the first modal
                            location.reload();
                        } catch (error) {
                            console.error('Error resetting Firebase data:', error);
                            alert(window.sharedApp.translations[window.sharedApp.currentLang]['Failed to reset Firebase data. Please try again.'] || 'Failed to reset Firebase data. Please try again.');
                        }
                    } else {
                         alert(window.sharedApp.translations[window.sharedApp.currentLang]['You must be logged in to reset Firebase data.'] || 'You must be logged in to reset Firebase data.');
                    }
                }
            }
        );
    }

    async restoreCloudData() {
        this.hideRestoreOptionsModal(); // Hide the restore options modal

        if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
            this.showGenericConfirmModal(
                window.sharedApp.translations[window.sharedApp.currentLang]['Login Required'] || 'Login Required',
                window.sharedApp.translations[window.sharedApp.currentLang]['You must be logged in to restore data from the cloud.'] || 'You must be logged in to restore data from the cloud.',
                () => { /* No action on confirm/cancel */ }
            );
            return;
        }

        this.showGenericConfirmModal(
            window.sharedApp.translations[window.sharedApp.currentLang]['Confirm Cloud Restore'] || 'Confirm Cloud Restore',
            window.sharedApp.translations[window.sharedApp.currentLang]['Are you sure you want to restore data from the cloud? This will overwrite your local data.'] || 'Are you sure you want to restore data from the cloud? This will overwrite your local data.',
            async (confirmed) => {
                if (confirmed) {
                    if (window.realtimeSync) {
                        try {
                            await window.realtimeSync.forceSyncAll(); // Assuming this pulls data from cloud
                            alert(window.sharedApp.translations[window.sharedApp.currentLang]['Data restored from cloud successfully! Page will now reload.'] || 'Data restored from cloud successfully! Page will now reload.');
                            location.reload();
                        } catch (error) {
                            console.error('Error restoring from cloud:', error);
                            alert(window.sharedApp.translations[window.sharedApp.currentLang]['Failed to restore data from cloud. Please check your connection.'] || 'Failed to restore data from cloud. Please check your connection.');
                        }
                    } else {
                        alert(window.sharedApp.translations[window.sharedApp.currentLang]['Cloud sync not available.'] || 'Cloud sync not available.');
                    }
                }
            }
        );
    }


    setupAuthListener() {
        // Use the global auth context for consistent auth state management
        if (window.authContext && window.authContext.onAuthStateChanged) {
            window.authContext.onAuthStateChanged((user) => {
                console.log('Settings page auth state changed:', user ? 'logged in' : 'logged out');
                
                if (user) {
                    // User is logged in
                    if (this.accountEmailSpan) {
                        this.accountEmailSpan.textContent = user.email || 'N/A';
                        this.accountEmailSpan.style.color = 'var(--success, #10b981)';
                    }
                    
                    // Show password change form
                    if (this.changePasswordForm) {
                        this.changePasswordForm.style.display = 'block';
                    }
                    
                    // Clear any previous messages
                    if (this.passwordChangeError) this.passwordChangeError.textContent = '';
                    if (this.passwordChangeSuccess) this.passwordChangeSuccess.textContent = '';
                } else {
                    // User is logged out
                    if (this.accountEmailSpan) {
                        this.accountEmailSpan.textContent = 'Not logged in';
                        this.accountEmailSpan.style.color = 'var(--text-secondary, #64748b)';
                    }
                    
                    // Hide password change form
                    if (this.changePasswordForm) {
                        this.changePasswordForm.style.display = 'none';
                    }
                }
            });
        } else {
            console.warn('Auth context not available in settings page');
            // Fallback to direct Firebase auth if authContext not available
            if (window.firebaseAuth && window.firebaseOnAuthStateChanged) {
                window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
                    if (user && this.accountEmailSpan) {
                        this.accountEmailSpan.textContent = user.email || 'N/A';
                        this.accountEmailSpan.style.color = 'var(--success, #10b981)';
                    } else if (this.accountEmailSpan) {
                        this.accountEmailSpan.textContent = 'Not logged in';
                        this.accountEmailSpan.style.color = 'var(--text-secondary, #64748b)';
                    }
                });
            }
        }
    }

    setupSyncStatusMonitoring() {
        if (!this.syncIndicator || !this.syncText) return;

        const updateSyncStatus = () => {
            if (!window.realtimeSync) {
                this.syncIndicator.style.color = '#94a3b8';
                this.syncText.textContent = window.sharedApp.translations[window.sharedApp.currentLang]['Sync not available'] || 'Sync not available';
                return;
            }

            const status = window.realtimeSync.getSyncStatus();
            
            if (!status.isLoggedIn) {
                this.syncIndicator.style.color = '#94a3b8';
                this.syncText.textContent = window.sharedApp.translations[window.sharedApp.currentLang]['Not logged in'] || 'Not logged in';
            } else if (!status.isOnline) {
                this.syncIndicator.style.color = '#f59e0b';
                this.syncText.textContent = `${status.queueLength} ${window.sharedApp.translations[window.sharedApp.currentLang]['queued']}`;
            } else if (status.syncInProgress) {
                this.syncIndicator.style.color = '#3b82f6';
                this.syncText.textContent = window.sharedApp.translations[window.sharedApp.currentLang]['Syncing...'] || 'Syncing...';
            } else if (status.queueLength > 0) {
                this.syncIndicator.style.color = '#f59e0b';
                this.syncText.textContent = `${status.queueLength} ${window.sharedApp.translations[window.sharedApp.currentLang]['items queued']}`;
            } else {
                this.syncIndicator.style.color = '#22c55e';
                this.syncText.textContent = window.sharedApp.translations[window.sharedApp.currentLang]['All data synced'] || 'All data synced';
            }
        };

        setInterval(updateSyncStatus, 2000);
        updateSyncStatus();
    }

    async handleChangePassword(e) {
        e.preventDefault();

        this.passwordChangeError.textContent = '';
        this.passwordChangeSuccess.textContent = '';

        const currentPassword = this.currentPasswordInput.value;
        const newPassword = this.newPasswordInput.value;
        const confirmNewPassword = this.confirmNewPasswordInput.value;

        if (newPassword !== confirmNewPassword) {
            this.passwordChangeError.textContent = window.sharedApp.translations[window.sharedApp.currentLang]['New passwords do not match.'] || 'New passwords do not match.';
            return;
        }

        if (newPassword.length < 6) {
            this.passwordChangeError.textContent = window.sharedApp.translations[window.sharedApp.currentLang]['New password must be at least 6 characters long.'] || 'New password must be at least 6 characters long.';
            return;
        }

        const user = window.firebaseAuth.currentUser;

        if (user) {
            try {
                const credential = window.firebaseEmailAuthProvider.credential(user.email, currentPassword);
                await window.firebaseReauthenticateWithCredential(user, credential);
                await window.firebaseUpdatePassword(user, newPassword);

                this.passwordChangeSuccess.textContent = window.sharedApp.translations[window.sharedApp.currentLang]['Password updated successfully!'] || 'Password updated successfully!';
                this.changePasswordForm.reset();
            } catch (error) {
                console.error('Error changing password:', error);
                let errorMessage = window.sharedApp.translations[window.sharedApp.currentLang]['Failed to change password. Please try again.'] || 'Failed to change password. Please try again.';
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMessage = window.sharedApp.translations[window.sharedApp.currentLang]['Incorrect current password.'] || 'Incorrect current password.';
                } else if (error.code === 'auth/requires-recent-login') {
                    errorMessage = window.sharedApp.translations[window.sharedApp.currentLang]['Please log in again to change your password.'] || 'Please log in again to change your password.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = window.sharedApp.translations[window.sharedApp.currentLang]['Password is too weak.'] || 'Password is too weak.';
                }
                this.passwordChangeError.textContent = errorMessage;
            }
        } else {
            this.passwordChangeError.textContent = window.sharedApp.translations[window.sharedApp.currentLang]['No user is logged in.'] || 'No user is logged in.';
        }
    }

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateThemeToggleButton(theme);
    }

    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark if no theme saved
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleButton(savedTheme);
    }

    updateThemeToggleButton(currentTheme) {
        if (this.themeToggleLeft && this.themeToggleRight) {
            if (currentTheme === 'light') {
                this.themeToggleLeft.classList.add('active');
                this.themeToggleRight.classList.remove('active');
            } else {
                this.themeToggleLeft.classList.remove('active');
                this.themeToggleRight.classList.add('active');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsApp = new Settings();
});