document.addEventListener('DOMContentLoaded', () => {
    const compassFace = document.getElementById('compass-face');
    const qiblaPointer = document.getElementById('qiblaPointer');
    const qiblaBearingElem = document.getElementById('qibla-bearing');
    const makkahDistanceElem = document.getElementById('makkah-distance');
    const currentHeadingElem = document.getElementById('current-heading');
    const accuracyEl = document.getElementById('accuracy');
    const calibrateButton = document.getElementById('calibrateButton');
    const statusMessage = document.getElementById('statusMessage');
    const currentLocationElem = document.getElementById('current-location');
    const locationCoordsElem = document.getElementById('location-coords');

    class QiblaCompass {
        constructor() {
            this.user = null; // Firebase user object
            this.preferencesLoaded = false; // Flag to ensure preferences are loaded once

            this.userLat = null;
            this.userLng = null;
            this.qiblaDirection = 0;
            this.currentHeading = 0;
            this.isCalibrating = false;
            this.calibrationOffset = parseFloat(localStorage.getItem('qiblaCalibrationOffset')) || 0;
            this.needsInversion = localStorage.getItem('qiblaNeedsInversion') === 'true';
            this.isCalibrated = false; // This will be true if calibration data is loaded
            this.meccaLat = 21.4225;
            this.meccaLng = 39.8262;
            this.allSearchableLocations = []; // To store locations from locations.json
            
            this.init();
        }

        async init() {
            await this.loadLocations(); // Load locations first
            this.setupAuthListener(); // New: Listen for auth state changes
            this._loadPreferences(); // New: Load preferences based on auth state
            this.createDegreeMarks();
            this.requestLocation();
            this.setupOrientationListener();
        }

        _loadPreferences() {
            // Load from localStorage first as a fallback and for initial display
            this.calibrationOffset = parseFloat(localStorage.getItem('qiblaCalibrationOffset')) || 0;
            this.needsInversion = localStorage.getItem('qiblaNeedsInversion') === 'true';
            this.isCalibrated = (localStorage.getItem('qiblaCalibrationOffset') !== null); // If offset exists, it's calibrated
            this.preferencesLoaded = true;
            console.log("Qibla preferences loaded from localStorage.", this.calibrationOffset, this.needsInversion);
        }

        setupAuthListener() {
            if (window.setupAuthObserver) {
                window.setupAuthObserver(async (user) => {
                    this.user = user;
                    if (user) {
                        console.log("QiblaCompass: User logged in.", user.uid);
                        await this.loadUserDataFromFirebase();
                    } else {
                        console.log("QiblaCompass: User logged out.");
                        // When logged out, ensure we are using local storage data
                        this._loadPreferences(); // Reload from local storage
                    }
                });
            } else {
                console.warn("QiblaCompass: setupAuthObserver not available. Authentication features may not work.");
            }
        }

        async loadUserDataFromFirebase() {
            if (!this.user || !window.firebaseDb || !window.firebaseGetDoc || !window.firebaseDoc) {
                console.warn("QiblaCompass: Firebase or user not available to load data.");
                return;
            }

            const userDocRef = window.firebaseDoc(window.firebaseDb, "users", this.user.uid);
            try {
                const docSnap = await window.firebaseGetDoc(userDocRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    console.log("QiblaCompass: User data loaded from Firebase:", userData);

                    // Apply preferences from Firebase
                    this.calibrationOffset = userData.qiblaCalibrationOffset !== undefined ? userData.qiblaCalibrationOffset : 0;
                    this.needsInversion = userData.qiblaNeedsInversion !== undefined ? userData.qiblaNeedsInversion : false;
                    this.isCalibrated = (userData.qiblaCalibrationOffset !== undefined); // If offset exists, it's calibrated

                    // Update localStorage with Firebase data
                    localStorage.setItem('qiblaCalibrationOffset', this.calibrationOffset.toString());
                    localStorage.setItem('qiblaNeedsInversion', this.needsInversion.toString());

                } else {
                    console.log("QiblaCompass: No user data found in Firebase. Syncing current local data to Firebase.");
                    await this.syncUserDataToFirebase();
                }
            } catch (error) {
                console.error("QiblaCompass: Error loading user data from Firebase:", error);
                // Fallback to local storage if Firebase load fails
                this._loadPreferences();
            }
        }

        async syncUserDataToFirebase() {
            if (!this.user || !window.firebaseDb || !window.firebaseSetDoc || !window.firebaseDoc) {
                console.warn("QiblaCompass: Firebase or user not available to sync data.");
                return;
            }

            const userDocRef = window.firebaseDoc(window.firebaseDb, "users", this.user.uid);
            const userData = {
                qiblaCalibrationOffset: this.calibrationOffset,
                qiblaNeedsInversion: this.needsInversion
            };

            try {
                await window.firebaseSetDoc(userDocRef, userData, { merge: true });
                console.log("QiblaCompass: User data synced to Firebase successfully.", userData);
            } catch (error) {
                console.error("QiblaCompass: Error syncing user data to Firebase:", error);
            }
        }

        async loadLocations() {
            try {
                const response = await fetch('json/locations.json');
                this.allSearchableLocations = await response.json();
                console.log("Locations loaded successfully in QiblaCompass.", this.allSearchableLocations.length, "entries.");
            } catch (error) {
                console.error("Failed to load locations data in QiblaCompass:", error);
                // Fallback to a very minimal default if locations can't be loaded
                this.allSearchableLocations = [{ name: "Dhaka", country: "Bangladesh", lat: 23.8103, lon: 90.4125 }];
                console.warn("Using fallback default location data in QiblaCompass due to load failure.");
            }
        }

        findClosestLocation(userLat, userLng) {
            let closestLocation = null;
            let minDistance = Infinity;

            for (const location of this.allSearchableLocations) {
                const distance = this.calculateHaversineDistance(userLat, userLng, location.lat, location.lon);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestLocation = location;
                }
            }
            return closestLocation;
        }

        calculateHaversineDistance(lat1, lon1, lat2, lon2) {
            const R = 6371; // Radius of Earth in kilometers
            const dLat = this.toRadians(lat2 - lat1);
            const dLon = this.toRadians(lon2 - lon1);
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        createDegreeMarks() {
            const degreeMarks = document.getElementById('degreeMarks');
            if (!degreeMarks) return;
            for (let i = 0; i < 360; i += 2) {
                const mark = document.createElement('div');
                mark.className = 'tick';
                if (i % 10 === 0) {
                    mark.classList.add('major');
                }
                mark.style.transform = `rotate(${i}deg) translateY(-140px)`;
                degreeMarks.appendChild(mark);
            }
        }

        async reverseGeocodeLocation(lat, lon) {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
                );
                const data = await response.json();
                console.log("Nominatim reverse geocoding response:", data);
                return {
                    name: data.address?.city || data.address?.town || data.address?.village || data.address?.country || 'Current Location',
                    country: data.address?.country || ''
                };
            } catch (error) {
                console.error("Nominatim reverse geocoding failed:", error);
                return { name: 'Current Location', country: '' };
            }
        }

        requestLocation() {
            console.log("Requesting location...");
            if (!navigator.geolocation) {
                this.showStatus('Geolocation not supported', 'error');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    console.log("Location found:", position);
                    this.userLat = position.coords.latitude;
                    this.userLng = position.coords.longitude;

                    let locationName = 'Current Location';
                    let locationCountry = '';

                    const geocoded = await this.reverseGeocodeLocation(this.userLat, this.userLng);
                    locationName = geocoded.name;
                    locationCountry = geocoded.country;

                    if (currentLocationElem) {
                        currentLocationElem.textContent = `${locationName}, ${locationCountry}`;
                    }
                    if(locationCoordsElem) locationCoordsElem.textContent = `Lat: ${this.userLat.toFixed(4)}, Lng: ${this.userLng.toFixed(4)}`;

                    // Save location to localStorage
                    const userLocation = {
                        lat: this.userLat,
                        lon: this.userLng,
                        name: locationName,
                        country: locationCountry
                    };
                    localStorage.setItem('userLocation', JSON.stringify(userLocation));

                    // Sync to Firebase if user is logged in and dataSync is available
                    if (this.user && window.dataSync && window.dataSync.uploadLocalDataToFirebase) {
                        console.log("QiblaCompass: Syncing user location to Firebase.");
                        await window.dataSync.uploadLocalDataToFirebase(this.user.uid);
                    }

                    this.calculateQiblaDirection();
                    this.showStatus('Location found. Please calibrate compass by pointing North', 'loading');
                    this.updateAccuracy(position.coords.accuracy);
                },
                async (error) => {
                    console.error("Error getting location:", error);
                    this.showStatus('Location access denied. Using default location.', 'error');
                    // Default to a central location if GPS fails
                    this.userLat = 23.8103;
                    this.userLng = 90.4125;
                    const geocoded = await this.reverseGeocodeLocation(this.userLat, this.userLng);
                    if(currentLocationElem) currentLocationElem.textContent = `${geocoded.name}, ${geocoded.country}`;
                    if(locationCoordsElem) locationCoordsElem.textContent = `Lat: ${this.userLat.toFixed(4)}, Lng: ${this.userLng.toFixed(4)}`;

                    // Save default location to localStorage
                    const userLocation = {
                        lat: this.userLat,
                        lon: this.userLng,
                        name: geocoded.name,
                        country: geocoded.country
                    };
                    localStorage.setItem('userLocation', JSON.stringify(userLocation));

                    // Sync to Firebase if user is logged in and dataSync is available
                    if (this.user && window.dataSync && window.dataSync.uploadLocalDataToFirebase) {
                        console.log("QiblaCompass: Syncing default user location to Firebase.");
                        await window.dataSync.uploadLocalDataToFirebase(this.user.uid);
                    }

                    this.calculateQiblaDirection();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        }

        calculateQiblaDirection() {
            const userLatRad = this.toRadians(this.userLat);
            const userLngRad = this.toRadians(this.userLng);
            const meccaLatRad = this.toRadians(this.meccaLat);
            const meccaLngRad = this.toRadians(this.meccaLng);

            const deltaLng = meccaLngRad - userLngRad;

            const y = Math.sin(deltaLng) * Math.cos(meccaLatRad);
            const x = Math.cos(userLatRad) * Math.sin(meccaLatRad) - 
                     Math.sin(userLatRad) * Math.cos(meccaLatRad) * Math.cos(deltaLng);

            let bearing = Math.atan2(y, x);
            bearing = this.toDegrees(bearing);
            bearing = (bearing + 360) % 360;

            this.qiblaDirection = bearing;
            qiblaBearingElem.textContent = `${bearing.toFixed(1)}°`;

            // Calculate distance
            const distance = this.calculateDistance();
            makkahDistanceElem.textContent = `${distance.toFixed(0)} km`;
        }

        calculateDistance() {
            const R = 6371; // Earth's radius in km
            const dLat = this.toRadians(this.meccaLat - this.userLat);
            const dLng = this.toRadians(this.meccaLng - this.userLng);
            
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(this.toRadians(this.userLat)) * Math.cos(this.toRadians(this.meccaLat)) *
                     Math.sin(dLng/2) * Math.sin(dLng/2);
            
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        setupOrientationListener() {
            if ('DeviceOrientationEvent' in window) {
                // Request permission for iOS 13+
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    DeviceOrientationEvent.requestPermission()
                        .then(response => {
                            if (response === 'granted') {
                                this.addOrientationListener();
                            }
                        });
                } else {
                    this.addOrientationListener();
                }
            } else {
                this.showStatus('Device orientation not supported', 'error');
            }
        }

        addOrientationListener() {
            window.addEventListener('deviceorientationabsolute', (event) => {
                this.handleOrientation(event);
            });

            window.addEventListener('deviceorientation', (event) => {
                if (!event.absolute) return;
                this.handleOrientation(event);
            });
        }

        handleOrientation(event) {
            if (this.isCalibrating) return;

            let heading = event.alpha;
            if (heading === null || heading === undefined) return;

            // Handle different browser implementations
            // iOS Safari and some Android browsers report differently
            if (event.webkitCompassHeading) {
                // iOS Safari
                heading = event.webkitCompassHeading;
            } else {
                // Standard implementation - but needs adjustment
                heading = event.alpha;
                
                // Apply calibration offset if set
                if (this.calibrationOffset !== undefined) {
                    heading = heading + this.calibrationOffset;
                }
                
                // For many Android devices, alpha needs to be inverted
                if (this.needsInversion) {
                    heading = 360 - heading;
                }
            }

            // Normalize heading
            heading = (heading + 360) % 360;

            this.currentHeading = heading;
            this.updateCompass();
        }

        updateCompass() {
            // Update compass face (rotate in positive direction)
            compassFace.style.transform = `rotate(${this.currentHeading}deg)`;

            // Counter-rotate all direction labels to keep them upright
            const directions = document.querySelectorAll('.direction');
            directions.forEach(direction => {
                const baseTransform = this.getDirectionBaseTransform(direction);
                direction.style.transform = `${baseTransform} rotate(${-this.currentHeading}deg)`;
            });

            // Update Qibla arrow - use absolute direction since compass face rotates
            const qiblaAngle = this.qiblaDirection;
            qiblaPointer.style.transform = `rotate(${qiblaAngle}deg)`;

            // Update heading display
            currentHeadingElem.textContent = `${this.currentHeading.toFixed(1)}°`;
        }

        getDirectionBaseTransform(direction) {
            if (direction.classList.contains('north')) return 'translateX(-50%)';
            if (direction.classList.contains('south')) return 'translateX(-50%)';
            if (direction.classList.contains('east')) return 'translateY(-50%)';
            if (direction.classList.contains('west')) return 'translateY(-50%)';
            return '';
        }

        updateAccuracy(accuracy) {
            const indicator = document.createElement('span');
            indicator.classList.add('accuracy-indicator');

            if (accuracy < 10) {
                accuracyEl.textContent = 'High ';
                indicator.classList.add('accuracy-high');
            } else if (accuracy < 50) {
                accuracyEl.textContent = 'Medium ';
                indicator.classList.add('accuracy-medium');
            } else {
                accuracyEl.textContent = 'Low ';
                indicator.classList.add('accuracy-low');
            }
            accuracyEl.appendChild(indicator);
        }

        showStatus(message, type) {
            statusMessage.querySelector('p').textContent = message;
            statusMessage.className = `status-message ${type}`;
            statusMessage.style.display = 'flex';
        }

        toRadians(degrees) {
            return degrees * Math.PI / 180;
        }

        toDegrees(radians) {
            return radians * 180 / Math.PI;
        }
    }

    function calibrateCompass() {
        const compass = window.qiblaCompass;
        if (!compass) return;

        compass.isCalibrating = true;
        const originalText = calibrateButton.innerHTML;
        calibrateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Point North & Hold...';
        
        // Show calibration instructions
        compass.showStatus('Point your device North and keep it steady for 3 seconds...', 'loading');
        
        let calibrationReadings = [];
        let readingCount = 0;
        const totalReadings = 30; // 3 seconds of readings at ~10Hz
        
        const calibrationInterval = setInterval(() => {
            if (compass.currentHeading !== undefined) {
                calibrationReadings.push(compass.currentHeading);
                readingCount++;
                
                // Update progress
                const progress = Math.round((readingCount / totalReadings) * 100);
                calibrateButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Calibrating... ${progress}%`;
            }
            
            if (readingCount >= totalReadings) {
                clearInterval(calibrationInterval);
                
                // Calculate average reading while pointing north
                const averageReading = calibrationReadings.reduce((a, b) => a + b, 0) / calibrationReadings.length;
                
                // Calculate offset needed to make this reading equal to 0° (North)
                compass.calibrationOffset = -averageReading;
                
                // Test if we need inversion (for Android devices)
                // If the reading is around 180° when pointing north, we need inversion
                if (Math.abs(averageReading - 180) < Math.abs(averageReading - 0)) {
                    compass.needsInversion = true;
                    compass.calibrationOffset = 180 - averageReading;
                } else {
                    compass.needsInversion = false;
                }
                
                compass.isCalibrating = false;
                calibrateButton.innerHTML = originalText;
                compass.showStatus('Compass calibrated! North should now read 0°', 'ready');
                
                // Save calibration for this session and to local storage
                compass.isCalibrated = true;
                localStorage.setItem('qiblaCalibrationOffset', compass.calibrationOffset.toString());
                localStorage.setItem('qiblaNeedsInversion', compass.needsInversion.toString());
                
                // Sync to Firebase if user is logged in
                if (compass.user) {
                    compass.syncUserDataToFirebase();
                }

                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 3000);
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (compass.isCalibrating) {
                clearInterval(calibrationInterval);
                compass.isCalibrating = false;
                calibrateButton.innerHTML = originalText;
                compass.showStatus('Calibration timeout. Try again in a clear area.', 'error');
            }
        }, 10000);
    }

    // Initialize compass when page loads
    window.qiblaCompass = new QiblaCompass();
    calibrateButton.addEventListener('click', calibrateCompass);
});