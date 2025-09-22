// Nearby Mosques JavaScript
class NearbyMosques {
    constructor() {
        this.userLocation = null;
        this.mosques = [];
        this.filteredMosques = [];
        this.searchQuery = '';
        this.distanceFilter = 'all';
        this.categoryFilter = 'all';
        this.sortBy = 'distance';
        this.viewMode = 'nearby';
        this.currentMosque = null;
        this.map = null;
        this.markers = [];
        this.favorites = []; // Initialize as empty, will be loaded by loadFavorites()
        this.isProcessingFavorite = false;
        this.userId = null; // New property for user ID
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateLocationStatus('Getting your location...');
        this.getCurrentLocation();
        this.applyLanguage();
        this.setupAuthListener(); // New: Listen for auth state changes
    }

    setupAuthListener() {
        if (window.setupAuthObserver) {
            window.setupAuthObserver((user) => {
                this.userId = user ? user.uid : null;
                console.log("NearbyMosques: User auth state changed. User ID:", this.userId);
                // Reload favorites based on new user ID
                this.loadFavorites().then(() => {
                    // Re-display mosques/favorites to update favorite icons
                    if (this.viewMode === 'favorites') {
                        this.displayFavorites();
                    } else {
                        this.displayMosques();
                    }
                    this.updateFavoriteButtons(); // Ensure all favorite buttons are updated
                });
            });
        } else {
            console.warn("NearbyMosques: setupAuthObserver not available. Favorites sync may not work.");
        }
    }

    applyLanguage() {
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];

        document.getElementById('mosqueSearch').placeholder = translations['search-mosques-placeholder'];
        
        const distanceFilter = document.getElementById('distanceFilter');
        distanceFilter.options[0].textContent = translations['all-distances-option'];
        distanceFilter.options[1].textContent = translations['within-600m-option'];
        distanceFilter.options[2].textContent = translations['within-1km-option'];
        distanceFilter.options[3].textContent = translations['within-2km-option'];
        distanceFilter.options[4].textContent = translations['within-5km-option'];

        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.options[0].textContent = translations['all-categories-option'];
        categoryFilter.options[1].textContent = translations['mosque-option'];
        categoryFilter.options[2].textContent = translations['islamic-center-option'];

        const sortFilter = document.getElementById('sortFilter');
        sortFilter.options[0].textContent = translations['sort-by-distance-option'];
        sortFilter.options[1].textContent = translations['sort-by-name-option'];
        sortFilter.options[2].textContent = translations['sort-by-rating-option'];

        document.querySelector('#getCurrentLocation span').textContent = translations['current-location-button'];
        document.querySelector('#nearbyViewBtn span').textContent = translations['nearby-view-button'];
        document.querySelector('#favoritesViewBtn span').textContent = translations['favorites-view-button'];
        document.querySelector('#mapViewBtn span').textContent = translations['map-view-button'];
        
