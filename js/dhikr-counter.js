// Dhikr Counter JavaScript - Enhanced Version
class DhikrCounter {
    constructor() {
        this.currentCount = 0;
        this.targetCount = 33;
        this.todayTotal = 0;
        this.isPaused = false;
        this.currentDhikrIndex = 0; // Use index for cycling
        this.settings = {
            vibration: true,
            sound: true,
            customTarget: 33,
            dailyGoal: 100,
            reminderTime: '',
            enableReminders: false,
            statsPeriod: 'today',
            customDhikrTargets: {}
        };
        this.stats = {
            streak: 0,
            completedSessions: 0,
            totalCount: 0,
            dailyHistory: {},
            dailyCounts: {}
        };
        
        this.dhikrData = []; 
        this.loadDhikrData().then(() => {
            this.init();
        });
    }

    async loadDhikrData() {
        try {
            const response = await fetch('/json/dhikr-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.dhikrData = await response.json();
        } catch (error) {
            console.error('Error loading dhikr data:', error);
            // Fallback to a default or empty array if loading fails
            this.dhikrData = []; 
        }
    }

    init() {
        this.loadSettings();
        this.loadStats();
        this.loadTodayData();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateProgressRing();
        this.checkDailyStreak();
        this.setupNotifications();
        this.createDhikrGrid(); // Populate the dhikr selection grid
        this.selectDhikr(this.dhikrData[this.currentDhikrIndex].key); // Set initial dhikr
        this.updatePlaceholders(); // Call this after sharedApp is ready
    }

    updatePlaceholders() {
        const dhikrSearchInput = document.getElementById('dhikrSearch');
        if (dhikrSearchInput && window.sharedApp) {
            dhikrSearchInput.placeholder = window.sharedApp.translations[window.sharedApp.currentLang]['search-dhikr-placeholder'];
        }
    }

    setupEventListeners() {
        // Tap button
        const tapButton = document.getElementById('tapButton');
        tapButton.addEventListener('click', () => this.incrementCount());
        tapButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.incrementCount();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isPaused) {
                e.preventDefault();
                this.incrementCount();
            }
        });

        // Control buttons
        document.getElementById('resetBtn').addEventListener('click', () => this.resetCount());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());

        // Dhikr selection (delegated to createDhikrGrid)

        // Search functionality
        document.getElementById('dhikrSearch').addEventListener('input', (e) => {
            this.filterDhikr(e.target.value);
        });

        // Modal controls
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('closeStats').addEventListener('click', () => this.closeStats());
        document.getElementById('viewStatsBtn').addEventListener('click', () => this.openStats());

        // Settings form
        this.setupSettingsForm();

        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('show');
                }
            });
        });

        // Export and reset buttons
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('resetAllBtn').addEventListener('click', () => this.resetAllData());
        
        // Window resize handler for responsive progress ring
        window.addEventListener('resize', () => {
            this.updateProgressRing();
        });
    }

    setupSettingsForm() {
        // Load current settings
        document.getElementById('vibrationToggle').checked = this.settings.vibration;
        document.getElementById('soundToggle').checked = this.settings.sound;
        document.getElementById('dailyGoal').value = this.settings.dailyGoal;
        document.getElementById('reminderTime').value = this.settings.reminderTime;
        document.getElementById('reminderToggle').checked = this.settings.enableReminders;
        document.getElementById('statsPeriod').value = this.settings.statsPeriod;

        // Add event listeners
        document.getElementById('vibrationToggle').addEventListener('change', (e) => {
            this.settings.vibration = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
        });

        

        document.getElementById('dailyGoal').addEventListener('change', (e) => {
            this.settings.dailyGoal = parseInt(e.target.value);
            this.saveSettings();
            this.updateStats();
        });

        document.getElementById('reminderTime').addEventListener('change', (e) => {
            this.settings.reminderTime = e.target.value;
            this.saveSettings();
            this.setupNotifications();
        });

        document.getElementById('reminderToggle').addEventListener('change', (e) => {
            this.settings.enableReminders = e.target.checked;
            this.saveSettings();
            this.setupNotifications();
        });

        document.getElementById('statsPeriod').addEventListener('change', (e) => {
            this.settings.statsPeriod = e.target.value;
            this.saveSettings();
        });
    }

    incrementCount() {
        // Check if button is disabled (during completion popup)
        const tapButton = document.getElementById('tapButton');
        if (this.isPaused || (tapButton && tapButton.disabled)) {
            console.log('Tap ignored: button is paused or disabled');
            return;
        }

        this.currentCount++;
        this.todayTotal++;
        this.stats.totalCount++;

        const today = new Date().toDateString();
        if (!this.stats.dailyCounts[today]) {
            this.stats.dailyCounts[today] = {};
        }
        const currentDhikrKey = this.dhikrData[this.currentDhikrIndex].key;
        if (!this.stats.dailyCounts[today][currentDhikrKey]) {
            this.stats.dailyCounts[today][currentDhikrKey] = 0;
        }
        this.stats.dailyCounts[today][currentDhikrKey]++;

        // Haptic feedback
        if (this.settings.vibration && 'vibrate' in navigator) {
            this.vibrateFeedback();
        }

        // Sound feedback
        if (this.settings.sound) {
            this.playCountSound();
        }

        // Visual feedback
        this.animateTapButton();

        // Check if target reached
        if (this.currentCount >= this.targetCount) {
            this.completeSession();
        }

        this.updateDisplay();
        this.updateProgressRing();
        this.saveData();
    }

    vibrateFeedback() {
        if (this.currentCount === Math.floor(this.targetCount / 2) && this.targetCount > 1) {
            navigator.vibrate([40, 20, 40]); // Halfway point
        } else if (this.currentCount >= this.targetCount * 0.9 && this.currentCount < this.targetCount) {
            navigator.vibrate(80); // Near completion
        } else {
            navigator.vibrate(30); // Regular count
        }
    }

    animateTapButton() {
        const tapButton = document.getElementById('tapButton');
        tapButton.classList.add('counting');
        setTimeout(() => {
            tapButton.classList.remove('counting');
        }, 200);
    }

    playCountSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 880; // A5 note
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('Audio not supported or error playing sound:', error);
        }
    }

    playCompletionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523, 659, 784, 1046]; // C5, E5, G5, C6
            
            notes.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, index * 150); // Shorter delay for a melody
            });
        } catch (error) {
            console.log('Audio not supported or error playing completion sound:', error);
        }
    }

    completeSession() {
        this.stats.completedSessions++;
        
        // DISABLE the tap button immediately to prevent miss-touches
        this.disableTapButton();
        
        // Goal completion vibration
        if (this.settings.vibration && 'vibrate' in navigator) {
            navigator.vibrate([300, 100, 300, 100, 300]);
        }

        // Completion sound
        if (this.settings.sound) {
            this.playCompletionSound();
        }

        this.showCompletionMessage();
        this.celebrateCompletion();
        
        this.saveStats();

        // Automatic Dhikr Switching (button remains disabled during this)
        setTimeout(() => {
            this.currentDhikrIndex = (this.currentDhikrIndex + 1) % this.dhikrData.length;
            const nextDhikr = this.dhikrData[this.currentDhikrIndex];
            this.selectDhikr(nextDhikr.key);
            this.currentCount = 0; // Reset count for new dhikr
            this.updateDisplay();
            this.updateProgressRing();
            this.saveData();
            this.showNotification(`Switching to: ${nextDhikr.transliteration}`, 'info');
            
            // RE-ENABLE the tap button after completion message is fully gone
            setTimeout(() => {
                this.enableTapButton();
            }, 500); // Additional delay after dhikr switch
        }, 1500); // 1.5-second delay for celebration
    }

    showCompletionMessage() {
        const dhikr = this.dhikrData[this.currentDhikrIndex];
        const message = document.createElement('div');
        message.className = 'completion-message';
        const currentLang = window.sharedApp ? window.sharedApp.currentLang : 'en';
        const rewardText = (currentLang === 'bn' && dhikr.reward_bn) ? dhikr.reward_bn : dhikr.reward;
        const alhamdulillahText = (currentLang === 'bn') ? 'আলহামদুলিল্লাহ!' : 'Alhamdulillah!';
        const completedMessage = (currentLang === 'bn') ? `আপনি ${this.targetCount} বার ${dhikr.transliteration} সম্পন্ন করেছেন` : `You've completed ${this.targetCount} ${dhikr.transliteration}`;

        message.innerHTML = `
            <div class="completion-icon">🎉</div>
            <div class="completion-text">
                <h3>${alhamdulillahText}</h3>
                <p>${completedMessage}</p>
                <p class="reward-text">${rewardText}</p>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.classList.add('hide'); // Add class for slide-out animation
                message.addEventListener('animationend', () => message.remove(), { once: true });
            }
        }, 2000);
    }

    celebrateCompletion() {
        const progressRing = document.querySelector('.progress-ring__circle');
        if (progressRing) {
            progressRing.classList.add('celebrate-glow');
            setTimeout(() => {
                progressRing.classList.remove('celebrate-glow');
            }, 1000);
        }
    }

    // Method to disable tap button during completion
    disableTapButton() {
        const tapButton = document.getElementById('tapButton');
        if (tapButton) {
            tapButton.disabled = true;
            tapButton.style.pointerEvents = 'none';
            tapButton.style.opacity = '0.6';
            tapButton.classList.add('disabled');
            console.log('Tap button disabled during completion popup');
        }
    }

    // Method to re-enable tap button after completion
    enableTapButton() {
        const tapButton = document.getElementById('tapButton');
        if (tapButton) {
            tapButton.disabled = false;
            tapButton.style.pointerEvents = 'auto';
            tapButton.style.opacity = '1';
            tapButton.classList.remove('disabled');
            console.log('Tap button re-enabled after completion popup');
        }
    }

    resetCount() {
        if (confirm('Are you sure you want to reset the current count?')) {
            const today = new Date().toDateString();
            const currentDhikrKey = this.dhikrData[this.currentDhikrIndex].key;

            if (this.stats.dailyCounts && this.stats.dailyCounts[today] && this.stats.dailyCounts[today][currentDhikrKey]) {
                this.stats.dailyCounts[today][currentDhikrKey] -= this.currentCount;
            }
            this.todayTotal -= this.currentCount;
            this.stats.totalCount -= this.currentCount;
            this.currentCount = 0;
            this.updateDisplay();
            this.updateProgressRing();
            this.saveData();
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        const icon = pauseBtn.querySelector('i');
        const text = pauseBtn.querySelector('span');
        
        if (this.isPaused) {
            icon.className = 'fas fa-play';
            text.textContent = 'Resume';
            pauseBtn.classList.add('active');
        } else {
            icon.className = 'fas fa-pause';
            text.textContent = 'Pause';
            pauseBtn.classList.remove('active');
        }
    }

    selectDhikr(dhikrKey) {
        // Remove active class from all options
        document.querySelectorAll('.dhikr-option').forEach(option => {
            option.classList.remove('active');
        });

        const newIndex = this.dhikrData.findIndex(d => d.key === dhikrKey);
        if (newIndex === -1) return; // Should not happen

        const isDifferentDhikr = this.currentDhikrIndex !== newIndex;
        this.currentDhikrIndex = newIndex;
        const selectedDhikr = this.dhikrData[newIndex];

        if (selectedDhikr) {
            document.querySelector(`[data-dhikr="${dhikrKey}"]`).classList.add('active');
            this.targetCount = this.settings.customDhikrTargets[selectedDhikr.key] || selectedDhikr.target;

            // Only reset count if MANUALLY changing to a different dhikr
            if (isDifferentDhikr) {
                this.currentCount = 0;
            }

            this.updateDhikrDisplay();
            this.updateDisplay();
            this.updateProgressRing();
            this.saveData();
        }
    }

    updateDhikrDisplay() {
        const dhikr = this.dhikrData[this.currentDhikrIndex];
        document.getElementById('dhikrArabic').textContent = dhikr.arabic;
        document.getElementById('dhikrTransliteration').textContent = dhikr.transliteration;
        const currentLang = window.sharedApp ? window.sharedApp.currentLang : 'en';
        document.getElementById('dhikrTranslation').textContent = (currentLang === 'bn' && dhikr.bn_translation) ? dhikr.bn_translation : dhikr.translation;
        document.getElementById('dhikrMeaning').textContent = `Meaning: ${dhikr.meaning}`;
        document.getElementById('dhikrReward').textContent = `Reward: ${dhikr.reward}`;
    }

    updateDisplay() {
        document.getElementById('currentCount').textContent = this.currentCount;
        document.getElementById('targetCount').textContent = this.targetCount;
        document.getElementById('todayTotal').textContent = this.todayTotal;
        this.updateStats();
    }

    updateStats() {
        document.getElementById('streakCount').textContent = this.stats.streak;
        document.getElementById('completedSessions').textContent = this.stats.completedSessions;
        
        // Calculate daily progress percentage
        const progressPercent = Math.min(Math.round((this.todayTotal / this.settings.dailyGoal) * 100), 100);
        document.getElementById('dailyProgress').textContent = `${progressPercent}%`;
    }

    updateProgressRing() {
        const circle = document.querySelector('.progress-ring__circle');
        const circlebg = document.querySelector('.progress-ring__circle-bg');
        const svg = document.querySelector('.progress-ring');
        
        // Get responsive radius and stroke width based on screen size (matching CSS media queries)
        let radius = 140; // Default desktop size
        let baseStrokeWidth = 6; // Default desktop stroke width
        let svgSize = 300; // Default SVG size
        let center = 150; // Default center position
        
        if (window.innerWidth <= 480) {
            radius = 100; // Very small screens
            baseStrokeWidth = 4; // Match CSS media query
            svgSize = 220; // Match CSS media query
            center = 110; // Center position for 220px SVG
        } else if (window.innerWidth <= 768) {
            radius = 115; // Mobile screens
            baseStrokeWidth = 5; // Match CSS media query
            svgSize = 250; // Match CSS media query
            center = 125; // Center position for 250px SVG
        }
        
        // Update SVG attributes dynamically
        svg.setAttribute('width', svgSize);
        svg.setAttribute('height', svgSize);
        
        // Update both circle elements
        [circle, circlebg].forEach(el => {
            if (el) {
                el.setAttribute('r', radius);
                el.setAttribute('cx', center);
                el.setAttribute('cy', center);
            }
        });
        
        const circumference = radius * 2 * Math.PI;
        const progress = (this.currentCount / this.targetCount) * 100;
        const offset = circumference - (progress / 100) * circumference;
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
        
        const currentDhikr = this.dhikrData[this.currentDhikrIndex];
        circle.style.stroke = currentDhikr.color;

        // Progress-based glow and responsive stroke thickness
        if (progress <= 50) {
            circle.style.filter = `drop-shadow(0 0 5px ${currentDhikr.color}50)`;
            circle.style.strokeWidth = `${baseStrokeWidth}px`;
        } else if (progress <= 75) {
            circle.style.filter = `drop-shadow(0 0 10px ${currentDhikr.color}80)`;
            circle.style.strokeWidth = `${baseStrokeWidth + 2}px`;
        } else if (progress <= 90) {
            circle.style.filter = `drop-shadow(0 0 15px ${currentDhikr.color}A0)`;
            circle.style.strokeWidth = `${baseStrokeWidth + 4}px`;
        } else {
            circle.style.filter = `drop-shadow(0 0 20px ${currentDhikr.color}C0)`;
            circle.style.strokeWidth = `${baseStrokeWidth + 6}px`;
            circle.classList.add('pulsing-glow'); // Add pulsing animation
        }
        if (progress < 90) {
            circle.classList.remove('pulsing-glow');
        }
    }

    filterDhikr(searchTerm) {
        const options = document.querySelectorAll('.dhikr-option');
        searchTerm = searchTerm.toLowerCase();
        
        options.forEach(option => {
            const dhikrKey = option.dataset.dhikr;
            const dhikr = this.dhikrData.find(d => d.key === dhikrKey);
            if (!dhikr) return; // Should not happen if data is consistent

            const searchable = `${dhikr.arabic} ${dhikr.transliteration} ${dhikr.translation} ${dhikr.meaning} ${dhikr.reward}`.toLowerCase();
            
            if (searchable.includes(searchTerm)) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    }

    openSettings() {
        document.getElementById('settingsModal').classList.add('show');
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    openStats() {
        this.generateStatsDisplay();
        document.getElementById('statsModal').classList.add('show');
        this.closeSettings();
    }

    closeStats() {
        document.getElementById('statsModal').classList.remove('show');
    }

    generateStatsDisplay() {
        const statsDisplay = document.getElementById('statsDisplay');
        const today = new Date().toDateString();
        const thisWeek = this.getThisWeekData();
        const thisMonth = this.getThisMonthData();
        const translations = sharedApp.translations[sharedApp.currentLang];
        
        statsDisplay.innerHTML = `
            <div class="stats-period">
                <h4><i class="fas fa-calendar-day"></i> ${translations['stats-today-title']}</h4>
                <div class="stats-grid">
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${this.todayTotal}</div>
                            <div class="stat-label">${translations['total-count-label-today']}</div>
                        </div>
                    </div>
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${this.stats.completedSessions}</div>
                            <div class="stat-label">${translations['sessions-label-today']}</div>
                        </div>
                    </div>
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${Math.round((this.todayTotal / this.settings.dailyGoal) * 100)}%</div>
                            <div class="stat-label">${translations['goal-progress-label-today']}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stats-period">
                <h4><i class="fas fa-calendar-week"></i> ${translations['stats-this-week-title']}</h4>
                <div class="stats-grid">
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${thisWeek.total}</div>
                            <div class="stat-label">${translations['total-count-label-week']}</div>
                        </div>
                    </div>
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${thisWeek.days}</div>
                            <div class="stat-label">${translations['active-days-label-week']}</div>
                        </div>
                    </div>
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${Math.round(thisWeek.average)}</div>
                            <div class="stat-label">${translations['daily-average-label-week']}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="stats-period">
                <h4><i class="fas fa-calendar-alt"></i> ${translations['stats-this-month-title']}</h4>
                <div class="stats-grid">
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${thisMonth.total}</div>
                            <div class="stat-label">${translations['total-count-label-month']}</div>
                        </div>
                    </div>
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${thisMonth.days}</div>
                            <div class="stat-label">${translations['active-days-label-month']}</div>
                        </div>
                    </div>
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${Math.round(thisMonth.average)}</div>
                            <div class="stat-label">${translations['daily-average-label-month']}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stats-period">
                <h4><i class="fas fa-chart-line"></i> ${translations['stats-overall-title']}</h4>
                <div class="stats-grid">
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${this.stats.totalCount}</div>
                            <div class="stat-label">${translations['all-time-total-label-overall']}</div>
                        </div>
                    </div>
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${this.stats.streak}</div>
                            <div class="stat-label">${translations['current-streak-label-overall']}</div>
                        </div>
                    </div>
                    <div class="stats-modal-card">
                        <div class="stat-info">
                            <div class="stat-number">${Object.keys(this.stats.dailyHistory).length}</div>
                            <div class="stat-label">${translations['total-days-label-overall']}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getThisWeekData() {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        let total = 0;
        let activeDays = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toDateString();
            
            if (this.stats.dailyHistory[dateStr]) {
                total += this.stats.dailyHistory[dateStr];
                activeDays++;
            }
        }
        
        return {
            total,
            days: activeDays,
            average: activeDays > 0 ? total / activeDays : 0
        };
    }

    getThisMonthData() {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        let total = 0;
        let activeDays = 0;
        
        Object.keys(this.stats.dailyHistory).forEach(dateStr => {
            const date = new Date(dateStr);
            if (date >= monthStart) {
                total += this.stats.dailyHistory[dateStr];
                activeDays++;
            }
        });
        
        return {
            total,
            days: activeDays,
            average: activeDays > 0 ? total / activeDays : 0
        };
    }

    async exportData() {
        // Check if sync is in progress - don't export during active sync
        if (window.dataSync && window.dataSync.dataSyncInProgress) {
            this.showNotification('Please wait for sync to complete before exporting...', 'info');
            return;
        }

        // Force reload all data from localStorage to ensure consistency
        console.log('PDF Export: Refreshing data before export...');
        this.showNotification('Refreshing data for export...', 'info');
        
        // Reload all data from storage for most accurate state
        this.reloadDataFromStorage();
        
        // Wait a moment for data to settle and UI to update
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Validate data consistency before proceeding
        if (this.isDataInconsistent()) {
            console.warn('PDF Export: Data inconsistency detected, using fallback data');
            this.showNotification('Using available data for export...', 'info');
        } else {
            console.log('PDF Export: Data validation passed, proceeding with export');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Load the Amiri font
        const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf';
        const fontResponse = await fetch(fontUrl);
        const font = await fontResponse.arrayBuffer();
        const fontB64 = this.arrayBufferToBase64(font);

        doc.addFileToVFS("Amiri-Regular.ttf", fontB64);
        doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
        doc.setFont("Amiri");

        const period = this.settings.statsPeriod;
        let title = "";
        let tableData = [];

        let startDate = null;
        let endDate = null;

        switch (period) {
            case "today":
                title = "Today's Dhikr Details";
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                break;
            case "week":
                title = "This Week's Dhikr Details";
                startDate = new Date();
                startDate.setDate(startDate.getDate() - startDate.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case "month":
                title = "This Month's Dhikr Details";
                const today = new Date();
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case "all":
                title = "All Time Dhikr Details";
                // startDate and endDate are null
                break;
        }

        tableData = this.getDhikrDataForPeriod(startDate, endDate);

        // Add a title
        doc.setFontSize(22);
        doc.text("Dhikr Counter Report", 105, 20, { align: "center" });

        // Add a date
        doc.setFontSize(12);
        doc.text(new Date().toLocaleDateString(), 105, 30, { align: "center" });

        // Add a summary with fresh data
        doc.setFontSize(16);
        doc.text("Summary", 14, 50);
        doc.setFontSize(12);
        
        // Use reconciled data for accurate reporting
        const todayTotal = this.todayTotal || 0;
        const allTimeTotal = this.stats.totalCount || 0;
        const completedSessions = this.stats.completedSessions || 0;
        const currentStreak = this.stats.streak || 0;
        const dailyGoal = this.settings.dailyGoal || 100;
        const dailyGoalProgress = Math.min(Math.round((todayTotal / dailyGoal) * 100), 100);
        const isCustomGoal = dailyGoal !== 100;
        
        // Ensure today's total doesn't exceed all-time total in display
        const displayTodayTotal = Math.min(todayTotal, allTimeTotal);
        
        doc.text(`Today's Total: ${displayTodayTotal}`, 14, 60);
        doc.text(`Daily Goal: ${dailyGoal}${isCustomGoal ? ' (Custom)' : ''}`, 14, 70);
        doc.text(`Daily Goal Progress: ${dailyGoalProgress}%`, 14, 80);
        doc.text(`Total Completed Sessions: ${completedSessions}`, 14, 90);
        doc.text(`Day Streak: ${currentStreak}`, 14, 100);
        doc.text(`All Time Total: ${allTimeTotal}`, 14, 110);

        // Add sync status info for debugging
        const syncStatus = window.dataSync && window.dataSync.dataSyncInProgress ? 'In Progress' : 'Complete';
        doc.text(`Data Sync Status: ${syncStatus}`, 14, 120);

        // Add a table of dhikr data
        doc.setFontSize(16);
        doc.text(title, 14, 140);
        
        // Create table with proper column headers
        const tableColumn = ["Dhikr", "Transliteration", "Count", "Target"];
        
        // Get table data and validate it
        const rawTableData = this.getDhikrDataForPeriod(startDate, endDate);
        
        // Format table data properly to ensure alignment
        const formattedTableData = rawTableData.map(row => [
            row[0] || 'Unknown',           // Dhikr (Arabic)
            row[1] || 'Unknown',           // Transliteration  
            String(row[2] || 0),           // Count (ensure it's a string)
            String(row[3] || 33)           // Target (ensure it's a string)
        ]);

        doc.autoTable(tableColumn, formattedTableData, {
            startY: 150,
            styles: { 
                font: "Amiri", 
                fontStyle: "normal",
                cellPadding: 3,
                fontSize: 10
            },
            headStyles: { 
                font: "Amiri", 
                fontStyle: "bold",
                fillColor: [59, 130, 246],
                textColor: 255
            },
            columnStyles: {
                0: { cellWidth: 60, halign: 'center' },  // Dhikr
                1: { cellWidth: 60, halign: 'left' },    // Transliteration
                2: { cellWidth: 30, halign: 'center' },  // Count
                3: { cellWidth: 30, halign: 'center' }   // Target
            },
            margin: { left: 14 }
        });

        // Save the PDF
        const fileName = `dhikr-data-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        // Show success notification
        this.showNotification(`PDF exported successfully: ${fileName}`, 'success');
        console.log('PDF Export: Export completed successfully');
    }

    getDhikrDataForPeriod(startDate, endDate) {
        const dhikrCounts = {};

        // Ensure dailyCounts exists and is an object
        if (!this.stats.dailyCounts || typeof this.stats.dailyCounts !== 'object') {
            console.warn('getDhikrDataForPeriod: dailyCounts is missing or invalid, using empty data');
            return [];
        }

        for (const dateStr in this.stats.dailyCounts) {
            const date = new Date(dateStr);
            
            // Skip invalid dates
            if (isNaN(date.getTime())) {
                console.warn(`getDhikrDataForPeriod: Skipping invalid date: ${dateStr}`);
                continue;
            }
            
            if ((!startDate || date >= startDate) && (!endDate || date <= endDate)) {
                const dailyData = this.stats.dailyCounts[dateStr];
                
                // Ensure dailyData is an object
                if (!dailyData || typeof dailyData !== 'object') {
                    console.warn(`getDhikrDataForPeriod: Skipping invalid daily data for ${dateStr}`);
                    continue;
                }
                
                for (const dhikrKey in dailyData) {
                    const count = dailyData[dhikrKey];
                    
                    // Ensure count is a valid number
                    if (typeof count !== 'number' || isNaN(count) || count < 0) {
                        console.warn(`getDhikrDataForPeriod: Skipping invalid count for ${dhikrKey} on ${dateStr}: ${count}`);
                        continue;
                    }
                    
                    if (!dhikrCounts[dhikrKey]) {
                        dhikrCounts[dhikrKey] = 0;
                    }
                    dhikrCounts[dhikrKey] += count;
                }
            }
        }

        const tableRows = [];
        for (const dhikrKey in dhikrCounts) {
            const dhikr = this.dhikrData.find(d => d.key === dhikrKey);
            if (dhikr) {
                const target = (this.settings.customDhikrTargets && this.settings.customDhikrTargets[dhikr.key]) || dhikr.target || 33;
                const dhikrRow = [
                    dhikr.arabic || 'Unknown',
                    dhikr.transliteration || dhikrKey,
                    dhikrCounts[dhikrKey],
                    target
                ];
                tableRows.push(dhikrRow);
            } else {
                console.warn(`getDhikrDataForPeriod: Dhikr data not found for key: ${dhikrKey}`);
                // Still include it with fallback data
                const dhikrRow = [
                    'Unknown Dhikr',
                    dhikrKey,
                    dhikrCounts[dhikrKey],
                    33 // Default target
                ];
                tableRows.push(dhikrRow);
            }
        }
        
        // Sort by count (highest first) for better presentation
        tableRows.sort((a, b) => b[2] - a[2]);
        
        return tableRows;
    }

    resetAllData() {
        if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
            if (confirm('This will delete all your progress, stats, and settings. Are you absolutely sure?')) {
                localStorage.removeItem('dhikr-settings');
                localStorage.removeItem('dhikr-stats');
                localStorage.removeItem('dhikr-session');
                location.reload();
            }
        }
    }

    // Method to reload data from storage after sync completion
    reloadDataFromStorage() {
        console.log('Reloading dhikr data from storage after sync...');
        
        // Reload settings
        this.loadSettings();
        
        // Reload stats
        this.loadStats();
        
        // Reload session data (which includes current count, today total, etc.)
        this.loadSessionData();
        
        // Reconcile data inconsistencies after loading
        this.reconcileDataAfterSync();
        
        // Update UI elements
        this.updateUI();
        this.updateStats();
        this.createDhikrGrid();
        this.updateDhikrDisplay();
        this.updateProgressRing();
        
        console.log('Dhikr data reload completed');
    }

    // New method to reconcile data after sync to fix inconsistencies
    reconcileDataAfterSync() {
        console.log('Reconciling data after sync...');
        
        // Recalculate today's total from dailyHistory and current session
        const today = new Date().toDateString();
        const todayFromHistory = this.stats.dailyHistory[today] || 0;
        
        // The todayTotal should be the sum of completed dhikr + current active count
        this.todayTotal = todayFromHistory + (this.currentCount || 0);
        
        // Recalculate all-time total from dailyHistory
        let recalculatedTotal = 0;
        for (const date in this.stats.dailyHistory) {
            const count = this.stats.dailyHistory[date];
            if (typeof count === 'number' && count > 0) {
                recalculatedTotal += count;
            }
        }
        
        // Add current session count if it's not yet saved to history
        recalculatedTotal += (this.currentCount || 0);
        
        // Update all-time total if it's inconsistent
        if (this.stats.totalCount !== recalculatedTotal) {
            console.log(`Reconciling totalCount: ${this.stats.totalCount} → ${recalculatedTotal}`);
            this.stats.totalCount = recalculatedTotal;
        }
        
        // Ensure today's total doesn't exceed all-time total
        if (this.todayTotal > this.stats.totalCount) {
            console.log(`Fixing todayTotal: was ${this.todayTotal}, setting to ${this.stats.totalCount}`);
            this.todayTotal = this.stats.totalCount;
        }
        
        // Recalculate completed sessions from dailyCounts
        let totalSessions = 0;
        for (const date in this.stats.dailyCounts) {
            const dailyData = this.stats.dailyCounts[date];
            if (dailyData && typeof dailyData === 'object') {
                for (const dhikrKey in dailyData) {
                    const count = dailyData[dhikrKey];
                    if (typeof count === 'number' && count > 0) {
                        // Calculate how many complete sessions this represents
                        const dhikr = this.dhikrData.find(d => d.key === dhikrKey);
                        const target = (this.settings.customDhikrTargets && this.settings.customDhikrTargets[dhikrKey]) || 
                                      (dhikr && dhikr.target) || 33;
                        totalSessions += Math.floor(count / target);
                    }
                }
            }
        }
        
        // Update completed sessions if it's inconsistent
        if (this.stats.completedSessions !== totalSessions) {
            console.log(`Reconciling completedSessions: ${this.stats.completedSessions} → ${totalSessions}`);
            this.stats.completedSessions = totalSessions;
        }
        
        // Recalculate streak
        this.recalculateStreak();
        
        // Save the reconciled data
        this.saveStats();
        
        console.log('Data reconciliation completed');
    }

    // Helper method to recalculate streak
    recalculateStreak() {
        const today = new Date();
        let currentStreak = 0;
        let checkDate = new Date(today);
        
        // Check backwards from today to find consecutive days meeting the goal
        while (true) {
            const dateStr = checkDate.toDateString();
            const dayTotal = this.stats.dailyHistory[dateStr] || 0;
            
            if (dayTotal >= this.settings.dailyGoal) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
            
            // Prevent infinite loop - don't check more than 365 days back
            if (currentStreak > 365) break;
        }
        
        if (this.stats.streak !== currentStreak) {
            console.log(`Recalculating streak: ${this.stats.streak} → ${currentStreak}`);
            this.stats.streak = currentStreak;
        }
    }

    // Helper method to load session data specifically
    loadSessionData() {
        const sessionData = localStorage.getItem('dhikr-session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                this.currentDhikrIndex = session.currentDhikrIndex || 0;
                this.currentCount = session.currentCount || 0;
                this.targetCount = session.targetCount || 33;
                this.todayTotal = session.todayTotal || 0;
                this.isPaused = session.isPaused || false;

                // Update UI for paused state
                if (this.isPaused) {
                    setTimeout(() => this.togglePause(), 100);
                }
            } catch (error) {
                console.error('Error parsing dhikr session data:', error);
            }
        }
    }

    // Helper method to update UI elements
    updateUI() {
        this.updateDisplay();
        this.updateStats();
        this.updateDhikrDisplay();
        this.updateProgressRing();
    }

    // Method to check if data is in an inconsistent state
    isDataInconsistent() {
        try {
            // Check if basic data structures exist
            if (!this.stats || !this.settings) {
                console.warn('Data inconsistency: Missing stats or settings objects');
                return true;
            }

            // Check if required properties exist
            if (typeof this.stats.totalCount !== 'number' || 
                typeof this.stats.completedSessions !== 'number' ||
                typeof this.stats.streak !== 'number') {
                console.warn('Data inconsistency: Invalid stats properties');
                return true;
            }

            // Check if dailyHistory and dailyCounts exist
            if (!this.stats.dailyHistory || !this.stats.dailyCounts) {
                console.warn('Data inconsistency: Missing dailyHistory or dailyCounts');
                return true;
            }

            // Check if today's data makes sense
            const today = new Date().toDateString();
            const todayHistoryCount = this.stats.dailyHistory[today] || 0;
            
            // Verify today's total matches history (with some tolerance for active sessions)
            if (Math.abs(this.todayTotal - todayHistoryCount) > this.currentCount + 10) {
                console.warn(`Data inconsistency: todayTotal (${this.todayTotal}) doesn't match history (${todayHistoryCount})`);
                // This is not necessarily critical, so we'll warn but not return true
            }

            // Check if dhikr data is loaded
            if (!this.dhikrData || this.dhikrData.length === 0) {
                console.warn('Data inconsistency: Dhikr data not loaded');
                return true;
            }

            // Check if current dhikr index is valid
            if (this.currentDhikrIndex < 0 || this.currentDhikrIndex >= this.dhikrData.length) {
                console.warn(`Data inconsistency: Invalid dhikr index (${this.currentDhikrIndex})`);
                this.currentDhikrIndex = 0; // Fix it
            }

            return false; // Data appears consistent
        } catch (error) {
            console.error('Error checking data consistency:', error);
            return true; // Assume inconsistent if we can't check
        }
    }

    // Method to reset session data (for logout)
    resetSession() {
        console.log('Resetting dhikr session data...');
        
        // Reset session data but keep settings and stats
        this.currentCount = 0;
        this.targetCount = 33;
        this.isPaused = false;
        this.todayTotal = 0;
        
        // Clear session from localStorage
        localStorage.removeItem('dhikr-session');
        
        // Update UI
        this.updateUI();
        
        console.log('Dhikr session reset completed');
    }

    setupNotifications() {
        if (!this.settings.enableReminders || !this.settings.reminderTime) return;
        
        if ('Notification' in window && Notification.permission === 'granted') {
            this.scheduleNotification();
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.scheduleNotification();
                }
            });
        }

        // Also setup OneSignal notifications if available
        if (window.oneSignalManager && window.oneSignalManager.isSubscribed) {
            this.scheduleOneSignalReminder();
        }
    }

    scheduleNotification() {
        // This is a simple implementation. In a real app, you'd use Service Workers
        const now = new Date();
        const [hours, minutes] = this.settings.reminderTime.split(':');
        const reminderTime = new Date();
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (reminderTime < now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
            new Notification('Dhikr Reminder', {
                body: 'Time for your daily dhikr! 🤲',
                icon: '/images/icon.png'
            });
        }, timeUntilReminder);
    }

    scheduleOneSignalReminder() {
        if (!window.oneSignalManager || !this.settings.enableReminders || !this.settings.reminderTime) return;
        
        const currentDhikr = this.dhikrData[this.currentDhikrIndex];
        window.oneSignalManager.scheduleDhikrReminder(
            currentDhikr.transliteration,
            this.targetCount,
            this.settings.reminderTime
        );
        console.log('OneSignal dhikr reminder scheduled');
    }

    checkDailyStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (this.stats.dailyHistory[today] && this.stats.dailyHistory[today] >= this.settings.dailyGoal) {
            // Today's goal achieved
            if (this.stats.dailyHistory[yesterdayStr] && this.stats.dailyHistory[yesterdayStr] >= this.settings.dailyGoal) {
                // Continue streak
                if (this.stats.lastStreakDate !== today) {
                    this.stats.streak++;
                    this.stats.lastStreakDate = today;
                }
            } else {
                // Start new streak
                this.stats.streak = 1;
                this.stats.lastStreakDate = today;
            }
        }
        
        this.saveStats();
    }

    loadTodayData() {
        const today = new Date().toDateString();
        if (this.stats.dailyHistory[today]) {
            this.todayTotal = this.stats.dailyHistory[today];
        }
    }

    saveData() {
        // Save current session
        const sessionData = {
            currentDhikrIndex: this.currentDhikrIndex,
            currentCount: this.currentCount,
            targetCount: this.targetCount,
            todayTotal: this.todayTotal,
            isPaused: this.isPaused,
            timestamp: new Date().getTime() // Add timestamp for smart merging
        };
        localStorage.setItem('dhikr-session', JSON.stringify(sessionData));
        
        // Save today's total to history
        const today = new Date().toDateString();
        this.stats.dailyHistory[today] = this.todayTotal;
        this.saveStats();

        // Real-time sync will automatically handle Firebase sync
        console.log("💾 Dhikr data saved to localStorage - Real-time sync will handle Firebase automatically");
    }

    saveSettings() {
        localStorage.setItem('dhikr-settings', JSON.stringify(this.settings));
        // Real-time sync will automatically handle Firebase sync
        console.log("⚙️ Dhikr settings saved to localStorage - Real-time sync will handle Firebase automatically");
    }

    saveStats() {
        localStorage.setItem('dhikr-stats', JSON.stringify(this.stats));
        // Real-time sync will automatically handle Firebase sync
        console.log("📊 Dhikr stats saved to localStorage - Real-time sync will handle Firebase automatically");
    }

    loadSettings() {
        const saved = localStorage.getItem('dhikr-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    loadStats() {
        const saved = localStorage.getItem('dhikr-stats');
        if (saved) {
            try {
                const parsedStats = JSON.parse(saved);
                if (parsedStats && typeof parsedStats === 'object') {
                    this.stats = { ...this.stats, ...parsedStats };
                } else {
                    console.warn('Invalid dhikr stats data in localStorage, using defaults.');
                }
            } catch (error) {
                console.error('Error parsing dhikr stats data:', error);
            }
        }

        // Also load and integrate session data here
        this.loadSessionDataIntoStats();
    }

    // Helper method to load session data and integrate with stats
    loadSessionDataIntoStats() {
        const sessionData = localStorage.getItem('dhikr-session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                this.currentDhikrIndex = session.currentDhikrIndex || 0;
                this.currentCount = session.currentCount || 0;
                this.targetCount = session.targetCount || 33;
                this.todayTotal = session.todayTotal || 0;
                this.isPaused = session.isPaused || false;

                // Update UI for paused state
                if (this.isPaused) {
                    setTimeout(() => this.togglePause(), 100);
                }
                
                // Ensure todayTotal is also reflected in dailyHistory
                const today = new Date().toDateString();
                if (!this.stats.dailyHistory[today] || this.stats.dailyHistory[today] < this.todayTotal) {
                    this.stats.dailyHistory[today] = this.todayTotal;
                }
            } catch (error) {
                console.error('Error parsing dhikr session data:', error);
            }
        } else {
            // If no session data, load today's data from history
            this.loadTodayData();
        }
    }

    createDhikrGrid() {
        const dhikrGrid = document.getElementById('dhikrGrid');
        dhikrGrid.innerHTML = '';

        this.dhikrData.forEach((dhikr, index) => {
            const dhikrCard = document.createElement('div');
            dhikrCard.className = `dhikr-option ${index === this.currentDhikrIndex ? 'active' : ''}`;
            dhikrCard.dataset.dhikr = dhikr.key;

            const currentLang = window.sharedApp ? window.sharedApp.currentLang : 'en';
            const meaningText = (currentLang === 'bn' && dhikr.meaning_bn) ? dhikr.meaning_bn : dhikr.meaning;
            const rewardText = (currentLang === 'bn' && dhikr.reward_bn) ? dhikr.reward_bn : dhikr.reward;
            const meaningLabel = (currentLang === 'bn') ? 'অর্থ' : 'Meaning';
            const rewardLabel = (currentLang === 'bn') ? 'পুরস্কার' : 'Reward';
            const translationLabel = (currentLang === 'bn') ? 'অনুবাদ' : 'Translation';

            dhikrCard.innerHTML = `
                <div class="dhikr-option-content">
                    <div class="dhikr-arabic-small">${dhikr.arabic}</div>
                    <div class="dhikr-name">${dhikr.transliteration}</div>
                    <div class="dhikr-target-wrapper">
                        <span class="dhikr-target-display">${this.settings.customDhikrTargets[dhikr.key] || dhikr.target}x</span>
                        <input type="number" class="dhikr-custom-target-input" min="1" value="${this.settings.customDhikrTargets[dhikr.key] || dhikr.target}" style="display:none;">
                        <button class="edit-target-btn" style="display:none;"><i class="fas fa-check"></i></button>
                    </div>
                    
                    <!-- Expandable content -->
                    <div class="dhikr-details">
                    <div class="dhikr-expanded-translation">
                            <h4><i class="fas fa-language"></i> ${translationLabel}</h4>
                            <p>${(currentLang === 'bn' && dhikr.bn_translation) ? dhikr.bn_translation : dhikr.translation}</p>
                        </div>
                        <div class="dhikr-expanded-meaning">
                            <h4><i class="fas fa-lightbulb"></i> ${meaningLabel}</h4>
                            <p>${meaningText}</p>
                        </div>
                        <div class="dhikr-expanded-reward">
                            <h4><i class="fas fa-gift"></i> ${rewardLabel}</h4>
                            <p>${rewardText}</p>
                        </div>
                        
                    </div>
                </div>
            `;

            // Add click event for card expansion (right-click or double-click)
            dhikrCard.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.toggleDhikrCardExpansion(dhikrCard);
            });
            
            dhikrCard.addEventListener('dblclick', (e) => {
                e.preventDefault();
                this.toggleDhikrCardExpansion(dhikrCard);
            });

            // Single click still selects the dhikr
            dhikrCard.addEventListener('click', (e) => {
                // Only select if not expanded or if clicking on non-expanded area
                if (!dhikrCard.classList.contains('expanded') || e.detail === 1) {
                    this.selectDhikr(dhikr.key);
                }
            });

            dhikrGrid.appendChild(dhikrCard);

            // Add event listeners for custom target
            const targetDisplay = dhikrCard.querySelector('.dhikr-target-display');
            const customInput = dhikrCard.querySelector('.dhikr-custom-target-input');
            const editBtn = dhikrCard.querySelector('.edit-target-btn');

            targetDisplay.addEventListener('click', () => {
                targetDisplay.style.display = 'none';
                customInput.style.display = 'inline-block';
                editBtn.style.display = 'inline-block';
                customInput.focus();
            });

            editBtn.addEventListener('click', () => {
                const newTarget = parseInt(customInput.value);
                if (!isNaN(newTarget) && newTarget > 0) {
                    this.settings.customDhikrTargets[dhikr.key] = newTarget;
                    this.saveSettings();
                    targetDisplay.textContent = `${newTarget}x`;
                    // If this dhikr is currently selected, update the main counter target
                    if (this.dhikrData[this.currentDhikrIndex].key === dhikr.key) {
                        this.targetCount = newTarget;
                        this.updateDisplay();
                        this.updateProgressRing();
                    }
                }
                targetDisplay.style.display = 'inline';
                customInput.style.display = 'none';
                editBtn.style.display = 'none';
            });

            customInput.addEventListener('blur', () => {
                const newTarget = parseInt(customInput.value);
                // Only save if the value has changed and is valid
                if (!isNaN(newTarget) && newTarget > 0 && newTarget !== (this.settings.customDhikrTargets[dhikr.key] || dhikr.target)) {
                    this.settings.customDhikrTargets[dhikr.key] = newTarget;
                    this.saveSettings();
                    targetDisplay.textContent = `${newTarget}x`;
                    // If this dhikr is currently selected, update the main counter target
                    if (this.dhikrData[this.currentDhikrIndex].key === dhikr.key) {
                        this.targetCount = newTarget;
                        this.updateDisplay();
                        this.updateProgressRing();
                    }
                } else {
                    // Revert input value if invalid or not changed
                    customInput.value = this.settings.customDhikrTargets[dhikr.key] || dhikr.target;
                }
                targetDisplay.style.display = 'inline';
                customInput.style.display = 'none';
                editBtn.style.display = 'none';
            });
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10); // Small delay to trigger CSS transition
        
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove(), { once: true });
        }, 3000);
    }

    toggleDhikrCardExpansion(card) {
        const isExpanded = card.classList.contains('expanded');
        
        // Close all other expanded cards first
        document.querySelectorAll('.dhikr-option.expanded').forEach(otherCard => {
            if (otherCard !== card) {
                otherCard.classList.remove('expanded');
            }
        });

        // Toggle current card
        if (isExpanded) {
            card.classList.remove('expanded');
        } else {
            card.classList.add('expanded');
            // Scroll card into view smoothly
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}

// Initialize the dhikr counter when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.dhikrCounter = new DhikrCounter();
    
    // Add event listener for sync completion to reload data
    document.addEventListener('dataSyncComplete', (event) => {
        console.log('Dhikr Counter: Data sync completed, reloading data from storage');
        if (window.dhikrCounter) {
            window.dhikrCounter.reloadDataFromStorage();
        }
    });
    
    // Add event listener for logout to clear session
    document.addEventListener('userLoggedOut', () => {
        console.log('Dhikr Counter: User logged out, clearing session');
        if (window.dhikrCounter) {
            window.dhikrCounter.resetSession();
        }
    });
});

