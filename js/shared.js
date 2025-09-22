// Shared functionality for all pages
class SharedApp {
    constructor() {
        // Ensure language is always a valid value, never null
        const savedLang = this.getSafeStorageItem('language', 'en');
        this.currentLang = (savedLang === null || savedLang === 'null') ? 'en' : savedLang;
        this.currentTheme = this.getSafeStorageItem('theme', 'dark');
        this.locationsData = []; // To store loaded locations from JSON
        
        this.translations = {
            en: {
                'app-title': 'Prayer Tracker',
                'lang-text': 'BN',
                'location-title': 'Your Location',
                'qibla-direction-title': 'Qibla Direction',
                'distance-title': 'Distance to Makkah',
                'calibration-text': 'Hold your device flat and move in a figure-8 pattern to calibrate the compass. The green pointer shows the Qibla direction.',
                'getting-location': 'Getting location...', 
                'location-error': 'Unable to get location',
                'compass-error': 'Compass not supported',
                'prayer-times': 'Prayer Times',
                'qibla-direction': 'Qibla Direction',
                'islamic-calendar': 'Islamic Calendar',
                'dhikr-counter': 'Dhikr Counter', 
                '99-names': '99 Names of Allah',
                'nearby-mosques': 'Nearby Mosques',
                'tap-instruction': 'Tap to Count',
                'today-total-label': "Today's Total:",
                'reset-btn-text': 'Reset',
                'pause-btn-text': 'Pause',
                'settings-btn-text': 'Settings',
                'day-streak-label': 'Day Streak',
                'completed-label': 'Completed',
                'daily-goal-label': 'Daily Goal',
                'choose-dhikr-title': 'Choose Dhikr',
                'search-dhikr-placeholder': 'Search dhikr...', 
                'dhikr-settings-title': 'Dhikr Settings',
                'feedback-title': 'Feedback',
                'vibration-label': 'Vibration on count',
                'sound-label': 'Sound feedback',
                'goals-targets-title': 'Goals & Targets',
                'custom-target-label': 'Custom target count',
                'daily-goal-input-label': 'Daily goal',
                'reminders-title': 'Reminders',
                'reminder-time-label': 'Daily reminder time',
                'enable-reminders-label': 'Enable reminders',
                'statistics-title': 'Statistics',
                'stats-period-label': 'Statistics period',
                'stats-today-option': 'Today',
                'stats-week-option': 'This Week',
                'stats-month-option': 'This Month',
                'stats-all-option': 'All Time',
                'backup-data-button-text': 'Backup Data',
                'restore-data-button-text': 'Restore Data',
                'reset-all-data-btn-text': 'Reset All Data',
                'export-data-btn-text': 'Export Data',
                'view-stats-btn-text': 'View Statistics',
                'dhikr-stats-title': 'Dhikr Statistics',
                'loading-stats-text': 'Loading statistics...', 
                'stats-today-title': 'Today',
                'total-count-label-today': 'Total Count',
                'sessions-label-today': 'Sessions',
                'goal-progress-label-today': 'Goal Progress',
                'stats-this-week-title': 'This Week',
                'total-count-label-week': 'Total Count',
                'active-days-label-week': 'Active Days',
                'daily-average-label-week': 'Daily Average',
                'stats-this-month-title': 'This Month',
                'total-count-label-month': 'Total Count',
                'active-days-label-month': 'Active Days',
                'daily-average-label-month': 'Daily Average',
                'stats-overall-title': 'Overall',
                'all-time-total-label-overall': 'All Time Total',
                'current-streak-label-overall': 'Current Streak',
                'total-days-label-overall': 'Total Days',
                'Fajr': 'Fajr', 'Dhuhr': 'Dhuhr', 'Asr': 'Asr', 'Maghrib': 'Maghrib', 'Isha': 'Isha',
                'Ishraq': 'Ishraq', 'Chasht': 'Chasht', 'Awwabin': 'Awwabin', 'Tahajjud': 'Tahajjud',
                'Completed': 'Completed', 'Missed': 'Missed', 'Qaza': 'Qaza', 'Pending': 'Pending',
                'Daily Analysis': 'Daily Analysis', 
                'Weekly Completion': 'Weekly Completion', 'Monthly Completion': 'Monthly Completion',
                'Obligatory Prayers': 'Obligatory Prayers', 
                'Data Management': 'Data Management', 
                'Settings': 'Settings', 'Time Format': 'Time Format', '12-hour': '12-hour', '24-hour': '24-hour',
                'Language': 'Language', 'English': 'English', 'Bengali': 'Bengali',
                'Notification Sound': 'Notification Sound', 'Enable notification sound': 'Enable notification sound',
                'Qaza Counter': 'Qaza Counter', 'Increment': 'Increment', 'Decrement': 'Decrement',
                'analytics-title': 'Analytics',
                'weekly-completion-title': 'Weekly Completion',
                'monthly-completion-title': 'Monthly Completion',
                'weekly-missed-title': 'Weekly Missed',
                'monthly-missed-title': 'Monthly Missed',
                'weekly-qaza-title': 'Weekly Qaza',
                'monthly-qaza-title': 'Monthly Qaza',
                'missed-prayers-title': 'Missed Prayers',
                'settings-title-modal': 'Settings',
                'optional-prayers-title': 'Optional Prayers',
                'reminders-title-modal': 'Reminders',
                'enable-reminders-label-text': 'Enable reminders for missed prayers',
                'time-format-title': 'Time Format',
                'data-management-title': 'Data Management',
                'exportPdf': 'Export to PDF',
                'resetData': 'Reset Data',
                'no-missed-prayers': 'No missed prayers recorded.',
                'month-view': 'Month View',
                'events-view': 'Events View',
                'today': 'Today',
                'export': 'Export',
                'upcoming-islamic-events': 'Upcoming Islamic Events',
                'sun': 'Sun', 'mon': 'Mon', 'tue': 'Tue', 'wed': 'Wed', 'thu': 'Thu', 'fri': 'Fri', 'sat': 'Sat',
                'no-events-for-date': 'No events for this date',
                'no-upcoming-events': 'No upcoming events found',
                'next-event': 'Next Event:',
                'days-abbr': 'd',
                'hours-abbr': 'h',
                'minutes-abbr': 'm',
                'seconds-abbr': 's',
                'event-today': 'is today!',
                'countdown-error': 'Error: Could not determine current Hijri date for countdown.',
                'sun-abbr': 'Sun',
                'mon-abbr': 'Mon',
                'tue-abbr': 'Tue',
                'wed-abbr': 'Wed',
                'thu-abbr': 'Thu',
                'fri-abbr': 'Fri',
                'sat-abbr': 'Sat',

                'search-mosques-placeholder': 'Search mosques...',
                'all-distances-option': 'All Distances',
                'within-600m-option': 'Within 600m',
                'within-1km-option': 'Within 1 km',
                'within-2km-option': 'Within 2 km',
                'within-5km-option': 'Within 5 km',
                'all-categories-option': 'All Categories',
                'mosque-option': 'Mosque',
                'islamic-center-option': 'Islamic Center',
                'sort-by-distance-option': 'Sort by Distance',
                'sort-by-name-option': 'Sort by Name',
                'sort-by-rating-option': 'Sort by Rating',
                'current-location-button': 'Current Location',
                'nearby-view-button': 'Nearby',
                'favorites-view-button': 'Favorites',
                'map-view-button': 'Map',
                'getting-location-status': 'Getting your location...',
                'mosques-found-status': '{count} mosques found',
                'finding-nearby-mosques-loading': 'Finding nearby mosques...',
                'unable-to-find-mosques-error': 'Unable to find mosques',
                'check-location-settings-error': 'Please check your location settings or try searching manually.',
                'try-again-button': 'Try Again',
                'no-mosques-found-empty': 'No mosques found',
                'expand-search-radius-empty': 'Try expanding your search radius or check a different area.',
                'no-favorite-mosques-empty': 'No favorite mosques yet',
                'add-to-favorites-empty': 'Add mosques to your favorites by clicking the heart icon when browsing nearby mosques.',
                'browse-nearby-button': 'Browse Nearby',
                'interactive-map-placeholder': 'Interactive Map',
                'map-functionality-requires-location': 'Map functionality requires location services',
                'enable-location-button': 'Enable Location',
                'phone-label': 'Phone',
                'hours-label': 'Hours',
                'website-label': 'Website',
                'category-label': 'Category',
                'directions-button': 'Directions',
                'call-button': 'Call',
                'share-button': 'Share',
                'save-button': 'Save',
                'saved-button': 'Saved',
                'remove-button': 'Remove',
                'hours-not-available': 'Hours not available',
                'mosque-category-display': 'Mosque',
                'islamic-center-category-display': 'Islamic Center',
                'added-label': 'Added',
                'added-to-favorites-success': '{mosqueName} added to favorites!',
                'removed-from-favorites-success': '{mosqueName} removed from favorites!',
                'no-favorites-to-clear-error': 'No favorites to clear!',
                'cleared-favorites-success': 'Cleared {count} favorite{s}!',
                'location-not-available-for-directions': 'Location not available for directions',
                'phone-number-not-available': 'Phone number not available',
                'mosque-details-copied': 'Mosque details copied to clipboard!'
            },
            bn: {
                'app-title': 'নামাজ ট্র্যাকার',
                'lang-text': 'EN', 
                'location-title': 'আপনার অবস্থান',
                'qibla-direction-title': 'কিবলার দিক',
                'distance-title': 'মক্কার দূরত্ব',
                'calibration-text': 'ডিভাইসটি সমতল রাখুন এবং কম্পাস ক্যালিব্রেট করতে ৮ আকৃতিতে নাড়ুন। সবুজ পয়েন্টার কিবলার দিক দেখায়।',
                'getting-location': 'অবস্থান নির্ধারণ করা হচ্ছে...', 
                'location-error': 'অবস্থান পেতে অক্ষম',
                'compass-error': 'কম্পাস সমর্থিত নয়',
                'prayer-times': 'নামাজের সময়',
                'qibla-direction': 'কিবলার দিক',
                'islamic-calendar': 'ইসলামিক ক্যালেন্ডার',
                'dhikr-counter': 'জিকির কাউন্টার',
                '99-names': 'আল্লাহর ৯৯ নাম',
                'nearby-mosques': 'নিকটস্থ মসজিদ',
                'tap-instruction': 'গণনা করতে ট্যাপ করুন',
                'today-total-label': 'আজকের মোট:',
                'reset-btn-text': 'রিসেট',
                'pause-btn-text': 'বিরতি',
                'settings-btn-text': 'সেটিংস',
                'day-streak-label': 'দিনের ধারা',
                'completed-label': 'সম্পন্ন হয়েছে',
                'daily-goal-label': 'দৈনিক লক্ষ্য',
                'choose-dhikr-title': 'জিকির নির্বাচন করুন',
                'search-dhikr-placeholder': 'জিকির খুঁজুন...', 
                'dhikr-settings-title': 'জিকির সেটিংস',
                'feedback-title': 'প্রতিক্রিয়া',
                'vibration-label': 'গণনায় কম্পন',
                'sound-label': 'শব্দ প্রতিক্রিয়া',
                'goals-targets-title': 'লক্ষ্য ও উদ্দেশ্য',
                'custom-target-label': 'কাস্টম লক্ষ্য গণনা',
                'daily-goal-input-label': 'দৈনিক লক্ষ্য',
                'reminders-title': 'অনুস্মারক',
                'reminder-time-label': 'দৈনিক অনুস্মারক সময়',
                'enable-reminders-label': 'অনুস্মারক সক্ষম করুন',
                'statistics-title': 'পরিসংখ্যান',
                'stats-period-label': 'পরিসংখ্যান সময়কাল',
                'stats-today-option': 'আজ',
                'stats-week-option': 'এই সপ্তাহ',
                'stats-month-option': 'এই মাস', 
                'stats-all-option': 'সর্বকাল',
                'backup-data-button-text': 'ব্যাকআপ ডেটা',
                'restore-data-button-text': 'ডেটা ফিরিয়ে আনুন',
                'reset-all-data-btn-text': 'সমস্ত ডেটা রিসেট করুন',
                'export-data-btn-text': 'ডেটা এক্সপোর্ট করুন',
                'view-stats-btn-text': 'পরিসংখ্যান দেখুন',
                'dhikr-stats-title': 'জিকির পরিসংখ্যান',
                'loading-stats-text': 'পরিসংখ্যান লোড হচ্ছে...', 
                'stats-today-title': 'আজ',
                'total-count-label-today': 'মোট গণনা',
                'sessions-label-today': 'সেশন',
                'goal-progress-label-today': 'লক্ষ্য অগ্রগতি',
                'stats-this-week-title': 'এই সপ্তাহ',
                'total-count-label-week': 'মোট গণনা',
                'active-days-label-week': 'সক্রিয় দিন',
                'daily-average-label-week': 'দৈনিক গড়',
                'stats-this-month-title': 'এই মাস',
                'total-count-label-month': 'মোট গণনা',
                'active-days-label-month': 'সক্রিয় দিন',
                'daily-average-label-month': 'দৈনিক গড়',
                'stats-overall-title': 'সামগ্রিক',
                'all-time-total-label-overall': 'সর্বমোট',
                'current-streak-label-overall': 'বর্তমান ধারা',
                'total-days-label-overall': 'মোট দিন',
                'Fajr': 'ফজর', 
                'Dhuhr': 'যুহর', 
                'Asr': 'আসর', 
                'Maghrib': 'মাগরিব', 
                'Isha': 'এশা',
                'Ishraq': 'ইশরাক', 
                'Chasht': 'চাশত', 
                'Awwabin': 'আওয়াবীন', 
                'Tahajjud': 'তাহাজ্জুদ',
                'Completed': 'সম্পন্ন',
                'Missed': 'মিসড', 
                'Qaza': 'কাজা', 
                'Pending': 'পেন্ডিং',
                'Daily Analysis': 'দৈনিক বিশ্লেষণ', 
                'Weekly Completion': 'সাপ্তাহিক সম্পন্ন', 
                'Monthly Completion': 'মাসিক সম্পন্ন',
                'Obligatory Prayers': 'ফরজ নামাজ', 
                'Data Management': 'ডেটা ম্যানেজমেন্ট', 
                'Settings': 'সেটিংস', 
                'Time Format': 'সময় বিন্যাস', 
                '12-hour': '১২-ঘন্টা', 
                '24-hour': '২৪-ঘন্টা',
                'Language': 'ভাষা', 
                'English': 'ইংরেজি', 
                'Bengali': 'বাংলা',
                'Notification Sound': 'নোটিফিকেশন সাউন্ড', 
                'Enable notification sound': 'নোটিফিকেশন সাউন্ড চালু করুন',
                'Qaza Counter': 'কাজা কাউন্টার', 
                'Increment': 'বৃদ্ধি', 
                'Decrement': 'হ্রাস',
                'analytics-title': 'বিশ্লেষণ',
                'weekly-completion-title': 'সাপ্তাহিক সম্পন্ন',
                'monthly-completion-title': 'মাসিক সম্পন্ন',
                'weekly-missed-title': 'সাপ্তাহিক মিস',
                'monthly-missed-title': 'মাসিক মিস',
                'weekly-qaza-title': 'সাপ্তাহিক কাজা',
                'monthly-qaza-title': 'মাসিক কাজা',
                'missed-prayers-title': 'ছুটে যাওয়া নামাজ',
                'settings-title-modal': 'সেটিংস',
                'optional-prayers-title': 'ঐচ্ছিক নামাজ',
                'reminders-title-modal': 'অনুস্মারক',
                'enable-reminders-label-text': 'ছুটে যাওয়া নামাজের জন্য অনুস্মারক চালু করুন',
                'time-format-title': 'সময় বিন্যাস',
                'data-management-title': 'ডেটা ম্যানেজমেন্ট',
                'exportPdf': 'পিডিএফ এক্সপোর্ট',
                'resetData': 'ডেটা রিসেট',
                'no-missed-prayers': 'কোনো ছুটে যাওয়া নামাজ নেই',
                'auto-missed-prayer-marking-title': 'স্বয়ংক্রিয় ছুটে যাওয়া নামাজ চিহ্নিতকরণ',
                'disabled-option': 'নিষ্ক্রিয়',
                'current-day-only-option': 'শুধুমাত্র বর্তমান দিন',
                'all-days-option': 'সকল দিন',
                'selected-hijri-day-mobile-text': 'আজকের হিজরি তারিখ',
                'month-view': 'মাস দেখুন',
                'events-view': 'ইভেন্ট দেখুন',
                'today': 'আজ',
                'export': 'এক্সপোর্ট',
                'upcoming-islamic-events': 'আসন্ন ইসলামিক ইভেন্ট',
                'sun': 'রবি', 'mon': 'সোম', 'tue': 'মঙ্গল', 'wed': 'বুধ', 'thu': 'বৃহঃ', 'fri': 'শুক্র', 'sat': 'শনি',
                'no-events-for-date': 'এই তারিখে কোন ইভেন্ট নেই',
                'no-upcoming-events': 'কোনো আসন্ন ইভেন্ট পাওয়া যায়নি',
                'next-event': 'পরবর্তী ইভেন্ট:',
                'days-abbr': 'দিন',
                'hours-abbr': 'ঘন্টা',
                'minutes-abbr': 'মিঃ',
                'seconds-abbr': 'সেঃ',
                'event-today': 'আজ!',
                'countdown-error': 'ত্রুটি: কাউন্টডাউনের জন্য বর্তমান হিজরি তারিখ নির্ধারণ করা যায়নি।',
                'sun-abbr': 'রবি',
                'mon-abbr': 'সোম',
                'tue-abbr': 'মঙ্গল',
                'wed-abbr': 'বুধ',
                'thu-abbr': 'বৃহঃ',
                'fri-abbr': 'শুক্র',
                'sat-abbr': 'শনি',

                'search-mosques-placeholder': 'মসজিদ খুঁজুন...',
                'all-distances-option': 'সমস্ত দূরত্ব',
                'within-600m-option': '৬০০ মিটারের মধ্যে',
                'within-1km-option': '১ কিমির মধ্যে',
                'within-2km-option': '২ কিমির মধ্যে',
                'within-5km-option': '৫ কিমির মধ্যে',
                'all-categories-option': 'সমস্ত বিভাগ',
                'mosque-option': 'মসজিদ',
                'islamic-center-option': 'ইসলামিক সেন্টার',
                'sort-by-distance-option': 'দূরত্ব অনুসারে সাজান',
                'sort-by-name-option': 'নাম অনুসারে সাজান',
                'sort-by-rating-option': 'রেটিং অনুসারে সাজান',
                'current-location-button': 'বর্তমান অবস্থান',
                'nearby-view-button': 'কাছাকাছি',
                'favorites-view-button': 'পছন্দের',
                'map-view-button': 'মানচিত্র',
                'getting-location-status': 'আপনার অবস্থান জানা হচ্ছে...',
                'mosques-found-status': '{count} টি মসজিদ পাওয়া গেছে',
                'finding-nearby-mosques-loading': 'কাছাকাছি মসজিদ খোঁজা হচ্ছে...',
                'unable-to-find-mosques-error': 'মসজিদ খুঁজে পাওয়া যায়নি',
                'check-location-settings-error': 'অনুগ্রহ করে আপনার লোকেশন সেটিংস পরীক্ষা করুন অথবা ম্যানুয়ালি অনুসন্ধান করুন।',
                'try-again-button': 'আবার চেষ্টা করুন',
                'no-mosques-found-empty': 'কোনো মসজিদ পাওয়া যায়নি',
                'expand-search-radius-empty': 'আপনার অনুসন্ধানের পরিধি বাড়ান অথবা অন্য এলাকায় পরীক্ষা করুন।',
                'no-favorite-mosques-empty': 'এখনও কোনো পছন্দের মসজিদ নেই',
                'add-to-favorites-empty': 'কাছাকাছি মসজিদ ব্রাউজ করার সময় হার্ট আইকনে ক্লিক করে আপনার পছন্দের তালিকায় মসজিদ যোগ করুন।',
                'browse-nearby-button': 'কাছাকাছি ব্রাউজ করুন',
                'interactive-map-placeholder': 'ইন্টারেক্টিভ মানচিত্র',
                'map-functionality-requires-location': 'মানচিত্র কার্যকারিতার জন্য লোকেশন পরিষেবা প্রয়োজন',
                'enable-location-button': 'লোকেশন সক্ষম করুন',
                'phone-label': 'ফোন',
                'hours-label': 'সময়',
                'website-label': 'ওয়েবসাইট',
                'category-label': 'বিভাগ',
                'directions-button': 'দিকনির্দেশনা',
                'call-button': 'কল করুন',
                'share-button': 'শেয়ার করুন',
                'save-button': 'সংরক্ষণ করুন',
                'saved-button': 'সংরক্ষিত',
                'remove-button': 'মুছে ফেলুন',
                'hours-not-available': 'সময় উপলব্ধ নয়',
                'mosque-category-display': 'মসজিদ',
                'islamic-center-category-display': 'ইসলামিক সেন্টার',
                'added-label': 'যোগ করা হয়েছে',
                'added-to-favorites-success': '{mosqueName} পছন্দের তালিকায় যোগ করা হয়েছে!',
                'removed-from-favorites-success': '{mosqueName} পছন্দের তালিকা থেকে মুছে ফেলা হয়েছে!',
                'no-favorites-to-clear-error': 'মুছে ফেলার জন্য কোনো পছন্দের তালিকা নেই!',
                'cleared-favorites-success': '{count} টি পছন্দের তালিকা মুছে ফেলা হয়েছে!',
                'location-not-available-for-directions': 'দিকনির্দেশনার জন্য অবস্থান উপলব্ধ নয়',
                'phone-number-not-available': 'ফোন নম্বর উপলব্ধ নয়',
                'mosque-details-copied': 'মসজিদের বিবরণ ক্লিপবোর্ডে কপি করা হয়েছে!'
            }
        };

        this.init();
    }

