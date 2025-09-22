// Islamic Calendar JavaScript
class IslamicCalendar {
    constructor() {
        this.currentHijriDate = null;
        this.currentGregorianDate = new Date();
        this.selectedDate = new Date();
        this.events = {}; // Initialize as empty object
        this.monthDataCache = {}; // Cache for fetched month data
        this.months = {
            en: [
                'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
                'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
                'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
            ],
            bn: [
                'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি',
                'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান',
                'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'
            ]
        };
        this.days = {
            en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            bn: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার']
        };
        this.calendarLogShown = false;
        this.gToHLogShown = false;
        this.hToGLogShown = false;

        this.weekdayTranslations = {
            en: {
                'Saturday': 'শনিবার',
                'Sunday': 'রবিবার',
                'Monday': 'সোমবার',
                'Tuesday': 'মঙ্গলবার',
                'Wednesday': 'বুধবার',
                'Thursday': 'বৃহস্পতিবার',
                'Friday': 'শুক্রবার'
            }
        };

        // New DOM elements for selected date display
        this.selectedHijriDayEl = document.getElementById('selected-hijri-day');
        this.selectedHijriDateEl = document.getElementById('selected-hijri-date');
        this.selectedGregorianDayEl = document.getElementById('selected-gregorian-day');
        this.selectedGregorianDateEl = document.getElementById('selected-gregorian-date');

        this.init();
    }

    async updateSelectedDateDisplay(gregorianDate, hijriDate) {
        if (!gregorianDate || !hijriDate) return;

        const currentLanguage = window.sharedApp.currentLang; // Use sharedApp's current language
        const monthNames = this.months[currentLanguage];
        
        // Get the English weekday name from hijriDate and translate it
        const translatedWeekday = window.sharedApp.translations[currentLanguage][hijriDate.weekday.en] || hijriDate.weekday.en;

        // Hijri Display
        this.selectedHijriDayEl.textContent = translatedWeekday;
        this.selectedHijriDateEl.textContent = 
            `${window.sharedApp.formatNumberForLanguage(hijriDate.day)} ${monthNames[hijriDate.month.number - 1]} ${window.sharedApp.formatNumberForLanguage(hijriDate.year)}`;

        // Gregorian Display
        this.selectedGregorianDayEl.textContent = gregorianDate.toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long' });
        this.selectedGregorianDateEl.textContent = 
            gregorianDate.toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', day: 'numeric' });

        // Update mobile display
        const mobileSelectedDayEl = document.getElementById('selected-hijri-day-mobile');
        if (mobileSelectedDayEl) {
            mobileSelectedDayEl.textContent = translatedWeekday;
        }
    }

