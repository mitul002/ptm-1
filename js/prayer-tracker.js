// js/prayer-tracker.js

class PrayerTracker {
    constructor() {
        this.currentDate = new Date();
        this.prayerTrackerData = {};
        this.prayerTimesData = {};
        this.allPrayers = [];
        this.obligatoryPrayers = [];
        this.remindersEnabled = true;
        // this.timeFormat = '12h'; // '12h' or '24h' - Now managed by sharedApp
        // this.language is now managed by sharedApp
        this.notificationSound = true;
        this.qazaCount = 0;
        this.missedPrayerSortOrder = 'newest-first'; // Default sort order

        this.PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        this.OPTIONAL_PRAYER_NAMES = ['Ishraq', 'Chasht', 'Awwabin', 'Tahajjud'];
        this.DISPLAY_ORDER = ['Fajr', 'Ishraq', 'Chasht', 'Dhuhr', 'Asr', 'Maghrib', 'Awwabin', 'Isha', 'Tahajjud'];

        // DOM Elements
        this.currentDateEl = document.getElementById('currentDate');
        this.prayerTrackerGridEl = document.getElementById('prayerTrackerGrid');
        this.prevDayBtn = document.getElementById('prevDay');
        this.nextDayBtn = document.getElementById('nextDay');
        this.weeklyCompletionEl = document.getElementById('weeklyCompletion');
        this.monthlyCompletionEl = document.getElementById('monthlyCompletion');
        this.monthlyCalendarEl = document.getElementById('monthlyCalendar');
        this.optionalPrayersEl = document.getElementById('optionalPrayers'); // Updated ID to match function
        this.exportPdfBtn = document.getElementById('exportPdf');
        this.resetDataBtn = document.getElementById('resetData');
        this.missedPrayerRemindersEl = document.getElementById('missedPrayerReminders');
        this.dailyAnalysisCardEl = document.getElementById('dailyAnalysisCard'); // New
        this.settingsModalEl = document.getElementById('settingsModal'); // New
        this.openSettingsBtn = document.getElementById('openSettingsBtn'); // New
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn'); // New
        this.missedPrayersListEl = document.getElementById('missedPrayersList'); // New
        this.qazaCountEl = null; // Will be set dynamically
        this.qazaIncrementBtn = null;
        this.qazaDecrementBtn = null;

        this.weeklyMissedEl = document.getElementById('weeklyMissed');
        this.monthlyMissedEl = document.getElementById('monthlyMissed');
        this.weeklyQazaEl = document.getElementById('weeklyQaza');
        this.monthlyQazaEl = document.getElementById('monthlyQaza');

        // Translations are now managed by sharedApp
    }

    async checkAndMarkMissedPrayers() {
        const missedPrayerOption = localStorage.getItem('missedPrayerOption');
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize for comparison
        let needsSave = false;
        let hasDataChanges = false;

        // Logic for "All Days" (catch up past missed prayers)
        if (missedPrayerOption === 'all-days') {
            const lastVisitString = localStorage.getItem('lastVisitDate');
            if (lastVisitString) {
                const lastVisitDate = new Date(lastVisitString);
                const lastVisitDay = new Date(lastVisitString);
                lastVisitDay.setHours(0, 0, 0, 0);

                if (lastVisitDay < today) {
                    for (let d = new Date(lastVisitDay); d < today; d.setDate(d.getDate() + 1)) {
                        const dateString = this.formatDate(d);
                        if (!this.prayerTrackerData[dateString]) {
                            this.prayerTrackerData[dateString] = {};
                        }
                        const dayData = this.prayerTrackerData[dateString];

                        this.obligatoryPrayers.forEach(prayerName => {
                            if (!dayData[prayerName]) {
                                dayData[prayerName] = 'missed';
                                needsSave = true;
                                hasDataChanges = true;
                            }
                        });
                    }
                }
            }
        }

        // Logic for "Current Day Only" and "All Days" (auto-update current day's missed prayers)
        if (missedPrayerOption === 'current-day' || missedPrayerOption === 'all-days') {
            const todayString = this.formatDate(now);
            const dateString = this.formatDate(this.currentDate); // This is the currently displayed date

            // Only auto-mark for the current actual day
            if (todayString === dateString) {
                const dayData = this.prayerTrackerData[dateString] || {};
                const prayersToTrack = this.allPrayers.filter(prayer => this.obligatoryPrayers.includes(prayer.name));

                prayersToTrack.forEach(prayer => {
                    const prayerName = prayer.name;
                    const prayerDateTime = prayer.endParsed;

                    if (now > prayerDateTime && !dayData[prayerName]) {
                        this.updatePrayerStatus(prayerName, 'missed');
                        this.showNotification('Prayer Missed', `You have missed the ${prayerName} prayer.`);
                        hasDataChanges = true;
                        needsSave = true; // updatePrayerStatus already saves, but good to track
                    }
                });
            }
        }

        // Update last visit date regardless of missed prayer option
        const lastVisitString = localStorage.getItem('lastVisitDate');
        if (!lastVisitString || this.formatDate(now) !== this.formatDate(new Date(lastVisitString))) {
            localStorage.setItem('lastVisitDate', now.toISOString());
        }

        if (needsSave) {
            this.saveData();
        }

        // Force Firebase sync if data was changed by auto-missed prayer marking
        if (hasDataChanges && window.realtimeSync && window.firebaseAuth && window.firebaseAuth.currentUser) {
            try {
                console.log('🔄 Auto-missed prayer marking triggered Firebase sync');
                await window.realtimeSync.forceSyncAll();
                console.log('✅ Auto-missed prayer data synced to Firebase successfully');
            } catch (error) {
                console.error('❌ Failed to sync auto-missed prayer data to Firebase:', error);
            }
        }
    }

