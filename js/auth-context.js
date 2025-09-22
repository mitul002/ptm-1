// Authentication Context for managing user state across the app
class AuthContext {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authStateListeners = [];
        this.isInitialized = false;

        this.init();
    }

    async init() {
        try {
            // Wait for Firebase to be available
            if (typeof window.firebaseAuth === 'undefined') {
                console.log('Waiting for Firebase Auth to load...');
                setTimeout(() => this.init(), 100);
                return;
            }

            console.log('Setting up Firebase Auth observer...');

            // Set up authentication state observer
            window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
                console.log('Auth state changed:', user ? `logged in as ${user.email}` : 'logged out');
                this.currentUser = user;
                this.isAuthenticated = !!user;
                this.isInitialized = true;

                // Notify all listeners
                this.authStateListeners.forEach(listener => {
                    try {
                        listener(user);
                    } catch (error) {
                        console.error('Error in auth state listener:', error);
                    }
                });

                // Update UI elements across all pages
                this.updateAuthUI();
            });

        } catch (error) {
            console.error('Error initializing auth context:', error);
        }
    }

    // Add listener for authentication state changes
    onAuthStateChanged(callback) {
        if (typeof callback === 'function') {
            this.authStateListeners.push(callback);

            // If already initialized, call immediately with current state
            if (this.isInitialized) {
                callback(this.currentUser);
            }
        }
    }

    // Update UI elements based on authentication state
    updateAuthUI() {
        // Update sidebar auth menu
        this.updateSidebarAuth();
        
        // Update settings page user info
        this.updateSettingsPageAuth();
        
        // Update any header auth elements
        this.updateHeaderAuth();
    }

    updateSidebarAuth() {
        const authMenuItem = document.getElementById('authMenuItem');
        const authMenuText = document.getElementById('authMenuText') || document.getElementById('authText');
        
        if (authMenuItem && authMenuText) {
            if (this.isAuthenticated && this.currentUser) {
                authMenuText.textContent = 'Logout';
                authMenuItem.href = '#';
                authMenuItem.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
                // Update icon
                const icon = authMenuItem.querySelector('i');
                if (icon) icon.className = 'fas fa-sign-out-alt';
            } else {
                authMenuText.textContent = 'Login';
                authMenuItem.href = 'login.html';
                authMenuItem.onclick = null;
                // Update icon
                const icon = authMenuItem.querySelector('i');
                if (icon) icon.className = 'fas fa-sign-in-alt';
            }
        }
    }

    updateSettingsPageAuth() {
        // Update account email display
        const accountEmail = document.getElementById('account-email');
        if (accountEmail) {
            if (this.isAuthenticated && this.currentUser) {
                accountEmail.textContent = this.currentUser.email;
                accountEmail.style.color = 'var(--success, #10b981)';
            } else {
                accountEmail.textContent = 'Not logged in';
                accountEmail.style.color = 'var(--text-secondary, #64748b)';
            }
        }

        // Update sync status
        const syncIndicator = document.getElementById('syncIndicator');
        const syncText = document.getElementById('syncText');
        if (syncIndicator && syncText) {
            if (this.isAuthenticated) {
                syncIndicator.style.color = 'var(--success, #10b981)';
                syncText.textContent = 'Synced with Cloud';
            } else {
                syncIndicator.style.color = 'var(--warning, #f59e0b)';
                syncText.textContent = 'Local Only (Guest Mode)';
            }
        }

        // Show/hide password change form
        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) {
            changePasswordForm.style.display = this.isAuthenticated ? 'block' : 'none';
        }
    }

    updateHeaderAuth() {
        // Update any header auth buttons or user info displays
        const headerUserInfo = document.querySelector('.header-user-info');
        if (headerUserInfo) {
            if (this.isAuthenticated && this.currentUser) {
                headerUserInfo.textContent = this.currentUser.email;
                headerUserInfo.style.display = 'block';
            } else {
                headerUserInfo.style.display = 'none';
            }
        }
    }

    // Logout function
    async logout() {
        try {
            console.log('Starting logout process...');
            
            // Call the existing logout function which handles data clearing
            if (window.logoutUser) {
                const result = await window.logoutUser();
                if (result.success) {
                    console.log('Logout successful');
                    // Force page reload to ensure clean state
                    window.location.href = 'index.html?logged_out=true';
                } else {
                    throw new Error(result.error);
                }
            } else {
                // Fallback if logoutUser function is not available
                await window.firebaseAuth.signOut();
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Error logging out. Please try again.');
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Get user ID
    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }

    // Get user email
    getUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }

    // Check if auth is initialized
    isAuthInitialized() {
        return this.isInitialized;
    }
}

// Create global auth context instance
document.addEventListener('DOMContentLoaded', () => {
    window.authContext = new AuthContext();
    
    // Make the auth observer function globally available for backwards compatibility
    window.setupAuthObserver = (callback) => {
        window.authContext.onAuthStateChanged(callback);
    };
});