    async fetchMonthData(year, month) {

        const CACHE_KEY_PREFIX = 'aladhan_calendar_';
        const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
        const latitude = 23.8103;
        const longitude = 90.4125;
        const cacheKey = `${CACHE_KEY_PREFIX}${year}-${month}-${latitude}-${longitude}`;

        // Check in-memory cache first
        if (this.monthDataCache[cacheKey]) {
            return this.monthDataCache[cacheKey];
        }

        // Check localStorage cache
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
                this.monthDataCache[cacheKey] = data; // Populate in-memory cache
                if (!this.calendarLogShown) {
                    console.log(`Aladhan calendar data loaded from cache.`);
                    this.calendarLogShown = true;
                }
                return data;
            }
        }

        try {
            const response = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&month=${month + 1}&year=${year}`);
            const data = await response.json();
            if (data.code === 200 && data.data) {
                this.monthDataCache[cacheKey] = data.data; // Populate in-memory cache
                localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data.data }));
                if (!this.calendarLogShown) {
                    console.log(`Aladhan calendar data fetched from API.`);
                    this.calendarLogShown = true;
                }
                return data.data;
            }
            else {
                throw new Error('Failed to fetch monthly calendar data from API');
            }
        }
        catch (error) {
            console.error('Error fetching monthly data:', error);
            this.showError('Unable to load calendar for the month.');
            return null;
        }
    }

    async init() {
        this.events = await this.getIslamicEvents(); // Load events asynchronously
        await this.getCurrentHijriDate(); // This sets this.currentHijriDate and this.currentGregorianDate
        this.updateSelectedDateDisplay(this.currentGregorianDate, this.currentHijriDate); // Initial display
        this.renderCalendar();
        this.bindEvents();
        this.updateMoonPhase();
        this.displayUpcomingEvents();
        this.updateNextEventCountdown();
    }

    async getHijriDate(date) {
        const CACHE_KEY_PREFIX = 'aladhan_gtoh_';
        const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
        const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const cacheKey = `${CACHE_KEY_PREFIX}${dateString}`;

        // Check localStorage cache
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
                if (!this.gToHLogShown) {
                    console.log(`Aladhan gToH data loaded from cache.`);
                    this.gToHLogShown = true;
                }
                return data;
            }
        }

        try {
            const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${dateString}`);
            const data = await response.json();
            if (data.code === 200 && data.status === 'OK') {
                localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data.data.hijri }));
                if (!this.gToHLogShown) {
                    console.log(`Aladhan gToH data fetched from API.`);
                    this.gToHLogShown = true;
                }
                return data.data.hijri;
            } else {
                throw new Error('Failed to fetch Hijri date');
            }
        } catch (error) {
            console.error('Error getting Hijri date:', error);
            this.showError('Unable to load Islamic date');
            return null;
        }
    }

    async getCurrentHijriDate() {
        try {
            const today = new Date();
            const hijriDate = await this.getHijriDate(today);
            if (hijriDate) {
                this.currentHijriDate = hijriDate;
                await this.updateDateDisplay(); // Call updateDateDisplay here
            }
        } catch (error) {
            console.error('Error getting Hijri date:', error);
            this.showError('Unable to load Islamic date');
        }
    }

    async gregorianToHijri(gDate) {
        return await this.getHijriDate(gDate);
    }

    async hijriToGregorian(hYear, hMonth, hDay) {
        const CACHE_KEY_PREFIX = 'aladhan_htog_';
        const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
        const dateString = `${hDay}-${hMonth}-${hYear}`;
        const cacheKey = `${CACHE_KEY_PREFIX}${dateString}`;

        // Check localStorage cache
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
                if (!this.hToGLogShown) {
                    console.log(`Aladhan hToG data loaded from cache.`);
                    this.hToGLogShown = true;
                }
                return new Date(data.year, data.month.number - 1, data.day);
            }
        }

        try {
            const response = await fetch(`https://api.aladhan.com/v1/hToG?date=${dateString}`);
            const data = await response.json();
            if (data.code === 200 && data.status === 'OK') {
                const gDate = data.data.gregorian;
                localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: gDate }));
                if (!this.hToGLogShown) {
                    console.log(`Aladhan hToG data fetched from API.`);
                    this.hToGLogShown = true;
                }
                return new Date(gDate.year, gDate.month.number - 1, gDate.day);
            } else {
                throw new Error('Failed to fetch Gregorian date');
            }
        } catch (error) {
            console.error('Error getting Gregorian date:', error);
            this.showError('Unable to load Gregorian date');
            return null;
        }
    }

    async updateDateDisplay() {
        if (!this.currentHijriDate) return;

        const currentLanguage = document.body.getAttribute('data-lang') || 'en';
        const monthNames = this.months[currentLanguage];
        const dayNames = this.days[currentLanguage];

        // Update current date displays
        document.getElementById('hijri-date').textContent = 
            `${sharedApp.formatNumberForLanguage(this.currentHijriDate.day)} ${monthNames[this.currentHijriDate.month.number - 1]} ${sharedApp.formatNumberForLanguage(this.currentHijriDate.year)}`;
        document.getElementById('hijri-day').textContent = this.currentHijriDate.weekday[currentLanguage];
        document.getElementById('gregorian-date').textContent = 
            this.currentGregorianDate.toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        document.getElementById('gregorian-day').textContent = this.currentGregorianDate.toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long' });

        
    }

    async renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();

        // --- Update Header ---
        const monthData = await this.fetchMonthData(year, month);
        if (!monthData || monthData.length === 0) {
            this.showError('Could not load calendar data for this month.');
            return; // Exit if data fetch fails
        }

        const firstDayHijri = monthData[0].date.hijri;
        const currentLanguage = document.body.getAttribute('data-lang') || 'en';
        document.getElementById('current-hijri-month').textContent =
            `${this.months[currentLanguage][firstDayHijri.month.number - 1]} ${firstDayHijri.year}`;
        document.getElementById('current-gregorian-month').textContent =
            this.selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // --- Render Grid ---
        calendarGrid.innerHTML = ''; // Clear calendar

        // Add day headers
        const dayHeaders = [sharedApp.translations[sharedApp.currentLang]['sun-abbr'], sharedApp.translations[sharedApp.currentLang]['mon-abbr'], sharedApp.translations[sharedApp.currentLang]['tue-abbr'], sharedApp.translations[sharedApp.currentLang]['wed-abbr'], sharedApp.translations[sharedApp.currentLang]['thu-abbr'], sharedApp.translations[sharedApp.currentLang]['fri-abbr'], sharedApp.translations[sharedApp.currentLang]['sat-abbr']];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Add empty cells for days before the month starts
        const gDate = monthData[0].date.gregorian;
        const firstDayOfMonth = new Date(gDate.year, gDate.month.number - 1, gDate.day);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Loop through the pre-fetched data and render each day
        monthData.forEach(dayData => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';

            const gregorianDay = dayData.date.gregorian.day;
            const hijriDay = dayData.date.hijri.day;

            dayElement.innerHTML = `
                
<div class="gregorian-date">${sharedApp.formatNumberForLanguage(gregorianDay, currentLanguage)}</div>
<div class="hijri-date">${sharedApp.formatNumberForLanguage(hijriDay, currentLanguage)}</div>

            `;

            // Mark today's date
            const today = new Date();
            if (parseInt(gregorianDay) === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            // Mark the selected date
            if (parseInt(gregorianDay) === this.selectedDate.getDate()) {
                dayElement.classList.add('selected');
            }

            // Check for Islamic events
            const eventKey = `${dayData.date.hijri.month.number}-${dayData.date.hijri.day}`;
            if (this.events[eventKey]) {
                dayElement.classList.add('has-event');
                dayElement.title = this.events[eventKey].name;
            }

            dayElement.addEventListener('click', async () => {
                document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
                dayElement.classList.add('selected');
                this.selectedDate = new Date(year, month, parseInt(gregorianDay));
                
                // Update the main display with the selected day's data
                const selectedHijri = await this.gregorianToHijri(this.selectedDate);
                this.updateSelectedDateDisplay(this.selectedDate, selectedHijri);
                this.showDayEvents(this.selectedDate);
            });

            calendarGrid.appendChild(dayElement);
        });
    }

    async showDayEvents(date) {
        const hijriDate = await this.gregorianToHijri(date);
        if (!hijriDate) return;

        const eventKey = `${hijriDate.month.number}-${hijriDate.day}`;
        const event = this.events[eventKey];

        const dayEventsContainer = document.getElementById('eventsList');
        if (event) {
            dayEventsContainer.innerHTML = `
                <div class="event-card">
                    <div class="event-date">
                        <span class="hijri">${hijriDate.day} ${this.months.en[hijriDate.month.number-1]}</span>
                        <span class="gregorian">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div class="event-info">
                        <h4>${event.name}</h4>
                        <p>${event.description || ''}</p>
                        <span class="event-type">${event.type}</span>
                    </div>
                </div>
            `;
        } else {
            dayEventsContainer.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-plus"></i>
                    <p>${sharedApp.translations[sharedApp.currentLang]['no-events-for-date']}</p>
                </div>
            `;
        }
    }

    async updateMoonPhase() {
        const CACHE_KEY = 'moonPhaseData';
        const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

        let phaseName = 'Unavailable';
        let emoji = '🌕'; // Default emoji
        let lunarAge = 0;

        // Try to load from cache
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
                // Use cached data
                phaseName = data.phaseName;
                emoji = data.emoji;
                lunarAge = data.lunarAge;
                console.log('Moon phase data loaded from cache.');
            }
        }

        // If not from cache or cache expired, fetch from API
        if (phaseName === 'Unavailable') {
            const apiKey = 'c4ead10db91048688ea97aad37cda3be';
            const latitude = 23.8103;
            const longitude = 90.4125;

            try {
                const response = await fetch(`https://api.ipgeolocation.io/astronomy?apiKey=${apiKey}&lat=${latitude}&long=${longitude}`);
                const data = await response.json();
                if (response.ok) {
                    phaseName = data.moon_phase.replace(/_/g, ' ');

                    const phaseEmojis = {
                        'NEW': '🌑', 'WAXING CRESCENT': '🌒', 'FIRST QUARTER': '🌓', 'WAXING GIBBOUS': '🌔',
                        'FULL': '🌕', 'WANING GIBBOUS': '🌖', 'LAST QUARTER': '🌗', 'WANING CRESCENT': '🌘'
                    };
                    for (const key in phaseEmojis) {
                        if (phaseName.includes(key)) {
                            emoji = phaseEmojis[key];
                            break;
                        }
                    }
                    console.log('Moon phase data fetched from API.');
                }
            } catch (error) {
                console.error('Error fetching moon phase data:', error);
            }
        }

        // --- Perform Simplified Local Calculation for Moon Age ---
        const today = new Date();
        const lunarMonth = 29.53;
        const knownNewMoon = new Date(2024, 0, 11);
        const daysSinceNewMoon = (today - knownNewMoon) / (1000 * 60 * 60 * 24);
        lunarAge = daysSinceNewMoon % lunarMonth;

        // Cache the data if it was just fetched or updated
        if (phaseName !== 'Unavailable') {
            const dataToCache = {
                phaseName,
                emoji,
                lunarAge: Math.round(lunarAge) // Store rounded age for consistency
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: dataToCache
            }));
        }

        // --- Update Display ---
        document.getElementById('moonPhase').innerHTML = `
            <div class="moon-emoji">${emoji}</div>
            <div class="moon-phase-name" style="text-transform: capitalize;">${phaseName.toLowerCase()}</div>
            <div class="moon-age">${Math.round(lunarAge)} days old</div>
        `;
    }

    async displayUpcomingEvents() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;
        
        const today = new Date();
        const upcomingEvents = [];

        // Get current Hijri date to determine upcoming events
        const currentHijri = await this.gregorianToHijri(today);
        if (!currentHijri) return;

        // Convert events to array and sort by month and day
        const eventEntries = Object.entries(this.events);
        
        // Sort events by month and day
        eventEntries.sort(([keyA], [keyB]) => {
            const [monthA, dayA] = keyA.split('-').map(Number);
            const [monthB, dayB] = keyB.split('-').map(Number);
            
            if (monthA !== monthB) return monthA - monthB;
            return dayA - dayB;
        });

        // Find upcoming events for this year
        for (const [key, event] of eventEntries) {
            const [month, day] = key.split('-').map(Number);
            
            // Check if this event is in the future
            if (month > currentHijri.month.number || 
                (month === currentHijri.month.number && day >= currentHijri.day)) {
                
                const gregorianDate = await this.hijriToGregorian(currentHijri.year, month, day);
                if (gregorianDate) {
                    const daysAway = Math.ceil((gregorianDate - today) / (1000 * 60 * 60 * 24));
                    upcomingEvents.push({
                        date: gregorianDate,
                        hijriDate: { month, day },
                        event,
                        daysAway
                    });
                }
            }
        }

        // If we need more events, get from next year
        if (upcomingEvents.length < 5) {
            for (const [key, event] of eventEntries) {
                const [month, day] = key.split('-').map(Number);
                const gregorianDate = await this.hijriToGregorian(parseInt(currentHijri.year) + 1, month, day);
                if (gregorianDate) {
                    const daysAway = Math.ceil((gregorianDate - today) / (1000 * 60 * 60 * 24));
                    upcomingEvents.push({
                        date: gregorianDate,
                        hijriDate: { month, day },
                        event,
                        daysAway
                    });
                }
            }
        }

        // Sort by date and take the first 5
        upcomingEvents.sort((a, b) => a.daysAway - b.daysAway);
        
        if (upcomingEvents.length > 0) {
            eventsList.innerHTML = upcomingEvents.slice(0, 5).map(item => `
                <div class="event-card">
                    <div class="event-date">
                        <span class="hijri">${item.hijriDate.day} ${this.months.en[item.hijriDate.month-1]}</span>
                        <span class="gregorian">${item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div class="event-info">
                        <h4>${item.event.name}</h4>
                        <p>${item.event.description || ''}</p>
                        <span class="event-type">${item.event.type}</span>
                    </div>
                </div>
            `).join('');
        } else {
            eventsList.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-plus"></i>
                    <p>${sharedApp.translations[sharedApp.currentLang]['no-upcoming-events']}</p>
                </div>
            `;
        }
    }

    async updateNextEventCountdown() {
        const countdownElement = document.getElementById('next-event-countdown');
        if (!countdownElement) return;

        const now = new Date();
        let nextEvent = null;
        let minDiff = Infinity;

        // Ensure currentHijriDate is available
        if (!this.currentHijriDate) {
            await this.getCurrentHijriDate(); // Fetch if not already available
            if (!this.currentHijriDate) { // If still not available, cannot proceed
                countdownElement.textContent = sharedApp.translations[sharedApp.currentLang]['countdown-error'];
                return;
            }
        }

        for (let yearOffset = 0; yearOffset <= 5; yearOffset++) { // Check current Hijri year and next 5 Hijri years
            const targetHijriYear = parseInt(this.currentHijriDate.year) + yearOffset;
            for (const key in this.events) {
                const [month, day] = key.split('-').map(Number);
                let eventGregorianDate = await this.hijriToGregorian(targetHijriYear, month, day);

                if (eventGregorianDate) {
                    const diff = eventGregorianDate.getTime() - now.getTime();
                    // Only consider events in the future
                    if (diff > 0 && diff < minDiff) {
                        minDiff = diff;
                        nextEvent = {
                            name: this.events[key].name,
                            date: eventGregorianDate
                        };
                    }
                }
            }
        }

        if (nextEvent) {
            const updateCountdown = () => {
                const currentDiff = nextEvent.date.getTime() - new Date().getTime();

                if (currentDiff <= 0) {
                    countdownElement.innerHTML = `${sharedApp.translations[sharedApp.currentLang]['next-event']} ${nextEvent.name} ${sharedApp.translations[sharedApp.currentLang]['event-today']}`;
                    clearInterval(countdownInterval);
                    return;
                }

                const days = Math.floor(currentDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((currentDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((currentDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((currentDiff % (1000 * 60)) / 1000);

                countdownElement.innerHTML = `
                    <div class="countdown-label">${sharedApp.translations[sharedApp.currentLang]['next-event']} ${nextEvent.name}</div>
                
                    <div class="countdown-time">
                        <span>${days}${sharedApp.translations[sharedApp.currentLang]['days-abbr']}</span>
                        <span>${hours}${sharedApp.translations[sharedApp.currentLang]['hours-abbr']}</span>
                        <span>${minutes}${sharedApp.translations[sharedApp.currentLang]['minutes-abbr']}</span>
                        <span>${seconds}${sharedApp.translations[sharedApp.currentLang]['seconds-abbr']}</span>
                    </div>
                    <div class="countdown-date">${nextEvent.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                `;
            };

            updateCountdown();
            const countdownInterval = setInterval(updateCountdown, 1000);
        } else {
            countdownElement.textContent = sharedApp.translations[sharedApp.currentLang]['no-upcoming-events'];
        }
    }

    async getIslamicEvents() {
        // Fallback events if API fails
        const fallbackEvents = {
            '1-1': { 
                name: 'Islamic New Year', 
                type: 'Religious', 
                description: 'First day of Muharram',
                significance: 'Beginning of the Islamic calendar year' 
            },
            '1-10': { 
                name: 'Day of Ashura', 
                type: 'Religious', 
                description: 'Tenth day of Muharram',
                significance: 'Day of fasting and remembrance' 
            },
            '3-12': { 
                name: 'Mawlid an-Nabi', 
                type: 'Religious', 
                description: 'Birth of Prophet Muhammad (PBUH)',
                significance: 'Celebration of the Prophet\'s birth' 
            },
            '7-27': { 
                name: 'Laylat al-Miraj', 
                type: 'Religious', 
                description: 'Night of Ascension',
                significance: 'Commemoration of the Prophet\'s journey to Jerusalem and ascent to heaven' 
            },
            '8-15': { 
                name: 'Laylat al-Baraat', 
                type: 'Religious', 
                description: 'Night of Forgiveness',
                significance: 'Night of seeking forgiveness and blessings' 
            },
            '9-1': { 
                name: 'Start of Ramadan', 
                type: 'Fasting', 
                description: 'Beginning of the holy month of fasting',
                significance: 'Month of fasting, prayer, and charity' 
            },
            '9-27': { 
                name: 'Laylat al-Qadr', 
                type: 'Religious', 
                description: 'Night of Power',
                significance: 'The night the Quran was first revealed' 
            },
            '10-1': { 
                name: 'Eid al-Fitr', 
                type: 'Festival', 
                description: 'Festival of Breaking the Fast',
                significance: 'Celebration marking the end of Ramadan' 
            },
            '12-8': { 
                name: 'Day of Arafah', 
                type: 'Religious', 
                description: 'Day of Arafah',
                significance: 'The most important day of Hajj' 
            },
            '12-9': { 
                name: 'Eid al-Adha', 
                type: 'Festival', 
                description: 'Festival of Sacrifice',
                significance: 'Commemoration of Ibrahim\'s sacrifice' 
            },
            '12-10': { 
                name: 'Eid al-Adha (Day 2)', 
                type: 'Festival', 
                description: 'Festival of Sacrifice continues',
                significance: 'Continuation of Eid celebrations' 
            }
        };

        // Directly return the reliable fallback events without making a faulty API call.
        console.log('Using reliable fallback for Islamic events.');
        return fallbackEvents;
    }

    bindEvents() {
        // Navigation buttons
        document.getElementById('prevMonth').addEventListener('click', async () => {
            this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
            await this.renderCalendar();
            const selectedHijri = await this.gregorianToHijri(this.selectedDate);
            this.updateSelectedDateDisplay(this.selectedDate, selectedHijri);
        });

        document.getElementById('nextMonth').addEventListener('click', async () => {
            this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
            await this.renderCalendar();
            const selectedHijri = await this.gregorianToHijri(this.selectedDate);
            this.updateSelectedDateDisplay(this.selectedDate, selectedHijri);
        });

        document.getElementById('todayBtn').addEventListener('click', async () => {
            this.selectedDate = new Date();
            await this.renderCalendar();
            const selectedHijri = await this.gregorianToHijri(this.selectedDate);
            this.updateSelectedDateDisplay(this.selectedDate, selectedHijri);
            this.displayUpcomingEvents();
        });

        document.getElementById('quickTodayBtn').addEventListener('click', async () => {
            this.selectedDate = new Date();
            await this.renderCalendar();
            const selectedHijri = await this.gregorianToHijri(this.selectedDate);
            this.updateSelectedDateDisplay(this.selectedDate, selectedHijri);
            this.displayUpcomingEvents();
        });

        document.getElementById('ramadanBtn').addEventListener('click', () => {
            this.navigateToIslamicDate(9, 1); // Ramadan starts on 9th month, 1st day
        });

        document.getElementById('hajjBtn').addEventListener('click', () => {
            this.navigateToIslamicDate(12, 8); // Day of Arafat is 12th month, 8th day
        });

        // Event search functionality
        const eventSearchInput = document.getElementById('eventSearch');
        if (eventSearchInput) {
            eventSearchInput.addEventListener('input', (e) => {
                this.filterEvents(e.target.value);
            });
        }

        // View toggles
        document.getElementById('monthViewBtn').addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('monthViewBtn').classList.add('active');
            document.getElementById('calendarGrid').style.display = 'grid';
            document.getElementById('eventsList').style.display = 'flex';
            this.displayUpcomingEvents();
        });

        document.getElementById('eventsViewBtn').addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('eventsViewBtn').classList.add('active');
            document.getElementById('calendarGrid').style.display = 'none';
            document.getElementById('eventsList').style.display = 'flex';
            this.displayUpcomingEvents();
        });

        // Export functionality
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportCalendar();
        });

       

        // Language toggle
        document.getElementById('langToggle').addEventListener('click', async () => {
            const currentLang = document.body.getAttribute('data-lang') || 'en';
            const newLang = currentLang === 'en' ? 'bn' : 'en';
            document.body.setAttribute('data-lang', newLang);
            localStorage.setItem('language', newLang);
            
            // Update button text
            document.getElementById('lang-text').textContent = newLang === 'en' ? 'BN' : 'EN';
            
            // Refresh display
            await this.renderCalendar();
            const selectedHijri = await this.gregorianToHijri(this.selectedDate);
            this.updateSelectedDateDisplay(this.selectedDate, selectedHijri);
        });

        // Side drawer functionality
        document.getElementById('hamburgerMenu').addEventListener('click', () => {
            document.getElementById('sideDrawer').classList.add('open');
            document.getElementById('drawerOverlay').classList.add('open');
        });

        document.getElementById('closeDrawer').addEventListener('click', () => {
            document.getElementById('sideDrawer').classList.remove('open');
            document.getElementById('drawerOverlay').classList.remove('open');
        });

        document.getElementById('drawerOverlay').addEventListener('click', () => {
            document.getElementById('sideDrawer').classList.remove('open');
            document.getElementById('drawerOverlay').classList.remove('open');
        });
    }

    async exportCalendar() {
        try {
            const events = [];
            const hijriYear = (await this.gregorianToHijri(this.selectedDate)).year;

            for (const [key, event] of Object.entries(this.events)) {
                const [month, day] = key.split('-');
                const gregorianDate = await this.hijriToGregorian(hijriYear, parseInt(month), parseInt(day));
                if (gregorianDate) {
                    events.push({
                        title: event.name,
                        start: gregorianDate.toISOString().split('T')[0],
                        description: event.description || event.name
                    });
                }
            }

            // Create ICS file content
            let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Islamic Calendar//EN\n';
            
            events.forEach(event => {
                icsContent += 'BEGIN:VEVENT\n';
                icsContent += `SUMMARY:${event.title}\n`;
                icsContent += `DTSTART;VALUE=DATE:${event.start.replace(/-/g, '')}\n`;
                icsContent += `DESCRIPTION:${event.description}\n`;
                icsContent += 'END:VEVENT\n';
            });
            
            icsContent += 'END:VCALENDAR';

            // Download file
            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `islamic-calendar-${hijriYear}.ics`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showError('Calendar exported successfully!');
        } catch (error) {
            console.error('Error exporting calendar:', error);
            this.showError('Failed to export calendar');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        // For success messages
        if (message.includes('success')) {
            errorDiv.style.background = '#38b000';
        }
        
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    async navigateToIslamicDate(hijriMonth, hijriDay) {
        try {
            const currentHijriYear = this.currentHijriDate ? this.currentHijriDate.year : (await this.gregorianToHijri(new Date())).year;
            let targetGregorianDate = await this.hijriToGregorian(currentHijriYear, hijriMonth, hijriDay);

            // If the date is in the past, try next year
            if (targetGregorianDate && targetGregorianDate < new Date()) {
                targetGregorianDate = await this.hijriToGregorian(parseInt(currentHijriYear) + 1, hijriMonth, hijriDay);
            }

            if (targetGregorianDate) {
                this.selectedDate = targetGregorianDate;
                this.renderCalendar();
                this.updateDateDisplay();
            } else {
                this.showError('Could not find the requested Islamic date.');
            }
        } catch (error) {
            console.error('Error navigating to Islamic date:', error);
            this.showError('Failed to navigate to the selected date');
        }
    }

    filterEvents(searchTerm) {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        if (!searchTerm) {
            this.displayUpcomingEvents();
            return;
        }

        const filteredEvents = Object.entries(this.events).filter(([key, event]) => 
            event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            event.type.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.displayFilteredEvents(filteredEvents);
    }

    async displayFilteredEvents(events) {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        if (events.length === 0) {
            eventsList.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-search"></i>
                    <p>No events found matching your search.</p>
                </div>
            `;
            return;
        }

        // Get current Hijri year for date conversion
        const today = new Date();
        const currentHijri = await this.gregorianToHijri(today);
        const hijriYear = currentHijri ? currentHijri.year : today.getFullYear();

        const eventPromises = events.map(async ([key, event]) => {
            const [month, day] = key.split('-').map(Number);
            const gregorianDate = await this.hijriToGregorian(hijriYear, month, day);
            
            if (gregorianDate) {
                return `
                    <div class="event-card">
                        <div class="event-date">
                            <span class="hijri">${day} ${this.months.en[month-1]}</span>
                            <span class="gregorian">${gregorianDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div class="event-info">
                            <h4>${event.name}</h4>
                            <p>${event.description || ''}</p>
                            <span class="event-type">${event.type}</span>
                        </div>
                    </div>
                `;
            }
            return '';
        });

        const eventHtml = await Promise.all(eventPromises);
        eventsList.innerHTML = eventHtml.join('');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme and language
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    const savedLang = localStorage.getItem('language') || 'en';
    document.body.setAttribute('data-lang', savedLang);

    // Update language button text
    document.getElementById('lang-text').textContent = savedLang === 'en' ? 'BN' : 'EN';

    // Initialize calendar
    new IslamicCalendar();
});