    getSafeStorageItem(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? item : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key '${key}':`, error);
            return defaultValue;
        }
    }

    setSafeStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error(`Error writing to localStorage key '${key}':`, error);
        }
    }

    init() {
        // Setup drawer functionality - only for non-index pages (index.html has its own in app.js)
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.endsWith('/');
        
        if (!isIndexPage) {
            this.setupDrawer();
        }
        
        // Setup theme and language toggles - always needed
        this.setupThemeToggle();
        this.setupLanguageToggle();
        
        // Setup location input only if it exists (index.html, nearby-mosques.html)
        if (document.getElementById('locationInput')) {
            this.setupLocationInput();
        }
        
        // Setup notification toggle only if it exists (index.html only now)
        if (document.getElementById('notificationToggleBtn')) {
            this.setupNotificationToggle();
        }
        
        // Apply current theme and language
        this.applyTheme();
        this.applyLanguage();
        
        // Update page title and menu
        this.updatePageTitle();
        this.setupActiveMenuItem();
        this.loadLocationsData(); // Load locations data when SharedApp initializes
    }

    async loadLocationsData() {
        try {
            const response = await fetch('/json/locations.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.locationsData = await response.json();
            console.log('Locations data loaded:', this.locationsData.length, 'entries');
        } catch (error) {
            console.error('Could not load locations data:', error);
        }
    }

    updatePageTitle() {
        const currentPage = this.getCurrentPageKey();
        const pageTitle = document.getElementById('app-title');
        
        if (pageTitle && currentPage) {
            const translations = this.translations[this.currentLang];
            if (translations[currentPage]) {
                pageTitle.textContent = translations[currentPage];
            }
        }
    }

    getCurrentPageKey() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        
        const pageMap = {
            'index': 'prayer-times',
            '': 'prayer-times', // For root
            'qibla': 'qibla-direction',
            'islamic-calendar': 'islamic-calendar',
            'dhikr-counter': 'dhikr-counter',
            '99-names': '99-names',
            'nearby-mosques': 'nearby-mosques',
            'settings': 'Settings'
        };
        
        return pageMap[filename] || 'app-title';
    }

    setupActiveMenuItem() {
        const currentPage = this.getCurrentPageFromPath();
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === currentPage) {
                item.classList.add('active');
            }
        });
    }

    getCurrentPageFromPath() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        
        const pageMap = {
            'index': 'home',
            '': 'home', // For root
            'prayer-tracker': 'tracker',
            'dhikr-counter': 'dhikr',
            '99-names': 'names',
            'nearby-mosques': 'mosques',
            'islamic-calendar': 'calendar',
            'qibla': 'qibla',
            'settings': 'settings'
            
            
        };
        
        return pageMap[filename] || 'home';
    }

    setupDrawer() {
        const hamburger = document.getElementById('hamburgerMenu');
        const drawer = document.getElementById('sideDrawer');
        const overlay = document.getElementById('drawerOverlay');
        const closeBtn = document.getElementById('closeDrawer');

        if (hamburger && drawer && overlay) {
            hamburger.addEventListener('click', () => this.toggleDrawer());
            overlay.addEventListener('click', () => this.closeDrawer());
            closeBtn?.addEventListener('click', () => this.closeDrawer());

            // Close drawer when clicking menu items
            document.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    setTimeout(() => this.closeDrawer(), 150);
                });
            });
        }
    }

    toggleDrawer() {
        const hamburger = document.getElementById('hamburgerMenu');
        const drawer = document.getElementById('sideDrawer');
        const overlay = document.getElementById('drawerOverlay');

        hamburger.classList.toggle('open');
        drawer.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    closeDrawer() {
        const hamburger = document.getElementById('hamburgerMenu');
        const drawer = document.getElementById('sideDrawer');
        const overlay = document.getElementById('drawerOverlay');

        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        overlay.classList.remove('active');
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setSafeStorageItem('theme', this.currentTheme);
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    setupLanguageToggle() {
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'en' ? 'bn' : 'en';
        this.setSafeStorageItem('language', this.currentLang);
        this.applyLanguage();
    }

    applyLanguage() {
        // Ensure currentLang is valid
        if (!this.currentLang || this.currentLang === 'null') {
            this.currentLang = 'en';
            this.setSafeStorageItem('language', 'en');
        }
        
        const translations = this.translations[this.currentLang];
        if (!translations || typeof translations !== 'object') {
            console.warn('Translations not available for language:', this.currentLang, 'falling back to English');
            this.currentLang = 'en';
            this.setSafeStorageItem('language', 'en');
            const fallbackTranslations = this.translations['en'];
            if (!fallbackTranslations) {
                console.error('Even English translations are not available!');
                return;
            }
            Object.keys(fallbackTranslations).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.textContent = fallbackTranslations[key];
                }
            });
            return;
        }
        
        Object.keys(translations).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = translations[key];
            }
        });

        // Handle elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });

        // New: Handle elements with data-en and data-bn attributes
        document.querySelectorAll('[data-en], [data-bn]').forEach(element => {
            const enText = element.getAttribute('data-en');
            const bnText = element.getAttribute('data-bn');
            if (this.currentLang === 'en' && enText) {
                element.textContent = enText;
            } else if (this.currentLang === 'bn' && bnText) {
                element.textContent = bnText;
            }

            // New: Handle placeholder attributes
            const enPlaceholder = element.getAttribute('data-en-placeholder');
            const bnPlaceholder = element.getAttribute('data-bn-placeholder');
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                if (this.currentLang === 'en' && enPlaceholder) {
                    element.placeholder = enPlaceholder;
                } else if (this.currentLang === 'bn' && bnPlaceholder) {
                    element.placeholder = bnPlaceholder;
                }
            }
        });

        // Update language toggle button
        const langText = document.getElementById('lang-text');
        if (langText) {
            langText.textContent = this.currentLang === 'en' ? 'BN' : 'EN';
        }
        
        // Update page title
        this.updatePageTitle();

        // If the prayerTracker object exists on the page, tell it to re-render.
        if (window.prayerTracker && typeof window.prayerTracker.applyLanguage === 'function') {
            window.prayerTracker.applyLanguage();
        }
        if (window.app && typeof window.app.applyLanguage === 'function') {
            window.app.applyLanguage();
        }
    }

    setupLocationInput() {
        const locationInput = document.getElementById('locationInput');
        const searchBtn = document.getElementById('searchBtn');
        const locationBtn = document.getElementById('locationBtn');
        const suggestionsContainer = document.getElementById('suggestionsContainer');
        
        if (locationInput) {
            // Setup page-specific placeholder text
            this.updateLocationInputPlaceholder();
            
            // Handle input changes for suggestions
            locationInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.showLocationSuggestions(query);
                } else {
                    this.hideSuggestions();
                }
            });

            // Handle focus/blur
            locationInput.addEventListener('focus', () => {
                if (locationInput.value.length >= 2) {
                    this.showLocationSuggestions(locationInput.value);
                }
            });

            locationInput.addEventListener('blur', () => {
                // Delay hiding to allow for suggestion clicks
                setTimeout(() => this.hideSuggestions(), 300); // Increased delay for desktop
            });
        }

        // Search button functionality
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = locationInput?.value.trim();
                if (query) {
                    this.handlePageSpecificSearch(query);
                }
            });
        }

        // Location button functionality
        if (locationBtn) {
            locationBtn.addEventListener('click', () => {
                this.getCurrentLocation();
            });
        }
    }

    updateLocationInputPlaceholder() {
        const locationInput = document.getElementById('locationInput');
        if (!locationInput) return;

        const currentPage = this.getCurrentPageFromPath();
        const translations = this.translations[this.currentLang];
        
        const placeholderKeys = {
            'home': 'location_input_placeholder',
            'qibla': 'location_input_placeholder', 
            'calendar': 'search-dhikr-placeholder',
            'dhikr': 'search-dhikr-placeholder',
            'names': 'search-dhikr-placeholder',
            'mosques': 'search-mosques-placeholder'
        };

        const placeholderKey = placeholderKeys[currentPage] || 'location_input_placeholder';
        locationInput.placeholder = translations[placeholderKey] || translations['location_input_placeholder'] || 'Enter city name';
    }

    handlePageSpecificSearch(query) {
        const currentPage = this.getCurrentPageFromPath();
        
        switch(currentPage) {
            case 'home':
                this.searchLocation(query);
                break;
            case 'qibla':
                this.searchLocation(query);
                break;
            case 'calendar':
                this.searchEvents(query);
                break;
            case 'dhikr':
                this.searchDhikr(query);
                break;
            case 'names':
                this.searchNames(query);
                break;
            case 'mosques':
                this.searchMosques(query);
                break;
        }
    }

    async searchLocation(query) {
        try {
            // This would typically use a geocoding API
            const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=YOUR_API_KEY&limit=5`);
            // For demo, we'll simulate suggestions
            this.showLocationSuggestions(query);
        } catch (error) {
            console.error('Error searching location:', error);
        }
    }

    searchEvents(query) {
        // Trigger event search on calendar page
        const eventSearchInput = document.getElementById('eventSearch');
        if (eventSearchInput) {
            eventSearchInput.value = query;
            eventSearchInput.dispatchEvent(new Event('input'));
        }
    }

    searchDhikr(query) {
        // Trigger dhikr search on dhikr counter page
        const dhikrSearchInput = document.getElementById('dhikrSearch');
        if (dhikrSearchInput) {
            dhikrSearchInput.value = query;
            dhikrSearchInput.dispatchEvent(new Event('input'));
        }
    }

    searchNames(query) {
        // Trigger names search on 99 names page
        const namesSearchInput = document.getElementById('namesSearch');
        if (namesSearchInput) {
            namesSearchInput.value = query;
            namesSearchInput.dispatchEvent(new Event('input'));
        }
    }

    searchMosques(query) {
        // Trigger mosque search on mosques page
        const mosqueSearchInput = document.getElementById('mosqueSearch');
        if (mosqueSearchInput) {
            mosqueSearchInput.value = query;
            mosqueSearchInput.dispatchEvent(new Event('input'));
        }
    }

    showLocationSuggestions(query) {
        const suggestionsContainer = document.getElementById('suggestionsContainer');
        if (!suggestionsContainer) return;

        // Filter locations from loaded data
        const suggestions = this.locationsData.filter(location => 
            location.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions

        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-lat="${suggestion.lat}" data-lng="${suggestion.lng}">
                <i class="fas fa-map-marker-alt"></i>
                <span>${suggestion.name}</span>
            </div>
        `).join('');

        // Bind suggestion clicks
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('mousedown', (event) => { // Changed to mousedown
                event.preventDefault(); // Prevent blur on input
                const locationInput = document.getElementById('locationInput');
                locationInput.value = item.querySelector('span').textContent;
                this.hideSuggestions();
                
                // Trigger location selection for appropriate pages
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                this.selectLocation(lat, lng, item.querySelector('span').textContent);
            });
        });

        suggestionsContainer.style.display = 'block';
    }

    hideSuggestions() {
        const suggestionsContainer = document.getElementById('suggestionsContainer');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    // Centralized location management with permission checking
    async checkLocationPermission() {
        if (!navigator.geolocation) {
            return 'denied';
        }

        if (!navigator.permissions) {
            // Fallback for browsers that don't support permissions API
            return 'unknown';
        }

        try {
            const result = await navigator.permissions.query({name: 'geolocation'});
            return result.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            return 'unknown';
        }
    }

    async getCurrentLocationWithPermissionCheck() {
        const permission = await this.checkLocationPermission();
        
        // If permission is already granted, get location directly
        if (permission === 'granted') {
            return this.getLocationData();
        }

        // If permission was denied, check if we have cached location
        if (permission === 'denied') {
            const cachedLocation = this.getCachedLocation();
            if (cachedLocation) {
                return cachedLocation;
            }
            throw new Error('Location permission denied');
        }

        // If permission is 'prompt' or 'unknown', request permission
        return this.getLocationData();
    }

    getLocationData() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: Date.now()
                    };
                    
                    // Cache the location for future use
                    this.cacheLocation(locationData);
                    
                    resolve(locationData);
                },
                (error) => {
                    reject(error);
                },
                { 
                    timeout: 10000,
                    enableHighAccuracy: true,
                    maximumAge: 300000 // 5 minutes cache
                }
            );
        });
    }

    cacheLocation(locationData) {
        try {
            localStorage.setItem('cachedLocation', JSON.stringify(locationData));
        } catch (error) {
            console.warn('Could not cache location:', error);
        }
    }

    getCachedLocation() {
        try {
            const cached = localStorage.getItem('cachedLocation');
            if (cached) {
                const locationData = JSON.parse(cached);
                // Check if cache is not too old (24 hours)
                if (Date.now() - locationData.timestamp < 24 * 60 * 60 * 1000) {
                    return locationData;
                }
            }
        } catch (error) {
            console.warn('Could not retrieve cached location:', error);
        }
        return null;
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showNotification('Geolocation not supported', 'error');
            return;
        }

        const locationBtn = document.getElementById('locationBtn');
        if (locationBtn) {
            locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const locationData = await this.getCurrentLocationWithPermissionCheck();
            const locationName = `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`;
            
            this.selectLocation(locationData.lat, locationData.lng, locationName);
            
            if (locationBtn) {
                locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            }
        } catch (error) {
            console.error('Location error:', error);
            
            let errorMessage = 'Unable to get location';
            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = 'Location permission denied';
            } else if (error.code === error.TIMEOUT) {
                errorMessage = 'Location request timed out';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMessage = 'Location information is unavailable';
            }
            
            this.showNotification(errorMessage, 'error');
            
            if (locationBtn) {
                locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            }
        }
    }

    selectLocation(lat, lng, name) {
        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.value = name;
        }

        // Trigger location update for appropriate pages
        const currentPage = this.getCurrentPageFromPath();
        
        if (currentPage === 'home' && window.prayerApp) {
            // For prayer app, call updateLocation if it exists
            if (window.prayerApp.updateLocation) {
                window.prayerApp.updateLocation(lat, lng, name);
            }
        } else if (currentPage === 'qibla' && window.qiblaApp) {
            // For qibla app, set location and recalculate
            window.qiblaApp.userLocation = { lat, lng };
            window.qiblaApp.locationName = name;
            if (window.qiblaApp.calculateQiblaDirection) {
                window.qiblaApp.calculateQiblaDirection();
            }
            if (window.qiblaApp.updateLocationDisplay) {
                window.qiblaApp.updateLocationDisplay();
            }
        } else if (currentPage === 'mosques' && window.app) {
            // For mosques app (assigned to window.app), set location and search
            window.app.userLocation = { lat, lng, accuracy: 100 };
            if (window.app.updateLocationStatus) {
                window.app.updateLocationStatus(`Location set: ${name}`);
            }
            if (window.app.searchNearbyMosques) {
                window.app.searchNearbyMosques();
            }
        }
    }

    setupNotificationToggle() {
        const notificationBtn = document.getElementById('notificationToggleBtn');
        if (notificationBtn) {
            // Check current notification permission
            this.updateNotificationButtonState();
            
            notificationBtn.addEventListener('click', () => {
                this.toggleNotifications();
            });
        }
    }

    async toggleNotifications() {
        if (!('Notification' in window)) {
            this.showNotification('Notifications not supported', 'error');
            return;
        }

        if (Notification.permission !== 'granted') {
            // If permission not granted, request it first
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // Set to mode 1 (obligatory prayers) when first enabled
                    this.setSafeStorageItem('notificationMode', '1');
                    this.updateNotificationButtonState();
                    this.showNotification('Notifications enabled for prayer reminders', 'success');
                    
                    // Also initialize OneSignal for push notifications
                    if (window.oneSignalManager) {
                        await window.oneSignalManager.requestPermission();
                        // Update UI again to reflect OneSignal status
                        setTimeout(() => this.updateNotificationButtonState(), 1000);
                    }
                } else {
                    this.showNotification('Notification permission denied', 'error');
                }
            } catch (error) {
                this.showNotification('Error enabling notifications', 'error');
            }
            return;
        }

        // Cycle through notification modes: 0 -> 1 -> 2 -> 0 (for all pages)
        const currentMode = parseInt(this.getSafeStorageItem('notificationMode', '0')) || 0;
        const newMode = (currentMode + 1) % 3;
        this.setSafeStorageItem('notificationMode', newMode.toString());
        this.updateNotificationButtonState();

        // Show feedback to user
        let message = '';
        if (newMode === 0) {
            message = 'Notifications turned off';
        } else if (newMode === 1) {
            message = 'Notifications enabled for obligatory prayers only';
            // Try to enable OneSignal if not already enabled
            this.ensureOneSignalEnabled();
        } else if (newMode === 2) {
            message = 'Notifications enabled for all prayers';
            // Try to enable OneSignal if not already enabled
            this.ensureOneSignalEnabled();
        }
        
        this.showNotification(message, 'info');
    }

    async ensureOneSignalEnabled() {
        // Check if OneSignal manager exists
        if (!window.oneSignalManager) {
            console.log('OneSignal manager not available');
            return;
        }

        // Try to initialize OneSignal if not already done
        if (!window.oneSignalManager.isInitialized) {
            console.log('OneSignal not initialized, attempting manual initialization...');
            
            // Use the manual initialization function
            if (window.initializeOneSignalIfNeeded) {
                const initialized = await window.initializeOneSignalIfNeeded();
                if (!initialized) {
                    console.log('Manual OneSignal initialization failed');
                    return;
                }
            } else {
                // Fallback to waiting
                for (let i = 0; i < 50; i++) {
                    if (window.oneSignalManager.isInitialized) {
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                if (!window.oneSignalManager.isInitialized) {
                    console.log('OneSignal failed to initialize within 5 seconds');
                    return;
                }
            }
        }

        // If OneSignal is available but not subscribed, try to enable it
        if (!window.oneSignalManager.isSubscribed) {
            console.log('Attempting to enable OneSignal for enhanced notifications...');
            console.log('Current OneSignal status - Initialized:', window.oneSignalManager.isInitialized, 'Subscribed:', window.oneSignalManager.isSubscribed);
            
            const success = await window.oneSignalManager.requestPermission();
            
            if (success) {
                console.log('OneSignal permission granted successfully');
            } else {
                console.log('OneSignal permission request failed or was denied');
                console.log('This is normal if user denied permission or browser blocked it');
            }
            
            // Update UI after a brief delay to reflect OneSignal status
            setTimeout(() => this.updateNotificationButtonState(), 1000);
        } else {
            console.log('OneSignal already subscribed');
        }
    }

    updateNotificationButtonState() {
        const notificationBtn = document.getElementById('notificationToggleBtn');
        if (!notificationBtn) {
            console.log('Notification button not found');
            return;
        }

        const icon = notificationBtn.querySelector('i');
        const notificationMode = parseInt(this.getSafeStorageItem('notificationMode', '0')) || 0;
        
        let iconClass, title;
        
        // Check OneSignal subscription status
        const isOneSignalActive = window.oneSignalManager && window.oneSignalManager.isSubscribed;
        const pushStatus = isOneSignalActive ? ' + Push' : ' (Local only)';
        
        console.log('Updating notification button - Mode:', notificationMode, 'OneSignal Active:', isOneSignalActive);
        
        switch (notificationMode) {
            case 0: // Off
                iconClass = 'fas fa-bell-slash';
                title = 'Notifications Off - Click to enable obligatory prayers';
                notificationBtn.classList.remove('active', 'partial', 'push-enabled');
                break;
            case 1: // Obligatory prayers only
                iconClass = 'fas fa-bell';
                title = `Obligatory Prayers Only${pushStatus} - Click for all prayers`;
                notificationBtn.classList.add('partial');
                notificationBtn.classList.remove('active');
                notificationBtn.classList.toggle('push-enabled', isOneSignalActive);
            case 2: // All prayers
                iconClass = 'fas fa-bell';
                title = `All Prayers${pushStatus} - Click to turn off`;
                notificationBtn.classList.add('active');
                notificationBtn.classList.remove('partial');
                notificationBtn.classList.toggle('push-enabled', isOneSignalActive);
                break;
        }
        
        if (icon) {
            icon.className = iconClass;
        }
        notificationBtn.title = title;
        
        // Also update OneSignal UI if available
        if (window.oneSignalManager) {
            window.oneSignalManager.updateUI();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Helper function to format numbers based on current language
    formatNumberForLanguage(number) {
        if (this.currentLang === 'bn') {
            return new Intl.NumberFormat('bn-BD').format(number);
        }
        return new Intl.NumberFormat('en-US').format(number);
    }

    updateMoonPhaseDisplay(elementId) {
        const moonPhaseElement = document.getElementById(elementId);
        if (!moonPhaseElement) return;

        const today = new Date();
        const lunarMonth = 29.53058867; // Average lunar month length
        const knownNewMoon = new Date('2024-01-11T00:00:00Z'); // Jan 11, 2024, 00:00 UTC (a known new moon)
        
        // Calculate days since known new moon in UTC to avoid timezone issues
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysSinceNewMoon = (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(knownNewMoon.getFullYear(), knownNewMoon.getMonth(), knownNewMoon.getDate())) / msPerDay;
        
        let lunarAge = daysSinceNewMoon % lunarMonth;
        if (lunarAge < 0) lunarAge += lunarMonth; // Ensure positive value

        let phase = '';
        let emoji = '';
        
        if (lunarAge < 1.84566) {
            phase = 'New Moon';
            emoji = '🌑';
        } else if (lunarAge < 5.53699) {
            phase = 'Waxing Crescent';
            emoji = '🌒';
        } else if (lunarAge < 9.22831) {
            phase = 'First Quarter';
            emoji = '🌓';
        } else if (lunarAge < 12.91963) {
            phase = 'Waxing Gibbous';
            emoji = '🌔';
        } else if (lunarAge < 16.61096) {
            phase = 'Full Moon';
            emoji = '🌕';
        } else if (lunarAge < 20.30228) {
            phase = 'Waning Gibbous';
            emoji = '🌖';
        } else if (lunarAge < 23.99361) {
            phase = 'Last Quarter';
            emoji = '🌗';
        } else {
            phase = 'Waning Crescent';
            emoji = '🌘';
        }

        moonPhaseElement.innerHTML = `
            <div class="moon-emoji">${emoji}</div>
            <div class="moon-phase-name">${phase}</div>
            <div class="moon-age">${Math.round(lunarAge)} days old</div>
        `;
    }
}

// Initialize shared functionality
const sharedApp = new SharedApp();
window.sharedApp = sharedApp;