    async init() {
        this.loadData();
        await this.loadPrayerTimesForDate(this.currentDate);
        this.render();
        this.addEventListeners();
        // Initial check and setup for periodic checks
        await this.checkAndMarkMissedPrayers();
        setInterval(() => this.checkAndMarkMissedPrayers(), 30000);
    }

    loadData() {
        const trackerData = localStorage.getItem('prayerTrackerData');
        if (trackerData) {
            try {
                this.prayerTrackerData = JSON.parse(trackerData);
                // Ensure it's a valid object, not null
                if (!this.prayerTrackerData || typeof this.prayerTrackerData !== 'object') {
                    console.warn('Invalid prayer tracker data, resetting to empty object');
                    this.prayerTrackerData = {};
                }
            } catch (error) {
                console.error('Error parsing prayer tracker data:', error);
                this.prayerTrackerData = {};
            }
        } else {
            this.prayerTrackerData = {};
        }

        const obligatoryPrayers = localStorage.getItem('obligatoryPrayers');
        if (obligatoryPrayers) {
            try {
                const parsedPrayers = JSON.parse(obligatoryPrayers);
                if (parsedPrayers && Array.isArray(parsedPrayers)) {
                    this.obligatoryPrayers = parsedPrayers;
                } else {
                    console.warn('Invalid obligatory prayers data, resetting to default.');
                    this.obligatoryPrayers = [...this.PRAYER_NAMES];
                }
            } catch (error) {
                console.error('Error parsing obligatory prayers data:', error);
                this.obligatoryPrayers = [...this.PRAYER_NAMES];
            }
        } else {
            this.obligatoryPrayers = [...this.PRAYER_NAMES];
        }

        const reminders = localStorage.getItem('missedPrayerReminders');
        if (reminders) {
            this.remindersEnabled = JSON.parse(reminders);
        }

        // language is now managed by sharedApp

        const notificationSound = localStorage.getItem('notificationSound');
        if (notificationSound) {
            this.notificationSound = JSON.parse(notificationSound);
        }

        const qazaCount = localStorage.getItem('qazaCount');
        if (qazaCount) {
            this.qazaCount = parseInt(qazaCount);
        }

        const missedPrayerSortOrder = localStorage.getItem('missedPrayerSortOrder');
        if (missedPrayerSortOrder) {
            this.missedPrayerSortOrder = missedPrayerSortOrder;
        }
    }

    saveData() {
        // Ensure prayerTrackerData is a valid object before saving
        if (!this.prayerTrackerData || typeof this.prayerTrackerData !== 'object') {
            console.warn('Prayer tracker data is invalid in saveData, resetting to empty object');
            this.prayerTrackerData = {};
        }
        
        localStorage.setItem('prayerTrackerData', JSON.stringify(this.prayerTrackerData));
        localStorage.setItem('obligatoryPrayers', JSON.stringify(this.obligatoryPrayers));
        localStorage.setItem('missedPrayerReminders', JSON.stringify(this.remindersEnabled));
        // localStorage.setItem('timeFormat', this.timeFormat); // Now managed by sharedApp
        // this.language is now managed by sharedApp
        localStorage.setItem('notificationSound', JSON.stringify(this.notificationSound));
        localStorage.setItem('qazaCount', this.qazaCount.toString());
        localStorage.setItem('missedPrayerSortOrder', this.missedPrayerSortOrder);

        // Sync to Firebase if user is logged in
        console.log("Attempting to sync prayer tracker data (saveData) to Firebase.");
        console.log("window.firebaseAuth:", window.firebaseAuth);
        console.log("window.firebaseAuth.currentUser:", window.firebaseAuth ? window.firebaseAuth.currentUser : 'N/A');
        console.log("window.dataSync:", window.dataSync);
        if (window.firebaseAuth && window.firebaseAuth.currentUser && window.dataSync) {
            console.log("Condition met: Syncing prayer tracker data (saveData).");
            window.dataSync.uploadLocalDataToFirebase(window.firebaseAuth.currentUser.uid);
        } else {
            console.log("Condition not met: Not syncing prayer tracker data (saveData).");
        }
    }

    async loadPrayerTimesForDate(date) {
        const dateString = this.formatDate(date);
        const location = JSON.parse(localStorage.getItem('userLocation'));

        if (!location) {
            this.prayerTrackerGridEl.innerHTML = '<p>Please set your location on the main page first.</p>';
            return;
        }

        const multiDayCache = JSON.parse(localStorage.getItem('multiDayPrayerCache')) || {};
        const dateKey = date.toDateString();

        if (multiDayCache[dateKey] && multiDayCache[dateKey].today && multiDayCache[dateKey].tomorrow) {
            this.prayerTimesData = {
                today: multiDayCache[dateKey].today.timings,
                tomorrow: multiDayCache[dateKey].tomorrow.timings
            };
        } else {
            await this.fetchPrayerTimesForDate(date, location);
        }
        
        if(this.prayerTimesData.today && this.prayerTimesData.tomorrow) {
            this.allPrayers = this.calculateAllTimes(this.prayerTimesData.today, this.prayerTimesData.tomorrow);
        }
    }