// Add some CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translate(-50%, -60%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -40%);
        }
    }

    .completion-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-card);
        border: 2px solid var(--accent);
        border-radius: 20px;
        padding: 32px;
        text-align: center;
        z-index: 1000;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideIn 0.5s ease-out forwards;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
    }

    .completion-message.hide {
        animation: slideOut 0.5s ease-in forwards;
    }

    .completion-icon {
        font-size: 4rem;
        line-height: 1;
    }

    .completion-text h3 {
        font-size: 2rem;
        color: var(--accent);
        margin-bottom: 10px;
    }

    .completion-text p {
        font-size: 1.1rem;
        color: var(--text-primary);
        margin-bottom: 5px;
    }

    .reward-text {
        font-style: italic;
        color: var(--text-secondary);
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(120%);
        transition: transform 0.3s ease-out;
    }

    .notification.success {
        background: #10b981;
    }

    .notification.info {
        background: var(--accent);
    }

    .notification.warning {
        background: #f59e0b;
    }

    .notification.error {
        background: #ef4444;
    }

    .notification.show {
        transform: translateX(0);
    }

    .progress-ring__circle.pulsing-glow {
        animation: pulsing-glow 1.5s infinite alternate;
    }

    @keyframes pulsing-glow {
        from {
            filter: drop-shadow(0 0 25px var(--accent)C0) drop-shadow(0 0 10px var(--accent)A0);
            stroke-width: 12px;
        }
        to {
            filter: drop-shadow(0 0 40px var(--accent)FF) drop-shadow(0 0 20px var(--accent)E0);
            stroke-width: 16px;
        }
    }

    .tap-button.counting {
        animation: tap-animation 0.2s ease-out;
    }

    @keyframes tap-animation {
        0% { transform: scale(1); }
        50% { transform: scale(0.95); }
        100% { transform: scale(1); }
    }

    .dhikr-option.active .dhikr-option-content {
        animation: active-dhikr-glow 1.5s infinite alternate;
    }

    @keyframes active-dhikr-glow {
        from {
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
        to {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
        }
    }

    .progress-ring__circle.celebrate-glow {
        animation: celebrate-ring-glow 1s forwards;
    }

    @keyframes celebrate-ring-glow {
        0% {
            filter: drop-shadow(0 0 20px var(--accent)C0);
            stroke-width: 12px;
        }
        50% {
            filter: drop-shadow(0 0 50px var(--accent)FF);
            stroke-width: 16px;
        }
        100% {
            filter: drop-shadow(0 0 20px var(--accent)C0);
            stroke-width: 12px;
        }
    }
`;
document.head.appendChild(style);