        this.updateLocationStatus(this.userLocation ? `${this.mosques.length} mosques found` : 'Getting your location...');
        this.displayMosques();
    }

    bindEvents() {
        // Search functionality
        document.getElementById('mosqueSearch').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterMosques();
        });

        // Filter controls
        document.getElementById('distanceFilter').addEventListener('change', (e) => {
            this.distanceFilter = e.target.value;
            this.filterMosques();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.categoryFilter = e.target.value;
            this.filterMosques();
        });

        // Sort functionality
        document.getElementById('sortFilter').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.sortAndFilterMosques();
        });

        // Location button
        document.getElementById('getCurrentLocation').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // View toggle
        document.getElementById('nearbyViewBtn').addEventListener('click', () => {
            this.setViewMode('nearby');
        });

        document.getElementById('favoritesViewBtn').addEventListener('click', () => {
            this.setViewMode('favorites');
        });

        document.getElementById('mapViewBtn').addEventListener('click', () => {
            this.setViewMode('map');
        });

        // Favorites functionality
        // Removed clearAllFavorites button from UI

        document.getElementById('browseNearbyBtn').addEventListener('click', () => {
            this.setViewMode('nearby');
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Enable location button in map
        document.getElementById('enableLocationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Attach global event listener for mosque cards and action buttons
        document.addEventListener('click', (e) => this.handleMosqueCardClick(e));
    }

    handleMosqueCardClick(e) {
        // Handle mosque card clicks for expansion
        const mosqueCard = e.target.closest('.mosque-card');
        if (mosqueCard && !e.target.closest('.action-btn')) {
            const isExpanded = mosqueCard.classList.contains('expanded');
            
            // Close all other expanded cards
            document.querySelectorAll('.mosque-card.expanded').forEach(otherCard => {
                if (otherCard !== mosqueCard) {
                    otherCard.classList.remove('expanded');
                    const expandBtn = otherCard.querySelector('.expand-btn i');
                    if (expandBtn) {
                        expandBtn.classList.remove('fa-chevron-up');
                        expandBtn.classList.add('fa-chevron-down');
                    }
                }
            });
            
            // Toggle this card
            if (isExpanded) {
                // Collapse this card
                mosqueCard.classList.remove('expanded');
                const expandBtn = mosqueCard.querySelector('.expand-btn i');
                if (expandBtn) {
                    expandBtn.classList.remove('fa-chevron-up');
                    expandBtn.classList.add('fa-chevron-down');
                }
            } else {
                // Expand this card
                mosqueCard.classList.add('expanded');
                const expandBtn = mosqueCard.querySelector('.expand-btn i');
                if (expandBtn) {
                    expandBtn.classList.remove('fa-chevron-down');
                    expandBtn.classList.add('fa-chevron-up');
                }
            }
        }
        
        // Handle action button clicks
        const targetBtn = e.target.closest('.action-btn');
        if (targetBtn) {
            e.stopPropagation(); // Prevent card expansion if action button is clicked
            const mosqueId = targetBtn.dataset.mosqueId;
            
            if (targetBtn.classList.contains('directions-btn')) {
                this.getDirections(mosqueId);
            } else if (targetBtn.classList.contains('call-btn')) {
                this.callMosque(mosqueId);
            } else if (targetBtn.classList.contains('share-btn')) {
                this.shareMosque(mosqueId);
            } else if (targetBtn.classList.contains('favorite-btn')) {
                this.toggleFavorite(mosqueId, targetBtn); // Pass the button element
            } else if (targetBtn.classList.contains('remove-favorite-btn')) {
                const cardElement = targetBtn.closest('.mosque-card');
                this.removeFromFavorites(mosqueId, cardElement); // Pass the card element
            }
        }
    }

    async getCurrentLocation() {
        this.showLoadingState();
        this.updateLocationStatus('Getting your location...');

        if (!window.sharedApp) {
            this.showError('Shared app not available');
            return;
        }

        try {
            const locationData = await window.sharedApp.getCurrentLocationWithPermissionCheck();
            
            this.userLocation = {
                lat: locationData.lat,
                lng: locationData.lng,
                accuracy: locationData.accuracy
            };
            
            let locationName = 'Current Location';
            let locationCountry = '';

            const geocoded = await this.reverseGeocodeLocation(locationData.lat, locationData.lng);
            locationName = geocoded.name;
            locationCountry = geocoded.country;



            this.userLocation = {
                lat: locationData.lat,
                lng: locationData.lng, // Keep lng for the API
                lon: locationData.lng, // Add lon for Firebase
                accuracy: locationData.accuracy,
                name: locationName,
                country: locationCountry
            };
            
            localStorage.setItem('userLocation', JSON.stringify(this.userLocation));

                            // We already have both lon and lng in userLocation - don't need separate object
                if (this.userId && window.dataSync && window.dataSync.uploadLocalDataToFirebase) {
                    console.log("NearbyMosques: Syncing user location to Firebase.");
                    // No need for temporary object - data-sync.js will handle filtering
                    await window.dataSync.uploadLocalDataToFirebase(this.userId);
                }

            this.updateLocationStatus(`Location found: ${locationName}, ${locationCountry} (±${Math.round(this.userLocation.accuracy)}m accuracy)`);
            this.searchNearbyMosques();
            
        } catch (error) {
            let errorMessage = 'Unable to get your location';
            
            switch (error.code) {
                case 1: // PERMISSION_DENIED
                    errorMessage = 'Location access denied. Please enable location services in your browser settings.';
                    break;
                case 2: // POSITION_UNAVAILABLE
                    errorMessage = 'Location information unavailable.';
                    break;
                case 3: // TIMEOUT
                    errorMessage = 'Location request timed out.';
                    break;
                default:
                    if (error.message === 'Location permission denied') {
                        errorMessage = 'Location access denied. Please enable location services in your browser settings.';
                    }
            }
            
            this.showErrorState(errorMessage);
            this.updateLocationStatus(errorMessage);

            // Fallback to default location and save/sync
            this.userLocation = {
                lat: 23.8103,
                lng: 90.4125,
                lon: 90.4125, // Add lon for Firebase
                accuracy: 0,
                name: 'Dhaka',
                country: 'Bangladesh'
            };
            
            localStorage.setItem('userLocation', JSON.stringify(this.userLocation));
            
            if (this.userId && window.dataSync && window.dataSync.uploadLocalDataToFirebase) {
                console.log("NearbyMosques: Syncing default user location to Firebase.");
                await window.dataSync.uploadLocalDataToFirebase(this.userId);
            }
        }
    }

    async searchNearbyMosques() {
        if (!this.userLocation) {
            this.showError('Location not available');
            return;
        }

        try {
            this.updateLocationStatus('Searching for nearby mosques...');
            
            // Try to get real mosques from OpenStreetMap data
            let realMosques = [];
            try {
                realMosques = await this.getRealNearbyMosques();
            } catch (error) {
                console.warn('Failed to get mosque data:', error);
                realMosques = [];
            }
            
            // Only use real mosque data - no fallback sample data
            if (realMosques.length === 0) {
                this.showErrorState('No mosques found in your area. Try expanding your search or check a different location.');
                this.updateLocationStatus('No mosques found nearby');
                return;
            }
            
            this.mosques = realMosques.map(mosque => ({
                ...mosque,
                distance: this.calculateDistance(
                    this.userLocation.lat,
                    this.userLocation.lng,
                    mosque.location.lat,
                    mosque.location.lng
                )
            }));

            // Sort by distance initially
            this.mosques.sort((a, b) => a.distance - b.distance);
            
            this.filteredMosques = [...this.mosques];
            this.sortMosques(); // Apply current sort
            this.displayMosques();
            
            this.updateLocationStatus(`${this.mosques.length} mosques found nearby`);
            
        } catch (error) {
            console.error('Error searching mosques:', error);
            this.showErrorState('Failed to search for mosques. Please try again.');
        }
    }

    async getRealNearbyMosques() {
        const { lat, lng } = this.userLocation;
        const radius = 3000; // 3km radius for better coverage, then filter precisely
        
        // Overpass API query to find mosques, islamic centers, and prayer rooms
        const query = `
            [out:json][timeout:25];
            (
              node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});
              way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});
              relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});
              node["amenity"="mosque"](around:${radius},${lat},${lng});
              way["amenity"="mosque"](around:${radius},${lat},${lng});
              relation["amenity"="mosque"](around:${radius},${lat},${lng});
            );
            out center meta;
        `;
        
        const encodedQuery = encodeURIComponent(query);
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;
        
        console.log('Fetching real mosque data from OpenStreetMap...');
        
        const response = await fetch(overpassUrl);
        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received OpenStreetMap data:', data);
        
        const mosques = data.elements.map(element => {
            // Get coordinates based on element type
            let elementLat, elementLng;
            if (element.type === 'node') {
                elementLat = element.lat;
                elementLng = element.lon;
            } else if (element.center) {
                elementLat = element.center.lat;
                elementLng = element.center.lon;
            } else {
                return null; // Skip if no coordinates available
            }
            
            const tags = element.tags || {};
            
            // Extract name (try multiple tag possibilities)
            const name = tags.name || 
                        tags['name:en'] || 
                        tags['official_name'] || 
                        tags['alt_name'] || 
                        'Local Mosque';
            
            // Extract address information
            let address = '';
            const addressParts = [
                tags['addr:housenumber'],
                tags['addr:street'],
                tags['addr:city'],
                tags['addr:state'],
                tags['addr:postcode']
            ].filter(part => part);
            
            if (addressParts.length > 0) {
                address = addressParts.join(', ');
            } else {
                // Fallback address generation
                address = `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
            
            // Determine category
            let category = 'mosque';
            if (tags.amenity === 'place_of_worship' && tags.religion === 'muslim') {
                if (name.toLowerCase().includes('center') || name.toLowerCase().includes('centre')) {
                    category = 'islamic_center';
                }
                // All other mosques (including masjid) are categorized as 'mosque'
            }
            
            return {
                id: element.id.toString(),
                name: name,
                address: address,
                location: { 
                    lat: elementLat, 
                    lng: elementLng 
                },
                category: category,
                phone: tags.phone || tags['contact:phone'] || null,
                website: tags.website || tags['contact:website'] || null,
                rating: null, // OSM doesn't have ratings
                hours: this.parseOpeningHours(tags.opening_hours),
                image: null,
                source: 'openstreetmap'
            };
        }).filter(mosque => mosque !== null);
        
        console.log(`Found ${mosques.length} real mosques from OpenStreetMap`);
        return mosques;
    }

    parseOpeningHours(openingHours) {
        if (!openingHours) return 'Hours not available';
        
        // Simple parsing of opening hours
        if (openingHours === '24/7') return 'Open 24 hours';
        if (openingHours.includes('Mo-Su')) return 'Open daily';
        if (openingHours.includes('sunrise-sunset')) return 'Open sunrise to sunset';
        
        return openingHours; // Return as-is for now
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in kilometers
        
        // Return more precise calculation for small distances
        return Math.round(distance * 1000) / 1000; // Round to 3 decimal places
    }

    filterMosques() {
        this.filteredMosques = this.mosques.filter(mosque => {
            // Search filter
            const matchesSearch = this.searchQuery === '' || 
                mosque.name.toLowerCase().includes(this.searchQuery) ||
                mosque.address.toLowerCase().includes(this.searchQuery);

            // Distance filter - strict filtering for accurate results
            let matchesDistance = this.distanceFilter === 'all';
            if (!matchesDistance) {
                const filterDistance = parseFloat(this.distanceFilter); // in km
                const mosqueDistanceKm = mosque.distance; // already in km
                
                // Use <= for "within" distance (e.g., within 600m means <= 600m)
                matchesDistance = mosqueDistanceKm <= filterDistance;
            }

            // Category filter - treat masjid and prayer_room as mosque for filtering
            let matchesCategory = this.categoryFilter === 'all';
            if (!matchesCategory) {
                if (this.categoryFilter === 'mosque') {
                    // Include mosque, masjid, and prayer_room under "mosque" category
                    matchesCategory = mosque.category === 'mosque' || 
                                    mosque.category === 'masjid' || 
                                    mosque.category === 'prayer_room';
                } else {
                    matchesCategory = mosque.category === this.categoryFilter;
                }
            }

            return matchesSearch && matchesDistance && matchesCategory;
        });

        this.sortMosques();
        this.displayMosques();
    }

    sortAndFilterMosques() {
        this.filterMosques();
    }

    sortMosques() {
        switch (this.sortBy) {
            case 'distance':
                this.filteredMosques.sort((a, b) => a.distance - b.distance);
                break;
            case 'name':
                this.filteredMosques.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'rating':
                this.filteredMosques.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            default:
                this.filteredMosques.sort((a, b) => a.distance - b.distance);
        }
    }

    displayMosques() {
        const mosquesList = document.getElementById('mosquesList');
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        
        if (!mosquesList) {
            console.error('mosquesList element not found');
            return;
        }
        
        if (this.filteredMosques.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideErrorState();
        this.hideEmptyState();
        this.hideLoadingState();

        mosquesList.innerHTML = this.filteredMosques.map(mosque => `
            <div class="mosque-card" data-id="${mosque.id}">
                <div class="mosque-icon">
                    <i class="fas fa-mosque"></i>
                    ${mosque.source === 'openstreetmap' ? '<span class="real-data-badge" title="Real location from OpenStreetMap">OSM</span>' : ''}
                </div>
                <div class="mosque-info">
                    <div class="mosque-name">${mosque.name}</div>
                    <div class="mosque-address">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${mosque.address}</span>
                    </div>
                    <div class="mosque-quick-info">
                        <div class="distance-badge">${mosque.distance < 1 ? Math.round(mosque.distance * 1000) + 'm' : mosque.distance.toFixed(1) + ' km'}</div>
                        ${mosque.rating ? `<div class="rating-badge"><i class="fas fa-star"></i> ${mosque.rating}/5</div>` : ''}
                    </div>
                    
                    <!-- Expandable Details Section -->
                    <div class="mosque-details">
                        <div class="details-grid">
                            ${mosque.phone ? `
                                <div class="detail-item">
                                    <i class="fas fa-phone"></i>
                                    <span>${translations['phone-label']}</span>
                                    <span class="detail-value">${mosque.phone}</span>
                                </div>
                            ` : ''}
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>${translations['hours-label']}</span>
                                <span class="detail-value">${mosque.hours || translations['hours-not-available']}</span>
                            </div>
                            ${mosque.website ? `
                                <div class="detail-item">
                                    <i class="fas fa-globe"></i>
                                    <span>${translations['website-label']}</span>
                                    <a href="${mosque.website}" target="_blank" class="detail-value link">${mosque.website.replace('https://', '').replace('www.', '')}</a>
                                </div>
                            ` : ''}
                            <div class="detail-item">
                                <i class="fas fa-map"></i>
                                <span>${translations['category-label']}</span>
                                <span class="detail-value">${this.getCategoryDisplayName(mosque.category)}</span>
                            </div>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="action-btn primary directions-btn" data-mosque-id="${mosque.id}">
                                <i class="fas fa-directions"></i>
                                <span>${translations['directions-button']}</span>
                            </button>
                            ${mosque.phone ? `
                                <button class="action-btn call-btn" data-mosque-id="${mosque.id}">
                                    <i class="fas fa-phone"></i>
                                    <span>${translations['call-button']}</span>
                                </button>
                            ` : ''}
                            <button class="action-btn share-btn" data-mosque-id="${mosque.id}">
                                <i class="fas fa-share"></i>
                                <span>${translations['share-button']}</span>
                            </button>
                            <button class="action-btn favorite-btn ${this.isFavorite(mosque.id) ? 'favorited' : ''}" data-mosque-id="${mosque.id}">
                                <i class="fas fa-heart"></i>
                                <span>${this.isFavorite(mosque.id) ? translations['saved-button'] : translations['save-button']}</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="expand-btn">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
        `).join('');

        // Update mosque count
        const mosqueCountElement = document.getElementById('mosqueCount');
        if (mosqueCountElement) {
            let mosquesFoundText = translations['mosques-found-status'].replace('{count}', this.filteredMosques.length);
            mosqueCountElement.textContent = mosquesFoundText;
        }
    }

    getCategoryDisplayName(category) {
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        switch (category) {
            case 'mosque':
            case 'masjid':
            case 'prayer_room':
                return translations['mosque-category-display']; // Use translated string
            case 'islamic_center':
                return translations['islamic-center-category-display']; // Use translated string
            default:
                return category; // Fallback to category name if no translation
            }
    }

    // Favorites Management
    async saveFavorites() {
        if (!this.userId) {
            console.warn("NearbyMosques: No user ID available. Saving favorites to localStorage only.");
            try {
                localStorage.setItem('mosque_favorites', JSON.stringify(this.favorites));
            } catch (error) {
                console.error('NearbyMosques: Error saving favorites to localStorage:', error);
            }
            return;
        }

        const userDocRef = window.firebaseDoc(window.firebaseDb, "users", this.userId);
        try {
            await window.firebaseSetDoc(userDocRef, { 'mosque-favorites': this.favorites }, { merge: true });
            console.log("NearbyMosques: Favorites saved to Firebase successfully.");
        } catch (error) {
            console.error("NearbyMosques: Error saving favorites to Firebase:", error);
            // Fallback to localStorage on Firebase error
            try {
                localStorage.setItem('mosque_favorites', JSON.stringify(this.favorites));
                this.showError('Error saving favorites to cloud. Saved locally.');
            } catch (e) {
                console.error('NearbyMosques: Error saving favorites to localStorage after Firebase error:', e);
            }
        }
    }

    async loadFavorites() {
        if (!this.userId) {
            console.log("NearbyMosques: No user ID available. Loading favorites from localStorage.");
            try {
                const saved = localStorage.getItem('mosque_favorites');
                this.favorites = saved ? JSON.parse(saved) : [];
            } catch (error) {
                console.error('NearbyMosques: Error loading favorites from localStorage:', error);
                this.favorites = [];
            }
            return;
        }

        // Try loading from Firebase
        try {
            const userDocRef = window.firebaseDoc(window.firebaseDb, "users", this.userId);
            const docSnap = await window.firebaseGetDoc(userDocRef);

            if (docSnap.exists() && docSnap.data()['mosque-favorites']) {
                this.favorites = docSnap.data()['mosque-favorites'];
                console.log("NearbyMosques: Favorites loaded from Firebase successfully.");
            } else {
                console.log("NearbyMosques: No favorites found in Firebase for this user. Checking localStorage for migration.");
                // If no Firebase data, try loading from localStorage (for migration or initial sync)
                try {
                    const saved = localStorage.getItem('mosque_favorites');
                    if (saved) {
                        const localStorageFavorites = JSON.parse(saved);
                        this.favorites = localStorageFavorites;
                        console.log("NearbyMosques: Favorites loaded from localStorage. Uploading to Firebase.");
                        // Upload to Firebase for future consistency
                        await this.saveFavorites(); // Await this to ensure it's saved before continuing
                    } else {
                        this.favorites = [];
                    }
                } catch (error) {
                    console.error('NearbyMosques: Error loading favorites from localStorage for migration:', error);
                    this.favorites = [];
                }
            }
        } catch (error) {
            console.error("NearbyMosques: Error loading favorites from Firebase:", error);
            // Fallback to localStorage on Firebase error
            try {
                const saved = localStorage.getItem('mosque_favorites');
                this.favorites = saved ? JSON.parse(saved) : [];
                this.showError('Error loading favorites from cloud. Using local data.');
            } catch (e) {
                console.error('NearbyMosques: Error loading favorites from localStorage after Firebase error:', e);
                this.favorites = [];
            }
        }
    }

    isFavorite(mosqueId) {
        return this.favorites.some(fav => fav.id === mosqueId);
    }

    toggleFavorite(mosqueId, buttonElement) {
        const mosque = this.filteredMosques.find(m => m.id === mosqueId) || 
                     this.favorites.find(f => f.id === mosqueId);

        if (!mosque) return;

        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];

        if (this.isFavorite(mosqueId)) {
            // Remove from favorites
            this.favorites = this.favorites.filter(fav => fav.id !== mosqueId);
            this.saveFavorites();
            this.showSuccess(translations['removed-from-favorites-success'].replace('{mosqueName}', mosque.name));

            // Update the button visually
            if (buttonElement) {
                buttonElement.classList.remove('favorited');
                buttonElement.innerHTML = `<i class="fas fa-heart"></i><span>${translations['save-button']}</span>`;
            }

            // If in favorites view, re-render to show removal
            if (this.viewMode === 'favorites') {
                this.displayFavorites();
            }
        } else {
            // Add to favorites
            const favoriteData = {
                ...mosque,
                dateAdded: new Date().toISOString(),
                addedLocation: this.userLocation ? {
                    lat: this.userLocation.lat,
                    lon: this.userLocation.lng  // Use lon instead of lng
                } : null
            };

            this.favorites.unshift(favoriteData);
            this.saveFavorites();
            this.showSuccess(translations['added-to-favorites-success'].replace('{mosqueName}', mosque.name));

            // Update the button visually
            if (buttonElement) {
                buttonElement.classList.add('favorited');
                buttonElement.innerHTML = `<i class="fas fa-heart"></i><span>${translations['saved-button']}</span>`;
            }

            // If in favorites view, re-render to show addition
            if (this.viewMode === 'favorites') {
                this.displayFavorites();
            }
        }
        // Ensure all favorite buttons across different views are updated
        this.updateFavoriteButtons();
    }

    removeFromFavorites(mosqueId, cardElement) {
        const mosque = this.favorites.find(fav => fav.id === mosqueId);
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];

        if (mosque) {
            // Remove from data
            this.favorites = this.favorites.filter(fav => fav.id !== mosqueId);
            this.saveFavorites();
            this.showSuccess(translations['removed-from-favorites-success'].replace('{mosqueName}', mosque.name));

            // Remove from DOM instantly if cardElement is provided (from favorites view)
            if (cardElement) {
                cardElement.remove();
                // If favorites list becomes empty, show empty state
                if (this.favorites.length === 0 && this.viewMode === 'favorites') {
                    this.displayFavorites(); // This will render the empty state
                }
            }

            // Update favorite buttons in the nearby view if they exist
            this.updateFavoriteButtons();
        }
    }

    clearAllFavorites() {
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        if (this.favorites.length === 0) {
            this.showError(translations['no-favorites-to-clear-error']);
            return;
        }

        const count = this.favorites.length;
        this.favorites = [];
        this.saveFavorites();
        this.showSuccess(translations['cleared-favorites-success'].replace('{count}', count).replace('{s}', count !== 1 ? 's' : ''));
        this.displayFavorites();
        this.updateFavoriteButtons();
    }

    updateFavoriteButtons() {
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const mosqueId = btn.dataset.mosqueId;
            const isFav = this.isFavorite(mosqueId);
            
            if (isFav) {
                btn.classList.add('favorited');
                btn.innerHTML = `<i class="fas fa-heart"></i><span>${translations['saved-button']}</span>`;
            } else {
                btn.classList.remove('favorited');
                btn.innerHTML = `<i class="fas fa-heart"></i><span>${translations['save-button']}</span>`;
            }
        });
    }

    displayFavorites() {
        const container = document.getElementById('favoritesList');
        if (!container) return;
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];

        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <h3>${translations['no-favorite-mosques-empty']}</h3>
                    <p>${translations['add-to-favorites-empty']}</p>
                    <button class="browse-nearby-btn" onclick="app.setViewMode('nearby')">
                        <i class="fas fa-search"></i>
                        <span>${translations['browse-nearby-button']}</span>
                    </button>
                </div>
            `;
            return;
        }

        const favoriteCards = this.favorites.map(mosque => {
            const distanceText = mosque.distance ? `${mosque.distance < 1 ? Math.round(mosque.distance * 1000) + 'm' : mosque.distance.toFixed(1) + ' km'}` : '';
            const addedDate = new Date(mosque.dateAdded).toLocaleDateString();
            
            return `
                <div class="mosque-card" data-id="${mosque.id}">
                    <div class="mosque-icon">
                        <i class="fas fa-mosque"></i>

                    </div>
                    <div class="mosque-info">
                        <div class="mosque-name">${mosque.name}</div>
                        <div class="mosque-address">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${mosque.address}</span>
                        </div>
                        <div class="mosque-quick-info">
                            ${distanceText ? `<div class="distance-badge">${distanceText}</div>` : ''}
                            <div class="favorite-date">Saved ${addedDate}</div>
                            ${mosque.rating ? `<div class="rating-badge"><i class="fas fa-star"></i> ${mosque.rating}/5</div>` : ''}
                        </div>
                        
                        <!-- Expandable Details Section -->
                        <div class="mosque-details">
                            <div class="details-grid">
                                ${mosque.phone ? `
                                    <div class="detail-item">
                                        <i class="fas fa-phone"></i>
                                        <span>Phone</span>
                                        <span class="detail-value">${mosque.phone}</span>
                                    </div>
                                ` : ''}
                                <div class="detail-item">
                                    <i class="fas fa-clock"></i>
                                    <span>Hours</span>
                                    <span class="detail-value">${mosque.hours || 'Hours not available'}</span>
                                </div>
                                ${mosque.website ? `
                                    <div class="detail-item">
                                        <i class="fas fa-globe"></i>
                                        <span>Website</span>
                                        <a href="${mosque.website}" target="_blank" class="detail-value link">${mosque.website.replace('https://', '').replace('www.', '')}</a>
                                    </div>
                                ` : ''}
                                <div class="detail-item">
                                    <i class="fas fa-map"></i>
                                    <span>Category</span>
                                    <span class="detail-value">${this.getCategoryDisplayName(mosque.category)}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>${translations['added-label']}</span>
                                    <span class="detail-value">${addedDate}</span>
                                </div>
                            </div>
                            
                            <div class="action-buttons">
                                <button class="action-btn primary directions-btn" data-mosque-id="${mosque.id}">
                                    <i class="fas fa-directions"></i>
                                    <span>${translations['directions-button']}</span>
                                </button>
                                ${mosque.phone ? `
                                    <button class="action-btn call-btn" data-mosque-id="${mosque.id}">
                                        <i class="fas fa-phone"></i>
                                        <span>${translations['call-button']}</span>
                                    </button>
                                ` : ''}
                                <button class="action-btn share-btn" data-mosque-id="${mosque.id}">
                                    <i class="fas fa-share"></i>
                                    <span>${translations['share-button']}</span>
                                </button>
                                <button class="action-btn remove-favorite-btn" data-mosque-id="${mosque.id}">
                                    <i class="fas fa-heart-broken"></i>
                                    <span>${translations['remove-button']}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="expand-btn">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = favoriteCards;
    }

    toggleMosqueDetails(mosqueId) {
        const detailsElement = document.getElementById(`details-${mosqueId}`);
        const expandBtn = document.querySelector(`[onclick="app.toggleMosqueDetails('${mosqueId}')"] i`);
        
        if (!detailsElement) return; 
        
        const isVisible = detailsElement.style.display !== 'none';
        
        if (isVisible) {
            detailsElement.style.display = 'none';
            if (expandBtn) {
                expandBtn.classList.remove('fa-chevron-up');
                expandBtn.classList.add('fa-chevron-down');
            }
        } else {
            detailsElement.style.display = 'block';
            if (expandBtn) {
                expandBtn.classList.remove('fa-chevron-down');
                expandBtn.classList.add('fa-chevron-up');
            }
        }
    }

    getDirections(mosqueId) {
        const mosque = this.filteredMosques.find(m => m.id === mosqueId) || 
                      this.favorites.find(f => f.id === mosqueId);
        if (!mosque || !this.userLocation) return;

        // Handle different location formats
        const lat = mosque.location ? mosque.location.lat : mosque.lat;
        const lng = mosque.location ? mosque.location.lng : mosque.lng;

        if (!lat || !lng) {
            const lang = window.sharedApp.currentLang;
            const translations = window.sharedApp.translations[lang];
            this.showError(translations['location-not-available-for-directions']);
            return;
        }

        // Open directions in external map app
        const url = `https://www.google.com/maps/dir/${this.userLocation.lat},${this.userLocation.lon || this.userLocation.lng}/${lat},${lng}`;
        window.open(url, '_blank');
    }

    callMosque(mosqueId) {
        const mosque = this.filteredMosques.find(m => m.id === mosqueId) || 
                      this.favorites.find(f => f.id === mosqueId);
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        
        if (!mosque || !mosque.phone) {
            this.showError(translations['phone-number-not-available']);
            return;
        }

        window.location.href = `tel:${mosque.phone}`;
    }

    shareMosque(mosqueId) {
        const mosque = this.filteredMosques.find(m => m.id === mosqueId) || 
                      this.favorites.find(f => f.id === mosqueId);
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        
        if (!mosque) return;

        const shareData = {
            title: mosque.name,
            text: `${mosque.name} - ${mosque.address}`,
            url: `https://www.google.com/maps/place/${encodeURIComponent(mosque.address)}`
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => {
                this.showSuccess(translations['mosque-details-copied']);
            });
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.querySelector(`[data-view="${mode}"]`);
        if (targetBtn) targetBtn.classList.add('active');

        // Hide all content views
        document.querySelectorAll('.content-view').forEach(view => {
            view.style.display = 'none';
            view.classList.remove('active');
        });

        // Show the selected view
        switch (mode) {
            case 'nearby':
                const nearbyView = document.getElementById('nearbyView');
                if (nearbyView) {
                    nearbyView.style.display = 'block';
                    nearbyView.classList.add('active');
                }
                this.displayMosques(); // Display filtered nearby mosques
                break;
            
            case 'favorites':
                const favoritesView = document.getElementById('favoritesView');
                if (favoritesView) {
                    favoritesView.style.display = 'block';
                    favoritesView.classList.add('active');
                }
                this.displayFavorites(); // Display saved favorites
                break;
            
            case 'map':
                const mapView = document.getElementById('mapView');
                if (mapView) {
                    mapView.style.display = 'block';
                    mapView.classList.add('active');
                }
                this.initializeMap(); // Initialize map view
                break;
        }
    }

    initializeMap() {
        const mapPlaceholder = document.getElementById('mapPlaceholder');
        if (!mapPlaceholder) return;
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];

        if (this.userLocation && this.filteredMosques.length > 0) {
            const nearestMosque = this.filteredMosques[0];
            mapPlaceholder.innerHTML = `
                <div class="map-content-organized">
                    <!-- Compact Map Header -->
                    <div class="map-header-compact">
                        <div class="map-title-compact">
                            <i class="fas fa-map"></i>
                            <h3>${translations['interactive-map-placeholder']}</h3>
                            <span class="location-coords">${this.userLocation.lat.toFixed(3)}, ${(this.userLocation.lon || this.userLocation.lng).toFixed(3)}</span>
                        </div>
                    </div>

                    <!-- Compact Statistics -->
                    <div class="map-stats-compact">
                        <div class="stat-compact">
                            <i class="fas fa-mosque"></i>
                            <span class="stat-value">${this.filteredMosques.length}</span>
                            <span class="stat-label">Found</span>
                        </div>
                        <div class="stat-compact">
                            <i class="fas fa-crosshairs"></i>
                            <span class="stat-value">${nearestMosque.distance ? (nearestMosque.distance < 1 ? Math.round(nearestMosque.distance * 1000) + 'm' : nearestMosque.distance.toFixed(1) + 'km') : 'N/A'}</span>
                            <span class="stat-label">Nearest</span>
                        </div>
                        <div class="stat-compact">
                            <i class="fas fa-search-location"></i>
                            <span class="stat-value">${this.distanceFilter === 'all' ? 'All' : this.distanceFilter + 'km'}</span>
                            <span class="stat-label">Radius</span>
                        </div>
                    </div>

                    <!-- Nearest Mosque Compact -->
                    <div class="nearest-mosque-compact">
                        <div class="mosque-info-compact">
                            <div class="mosque-name-compact">${nearestMosque.name}</div>
                            <div class="mosque-address-compact">
                                <i class="fas fa-map-marker-alt"></i>
                                ${nearestMosque.address.length > 50 ? nearestMosque.address.substring(0, 50) + '...' : nearestMosque.address}
                            </div>
                        </div>
                        <div class="mosque-actions-compact">
                            <button class="btn-compact primary" onclick="app.getDirections('${nearestMosque.id}')">
                                <i class="fas fa-route"></i>
                                <span>Directions</span>
                            </button>
                            <button class="btn-compact secondary" onclick="app.setViewMode('nearby')">
                                <i class="fas fa-list"></i>
                                <span>View All</span>
                            </button>
                        </div>
                    </div>

                    <!-- Map Note Compact -->
                    <div class="map-note-compact">
                        <i class="fas fa-info-circle"></i>
                        <span>Interactive map available in full version</span>
                    </div>
                </div>
            `;
        } else if (!this.userLocation) {
            mapPlaceholder.innerHTML = `
                <div class="map-content-organized">
                    <div class="map-no-location-compact">
                        <div class="no-location-icon">
                            <i class="fas fa-location-slash"></i>
                        </div>
                        <div class="no-location-text">
                            <h3>${translations['location-error']}</h3>
                            <p>${translations['map-functionality-requires-location']}</p>
                        </div>
                        <button class="enable-location-btn-compact" onclick="app.getCurrentLocation()">
                            <i class="fas fa-location-arrow"></i>
                            <span>${translations['enable-location-button']}</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            mapPlaceholder.innerHTML = `
                <div class="map-content-organized">
                    <div class="map-empty-compact">
                        <div class="empty-icon">
                            <i class="fas fa-search-minus"></i>
                        </div>
                        <div class="empty-text">
                            <h3>${translations['no-mosques-found-empty']}</h3>
                            <p>${translations['expand-search-radius-empty']}</p>
                        </div>
                        <div class="empty-actions-compact">
                            <button class="btn-compact primary" onclick="app.getCurrentLocation()">
                                <i class="fas fa-refresh"></i>
                                <span>${translations['try-again-button']}</span>
                            </button>
                            <button class="btn-compact secondary" onclick="document.getElementById('distanceFilter').value = 'all'; app.filterMosques();">
                                <i class="fas fa-expand-arrows-alt"></i>
                                <span>Expand</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    updateLocationStatus(message) {
        const locationText = document.getElementById('currentLocationText');
        if (locationText) {
            const lang = window.sharedApp.currentLang;
            const translations = window.sharedApp.translations[lang];
            if (message.includes('Getting your location')) {
                locationText.textContent = translations['getting-location-status'];
            } else {
                locationText.textContent = message;
            }
        }
    }

    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'flex';
        if (errorState) errorState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }

    showErrorState(message) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const emptyState = document.getElementById('emptyState');
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        
        if (message) {
            const errorMessage = document.querySelector('#errorState p');
            if (errorMessage) errorMessage.textContent = message;
        }

        document.querySelector('#errorState h3').textContent = translations['unable-to-find-mosques-error'];
        document.querySelector('#errorState p').textContent = translations['check-location-settings-error'];
        document.querySelector('#retryBtn span').textContent = translations['try-again-button'];
    }

    showEmptyState() {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const emptyState = document.getElementById('emptyState');
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';

        document.querySelector('#emptyState h3').textContent = translations['no-mosques-found-empty'];
        document.querySelector('#emptyState p').textContent = translations['expand-search-radius-empty'];
    }

    hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
    }

    hideErrorState() {
        const errorState = document.getElementById('errorState');
        if (errorState) errorState.style.display = 'none';
    }

    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'none';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    async reverseGeocodeLocation(lat, lon) {
        try {
            // First, try direct fetch
            let response;
            try {
                response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
                    {
                        mode: 'cors',
                        headers: {
                            'User-Agent': 'Prayer-Times-App/1.0'
                        }
                    }
                );
            } catch (corsError) {
                console.warn("Direct fetch failed due to CORS, trying alternative approach:", corsError);
                
                // CORS fallback: Try using a CORS proxy for development
                try {
                    response = await fetch(
                        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`)}`
                    );
                    
                    if (response.ok) {
                        const proxyData = await response.json();
                        const data = JSON.parse(proxyData.contents);
                        console.log("Nominatim reverse geocoding response via proxy (NearbyMosques):", data);
                        return {
                            name: data.address?.city || data.address?.town || data.address?.village || data.address?.country || 'Current Location',
                            country: data.address?.country || ''
                        };
                    }
                } catch (proxyError) {
                    console.warn("CORS proxy also failed:", proxyError);
                }
                
                // If both methods fail, return default location name
                return this.getFallbackLocationName(lat, lon);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Nominatim reverse geocoding response (NearbyMosques):", data);
            return {
                name: data.address?.city || data.address?.town || data.address?.village || data.address?.country || 'Current Location',
                country: data.address?.country || ''
            };
        } catch (error) {
            console.error("Nominatim reverse geocoding failed (NearbyMosques):", error);
            return this.getFallbackLocationName(lat, lon);
        }
    }

    getFallbackLocationName(lat, lon) {
        // Provide a reasonable fallback based on coordinates
        let locationName = 'Current Location';
        let country = '';

        // Basic region detection based on coordinates
        if (lat >= 20.5 && lat <= 26.6 && lon >= 88.0 && lon <= 92.7) {
            locationName = 'Bangladesh';
            country = 'Bangladesh';
        } else if (lat >= 23.6 && lat <= 27.3 && lon >= 68.1 && lon <= 97.4) {
            locationName = 'Pakistan';
            country = 'Pakistan';
        } else if (lat >= 8.0 && lat <= 37.1 && lon >= 68.1 && lon <= 97.4) {
            locationName = 'India';
            country = 'India';
        } else if (lat >= 24.0 && lat <= 42.0 && lon >= 34.0 && lon <= 45.0) {
            locationName = 'Middle East';
            country = 'Middle East';
        } else {
            locationName = `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
        }

        console.log(`Using fallback location name: ${locationName}`);
        return { name: locationName, country };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NearbyMosques(); // Make globally accessible
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NearbyMosques;
}