    async fetchPrayerTimesForDate(date, location) {
        const dateString = this.formatDate(date);
        const method = localStorage.getItem('prayerMethod') || 3;
        const school = localStorage.getItem('prayerSchool') || 0;

        const tomorrow = new Date(date);
        tomorrow.setDate(date.getDate() + 1);
        const tomorrowDateString = this.formatDate(tomorrow);

        try {
            const [todayResponse, tomorrowResponse] = await Promise.all([
                fetch(`https://api.aladhan.com/v1/timings/${dateString}?latitude=${location.lat}&longitude=${location.lon}&method=${method}&school=${school}`),
                fetch(`https://api.aladhan.com/v1/timings/${tomorrowDateString}?latitude=${location.lat}&longitude=${location.lon}&method=${method}&school=${school}`)
            ]);

            const todayData = await todayResponse.json();
            const tomorrowData = await tomorrowResponse.json();

            if (todayData.code === 200 && todayData.status === 'OK' && tomorrowData.code === 200 && tomorrowData.status === 'OK') {
                this.prayerTimesData = {
                    today: todayData.data.timings,
                    tomorrow: tomorrowData.data.timings
                };
            } else {
                this.prayerTimesData = {};
            }
        } catch (error) {
            console.error('Error fetching prayer times:', error);
            // Enhanced error handling for CORS/file system issues
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                alert('Unable to load prayer times. This may be due to opening the file directly from your file system. Please serve the app using a local web server:\n\n1. Open command prompt/terminal.\n2. Navigate to the project folder (e.g., cd H:\\Download\\prayer_times).\n3. Run: python -m http.server\n4. Open http://localhost:8000 in your browser.\n\nFor more details, check the console or app documentation.');
            } else {
                alert('Error loading prayer times. Please check your internet connection and try again.');
            }
            this.prayerTimesData = {};
        }
    }

    render() {
        this.renderTracker();
        this.renderDailyAnalysis(); // New
        this.renderAnalytics();
        this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        this.renderSettings();
        this.renderMissedPrayersReport();
    }

    renderTracker() {
        const dateString = this.formatDate(this.currentDate);
        const locale = window.sharedApp.currentLang === 'bn' ? 'bn-BD' : 'en-US';
        this.currentDateEl.textContent = new Date(this.currentDate).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        this.prayerTrackerGridEl.innerHTML = '';
        
        // Ensure prayerTrackerData is a valid object
        if (!this.prayerTrackerData || typeof this.prayerTrackerData !== 'object') {
            console.warn('Prayer tracker data is invalid, resetting to empty object');
            this.prayerTrackerData = {};
        }
        
        const dayData = this.prayerTrackerData[dateString] || {};

        // Filter allPrayers to only include user-selected obligatory ones
        let prayersToDisplay = this.allPrayers.filter(prayer => this.obligatoryPrayers.includes(prayer.name));

        // Sort prayersToDisplay based on DISPLAY_ORDER
        prayersToDisplay.sort((a, b) => {
            const indexA = this.DISPLAY_ORDER.indexOf(a.name);
            const indexB = this.DISPLAY_ORDER.indexOf(b.name);
            return indexA - indexB;
        });

        prayersToDisplay.forEach(prayer => {
            const prayerName = prayer.name;
            const prayerRow = document.createElement('div');
            prayerRow.classList.add('prayer-row');
            const status = dayData[prayerName] || 'pending';
            const prayerTime = `${this.formatTime(prayer.start)} - ${this.formatTime(prayer.end)}`; // Use formatTime

            prayerRow.innerHTML = `
                <div class="prayer-row-header">
                    <span class="prayer-row-name">${this.getTranslation(prayerName)}</span>
                    <span class="prayer-row-time">${prayerTime}</span>
                </div>
                <div class="prayer-status-options" data-prayer="${prayerName}">
                    <button class="status-btn ${status === 'completed' ? 'completed' : ''}" data-status="completed">${this.getTranslation('Completed')}</button>
                    <button class="status-btn ${status === 'missed' ? 'missed' : ''}" data-status="missed">${this.getTranslation('Missed')}</button>
                    <button class="status-btn ${status === 'qaza' ? 'qaza' : ''}" data-status="qaza">${this.getTranslation('Qaza')}</button>
                </div>
            `;
            this.prayerTrackerGridEl.appendChild(prayerRow);
        });
    }

    renderDailyAnalysis() {
        const dateString = this.formatDate(this.currentDate);
        const dayData = this.prayerTrackerData[dateString] || {};
        let completed = 0;
        let missed = 0;
        let qaza = 0;

        this.obligatoryPrayers.forEach(prayerName => {  
            const status = dayData[prayerName];
            if (status === 'completed') completed++;
            else if (status === 'missed') missed++;
            else if (status === 'qaza') qaza++;
        });

        this.dailyAnalysisCardEl.innerHTML = `
            <h4>${this.getTranslation('Daily Analysis')}</h4>
            <div class="daily-analysis-summary">
                <div class="daily-analysis-item">
                    <span class="daily-analysis-count" style="color: var(--success);">${completed}</span>
                    <span class="daily-analysis-label">${this.getTranslation('Completed')}</span>
                </div>
                <div class="daily-analysis-item">
                    <span class="daily-analysis-count" style="color: var(--danger);">${missed}</span>
                    <span class="daily-analysis-label">${this.getTranslation('Missed')}</span>
                </div>
                <div class="daily-analysis-item">
                    <span class="daily-analysis-count" style="color: var(--warning);">${qaza}</span>
                    <span class="daily-analysis-label">${this.getTranslation('Qaza')}</span>
                </div>
            </div>
        `;
    }

    renderAnalytics() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        const weeklyPercentage = this.calculateCompletion(weekStart, today);
        this.weeklyCompletionEl.textContent = `${weeklyPercentage}%`;

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const monthlyPercentage = this.calculateCompletion(monthStart, monthEnd);
        this.monthlyCompletionEl.textContent = `${monthlyPercentage}%`;

        // New stats
        const weeklyMissedStats = this.calculateStats(weekStart, today, 'missed');
        const weeklyMissedPercentage = weeklyMissedStats.totalPossible > 0 ? Math.round((weeklyMissedStats.count / weeklyMissedStats.totalPossible) * 100) : 0;
        this.weeklyMissedEl.textContent = `${weeklyMissedPercentage}%`;

        const monthlyMissedStats = this.calculateStats(monthStart, monthEnd, 'missed');
        const monthlyMissedPercentage = monthlyMissedStats.totalPossible > 0 ? Math.round((monthlyMissedStats.count / monthlyMissedStats.totalPossible) * 100) : 0;
        this.monthlyMissedEl.textContent = `${monthlyMissedPercentage}%`;

        const weeklyQazaStats = this.calculateStats(weekStart, today, 'qaza');
        const weeklyQazaPercentage = weeklyQazaStats.totalPossible > 0 ? Math.round((weeklyQazaStats.count / weeklyQazaStats.totalPossible) * 100) : 0;
        this.weeklyQazaEl.textContent = `${weeklyQazaPercentage}%`;

        const monthlyQazaStats = this.calculateStats(monthStart, monthEnd, 'qaza');
        const monthlyQazaPercentage = monthlyQazaStats.totalPossible > 0 ? Math.round((monthlyQazaStats.count / monthlyQazaStats.totalPossible) * 100) : 0;
        this.monthlyQazaEl.textContent = `${monthlyQazaPercentage}%`;
    }

    calculateStats(startDate, endDate, status) {
        let count = 0;
        let totalPossible = 0;
        const today = new Date();

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d > today) continue;
            const dateString = this.formatDate(d);
            const dayData = this.prayerTrackerData[dateString];

            this.obligatoryPrayers.forEach(prayerName => {
                totalPossible++; // Increment total possible for each obligatory prayer
                if (dayData && dayData[prayerName] === status) {
                    count++;
                }
            });
        }
        return { count, totalPossible }; // Return an object with both values
    }

    renderCalendar(year, month) {
        this.monthlyCalendarEl.innerHTML = '';
        const locale = window.sharedApp.currentLang === 'bn' ? 'bn-BD' : 'en-US';

        const monthName = new Date(year, month).toLocaleString(locale, { month: 'long' });
        const yearFormatted = new Intl.NumberFormat(locale).format(year);

        const header = document.createElement('div');
        header.classList.add('calendar-header');
        header.innerHTML = `
            <button id="prevMonth" class="btn"><i class="fas fa-chevron-left"></i></button>
            <h4>${monthName} ${yearFormatted}</h4>
            <button id="nextMonth" class="btn"><i class="fas fa-chevron-right"></i></button>
        `;
        this.monthlyCalendarEl.appendChild(header);

        const calendarGrid = document.createElement('div');
        calendarGrid.classList.add('calendar-grid');
        this.monthlyCalendarEl.appendChild(calendarGrid);

        // Dynamically generate days of the week based on locale
        const daysOfWeek = [];
        // Starting with a known Sunday (Jan 1, 2023) to get the week days in order
        for (let i = 1; i <= 7; i++) {
            const day = new Date(Date.UTC(2023, 0, i)); 
            daysOfWeek.push(day.toLocaleString(locale, { weekday: 'short' }));
        }

        daysOfWeek.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day', 'day-name');
            dayEl.textContent = day;
            calendarGrid.appendChild(dayEl);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day');
            calendarGrid.appendChild(emptyCell);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = new Intl.NumberFormat(locale).format(i); // Localize numbers
            const date = new Date(year, month, i);
            dayCell.dataset.date = this.formatDate(date);

            if (this.formatDate(date) === this.formatDate(this.currentDate)) {
                dayCell.classList.add('selected');
            }

            const dateString = this.formatDate(date);
            const dayData = this.prayerTrackerData[dateString];

            if (dayData) {
                const prayerDots = document.createElement('div');
                prayerDots.classList.add('prayer-dots');
                this.obligatoryPrayers.forEach(prayerName => {
                    const status = dayData[prayerName];
                    if (status) {
                        const dot = document.createElement('span');
                        dot.classList.add('prayer-dot', status);
                        prayerDots.appendChild(dot);
                    }
                });
                dayCell.appendChild(prayerDots);
            }
            calendarGrid.appendChild(dayCell);
        }

        document.getElementById('prevMonth').addEventListener('click', () => {
            const newDate = new Date(year, month - 1, 1);
            this.renderCalendar(newDate.getFullYear(), newDate.getMonth());
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            const newDate = new Date(year, month + 1, 1);
            this.renderCalendar(newDate.getFullYear(), newDate.getMonth());
        });
    }

    renderSettings() {
        // Optional Prayers to include in tracking
        this.optionalPrayersEl.innerHTML = '';
        this.OPTIONAL_PRAYER_NAMES.forEach(prayerName => {
            const isChecked = this.obligatoryPrayers.includes(prayerName);
            const checkbox = document.createElement('label');
            checkbox.innerHTML = `
                <input type="checkbox" value="${prayerName}" ${isChecked ? 'checked' : ''}>
                ${this.getTranslation(prayerName)}
            `;
            this.optionalPrayersEl.appendChild(checkbox);
        });

        // Reminders
        this.missedPrayerRemindersEl.checked = this.remindersEnabled;

        // Time Format
        // const timeFormatRadios = `
        //     <div class="setting-item">
        //         <label>
        //             <input type="radio" name="timeFormat" value="12h" ${this.timeFormat === '12h' ? 'checked' : ''}>
        //             ${this.getTranslation('12-hour')}
        //         </label>
        //     </div>
        //     <div class="setting-item">
        //         <label>
        //             <input type="radio" name="timeFormat" value="24h" ${this.timeFormat === '24h' ? 'checked' : ''}>
        //             ${this.getTranslation('24-hour')}
        //         </label>
        //     </div>
        // `;
        // // Assuming a div with id="timeFormatSettings" in modal-body
        // const timeFormatSettingsEl = this.settingsModalEl.querySelector('#timeFormatSettings');
        // if (timeFormatSettingsEl) timeFormatSettingsEl.innerHTML = timeFormatRadios;

        // Language
        const languageSelect = `
            <div class="setting-item">
                <label for="languageSelect">${this.getTranslation('Language')}</label>
                <select id="languageSelect">
                    <option value="en" ${this.language === 'en' ? 'selected' : ''}>${this.getTranslation('EN')}</option>    
                    <option value="bn" ${this.language === 'bn' ? 'selected' : ''}>${this.getTranslation('BN')}</option>
                </select>
            </div>
        `;
        const languageSettingsEl = this.settingsModalEl.querySelector('#languageSettings');
        if (languageSettingsEl) languageSettingsEl.innerHTML = languageSelect;

        // Notification Sound
        const notificationSoundCheckbox = `
            <div class="setting-item">
                <label>
                    <input type="checkbox" id="notificationSound" ${this.notificationSound ? 'checked' : ''}>
                    ${this.getTranslation('Enable notification sound')}
                </label>
            </div>
        `;
        const notificationSoundSettingsEl = this.settingsModalEl.querySelector('#notificationSoundSettings');
        if (notificationSoundSettingsEl) notificationSoundSettingsEl.innerHTML = notificationSoundCheckbox;

        // Qaza Counter
     
        const qazaCounterHtml = `
            <div class="setting-item">
                <span id="qazaCountDisplay">${this.getTranslation('Qaza Counter')}: ${this.qazaCount}</span>
            </div>
            <div class="setting-item">
                <button id="qazaIncrementBtn" class="btn">${this.getTranslation('Increment')}</button>
                <button id="qazaDecrementBtn" class="btn secondary">${this.getTranslation('Decrement')}</button>
            </div>
        `;
      
        const qazaCounterSettingsEl = this.settingsModalEl.querySelector('#qazaCounterSettings');
        if (qazaCounterSettingsEl) qazaCounterSettingsEl.innerHTML = qazaCounterHtml;

        

        // Set dynamic elements for event listeners
        this.qazaCountEl = this.settingsModalEl.querySelector('#qazaCountDisplay');
        this.qazaIncrementBtn = this.settingsModalEl.querySelector('#qazaIncrementBtn');
        this.qazaDecrementBtn = this.settingsModalEl.querySelector('#qazaDecrementBtn');
    }

    renderMissedPrayersReport() {
        this.missedPrayersListEl.innerHTML = ''; // Clear previous content
        const missedPrayers = [];
        const prayersToTrack = [...this.PRAYER_NAMES, ...this.obligatoryPrayers.filter(p => !this.PRAYER_NAMES.includes(p))];


        // Iterate through all dates in prayerTrackerData
        for (const dateString in this.prayerTrackerData) {
            const dayData = this.prayerTrackerData[dateString];
            for (const prayerName in dayData) {
                if (dayData[prayerName] === 'missed' && prayersToTrack.includes(prayerName)) {
                    missedPrayers.push({ date: dateString, prayer: prayerName });
                }
            }
        }

        // Sort missed prayers based on user preference
        if (this.missedPrayerSortOrder === 'newest-first') {
            missedPrayers.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
            // Default to oldest-first
            missedPrayers.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        if (missedPrayers.length === 0) {
            this.missedPrayersListEl.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">${this.getTranslation('no-missed-prayers')}</p>`;
            return;
        }

        missedPrayers.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('missed-prayer-card');
            card.dataset.date = item.date;
            card.dataset.prayer = item.prayer;

            card.innerHTML = `
                <div class="missed-prayer-card-info">
                    <span class="date">${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span class="prayer-name">${this.getTranslation(item.prayer)}</span>
                </div>
                <button class="status-button missed" data-status="missed"></button>
            `;
            this.missedPrayersListEl.appendChild(card);
        });
    }



    addEventListeners() {
        this.prevDayBtn.addEventListener('click', async () => {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
            await this.loadPrayerTimesForDate(this.currentDate);
            this.render();
        });

        this.nextDayBtn.addEventListener('click', async () => {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
            await this.loadPrayerTimesForDate(this.currentDate);
            this.render();
        });

        this.prayerTrackerGridEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-btn')) {
                const prayerName = e.target.parentElement.dataset.prayer;
                const newStatus = e.target.dataset.status;
                this.updatePrayerStatus(prayerName, newStatus);
            }
        });

        this.optionalPrayersEl.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const prayerName = e.target.value;
                if (e.target.checked) {
                    this.obligatoryPrayers.push(prayerName);
                } else {
                    this.obligatoryPrayers = this.obligatoryPrayers.filter(p => p !== prayerName);
                }
                this.saveData();
                this.renderAnalytics();
            }
        });

        this.missedPrayerRemindersEl.addEventListener('change', (e) => {
            this.remindersEnabled = e.target.checked;
            this.saveData();
            if (this.remindersEnabled && Notification.permission !== 'granted') {
                Notification.requestPermission();
            }
        });

        this.exportPdfBtn.addEventListener('click', () => this.exportToPdf());
        this.resetDataBtn.addEventListener('click', () => this.resetTrackerData());

        // Settings Modal Event Listeners
        this.openSettingsBtn.addEventListener('click', () => this.settingsModalEl.classList.add('visible'));
        this.closeSettingsBtn.addEventListener('click', () => this.settingsModalEl.classList.remove('visible'));
        this.settingsModalEl.addEventListener('click', (e) => {
            if (e.target === this.settingsModalEl) { // Clicked on overlay
                this.settingsModalEl.classList.remove('visible');
            }
        });

        // New Setting Event Listeners
        // const timeFormatSettingsEl = this.settingsModalEl.querySelector('#timeFormatSettings');
        // if (timeFormatSettingsEl) {
        //     timeFormatSettingsEl.addEventListener('change', (e) => {
        //         if (e.target.name === 'timeFormat') {
        //             this.timeFormat = e.target.value;
        //             this.saveData();
        //             this.renderTracker(); // Re-render to apply new time format
        //         }
        //     });
        // }

        const languageSelectEl = this.settingsModalEl.querySelector('#languageSelect');
        if (languageSelectEl) {
            languageSelectEl.addEventListener('change', (e) => {
                this.language = e.target.value;
                this.saveData();
                this.render(); // Re-render all to apply new language
            });
        }

        const notificationSoundEl = this.settingsModalEl.querySelector('#notificationSound');
        if (notificationSoundEl) {
            notificationSoundEl.addEventListener('change', (e) => {
                this.notificationSound = e.target.checked;
                this.saveData();
            });
        }

        this.monthlyCalendarEl.addEventListener('click', async (e) => {
            if (e.target.classList.contains('calendar-day') && e.target.dataset.date) {
              
                const [year, month, day] = e.target.dataset.date.split('-').map(Number);
                this.currentDate = new Date(year, month - 1, day);
                
                await this.loadPrayerTimesForDate(this.currentDate);
                this.render(); // Re-render with new prayer times
               
            }
        });

        this.missedPrayersListEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-button')) {
                const button = e.target;
                const card = button.closest('.missed-prayer-card');
                const date = card.dataset.date;
                const prayer = card.dataset.prayer;

                // Apply qaza-transition class for animation
                card.classList.add('qaza-transition');

                // After animation, update status and remove card from DOM
                card.addEventListener('transitionend', () => {
                    this.updatePrayerStatus(prayer, 'qaza', date); // Update status to qaza
                    card.remove(); // Remove card from display
                    this.renderDailyAnalysis(); // Re-render daily analysis to reflect qaza count
                }, { once: true });
            }
        });

        const backupButton = document.getElementById('backup-data-button');
        if (backupButton) {
            backupButton.addEventListener('click', () => {
                this.backupData();
            });
        }

        const restoreButton = document.getElementById('restore-data-button');
        const restoreFileInput = document.getElementById('restore-file-input');
        if (restoreButton && restoreFileInput) {
            restoreButton.addEventListener('click', () => {
                restoreFileInput.click();
            });
            restoreFileInput.addEventListener('change', (event) => {
                this.restoreData(event);
            });
        }

        

        const sortMissedPrayersBtn = document.getElementById('sortMissedPrayers');
        if (sortMissedPrayersBtn) {
            sortMissedPrayersBtn.addEventListener('click', () => {
                this.missedPrayerSortOrder = this.missedPrayerSortOrder === 'oldest-first' ? 'newest-first' : 'oldest-first';
                this.saveData();
                this.renderMissedPrayersReport();
            });
        }

        // Analytics card expansion logic
        const analyticsCard = document.querySelector('.analytics-section'); // Target the main analytics card
        if (analyticsCard) {
            analyticsCard.addEventListener('dblclick', (e) => {
                e.preventDefault(); // Prevent text selection on double click
                this.toggleAnalyticsCardExpansion();
            });
            analyticsCard.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // Prevent default right-click menu
                this.toggleAnalyticsCardExpansion();
            });
        }
    }

    backupData() {
        const data = localStorage.getItem('prayerTrackerData');
        if (!data) {
            alert('No data to backup.');
            return;
        }
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prayer-tracker-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    restoreData(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Basic validation
                if (typeof data === 'object' && data !== null) {
                    localStorage.setItem('prayerTrackerData', JSON.stringify(data));
                    alert('Data restored successfully. The page will now reload.');
                    location.reload();
                } else {
                    alert('Invalid backup file.');
                }
            } catch (error) {
                alert('Error reading backup file.');
                console.error('Error parsing backup file:', error);
            }
        };
        reader.readAsText(file);
    }



    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0);

        const locale = window.sharedApp.currentLang === 'bn' ? 'bn-BD' : 'en-US';
        const savedTimeFormat = window.sharedApp.getSafeStorageItem('timeFormat', '12h'); // Get from sharedApp

        const options = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: savedTimeFormat === '12h' // Use the shared time format
        };

        return date.toLocaleTimeString(locale, options);
    }

    getTranslation(key) {
        // Use the global sharedApp for translations
        const lang = window.sharedApp.currentLang;
        const translations = window.sharedApp.translations[lang];
        return translations[key] || key;
    }

    applyLanguage() {
        // This method is called by the sharedApp when the language changes
        this.render();
    }

    updatePrayerStatus(prayerName, newStatus, dateToUpdate = null) {
        // Ensure prayerTrackerData is a valid object
        if (!this.prayerTrackerData || typeof this.prayerTrackerData !== 'object') {
            console.warn('Prayer tracker data is invalid in updatePrayerStatus, resetting to empty object');
            this.prayerTrackerData = {};
        }
        
        const dateString = dateToUpdate ? dateToUpdate : this.formatDate(this.currentDate);
        if (!this.prayerTrackerData[dateString]) {
            this.prayerTrackerData[dateString] = {};
        }

        if (this.prayerTrackerData[dateString][prayerName] === newStatus) {
            delete this.prayerTrackerData[dateString][prayerName];
        } else {
            this.prayerTrackerData[dateString][prayerName] = newStatus;
        }
        
        this.saveData();
        this.render();
    }

    async autoUpdateMissedPrayers() {
        const missedPrayerOption = localStorage.getItem('missedPrayerOption');
        if (missedPrayerOption === 'disabled') {
            return; // Do nothing if auto-marking is disabled
        }

        const now = new Date();
        const todayString = this.formatDate(now);
        const dateString = this.formatDate(this.currentDate);

        if (todayString !== dateString) return;

        const dayData = this.prayerTrackerData[dateString] || {};

        // Determine which prayers to check for reminders based on user's tracking selection
        const prayersToTrack = this.allPrayers.filter(prayer => this.obligatoryPrayers.includes(prayer.name));

        console.log('autoUpdateMissedPrayers: Current time (now):', now.toLocaleString());
        let hasChanges = false;
        
        prayersToTrack.forEach(prayer => {
            const prayerName = prayer.name;
            const prayerDateTime = prayer.endParsed;

            console.log(`Checking prayer: ${prayerName}`);
            console.log(`  Prayer end time: ${prayerDateTime.toLocaleString()}`);
            console.log(`  Is now > prayerDateTime? ${now > prayerDateTime}`);
            console.log(`  Current status (dayData[${prayerName}]): ${dayData[prayerName]}`);

            if (now > prayerDateTime && !dayData[prayerName]) {
                console.log(`  Marking ${prayerName} as missed.`);
                this.updatePrayerStatus(prayerName, 'missed');
                console.log(`  Triggering notification for ${prayerName}.`);
                this.showNotification('Prayer Missed', `You have missed the ${prayerName} prayer.`);
                hasChanges = true;
            }
        });

        // Force Firebase sync if any prayers were auto-marked as missed
        if (hasChanges && window.realtimeSync && window.firebaseAuth && window.firebaseAuth.currentUser) {
            try {
                console.log('🔄 Auto-missed prayer marking triggered Firebase sync');
                await window.realtimeSync.forceSyncAll();
                console.log('✅ Auto-missed prayer data synced to Firebase successfully');
            } catch (error) {
                console.error('❌ Failed to sync auto-missed prayer data to Firebase:', error);
            }
        }
    }

    showNotification(title, body) {
        if (!this.remindersEnabled || Notification.permission !== 'granted') {
            return;
        }
        
        // Send local notification via service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(function(registration) {
                registration.active.postMessage({
                    type: 'PRAYER_REMINDER',
                    title: title,
                    body: body,
                    tag: 'prayer-reminder-' + Date.now() // Unique tag
                });
            });
        } else {
            // Fallback for browsers without service worker support or if not controlled
            new Notification(title, { body });
        }
        
        // Also send OneSignal push notification for missed prayers
        if (window.OneSignalConfig && typeof window.OneSignalConfig.sendMissedPrayerAlert === 'function') {
            const prayerName = body.match(/missed the (\w+) prayer/i);
            if (prayerName && prayerName[1]) {
                window.OneSignalConfig.sendMissedPrayerAlert(prayerName[1]);
            }
        }
    }

    calculateCompletion(startDate, endDate) {
        let completedCount = 0;
        let totalCount = 0;
        const today = new Date();

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d > today) continue;
            const dateString = this.formatDate(d);
            const dayData = this.prayerTrackerData[dateString];

            this.obligatoryPrayers.forEach(prayerName => {
                totalCount++;
                if (dayData && dayData[prayerName] === 'completed') {
                    completedCount++;
                }
            });
        }
        return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    }

    exportToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });

        doc.text(`Prayer Tracker - ${monthName} ${year}`, 14, 16);

        const prayersForPdf = this.DISPLAY_ORDER.filter(prayerName => this.obligatoryPrayers.includes(prayerName));
        const tableColumn = ["Date", ...prayersForPdf];
        const tableRows = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = this.formatDate(date);
            const dayData = this.prayerTrackerData[dateString] || {};
            const row = [dateString];
            prayersForPdf.forEach(prayerName => {
                row.push(dayData[prayerName] || 'Pending');
            });
            tableRows.push(row);
        }

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save(`prayer-tracker-${year}-${month + 1}.pdf`);
    }

    resetTrackerData() {
        if (confirm('Are you sure you want to reset all your prayer tracking data? This cannot be undone.')) {
            this.prayerTrackerData = {};
            this.saveData();
            this.render();
        }
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getSymbolForStatus(status) {
        switch (status) {
            case 'completed': return '✅';
            case 'missed': return '❌';
            case 'qaza': return '⚠️';
            case 'pending': return '⚪';
            default: return '';
        }
    }

    calculateIslamicMidnight(todayTimings, tomorrowTimings) {
        if (!todayTimings || !tomorrowTimings) return '00:00';
        const parseTime = (timeString) => {
            const [hours, minutes] = timeString.split(':').map(Number);
            return { hours, minutes };
        };
        const maghribTime = parseTime(todayTimings.Maghrib);
        const nextFajrTime = parseTime(tomorrowTimings.Fajr);
        const maghribMinutes = maghribTime.hours * 60 + maghribTime.minutes;
        const nextFajrMinutes = (nextFajrTime.hours + 24) * 60 + nextFajrTime.minutes;
        const midpointMinutes = Math.round((maghribMinutes + nextFajrMinutes) / 2);
        const hours = Math.floor(midpointMinutes / 60) % 24;
        const minutes = midpointMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    calculateAllTimes(todayTimings, tomorrowTimings) {
        const timings = todayTimings;
        const date = new Date(this.currentDate);
        const parseTime = (timeString) => {
            const [hours, minutes] = timeString.split(':').map(Number);
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
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

        const islamicMidnight = this.calculateIslamicMidnight(todayTimings, tomorrowTimings);

        const calculateTahajjudTime = (todayTimings, tomorrowTimings) => {
            if (!todayTimings || !tomorrowTimings) return null;
            const maghribTime = parseTime(todayTimings.Maghrib);
            const nextFajrTime = parseTime(tomorrowTimings.Fajr);
            const maghribMinutes = maghribTime.getHours() * 60 + maghribTime.getMinutes();
            const nextFajrMinutes = (nextFajrTime.getHours() + 24) * 60 + nextFajrTime.getMinutes();
            const nightDurationMinutes = nextFajrMinutes - maghribMinutes;
            const lastThirdStartMinutes = maghribMinutes + Math.round((nightDurationMinutes * 2) / 3);
            const hours = Math.floor(lastThirdStartMinutes / 60) % 24;
            const minutes = Math.floor(lastThirdStartMinutes % 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };
        const tahajjudStartTime = calculateTahajjudTime(todayTimings, tomorrowTimings);

        const prayers = [
            { name: 'Fajr', type: 'prayer', start: timings.Fajr, end: timings.Sunrise },
            { name: 'Dhuhr', type: 'prayer', start: timings.Dhuhr, end: timings.Asr },
            { name: 'Asr', type: 'prayer', start: timings.Asr, end: subtractMinutes(sunsetTime, 15) },
            { name: 'Maghrib', type: 'prayer', start: timings.Maghrib, end: addMinutes(maghribTime, 25) },
            { name: 'Isha', type: 'prayer', start: timings.Isha, end: islamicMidnight },
            // Optional prayers
            { name: 'Ishraq', type: 'optional', start: addMinutes(sunriseTime, 20), end: addMinutes(sunriseTime, 99) },
            { name: 'Chasht', type: 'optional', start: addMinutes(sunriseTime, 100), end: subtractMinutes(dhuhrTime, 16) },
            { name: 'Awwabin', type: 'optional', start: addMinutes(maghribTime, 25), end: timings.Isha },
        ];

        if (tahajjudStartTime) {
            prayers.push({ name: 'Tahajjud', type: 'optional', start: tahajjudStartTime, end: subtractMinutes(fajrTime, 1) });
        }

        return prayers.map(p => {
            p.startParsed = parseTime(p.start);
            p.endParsed = parseTime(p.end);
            return p;
        });
    }
    toggleAnalyticsCardExpansion() {
        const analyticsCard = document.querySelector('.analytics-card');
        if (analyticsCard) {
            analyticsCard.classList.toggle('expanded');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.prayerTracker = new PrayerTracker();
    window.prayerTracker.init();

    

    // Handle settings for missed prayer marking
    const missedPrayerSettingsForm = document.getElementById('missed-prayer-settings');
    let savedMissedPrayerOption = localStorage.getItem('missedPrayerOption');

    // Set 'all-days' as default if no option is saved
    if (!savedMissedPrayerOption) {
        savedMissedPrayerOption = 'all-days';
        localStorage.setItem('missedPrayerOption', savedMissedPrayerOption);
    }

    const radio = missedPrayerSettingsForm.querySelector(`input[value="${savedMissedPrayerOption}"]`);
    if (radio) {
        radio.checked = true;
    }

    missedPrayerSettingsForm.addEventListener('change', (event) => {
        if (event.target.name === 'missed-prayer-option') {
            localStorage.setItem('missedPrayerOption', event.target.value);
            // Re-run the check to apply the new setting immediately
            window.prayerTracker.checkAndMarkMissedPrayers();
        }
    });
});