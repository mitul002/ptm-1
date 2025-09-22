// 99 Names of Allah JavaScript
class NamesOfAllah {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.viewMode = 'grid';
        this.searchQuery = '';
        this.favorites = new Set();
        this.currentAudio = null;
        this.isPlaying = false;
        this.currentView = 'all'; // 'all' or 'favorites'
        this.isShuffled = false; // Track if cards are shuffled
        this.currentLang = localStorage.getItem('language') || 'en'; // Add language support
        this.isReciteAllActive = false; // Track if Recite All is active
        this.reciteAllCurrentIndex = 0; // Track current position in Recite All
        this.reciteAllTimeout = null; // Store timeout for Recite All
        this.namesToRecite = null; // Store the array of names to recite
        this.reciteViewMode = null; // Track which view mode was used for recitation
        this.reciteShuffleState = null; // Track shuffle state when recitation started
        this.utteranceEndHandler = null; // Handler for speech synthesis end event
        this._inReciteAllProcess = false; // Flag to track if we're in recite all process
        this._inStopAudio = false; // Flag to track if we're in stopAudio
        this._inPauseReciteAll = false; // Flag to prevent infinite recursion
        this.names = this.get99Names();
        this.originalNames = [...this.names]; // Keep original order
        this.filteredNames = [...this.names];
        this.featuredNameIndex = this.getDailyFeaturedIndex();
        this.featuredName = this.originalNames[this.featuredNameIndex]; // Store the actual featured name object
        this.userId = null; // Initialize userId as null
        
        this.translations = {
            en: {
                'app-title': 'Names of Allah',
                'lang-text': 'BN',
                'name-of-day': 'Name of the Day',
                'search-placeholder': 'Search the beautiful names...',
                'search-favorites-placeholder': 'Search favorites...',
                
                
                'recite-all': 'Recite All',
                'pause': 'Pause',
                'resume': 'Resume',
                
                'restore-order': 'Restore Order',
                'share': 'Share',
                'meaning': 'Meaning',
                'no-favorites': 'No favorites added yet',
                'cards-shuffled': 'Cards shuffled! Browse through the pages to see the randomized order.',
                'order-restored': 'Original order restored!'
            },
            bn: {
                'app-title': 'আল্লাহর ৯৯ নাম',
                'lang-text': 'EN',
                'name-of-day': 'আজকের নাম',
                'search-placeholder': 'সুন্দর নামগুলি খুঁজুন...',
                'search-favorites-placeholder': 'প্রিয় নামগুলি খুঁজুন...',
               
               
                'recite-all': 'সব পড়ুন',
                'pause': 'বিরতি',
                'resume': 'চালিয়ে যান',
                'restore-order': 'ক্রম পুনরুদ্ধার',
                'share': 'শেয়ার',
                'meaning': 'অর্থ',
                'no-favorites': 'এখনো কোনো প্রিয় নাম যোগ করা হয়নি',
                'cards-shuffled': 'কার্ডগুলি এলোমেলো করা হয়েছে! এলোমেলো ক্রম দেখতে পৃষ্ঠাগুলি ব্রাউজ করুন।',
                'order-restored': 'মূল ক্রম পুনরুদ্ধার করা হয়েছে!'
            }
        };
        
        this.init();
    }

    init() {
        this.loadFavorites(); // This will now attempt to load from Firebase
        this.setFeaturedName();
        this.renderNames();
        this.updatePagination();
        this.applyLanguage();
        this.bindEvents();
        this.setupAuthListener(); // New: Listen for auth state changes

        // Listen for data sync completion to reload favorites
        document.addEventListener('dataSyncComplete', () => {
            console.log('dataSyncComplete event received in 99-names.js, reloading favorites...');
            this.loadFavorites();
            this.renderNames(); // Re-render to reflect updated favorites
            this.updatePagination(); // Update pagination based on new filtered names
        });
    }

    setupAuthListener() {
        if (window.setupAuthObserver) {
            window.setupAuthObserver((user) => {
                this.userId = user ? user.uid : null;
                console.log("99-Names: User auth state changed. User ID:", this.userId);
                // Reload favorites based on new user ID
                this.loadFavorites();
                this.renderNames(); // Re-render to update favorite icons
            });
        } else {
            console.warn("99-Names: setupAuthObserver not available. Favorites sync may not work.");
        }
    }

    get99Names() {
        return [
            { 
                number: 1, 
                arabic: 'الرَّحْمَنُ', 
                transliteration: 'Ar-Rahman', 
                translation: { en: 'The Most Compassionate', bn: 'পরম দয়ালু' }, 
                meaning: { en: 'The One who wills goodness and mercy for all His creatures', bn: 'যিনি তাঁর সকল সৃষ্টির জন্য কল্যাণ ও দয়া চান' }, 
                description: { en: 'Allah shows mercy to all creation without exception. His mercy encompasses everything in existence.', bn: 'আল্লাহ ব্যতিক্রম ছাড়াই সকল সৃষ্টির প্রতি দয়া দেখান। তাঁর রহমত অস্তিত্বের সবকিছুকে ঘিরে রাখে।' }
            },
            { 
                number: 2, 
                arabic: 'الرَّحِيمُ', 
                transliteration: 'Ar-Raheem', 
                translation: { en: 'The Most Merciful', bn: 'অতি দয়াময়' }, 
                meaning: { en: 'The One who is merciful especially to the believers', bn: 'যিনি বিশেষভাবে মুমিনদের প্রতি দয়ালু' }, 
                description: { en: 'Allah shows special mercy to those who believe and follow His guidance.', bn: 'আল্লাহ তাদের প্রতি বিশেষ রহমত দেখান যারা ঈমান আনে ও তাঁর পথনির্দেশনা অনুসরণ করে।' }
            },
            { 
                number: 3, 
                arabic: 'الْمَلِكُ', 
                transliteration: 'Al-Malik', 
                translation: { en: 'The King', bn: 'রাজা' }, 
                meaning: { en: 'The Sovereign Lord, Master of all', bn: 'সার্বভৌম প্রভু, সকলের মালিক' }, 
                description: { en: 'Allah is the ultimate authority over all creation, the true King of the universe.', bn: 'আল্লাহ সমস্ত সৃষ্টির উপর চূড়ান্ত কর্তৃত্ব, মহাবিশ্বের সত্যিকারের রাজা।' }
            },
            { 
                number: 4, 
                arabic: 'الْقُدُّوسُ', 
                transliteration: 'Al-Quddus', 
                translation: { en: 'The Most Holy', bn: 'পবিত্রতম' }, 
                meaning: { en: 'The Pure One, free from any defect', bn: 'নিষ্কলুষ, যে কোন ত্রুটি থেকে মুক্ত' }, 
                description: { en: 'Allah is absolutely pure and free from any imperfection or fault.', bn: 'আল্লাহ সম্পূর্ণভাবে পবিত্র এবং যেকোনো অপূর্ণতা বা দোষ থেকে মুক্ত।' }
            },
            { 
                number: 5, 
                arabic: 'السَّلاَمُ', 
                transliteration: 'As-Salam', 
                translation: { en: 'The Source of Peace', bn: 'শান্তির উৎস' }, 
                meaning: { en: 'The One who is free from all defects', bn: 'সকল ত্রুটি থেকে মুক্ত' }, 
                description: { en: 'Allah is the source of peace and security, free from any weakness or flaw.', bn: 'আল্লাহ শান্তি ও নিরাপত্তার উৎস, যেকোনো দুর্বলতা বা ত্রুটি থেকে মুক্ত।' }
            },
            { 
                number: 6, 
                arabic: 'الْمُؤْمِنُ', 
                transliteration: 'Al-Mu\'min', 
                translation: { en: 'The Guardian of Faith', bn: 'ঈমানের রক্ষক' }, 
                meaning: { en: 'The One who gives security and peace', bn: 'যিনি নিরাপত্তা ও শান্তি দান করেন' }, 
                description: { en: 'Allah provides security and faith to those who believe in Him.', bn: 'আল্লাহ তাঁর উপর বিশ্বাসীদের নিরাপত্তা ও ঈমান প্রদান করেন।' }
            },
            { 
                number: 7, 
                arabic: 'الْمُهَيْمِنُ', 
                transliteration: 'Al-Muhaymin', 
                translation: { en: 'The Protector', bn: 'রক্ষাকর্তা' }, 
                meaning: { en: 'The Guardian, Overseer, Protector', bn: 'অভিভাবক, তত্ত্বাবধায়ক, রক্ষক' }, 
                description: { en: 'Allah watches over and protects all of creation continuously.', bn: 'আল্লাহ ক্রমাগত সমস্ত সৃষ্টির দেখভাল করেন এবং রক্ষা করেন।' }
            },
            { 
                number: 8, 
                arabic: 'الْعَزِيزُ', 
                transliteration: 'Al-Aziz', 
                translation: { en: 'The Mighty', bn: 'পরাক্রমশালী' }, 
                meaning: { en: 'The Strong, The Dominant', bn: 'শক্তিশালী, প্রাধান্যবিস্তারী' }, 
                description: { en: 'Allah possesses ultimate power and strength that cannot be overcome.', bn: 'আল্লাহ এমন চূড়ান্ত শক্তি ও বলের অধিকারী যা পরাজিত হতে পারে না।' }
            },
            { 
                number: 9, 
                arabic: 'الْجَبَّارُ', 
                transliteration: 'Al-Jabbar', 
                translation: { en: 'The Compeller', bn: 'বাধ্যকারী' }, 
                meaning: { en: 'The One who prevails over all', bn: 'যিনি সবার উপর জয়ী' }, 
                description: { en: 'Allah has absolute power to enforce His will upon all creation.', bn: 'আল্লাহর সমস্ত সৃষ্টির উপর তাঁর ইচ্ছা প্রয়োগ করার পূর্ণ ক্ষমতা রয়েছে।' }
            },
            { 
                number: 10, 
                arabic: 'الْمُتَكَبِّرُ', 
                transliteration: 'Al-Mutakabbir', 
                translation: { en: 'The Supreme', bn: 'মহাগর্বিত' }, 
                meaning: { en: 'The One who is supremely great', bn: 'যিনি চরমভাবে মহান' }, 
                description: { en: 'Allah alone has the right to true greatness and supremacy.', bn: 'একমাত্র আল্লাহরই প্রকৃত মহত্ত্ব ও শ্রেষ্ঠত্বের অধিকার রয়েছে।' }
            },
            { 
                number: 11, 
                arabic: 'الْخَالِقُ', 
                transliteration: 'Al-Khaliq', 
                translation: { en: 'The Creator', bn: 'সৃষ্টিকর্তা' }, 
                meaning: { en: 'The One who creates everything', bn: 'যিনি সব কিছু সৃষ্টি করেন' }, 
                description: { en: 'Allah created all things from nothing and continues to create.', bn: 'আল্লাহ শূন্য থেকে সব কিছু সৃষ্টি করেছেন এবং সৃষ্টি করে চলেছেন।' }
            },
            { 
                number: 12, 
                arabic: 'الْبَارِئُ', 
                transliteration: 'Al-Bari', 
                translation: { en: 'The Maker', bn: 'নির্মাতা' }, 
                meaning: { en: 'The One who makes things with proportion', bn: 'যিনি সবকিছু সুসামঞ্জস্যভাবে তৈরি করেন' }, 
                description: { en: 'Allah creates everything in perfect proportion and harmony.', bn: 'আল্লাহ সবকিছু নিখুঁত অনুপাত ও সামঞ্জস্যে সৃষ্টি করেন।' }
            },
            { 
                number: 13, 
                arabic: 'الْمُصَوِّرُ', 
                transliteration: 'Al-Musawwir', 
                translation: { en: 'The Shaper', bn: 'আকৃতিদানকারী' }, 
                meaning: { en: 'The One who gives form and shape', bn: 'যিনি রূপ ও আকৃতি দান করেন' }, 
                description: { en: 'Allah gives form and distinctive features to all creation.', bn: 'আল্লাহ সমস্ত সৃষ্টিকে রূপ ও বিশিষ্ট বৈশিষ্ট্য দান করেন।' }
            },
            { 
                number: 14, 
                arabic: 'الْغَفَّارُ', 
                transliteration: 'Al-Ghaffar', 
                translation: { en: 'The Great Forgiver', bn: 'মহাক্ষমাশীল' }, 
                meaning: { en: 'The One who repeatedly forgives', bn: 'যিনি বারবার ক্ষমা করেন' }, 
                description: { en: 'Allah forgives sins again and again for those who sincerely repent.', bn: 'আল্লাহ তাদের পাপ বারবার ক্ষমা করেন যারা আন্তরিকভাবে তওবা করে।' }
            },
            { 
                number: 15, 
                arabic: 'الْقَهَّارُ', 
                transliteration: 'Al-Qahhar', 
                translation: { en: 'The Subduer', bn: 'পরাক্রমশালী' }, 
                meaning: { en: 'The One who dominates everything', bn: 'যিনি সবকিছুর উপর কর্তৃত্ব করেন' }, 
                description: { en: 'All things submit to Allah\'s power and authority.', bn: 'সব কিছুই আল্লাহর ক্ষমতা ও কর্তৃত্বের কাছে নতি স্বীকার করে।' }
            },
            { 
                number: 16, 
                arabic: 'الْوَهَّابُ', 
                transliteration: 'Al-Wahhab', 
                translation: { en: 'The Great Giver', bn: 'মহান দাতা' }, 
                meaning: { en: 'The One who gives generously', bn: 'যিনি উদারভাবে দান করেন' }, 
                description: { en: 'Allah gives continuously without expecting anything in return.', bn: 'আল্লাহ কোন প্রতিদান আশা না করে ক্রমাগত দান করেন।' }
            },
            { 
                number: 17, 
                arabic: 'الرَّزَّاقُ', 
                transliteration: 'Ar-Razzaq', 
                translation: { en: 'The Sustainer', bn: 'রিযিকদাতা' }, 
                meaning: { en: 'The One who provides sustenance', bn: 'যিনি জীবিকা প্রদান করেন' }, 
                description: { en: 'Allah provides for all creation and sustains them continuously.', bn: 'আল্লাহ সমস্ত সৃষ্টির জন্য ব্যবস্থা করেন এবং ক্রমাগত তাদের ভরণপোষণ করেন।' }
            },
            { 
                number: 18, 
                arabic: 'الْفَتَّاحُ', 
                transliteration: 'Al-Fattah', 
                translation: { en: 'The Opener', bn: 'উন্মোচনকারী' }, 
                meaning: { en: 'The One who opens what is closed', bn: 'যিনি বন্ধ থাকা উন্মোচন করেন' }, 
                description: { en: 'Allah opens doors of mercy, knowledge, and opportunities.', bn: 'আল্লাহ রহমত, জ্ঞান ও সুযোগের দরজা খুলে দেন।' }
            },
            { 
                number: 19, 
                arabic: 'الْعَلِيمُ', 
                transliteration: 'Al-Alim', 
                translation: { en: 'The All-Knowing', bn: 'সর্বজ্ঞানী' }, 
                meaning: { en: 'The One who knows everything', bn: 'যিনি সব কিছু জানেন' }, 
                description: { en: 'Allah\'s knowledge encompasses all things, past, present, and future.', bn: 'আল্লাহর জ্ঞান সব কিছুকে ঘিরে রাখে - অতীত, বর্তমান ও ভবিষ্যত।' }
            },
            { 
                number: 20, 
                arabic: 'الْقَابِضُ', 
                transliteration: 'Al-Qabid', 
                translation: { en: 'The Withholder', bn: 'সংকোচনকারী' }, 
                meaning: { en: 'The One who constricts sustenance', bn: 'যিনি জীবিকা সংকুচিত করেন' }, 
                description: { en: 'Allah withholds or restricts according to His wisdom.', bn: 'আল্লাহ তাঁর জ্ঞান অনুসারে বিরত রাখেন বা সীমাবদ্ধ করেন।' }
            },
            { 
                number: 21, 
                arabic: 'الْبَاسِطُ', 
                transliteration: 'Al-Basit', 
                translation: { en: 'The Expander', bn: 'প্রসারণকারী' }, 
                meaning: { en: 'The One who gives abundantly', bn: 'যিনি প্রাচুর্যের সাথে দান করেন' }, 
                description: { en: 'Allah expands and increases sustenance and provisions.', bn: 'আল্লাহ জীবিকা ও রিযিক সম্প্রসারিত ও বৃদ্ধি করেন।' }
            },
            { 
                number: 22, 
                arabic: 'الْخَافِضُ', 
                transliteration: 'Al-Khafid', 
                translation: { en: 'The Abaser', bn: 'অবনমনকারী' }, 
                meaning: { en: 'The One who lowers and humbles', bn: 'যিনি নিচু করেন ও বিনত করেন' }, 
                description: { en: 'Allah lowers those who deserve to be humbled.', bn: 'আল্লাহ তাদের অবনত করেন যারা অবনত হওয়ার যোগ্য।' }
            },
            { 
                number: 23, 
                arabic: 'الرَّافِعُ', 
                transliteration: 'Ar-Rafi', 
                translation: { en: 'The Exalter', bn: 'উন্নতকারী' }, 
                meaning: { en: 'The One who raises and elevates', bn: 'যিনি উঠান ও উন্নত করেন' }, 
                description: { en: 'Allah raises the status of those who deserve elevation.', bn: 'আল্লাহ তাদের মর্যাদা বৃদ্ধি করেন যারা উন্নতির যোগ্য।' }
            },
            { 
                number: 24, 
                arabic: 'الْمُعِزُّ', 
                transliteration: 'Al-Mu\'izz', 
                translation: { en: 'The Giver of Honor', bn: 'সম্মানদাতা' }, 
                meaning: { en: 'The One who gives honor and might', bn: 'যিনি সম্মান ও শক্তি দান করেন' }, 
                description: { en: 'Allah grants honor and dignity to whom He wills.', bn: 'আল্লাহ যাকে ইচ্ছা সম্মান ও মর্যাদা দান করেন।' }
            },
            { 
                number: 25, 
                arabic: 'الْمُذِلُّ', 
                transliteration: 'Al-Mudhill', 
                translation: { en: 'The Humiliator', bn: 'অপমানকারী' }, 
                meaning: { en: 'The One who gives humiliation', bn: 'যিনি অপমান দান করেন' }, 
                description: { en: 'Allah humiliates those who deserve humiliation through their actions.', bn: 'আল্লাহ তাদের কর্মের মাধ্যমে অপমানিত করেন যারা অপমানের যোগ্য।' }
            },
            { 
                number: 26, 
                arabic: 'السَّمِيعُ', 
                transliteration: 'As-Sami', 
                translation: { en: 'The All-Hearing', bn: 'সর্বশ্রোতা' }, 
                meaning: { en: 'The One who hears all sounds', bn: 'যিনি সব আওয়াজ শোনেন' }, 
                description: { en: 'Allah hears all sounds, whispers, and even thoughts.', bn: 'আল্লাহ সব আওয়াজ, ফিসফিসানি এমনকি চিন্তাভাবনাও শুনেন।' }
            },
            { 
                number: 27, 
                arabic: 'الْبَصِيرُ', 
                transliteration: 'Al-Basir', 
                translation: { en: 'The All-Seeing', bn: 'সর্বদর্শী' }, 
                meaning: { en: 'The One who sees everything', bn: 'যিনি সবকিছু দেখেন' }, 
                description: { en: 'Allah sees all things, visible and hidden, in complete detail.', bn: 'আল্লাহ সব কিছু দেখেন - দৃশ্য ও অদৃশ্য, সম্পূর্ণ বিস্তারিতভাবে।' }
            },
            { 
                number: 28, 
                arabic: 'الْحَكَمُ', 
                transliteration: 'Al-Hakam', 
                translation: { en: 'The Judge', bn: 'বিচারক' }, 
                meaning: { en: 'The One who judges with justice', bn: 'যিনি ন্যায়বিচার করেন' }, 
                description: { en: 'Allah is the ultimate judge who judges with perfect justice.', bn: 'আল্লাহ চূড়ান্ত বিচারক যিনি নিখুঁত ন্যায়বিচার করেন।' }
            },
            { 
                number: 29, 
                arabic: 'الْعَدْلُ', 
                transliteration: 'Al-Adl', 
                translation: { en: 'The Just', bn: 'ন্যায়পরায়ণ' }, 
                meaning: { en: 'The One who is perfectly just', bn: 'যিনি নিখুঁতভাবে ন্যায়পরায়ণ' }, 
                description: { en: 'Allah is absolutely just and never commits any injustice.', bn: 'আল্লাহ সম্পূর্ণভাবে ন্যায়পরায়ণ এবং কখনো কোনো অন্যায় করেন না।' }
            },
            { 
                number: 30, 
                arabic: 'اللَّطِيفُ', 
                transliteration: 'Al-Latif', 
                translation: { en: 'The Gentle', bn: 'সূক্ষ্মদর্শী' }, 
                meaning: { en: 'The One who is subtle and gentle', bn: 'যিনি সূক্ষ্ম ও কোমল' }, 
                description: { en: 'Allah is gentle with His servants and works in subtle ways.', bn: 'আল্লাহ তাঁর বান্দাদের সাথে কোমল এবং সূক্ষ্ম উপায়ে কাজ করেন।' }
            },
            { 
                number: 31, 
                arabic: 'الْخَبِيرُ', 
                transliteration: 'Al-Khabir', 
                translation: { en: 'The All-Aware', bn: 'সর্বজ্ঞাতা' }, 
                meaning: { en: 'The One who is aware of everything', bn: 'যিনি সবকিছু সম্পর্কে অবগত' }, 
                description: { en: 'Allah is completely aware of all matters, no matter how hidden.', bn: 'আল্লাহ সব বিষয় সম্পর্কে সম্পূর্ণভাবে অবগত, যতই গোপন থাক না কেন।' }
            },
            { 
                number: 32, 
                arabic: 'الْحَلِيمُ', 
                transliteration: 'Al-Halim', 
                translation: { en: 'The Forbearing', bn: 'ধৈর্যশীল' }, 
                meaning: { en: 'The One who is patient and gentle', bn: 'যিনি ধৈর্যশীল ও কোমল' }, 
                description: { en: 'Allah is patient with His servants and does not hasten punishment.', bn: 'আল্লাহ তাঁর বান্দাদের সাথে ধৈর্য ধরেন এবং শাস্তিতে তাড়াহুড়া করেন না।' }
            },
            { 
                number: 33, 
                arabic: 'الْعَظِيمُ', 
                transliteration: 'Al-Azim', 
                translation: { en: 'The Magnificent', bn: 'মহিমান্বিত' }, 
                meaning: { en: 'The One who is supremely great', bn: 'যিনি সর্বোচ্চ মহান' }, 
                description: { en: 'Allah is magnificent beyond human comprehension.', bn: 'আল্লাহ মানুষের বোধগম্যতার চেয়ে মহিমান্বিত।' }
            },
            { 
                number: 34, 
                arabic: 'الْغَفُورُ', 
                transliteration: 'Al-Ghafur', 
                translation: { en: 'The All-Forgiving', bn: 'সর্বক্ষমাশীল' }, 
                meaning: { en: 'The One who covers and forgives sins', bn: 'যিনি পাপ ঢেকে দেন ও ক্ষমা করেন' }, 
                description: { en: 'Allah conceals faults and forgives those who repent sincerely.', bn: 'আল্লাহ দোষত্রুটি গোপন করেন এবং যারা আন্তরিকভাবে তওবা করে তাদের ক্ষমা করেন।' }
            },
            { 
                number: 35, 
                arabic: 'الشَّكُورُ', 
                transliteration: 'Ash-Shakur', 
                translation: { en: 'The Appreciative', bn: 'কৃতজ্ঞতাপূর্ণ' }, 
                meaning: { en: 'The One who appreciates good deeds', bn: 'যিনি ভালো কাজের প্রশংসা করেন' }, 
                description: { en: 'Allah appreciates and rewards even small acts of goodness.', bn: 'আল্লাহ ছোট ভালো কাজের প্রশংসা করেন ও পুরস্কার দেন।' }
            },
            { 
                number: 36, 
                arabic: 'الْعَلِيُّ', 
                transliteration: 'Al-Ali', 
                translation: { en: 'The Most High', bn: 'সর্বোচ্চ' }, 
                meaning: { en: 'The One who is elevated above everything', bn: 'যিনি সবকিছুর উপরে উন্নত' }, 
                description: { en: 'Allah is elevated above all creation in every aspect.', bn: 'আল্লাহ সকল দিক দিয়ে সমস্ত সৃষ্টির উর্ধ্বে অবস্থান করেন।' }
            },
            { 
                number: 37, 
                arabic: 'الْكَبِيرُ', 
                transliteration: 'Al-Kabir', 
                translation: { en: 'The Great', bn: 'মহান' }, 
                meaning: { en: 'The One who is greater than everything', bn: 'যিনি সবকিছুর চেয়ে বড়' }, 
                description: { en: 'Allah is greater than anything that can be imagined.', bn: 'আল্লাহ কল্পনা করা যায় এমন যেকোনো কিছুর চেয়ে মহান।' }
            },
            { 
                number: 38, 
                arabic: 'الْحَفِيظُ', 
                transliteration: 'Al-Hafiz', 
                translation: { en: 'The Preserver', bn: 'রক্ষণাবেক্ষণকারী' }, 
                meaning: { en: 'The One who protects and preserves', bn: 'যিনি রক্ষা ও সংরক্ষণ করেন' }, 
                description: { en: 'Allah preserves and protects all of creation from harm.', bn: 'আল্লাহ সমস্ত সৃষ্টিকে ক্ষতি থেকে রক্ষা ও সংরক্ষণ করেন।' }
            },
            { 
                number: 39, 
                arabic: 'الْمُقِيتُ', 
                transliteration: 'Al-Muqit', 
                translation: { en: 'The Nourisher', bn: 'পুষ্টিদাতা' }, 
                meaning: { en: 'The One who provides nourishment', bn: 'যিনি পুষ্টি প্রদান করেন' }, 
                description: { en: 'Allah provides all necessary nourishment for every living thing.', bn: 'আল্লাহ প্রতিটি জীবের জন্য প্রয়োজনীয় সব পুষ্টি প্রদান করেন।' }
            },
            { 
                number: 40, 
                arabic: 'الْحَسِيبُ', 
                transliteration: 'Al-Hasib', 
                translation: { en: 'The Reckoner', bn: 'হিসাবগ্রহণকারী' }, 
                meaning: { en: 'The One who takes account', bn: 'যিনি হিসাব নেন' }, 
                description: { en: 'Allah takes perfect account of all deeds and actions.', bn: 'আল্লাহ সব কাজ ও কর্মের নিখুঁত হিসাব নেন।' }
            },
            { 
                number: 41, 
                arabic: 'الْجَلِيلُ', 
                transliteration: 'Al-Jalil', 
                translation: { en: 'The Majestic', bn: 'মহিমান্বিত' }, 
                meaning: { en: 'The One who is majestic and sublime', bn: 'যিনি মহিমান্বিত ও উদাত্ত' }, 
                description: { en: 'Allah possesses ultimate majesty and sublime greatness.', bn: 'আল্লাহর চূড়ান্ত মহিমা ও উদাত্ত মহত্ত্ব রয়েছে।' }
            },
            { 
                number: 42, 
                arabic: 'الْكَرِيمُ', 
                transliteration: 'Al-Karim', 
                translation: { en: 'The Noble', bn: 'সম্মানিত' }, 
                meaning: { en: 'The One who is generous and noble', bn: 'যিনি উদার ও সম্মানিত' }, 
                description: { en: 'Allah is the most generous and noble, giving without limit.', bn: 'আল্লাহ সবচেয়ে উদার ও সম্মানিত, সীমাহীন দান করেন।' }
            },
            { 
                number: 43, 
                arabic: 'الرَّقِيبُ', 
                transliteration: 'Ar-Raqib', 
                translation: { en: 'The Watchful', bn: 'পর্যবেক্ষণকারী' }, 
                meaning: { en: 'The One who watches over everything', bn: 'যিনি সবকিছুর উপর নজরদারি করেন' }, 
                description: { en: 'Allah constantly watches over all creation with perfect attention.', bn: 'আল্লাহ নিখুঁত মনোযোগ দিয়ে ক্রমাগত সমস্ত সৃষ্টির উপর নজরদারি করেন।' }
            },
            { 
                number: 44, 
                arabic: 'الْمُجِيبُ', 
                transliteration: 'Al-Mujib', 
                translation: { en: 'The Responder', bn: 'উত্তরদাতা' }, 
                meaning: { en: 'The One who responds to prayers', bn: 'যিনি প্রার্থনার উত্তর দেন' }, 
                description: { en: 'Allah responds to the prayers and calls of His servants.', bn: 'আল্লাহ তাঁর বান্দাদের প্রার্থনা ও আহ্বানের উত্তর দেন।' }
            },
            { 
                number: 45, 
                arabic: 'الْوَاسِعُ', 
                transliteration: 'Al-Wasi', 
                translation: { en: 'The All-Encompassing', bn: 'ব্যাপক' }, 
                meaning: { en: 'The One whose knowledge and mercy encompass all', bn: 'যার জ্ঞান ও দয়া সবকিছুকে ঘিরে রাখে' }, 
                description: { en: 'Allah\'s knowledge, mercy, and power encompass everything.', bn: 'আল্লাহর জ্ঞান, দয়া ও শক্তি সবকিছুকে ঘিরে রাখে।' }
            },
            { 
                number: 46, 
                arabic: 'الْحَكِيمُ', 
                transliteration: 'Al-Hakim', 
                translation: { en: 'The Wise', bn: 'প্রজ্ঞাবান' }, 
                meaning: { en: 'The One who is perfectly wise', bn: 'যিনি নিখুঁতভাবে প্রজ্ঞাবান' }, 
                description: { en: 'Allah\'s wisdom is perfect and His decisions are always right.', bn: 'আল্লাহর প্রজ্ঞা নিখুঁত এবং তাঁর সিদ্ধান্ত সর্বদা সঠিক।' }
            },
            { 
                number: 47, 
                arabic: 'الْوَدُودُ', 
                transliteration: 'Al-Wadud', 
                translation: { en: 'The Loving', bn: 'ভালোবাসাময়' }, 
                meaning: { en: 'The One who loves His righteous servants', bn: 'যিনি তাঁর ধার্মিক বান্দাদের ভালোবাসেন' }, 
                description: { en: 'Allah loves those who are righteous and obedient to Him.', bn: 'আল্লাহ তাদের ভালোবাসেন যারা ধার্মিক ও তাঁর আজ্ঞাবহ।' }
            },
            { 
                number: 48, 
                arabic: 'الْمَجِيدُ', 
                transliteration: 'Al-Majid', 
                translation: { en: 'The Glorious', bn: 'মহিমান্বিত' }, 
                meaning: { en: 'The One who is glorious and honorable', bn: 'যিনি মহিমান্বিত ও সম্মানিত' }, 
                description: { en: 'Allah possesses ultimate glory and honor in all aspects.', bn: 'আল্লাহর সকল দিকে চূড়ান্ত গৌরব ও সম্মান রয়েছে।' }
            },
            { 
                number: 49, 
                arabic: 'الْبَاعِثُ', 
                transliteration: 'Al-Ba\'ith', 
                translation: { en: 'The Resurrector', bn: 'পুনরুত্থানকারী' }, 
                meaning: { en: 'The One who will resurrect all creation', bn: 'যিনি সমস্ত সৃষ্টিকে পুনরুত্থিত করবেন' }, 
                description: { en: 'Allah will resurrect all people on the Day of Judgment.', bn: 'আল্লাহ কিয়ামতের দিন সকল মানুষকে পুনরুত্থিত করবেন।' }
            },
            { 
                number: 50, 
                arabic: 'الشَّهِيدُ', 
                transliteration: 'Ash-Shahid', 
                translation: { en: 'The Witness', bn: 'সাক্ষী' }, 
                meaning: { en: 'The One who witnesses everything', bn: 'যিনি সবকিছুর সাক্ষী' }, 
                description: { en: 'Allah is witness to all actions, words, and even intentions.', bn: 'আল্লাহ সমস্ত কাজ, কথা এমনকি নিয়তেরও সাক্ষী।' }
            },
            { 
                number: 51, 
                arabic: 'الْحَقُّ', 
                transliteration: 'Al-Haqq', 
                translation: { en: 'The Truth', bn: 'সত্য' }, 
                meaning: { en: 'The One who is the ultimate truth', bn: 'যিনি চূড়ান্ত সত্য' }, 
                description: { en: 'Allah is the absolute truth, and everything else is temporary.', bn: 'আল্লাহ পরম সত্য, আর সবকিছুই ক্ষণস্থায়ী।' }
            },
            { 
                number: 52, 
                arabic: 'الْوَكِيلُ', 
                transliteration: 'Al-Wakil', 
                translation: { en: 'The Trustee', bn: 'বিশ্বস্ত' }, 
                meaning: { en: 'The One who can be trusted with all affairs', bn: 'যার কাছে সব বিষয় অর্পণ করা যায়' }, 
                description: { en: 'Allah can be completely trusted to handle all matters.', bn: 'আল্লাহর কাছে সব বিষয়ের ভার সম্পূর্ণ নিরাপদে অর্পণ করা যায়।' }
            },
            { 
                number: 53, 
                arabic: 'الْقَوِيُّ', 
                transliteration: 'Al-Qawi', 
                translation: { en: 'The Strong', bn: 'শক্তিশালী' }, 
                meaning: { en: 'The One who possesses ultimate strength', bn: 'যিনি চূড়ান্ত শক্তির অধিকারী' }, 
                description: { en: 'Allah has unlimited strength and power over all things.', bn: 'আল্লাহর সীমাহীন শক্তি ও সবকিছুর উপর ক্ষমতা রয়েছে।' }
            },
            { 
                number: 54, 
                arabic: 'الْمَتِينُ', 
                transliteration: 'Al-Matin', 
                translation: { en: 'The Firm', bn: 'দৃঢ়' }, 
                meaning: { en: 'The One who is firm and steadfast', bn: 'যিনি দৃঢ় ও অটল' }, 
                description: { en: 'Allah is firm in His decisions and promises, never changing.', bn: 'আল্লাহ তাঁর সিদ্ধান্ত ও প্রতিশ্রুতিতে দৃঢ়, কখনো পরিবর্তন হন না।' }
            },
            { 
                number: 55, 
                arabic: 'الْوَلِيُّ', 
                transliteration: 'Al-Wali', 
                translation: { en: 'The Friend', bn: 'বন্ধু' }, 
                meaning: { en: 'The One who is the friend and helper', bn: 'যিনি বন্ধু ও সাহায্যকারী' }, 
                description: { en: 'Allah is the true friend and protector of the believers.', bn: 'আল্লাহ মুমিনদের প্রকৃত বন্ধু ও রক্ষক।' }
            },
            { 
                number: 56, 
                arabic: 'الْحَمِيدُ', 
                transliteration: 'Al-Hamid', 
                translation: { en: 'The Praiseworthy', bn: 'প্রশংসিত' }, 
                meaning: { en: 'The One who deserves all praise', bn: 'যিনি সকল প্রশংসার যোগ্য' }, 
                description: { en: 'Allah is worthy of all praise in all circumstances.', bn: 'আল্লাহ সর্বাবস্থায় সকল প্রশংসার যোগ্য।' }
            },
            { 
                number: 57, 
                arabic: 'الْمُحْصِي', 
                transliteration: 'Al-Muhsi', 
                translation: { en: 'The Counter', bn: 'গণনাকারী' }, 
                meaning: { en: 'The One who counts and records everything', bn: 'যিনি সবকিছু গণনা ও লিপিবদ্ধ করেন' }, 
                description: { en: 'Allah counts and records every single thing in existence.', bn: 'আল্লাহ অস্তিত্বের প্রতিটি বিষয় গণনা ও লিপিবদ্ধ করেন।' }
            },
            { 
                number: 58, 
                arabic: 'الْمُبْدِئُ', 
                transliteration: 'Al-Mubdi', 
                translation: { en: 'The Originator', bn: 'সূচনাকারী' }, 
                meaning: { en: 'The One who begins and creates', bn: 'যিনি শুরু ও সৃষ্টি করেন' }, 
                description: { en: 'Allah originated and created everything from nothing.', bn: 'আল্লাহ শূন্য থেকে সবকিছুর উৎপত্তি ও সৃষ্টি করেছেন।' }
            },
            { 
                number: 59, 
                arabic: 'الْمُعِيدُ', 
                transliteration: 'Al-Mu\'id', 
                translation: { en: 'The Restorer', bn: 'পুনরুদ্ধারকারী' }, 
                meaning: { en: 'The One who will restore and recreate', bn: 'যিনি পুনরুদ্ধার ও পুনঃসৃষ্টি করবেন' }, 
                description: { en: 'Allah will recreate all creation on the Day of Resurrection.', bn: 'আল্লাহ কিয়ামতের দিন সমস্ত সৃষ্টিকে পুনঃসৃষ্টি করবেন।' }
            },
            { 
                number: 60, 
                arabic: 'الْمُحْيِي', 
                transliteration: 'Al-Muhyi', 
                translation: { en: 'The Giver of Life', bn: 'জীবনদাতা' }, 
                meaning: { en: 'The One who gives life', bn: 'যিনি জীবন দান করেন' }, 
                description: { en: 'Allah gives life to all living beings and can revive the dead.', bn: 'আল্লাহ সকল জীবকে প্রাণ দান করেন ও মৃতকে জীবিত করতে পারেন।' }
            },
            { 
                number: 61, 
                arabic: 'الْمُمِيتُ', 
                transliteration: 'Al-Mumit', 
                translation: { en: 'The Taker of Life', bn: 'মৃত্যুদাতা' }, 
                meaning: { en: 'The One who causes death', bn: 'যিনি মৃত্যু ঘটান' }, 
                description: { en: 'Allah determines when every soul will taste death.', bn: 'আল্লাহ নির্ধারণ করেন কখন প্রতিটি আত্মা মৃত্যুর স্বাদ নেবে।' }
            },
            { 
                number: 62, 
                arabic: 'الْحَيُّ', 
                transliteration: 'Al-Hayy', 
                translation: { en: 'The Ever Living', bn: 'চিরঞ্জীব' }, 
                meaning: { en: 'The One who is eternally alive', bn: 'যিনি চিরকাল জীবিত' }, 
                description: { en: 'Allah is eternally alive and will never die or cease to exist.', bn: 'আল্লাহ চিরকাল জীবিত এবং কখনো মৃত্যুবরণ বা অস্তিত্ব হারাবেন না।' }
            },
            { 
                number: 63, 
                arabic: 'الْقَيُّومُ', 
                transliteration: 'Al-Qayyum', 
                translation: { en: 'The Self-Sustaining', bn: 'স্বয়ংসম্পূর্ণ' }, 
                meaning: { en: 'The One who sustains everything', bn: 'যিনি সবকিছুকে টিকিয়ে রাখেন' }, 
                description: { en: 'Allah sustains all existence and needs nothing from anyone.', bn: 'আল্লাহ সমস্ত অস্তিত্ব টিকিয়ে রাখেন এবং কারো কিছুর মুখাপেক্ষী নন।' }
            },
            { 
                number: 64, 
                arabic: 'الْوَاجِدُ', 
                transliteration: 'Al-Wajid', 
                translation: { en: 'The Finder', bn: 'অনুসন্ধানকারী' }, 
                meaning: { en: 'The One who finds whatever He wants', bn: 'যিনি যা চান তা খুঁজে পান' }, 
                description: { en: 'Allah finds and reaches everything, nothing is hidden from Him.', bn: 'আল্লাহ সবকিছু খুঁজে পান ও পৌঁছান, তাঁর কাছে কিছুই গোপন নয়।' }
            },
            { 
                number: 65, 
                arabic: 'الْمَاجِدُ', 
                transliteration: 'Al-Majid', 
                translation: { en: 'The Noble', bn: 'সম্ভ্রান্ত' }, 
                meaning: { en: 'The One who is most noble and honored', bn: 'যিনি সবচেয়ে সম্ভ্রান্ত ও সম্মানিত' }, 
                description: { en: 'Allah possesses ultimate nobility and honor.', bn: 'আল্লাহর চূড়ান্ত সভ্রান্ততা ও সম্মান রয়েছে।' }
            },
            { 
                number: 66, 
                arabic: 'الْوَاحِدُ', 
                transliteration: 'Al-Wahid', 
                translation: { en: 'The One', bn: 'একক' }, 
                meaning: { en: 'The One who is unique in every aspect', bn: 'যিনি সকল দিক থেকে অনন্য' }, 
                description: { en: 'Allah is unique and incomparable in all His attributes.', bn: 'আল্লাহ তাঁর সকল গুণে অনন্য ও অতুলনীয়।' }
            },
            { 
                number: 67, 
                arabic: 'الصَّمَدُ', 
                transliteration: 'As-Samad', 
                translation: { en: 'The Eternal', bn: 'চিরস্থায়ী' }, 
                meaning: { en: 'The One who is eternal and independent', bn: 'যিনি চিরন্তন ও স্বাধীন' }, 
                description: { en: 'Allah is eternal, perfect, and completely independent of all needs.', bn: 'আল্লাহ চিরন্তন, নিখুঁত এবং সকল প্রয়োজন থেকে সম্পূর্ণ স্বাধীন।' }
            },
            { 
                number: 68, 
                arabic: 'الْقَادِرُ', 
                transliteration: 'Al-Qadir', 
                translation: { en: 'The Powerful', bn: 'শক্তিমান' }, 
                meaning: { en: 'The One who has power over all things', bn: 'যিনি সবকিছুর উপর ক্ষমতা রাখেন' }, 
                description: { en: 'Allah has complete power to do anything He wills.', bn: 'আল্লাহর যা ইচ্ছা তা করার সম্পূর্ণ ক্ষমতা রয়েছে।' }
            },
            { 
                number: 69, 
                arabic: 'الْمُقْتَدِرُ', 
                transliteration: 'Al-Muqtadir', 
                translation: { en: 'The Determiner', bn: 'নিয়ন্তা' }, 
                meaning: { en: 'The One who determines everything', bn: 'যিনি সবকিছু নির্ধারণ করেন' }, 
                description: { en: 'Allah determines all outcomes with perfect wisdom and power.', bn: 'আল্লাহ নিখুঁত প্রজ্ঞা ও শক্তি দিয়ে সব ফলাফল নির্ধারণ করেন।' }
            },
            { 
                number: 70, 
                arabic: 'الْمُقَدِّمُ', 
                transliteration: 'Al-Muqaddim', 
                translation: { en: 'The Promoter', bn: 'এগিয়ে রাখনেওয়ালা' }, 
                meaning: { en: 'The One who brings forward', bn: 'যিনি সামনে এগিয়ে দেন' }, 
                description: { en: 'Allah promotes and advances whom He wills.', bn: 'আল্লাহ যাকে ইচ্ছা উন্নত ও এগিয়ে নিয়ে যান।' }
            },

             { 
        number: 71, 
        arabic: 'الْمُؤَخِّرُ', 
        transliteration: 'Al-Mu\'akhkhir', 
        translation: { en: 'The Delayer', bn: 'বিলম্বকারী' }, 
        meaning: { en: 'The One who delays or postpones', bn: 'যিনি বিলম্ব বা স্থগিত করেন' }, 
        description: { en: 'Allah delays things according to His perfect timing.', bn: 'আল্লাহ তাঁর নিখুঁত সময় অনুসারে বিষয়গুলি বিলম্বিত করেন।' }
    },
    { 
        number: 72, 
        arabic: 'الأَوَّلُ', 
        transliteration: 'Al-Awwal', 
        translation: { en: 'The First', bn: 'প্রথম' }, 
        meaning: { en: 'The One who has no beginning', bn: 'যার কোনো শুরু নেই' }, 
        description: { en: 'Allah existed before everything and has no beginning.', bn: 'আল্লাহ সবকিছুর আগে থেকে আছেন এবং তাঁর কোনো শুরু নেই।' }
    },
    { 
        number: 73, 
        arabic: 'الآخِرُ', 
        transliteration: 'Al-Akhir', 
        translation: { en: 'The Last', bn: 'শেষ' }, 
        meaning: { en: 'The One who has no end', bn: 'যার কোনো শেষ নেই' }, 
        description: { en: 'Allah will exist after everything ends and has no end.', bn: 'আল্লাহ সবকিছু শেষ হওয়ার পরও থাকবেন এবং তাঁর কোনো শেষ নেই।' }
    },
    { 
        number: 74, 
        arabic: 'الظَّاهِرُ', 
        transliteration: 'Az-Zahir', 
        translation: { en: 'The Manifest', bn: 'প্রকাশ্য' }, 
        meaning: { en: 'The One who is evident through His signs', bn: 'যিনি তাঁর নিদর্শনের মাধ্যমে স্পষ্ট' }, 
        description: { en: 'Allah\'s existence is evident through His signs in creation.', bn: 'আল্লাহর অস্তিত্ব সৃষ্টিতে তাঁর নিদর্শনের মাধ্যমে স্পষ্ট।' }
    },
    { 
        number: 75, 
        arabic: 'الْبَاطِنُ', 
        transliteration: 'Al-Batin', 
        translation: { en: 'The Hidden', bn: 'গুপ্ত' }, 
        meaning: { en: 'The One whose essence is hidden', bn: 'যার সারসত্য গুপ্ত' }, 
        description: { en: 'Allah\'s true essence cannot be fully comprehended by human minds.', bn: 'আল্লাহর প্রকৃত সারসত্য মানুষের মন দিয়ে পূর্ণভাবে উপলব্ধি করা যায় না।' }
    },
    { 
        number: 76, 
        arabic: 'الْوَالِي', 
        transliteration: 'Al-Wali', 
        translation: { en: 'The Governor', bn: 'শাসক' }, 
        meaning: { en: 'The One who governs everything', bn: 'যিনি সবকিছু শাসন করেন' }, 
        description: { en: 'Allah governs and controls all affairs in the universe.', bn: 'আল্লাহ মহাবিশ্বের সকল বিষয় শাসন ও নিয়ন্ত্রণ করেন।' }
    },
    { 
        number: 77, 
        arabic: 'الْمُتَعَالِي', 
        transliteration: 'Al-Muta\'ali', 
        translation: { en: 'The Most Exalted', bn: 'সর্বোচ্চ উন্নত' }, 
        meaning: { en: 'The One who is supremely exalted', bn: 'যিনি পরমভাবে উন্নত' }, 
        description: { en: 'Allah is exalted far above any deficiency or limitation.', bn: 'আল্লাহ কোনো অভাব বা সীমাবদ্ধতার অনেক উর্ধ্বে উন্নত।' }
    },
    { 
        number: 78, 
        arabic: 'الْبَرُّ', 
        transliteration: 'Al-Barr', 
        translation: { en: 'The Source of Goodness', bn: 'কল্যাণের উৎস' }, 
        meaning: { en: 'The One who is kind and good', bn: 'যিনি দয়ালু ও ভালো' }, 
        description: { en: 'Allah is the source of all goodness and kindness.', bn: 'আল্লাহ সকল কল্যাণ ও দয়ার উৎস।' }
    },
    { 
        number: 79, 
        arabic: 'التَّوَّابُ', 
        transliteration: 'At-Tawwab', 
        translation: { en: 'The Acceptor of Repentance', bn: 'তওবা গ্রহণকারী' }, 
        meaning: { en: 'The One who accepts repentance', bn: 'যিনি তওবা কবুল করেন' }, 
        description: { en: 'Allah accepts sincere repentance and turns back to His servants.', bn: 'আল্লাহ আন্তরিক তওবা কবুল করেন ও তাঁর বান্দাদের দিকে ফিরে আসেন।' }
    },
    { 
        number: 80, 
        arabic: 'الْمُنْتَقِمُ', 
        transliteration: 'Al-Muntaqim', 
        translation: { en: 'The Avenger', bn: 'প্রতিশোধগ্রহণকারী' }, 
        meaning: { en: 'The One who punishes the wrongdoers', bn: 'যিনি অন্যায়কারীদের শাস্তি দেন' }, 
        description: { en: 'Allah takes revenge against those who wrong others.', bn: 'আল্লাহ তাদের বিরুদ্ধে প্রতিশোধ নেন যারা অন্যদের অন্যায় করে।' }
    },
    { 
        number: 81, 
        arabic: 'العَفُوُّ', 
        transliteration: 'Al-\'Afuw', 
        translation: { en: 'The Pardoner', bn: 'ক্ষমাকারী' }, 
        meaning: { en: 'The One who pardons and excuses', bn: 'যিনি ক্ষমা ও মার্জনা করেন' }, 
        description: { en: 'Allah pardons sins and overlooks faults of His servants.', bn: 'আল্লাহ পাপ ক্ষমা করেন এবং তাঁর বান্দাদের ত্রুটি উপেক্ষা করেন।' }
    },
    { 
        number: 82, 
        arabic: 'الرَّؤُوفُ', 
        transliteration: 'Ar-Ra\'uf', 
        translation: { en: 'The Compassionate', bn: 'করুণাময়' }, 
        meaning: { en: 'The One who is extremely compassionate', bn: 'যিনি অত্যন্ত করুণাময়' }, 
        description: { en: 'Allah shows deep compassion and care for His creation.', bn: 'আল্লাহ তাঁর সৃষ্টির প্রতি গভীর করুণা ও যত্ন দেখান।' }
    },
    { 
        number: 83, 
        arabic: 'مَالِكُ الْمُلْكِ', 
        transliteration: 'Malik-ul-Mulk', 
        translation: { en: 'Owner of All Sovereignty', bn: 'সার্বভৌমত্বের মালিক' }, 
        meaning: { en: 'The One who owns all dominion', bn: 'যিনি সকল আধিপত্যের মালিক' }, 
        description: { en: 'Allah owns all sovereignty and kingship in the universe.', bn: 'আল্লাহ মহাবিশ্বের সকল সার্বভৌমত্ব ও রাজত্বের মালিক।' }
    },
    { 
        number: 84, 
        arabic: 'ذُو الْجَلاَلِ وَالإِكْرَامِ', 
        transliteration: 'Dhul-Jalali wal-Ikram', 
        translation: { en: 'Owner of Majesty and Honor', bn: 'মহিমা ও সম্মানের অধিকারী' }, 
        meaning: { en: 'The One who possesses majesty and honor', bn: 'যিনি মহিমা ও সম্মানের অধিকারী' }, 
        description: { en: 'Allah possesses ultimate majesty and deserves the highest honor.', bn: 'আল্লাহর চূড়ান্ত মহিমা রয়েছে এবং সর্বোচ্চ সম্মানের যোগ্য।' }
    },
    { 
        number: 85, 
        arabic: 'الْمُقْسِطُ', 
        transliteration: 'Al-Muqsit', 
        translation: { en: 'The Equitable', bn: 'ন্যায়পরায়ণ' }, 
        meaning: { en: 'The One who is fair and just', bn: 'যিনি ন্যায্য ও ন্যায়পরায়ণ' }, 
        description: { en: 'Allah is perfectly fair and just in all His dealings.', bn: 'আল্লাহ তাঁর সকল ব্যবহারে নিখুঁতভাবে ন্যায্য ও ন্যায়পরায়ণ।' }
    },
    { 
        number: 86, 
        arabic: 'الْجَامِعُ', 
        transliteration: 'Al-Jami', 
        translation: { en: 'The Gatherer', bn: 'একত্রকারী' }, 
        meaning: { en: 'The One who brings together', bn: 'যিনি একত্র করেন' }, 
        description: { en: 'Allah will gather all humanity on the Day of Judgment.', bn: 'আল্লাহ কিয়ামতের দিন সমস্ত মানবজাতিকে একত্র করবেন।' }
    },
    { 
        number: 87, 
        arabic: 'الْغَنِيُّ', 
        transliteration: 'Al-Ghani', 
        translation: { en: 'The Self-Sufficient', bn: 'অভাবমুক্ত' }, 
        meaning: { en: 'The One who needs nothing', bn: 'যার কিছুর প্রয়োজন নেই' }, 
        description: { en: 'Allah is completely self-sufficient and needs nothing from anyone.', bn: 'আল্লাহ সম্পূর্ণভাবে স্বয়ংসম্পূর্ণ এবং কারো কিছুর মুখাপেক্ষী নন।' }
    },
    { 
        number: 88, 
        arabic: 'الْمُغْنِي', 
        transliteration: 'Al-Mughni', 
        translation: { en: 'The Enricher', bn: 'সম্পদশালীকারী' }, 
        meaning: { en: 'The One who makes others self-sufficient', bn: 'যিনি অন্যদের স্বয়ংসম্পূর্ণ করেন' }, 
        description: { en: 'Allah enriches and makes others independent of need.', bn: 'আল্লাহ সমৃদ্ধ করেন এবং অন্যদের প্রয়োজন থেকে স্বাধীন করেন।' }
    },
    { 
        number: 89, 
        arabic: 'الْمَانِعُ', 
        transliteration: 'Al-Mani', 
        translation: { en: 'The Preventer', bn: 'প্রতিরোধকারী' }, 
        meaning: { en: 'The One who prevents and protects', bn: 'যিনি প্রতিরোধ ও রক্ষা করেন' }, 
        description: { en: 'Allah prevents harm and protects those who seek His protection.', bn: 'আল্লাহ ক্ষতি প্রতিরোধ করেন এবং যারা তাঁর আশ্রয় চায় তাদের রক্ষা করেন।' }
    },
    { 
        number: 90, 
        arabic: 'الضَّارُّ', 
        transliteration: 'Ad-Darr', 
        translation: { en: 'The Distresser', bn: 'কষ্টদাতা' }, 
        meaning: { en: 'The One who can cause distress', bn: 'যিনি কষ্ট দিতে পারেন' }, 
        description: { en: 'Allah can cause distress to teach lessons or test faith.', bn: 'আল্লাহ শিক্ষা দিতে বা ঈমান পরীক্ষা করতে কষ্ট দিতে পারেন।' }
    },
    { 
        number: 91, 
        arabic: 'النَّافِعُ', 
        transliteration: 'An-Nafi', 
        translation: { en: 'The Benefiter', bn: 'উপকারী' }, 
        meaning: { en: 'The One who benefits and helps', bn: 'যিনি উপকার ও সাহায্য করেন' }, 
        description: { en: 'Allah brings benefit and good to His creation.', bn: 'আল্লাহ তাঁর সৃষ্টির জন্য উপকার ও কল্যাণ নিয়ে আসেন।' }
    },
    { 
        number: 92, 
        arabic: 'النُّورُ', 
        transliteration: 'An-Nur', 
        translation: { en: 'The Light', bn: 'আলো' }, 
        meaning: { en: 'The One who is the source of all light', bn: 'যিনি সকল আলোর উৎস' }, 
        description: { en: 'Allah is the light that illuminates the heavens and the earth.', bn: 'আল্লাহ সেই আলো যা আসমান ও জমিনকে আলোকিত করে।' }
    },
    { 
        number: 93, 
        arabic: 'الْهَادِي', 
        transliteration: 'Al-Hadi', 
        translation: { en: 'The Guide', bn: 'পথপ্রদর্শক' }, 
        meaning: { en: 'The One who guides to the right path', bn: 'যিনি সঠিক পথ দেখান' }, 
        description: { en: 'Allah guides those who seek guidance to the straight path.', bn: 'আল্লাহ যারা হেদায়েত চায় তাদের সরল পথ দেখান।' }
    },
    { 
        number: 94, 
        arabic: 'الْبَدِيعُ', 
        transliteration: 'Al-Badi', 
        translation: { en: 'The Originator', bn: 'উদ্ভাবক' }, 
        meaning: { en: 'The One who creates in a unique way', bn: 'যিনি অনন্য উপায়ে সৃষ্টি করেন' }, 
        description: { en: 'Allah creates things in a way that has never been done before.', bn: 'আল্লাহ এমন উপায়ে বস্তু সৃষ্টি করেন যা আগে কখনো করা হয়নি।' }
    },
    { 
        number: 95, 
        arabic: 'الْبَاقِي', 
        transliteration: 'Al-Baqi', 
        translation: { en: 'The Everlasting', bn: 'চিরস্থায়ী' }, 
        meaning: { en: 'The One who remains forever', bn: 'যিনি চিরকাল থাকবেন' }, 
        description: { en: 'Allah will remain when everything else perishes.', bn: 'অন্য সবকিছু ধ্বংস হলেও আল্লাহ থাকবেন।' }
    },
    { 
        number: 96, 
        arabic: 'الْوَارِثُ', 
        transliteration: 'Al-Warith', 
        translation: { en: 'The Inheritor', bn: 'উত্তরাধিকারী' }, 
        meaning: { en: 'The One who will inherit everything', bn: 'যিনি সবকিছুর উত্তরাধিকারী হবেন' }, 
        description: { en: 'Allah will inherit and remain when all creation is gone.', bn: 'সমস্ত সৃষ্টি চলে গেলে আল্লাহ উত্তরাধিকারী হয়ে থাকবেন।' }
    },
    { 
        number: 97, 
        arabic: 'الرَّشِيدُ', 
        transliteration: 'Ar-Rashid', 
        translation: { en: 'The Guide to Right Path', bn: 'সঠিক পথপ্রদর্শক' }, 
        meaning: { en: 'The One who guides to righteousness', bn: 'যিনি সৎপথে পরিচালনা করেন' }, 
        description: { en: 'Allah guides His creation to what is right and beneficial.', bn: 'আল্লাহ তাঁর সৃষ্টিকে সঠিক ও উপকারী বিষয়ে পরিচালনা করেন।' }
    },
    { 
        number: 98, 
        arabic: 'الصَّبُورُ', 
        transliteration: 'As-Sabur', 
        translation: { en: 'The Patient', bn: 'ধৈর্যশীল' }, 
        meaning: { en: 'The One who is infinitely patient', bn: 'যিনি অসীম ধৈর্যশীল' }, 
        description: { en: 'Allah shows infinite patience with His servants despite their sins.', bn: 'আল্লাহ তাঁর বান্দাদের পাপ সত্ত্বেও অসীম ধৈর্য দেখান।' }
    },
    { 
        number: 99, 
        arabic: 'الْأَحَدُ', 
        transliteration: 'Al-Ahad', 
        translation: { en: 'The One', bn: 'একক' }, 
        meaning: { en: 'The One who is absolutely one', bn: 'যিনি সম্পূর্ণভাবে একক' }, 
        description: { en: 'Allah is absolutely one and indivisible in His essence and attributes.', bn: 'আল্লাহ তাঁর সারসত্য ও গুণাবলিতে সম্পূর্ণভাবে এক ও অবিভাজ্য।' }
    },
]

}

    bindEvents() {
        // Search functionality
        document.getElementById('namesSearch').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterNames();
        });

        // View mode toggles
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.setViewMode('grid');
        });

        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.setViewMode('list');
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderNames();
                this.updatePagination();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredNames.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderNames();
                this.updatePagination();
            }
        });

        // Quick actions
        document.getElementById('favoriteBtn').addEventListener('click', () => {
            if (this.currentView === 'favorites') {
                this.showAllNames();
            } else {
                this.showFavorites();
            }
        });

        document.getElementById('reciteAllBtn').addEventListener('click', () => {
            this.toggleReciteAll();
        });

        document.getElementById('randomBtn').addEventListener('click', () => {
            if (this.isShuffled) {
                this.restoreOriginalOrder();
            } else {
                this.showRandomName();
            }
        });

        // Language toggle
        document.getElementById('langToggle').addEventListener('click', () => {
            this.toggleLanguage();
        });

        // Featured name play button
        document.getElementById('playFeatured').addEventListener('click', () => {
            // Find the correct index of the featured name in the current names array
            const correctIndex = this.names.findIndex(name => name.number === this.featuredName.number);
            if (correctIndex !== -1) {
                this.playNameAudio(correctIndex);
            }
            
            // Add visual feedback to the button
            const playBtn = document.getElementById('playFeatured');
            playBtn.classList.add('playing');
            
            // Remove the visual feedback after audio completes
            setTimeout(() => {
                playBtn.classList.remove('playing');
            }, 3000);
        });

        // Keyboard shortcuts - removed modal close since we don't use modal anymore
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any expanded cards
                document.querySelectorAll('.name-card.expanded').forEach(card => {
                    card.classList.remove('expanded');
                });
                this.stopAudio();
            }
        });
    }

    filterNames() {
        let sourceNames;
        
        // Determine source names based on current view
        if (this.currentView === 'favorites') {
            const favoriteNumbers = Array.from(this.favorites);
            sourceNames = this.names.filter(name => favoriteNumbers.includes(name.number));
        } else {
            sourceNames = [...this.names]; // Use current order (shuffled or original)
        }
        
        if (this.searchQuery === '') {
            this.filteredNames = sourceNames;
        } else {
            this.filteredNames = sourceNames.filter(name => {
                const translation = typeof name.translation === 'object' ? name.translation[this.currentLang] : name.translation;
                const meaning = typeof name.meaning === 'object' ? name.meaning[this.currentLang] : name.meaning;
                const description = typeof name.description === 'object' ? name.description[this.currentLang] : name.description;
                
                return name.arabic.includes(this.searchQuery) ||
                       name.transliteration.toLowerCase().includes(this.searchQuery) ||
                       translation.toLowerCase().includes(this.searchQuery) ||
                       meaning.toLowerCase().includes(this.searchQuery) ||
                       description.toLowerCase().includes(this.searchQuery);
            });
        }
        
        this.currentPage = 1;
        this.renderNames();
        this.updatePagination();
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}ViewBtn`).classList.add('active');
        
        this.renderNames();
    }

    renderNames() {
        const namesGrid = document.getElementById('namesGrid');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentNames = this.filteredNames.slice(startIndex, endIndex);

        namesGrid.className = `names-grid ${this.viewMode}-view`;
        
        namesGrid.innerHTML = currentNames.map(name => `
            <div class="name-card" data-number="${name.number}">
                <div class="name-number">${name.number}</div>
                <button class="play-button-corner" data-number="${name.number}">
                    <i class="fas fa-play"></i>
                </button>
                <div class="name-content">
                    <div class="name-arabic">${name.arabic}</div>
                    <div class="name-transliteration">${name.transliteration}</div>
                    <div class="name-translation">${typeof name.translation === 'object' ? name.translation[this.currentLang] : name.translation}</div>
                    
                    <!-- Expanded content - no duplicate action buttons -->
                    <div class="name-details">
                        <div class="name-meaning">
                            <h4>${this.translations[this.currentLang]['meaning']}</h4>
                            <p>${typeof name.meaning === 'object' ? name.meaning[this.currentLang] : name.meaning}</p>
                        </div>
                        <div class="name-description">${typeof name.description === 'object' ? name.description[this.currentLang] : name.description}</div>
                    </div>
                </div>
                <div class="name-actions">
                    <button class="name-action-btn favorite-btn ${this.favorites.has(name.number) ? 'active' : ''}" data-number="${name.number}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="name-action-btn share-btn" data-number="${name.number}">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Bind card events
        this.bindCardEvents();
    }

    bindCardEvents() {
        // Card click events - expand/collapse instead of modal
        document.querySelectorAll('.name-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.name-actions') && !e.target.closest('.play-button-corner')) {
                    const number = parseInt(card.dataset.number);
                    this.toggleCardExpansion(card);
                }
            });
        });

        // Play button events (corner play button)
        document.querySelectorAll('.play-button-corner').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const number = parseInt(btn.dataset.number);
                // Find the correct index in the current names array (shuffled or original)
                const correctIndex = this.names.findIndex(name => name.number === number);
                if (correctIndex !== -1) {
                    this.playNameAudio(correctIndex);
                }
            });
        });

        // Favorite and Share button events
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const number = parseInt(btn.dataset.number);
                this.toggleFavorite(number);
            });
        });

        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const number = parseInt(btn.dataset.number);
                this.shareName(number);
            });
        });
    }

    toggleCardExpansion(card) {
        const isExpanded = card.classList.contains('expanded');
        
        // Close all other expanded cards first
        document.querySelectorAll('.name-card.expanded').forEach(otherCard => {
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

    // Modal functionality disabled - using card expansion instead
    /*
    showNameModal(number) {
        const name = this.names[number - 1];
        const modal = document.getElementById('nameModal');
        
        // Update modal content
        document.getElementById('modalNumber').textContent = name.number;
        document.getElementById('modalArabic').textContent = name.arabic;
        document.getElementById('modalTransliteration').textContent = name.transliteration;
        document.getElementById('modalTranslation').textContent = name.translation;
        document.getElementById('modalDescription').textContent = name.description;
        
        // Update modal buttons
        const favoriteBtn = document.getElementById('modalFavorite');
        favoriteBtn.className = `action-btn ${this.favorites.has(number) ? 'active' : ''}`;
        favoriteBtn.innerHTML = `
            <i class="fas fa-heart"></i>
            <span>${this.favorites.has(number) ? 'Remove from Favorites' : 'Add to Favorites'}</span>
        `;

        // Bind modal events
        document.getElementById('modalPlay').onclick = () => {
            const correctIndex = this.names.findIndex(name => name.number === number);
            if (correctIndex !== -1) {
                this.playNameAudio(correctIndex);
            }
        };
        document.getElementById('modalFavorite').onclick = () => {
            this.toggleFavorite(number);
            this.showNameModal(number); // Refresh modal
        };
        document.getElementById('modalShare').onclick = () => this.shareName(number);
        
        modal.style.display = 'flex';
    }
    */

    toggleFavorite(number) {
        if (this.favorites.has(number)) {
            this.favorites.delete(number);
        } else {
            this.favorites.add(number);
        }
        
        this.saveFavorites();
        
        // Update the favorite button
        const card = document.querySelector(`[data-number="${number}"]`);
        if (card) {
            const favoriteButton = card.querySelector('.favorite-btn');
            const isFavorite = this.favorites.has(number);
            
            if (favoriteButton) {
                favoriteButton.classList.toggle('active', isFavorite);
            }
        }
        
        // Show feedback
        this.showSuccess(this.favorites.has(number) ? 'Added to favorites!' : 'Removed from favorites!');
    }

    playNameAudio(index) {
        const name = this.names[index];
        
        // If playing individual name while Recite All is active, pause Recite All
        // This is for manual clicks, not for the reciteAll sequence itself
        if (this.isReciteAllActive && !this._inReciteAllProcess) {
            this.pauseReciteAll();
        }
        
        // Cancel any existing speech synthesis
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        // Stop any currently playing audio, passing true to indicate it's from reciteAll if _inReciteAllProcess is true
        if (this.currentAudio) {
            this._inStopAudio = true;
            this.stopAudio(this._inReciteAllProcess); // Pass the flag
            this._inStopAudio = false;
        }
        
        // Create speech synthesis
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(name.arabic);
            utterance.lang = 'ar-SA'; // Arabic (Saudi Arabia)
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            
            utterance.onstart = () => {
                console.log(`Speech started for: ${name.transliteration}`);
                this.isPlaying = true;
                this.updatePlayButtons(true);
                
                // If this is part of reciteAll process, make sure only this card is highlighted
                if (this._inReciteAllProcess) {
                    // Remove highlight from all cards first
                    document.querySelectorAll('.name-card.reciting').forEach(card => {
                        card.classList.remove('reciting');
                    });
                    
                    // Then highlight only the current card
                    const card = document.querySelector(`[data-number="${name.number}"]`);
                    if (card) {
                        card.classList.add('reciting');
                    }
                }
            };
            
            utterance.onend = () => {
                console.log(`Speech ended for: ${name.transliteration}`);
                this.isPlaying = false;
                this.updatePlayButtons(false);
                
                // If this is part of reciteAll process, trigger the utterance end handler
                if (this.isReciteAllActive && this.utteranceEndHandler) {
                    this.utteranceEndHandler();
                }
            };
            
            utterance.onerror = (event) => {
                console.error(`Speech synthesis error: ${event.error}`);
                this.isPlaying = false;
                this.updatePlayButtons(false);
                // If an error occurs during reciteAll, stop the process
                if (this.isReciteAllActive) {
                    this.stopReciteAll();
                    this.showError('Speech playback error. Stopping recitation.');
                }
            };
            
            // Make sure we completely reset the state before starting a new utterance
            // Removed setTimeout to speak immediately
            speechSynthesis.speak(utterance);
            this.currentAudio = utterance;
        } else {
            this.showError('Audio playback not supported in this browser');
        }
    }

    stopAudio(fromReciteAll = false) {
        this._inStopAudio = true;
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            this.isPlaying = false;
            this.updatePlayButtons(false);
            this.currentAudio = null;
        }
        
        // If stopping audio manually, also stop recite all
        // Only do this if we're not already inside a pauseReciteAll call
        // AND if we are not currently in the middle of a reciteAll process
        if (this.isReciteAllActive && !this._inPauseReciteAll && !fromReciteAll) {
            this._inPauseReciteAll = true;
            this.pauseReciteAll();
            this._inPauseReciteAll = false;
        }
        
        this._inStopAudio = false;
    }

    updatePlayButtons(isPlaying) {
        // Update corner play buttons
        document.querySelectorAll('.play-button-corner i').forEach(icon => {
            icon.className = isPlaying ? 'fas fa-stop' : 'fas fa-play';
        });
        
        // Update featured play button
        const featuredPlayBtn = document.getElementById('playFeatured');
        if (featuredPlayBtn) {
            const icon = featuredPlayBtn.querySelector('i');
            if (icon) {
                icon.className = isPlaying ? 'fas fa-stop' : 'fas fa-play';
            }
            featuredPlayBtn.classList.toggle('playing', isPlaying);
        }
    }

    getDailyFeaturedIndex() {
        // Get current date and create a seed for consistent daily selection
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // 0-indexed, so add 1
        const day = today.getDate();
        
        // Create a simple hash from the date for consistent daily randomization
        const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Use absolute value and modulo to get index between 0-98
        return Math.abs(hash) % 99;
    }

    setFeaturedName() {
        // Use the stored featured name object (always consistent regardless of shuffling)
        const featured = this.featuredName;
        
        document.getElementById('featuredArabic').textContent = featured.arabic;
        document.getElementById('featuredTransliteration').textContent = featured.transliteration;
        document.getElementById('featuredTranslation').textContent = typeof featured.translation === 'object' ? featured.translation[this.currentLang] : featured.translation;
        document.getElementById('featuredDescription').textContent = typeof featured.description === 'object' ? featured.description[this.currentLang] : featured.description;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredNames.length / this.itemsPerPage);
        
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    }

    showAllNames() {
        // Reset recitation state when switching views
        this.resetRecitationState();
        
        this.currentView = 'all';
        this.searchQuery = '';
        this.filteredNames = [...this.names];
        this.currentPage = 1;
        this.renderNames();
        this.updatePagination();
        
        // Reset search placeholder
        const searchInput = document.getElementById('namesSearch');
        searchInput.placeholder = this.translations[this.currentLang]['search-placeholder'];
        searchInput.value = '';
        
        // Update favorites button
        this.updateFavoritesButtonText();
        document.getElementById('favoriteBtn').classList.remove('active');
    }

    showFavorites() {
        if (this.favorites.size === 0) {
            this.showError(this.translations[this.currentLang]['no-favorites']);
            return;
        }
        
        // Reset recitation state when switching views
        this.resetRecitationState();
        
        this.currentView = 'favorites';
        const favoriteNumbers = Array.from(this.favorites);
        this.filteredNames = this.names.filter(name => favoriteNumbers.includes(name.number));
        this.currentPage = 1;
        this.renderNames();
        this.updatePagination();
        
        // Update search placeholder
        const searchInput = document.getElementById('namesSearch');
        searchInput.placeholder = this.translations[this.currentLang]['search-favorites-placeholder'];
        
        // Update favorites button
        this.updateFavoritesButtonText();
        document.getElementById('favoriteBtn').classList.add('active');
    }

    reciteAll() {
        if (this.isReciteAllActive) return; // Already active
        
        // Set this flag to true for the entire duration of reciteAll
        this._inReciteAllProcess = true; // <--- Set here

        // Make sure any ongoing audio is fully stopped
        if (this.currentAudio) {
            this.stopAudio(true); // Pass true as it's part of reciteAll initialization
        }
        
        this.isReciteAllActive = true;
        
        // Check if this is a resume or fresh start
        const isResume = this.namesToRecite !== null && 
                        this.reciteAllCurrentIndex > 0 &&
                        this.reciteViewMode === this.currentView &&
                        this.reciteShuffleState === this.isShuffled;
        
        if (!isResume) {
            // Fresh start - reset everything and store current state
            this.reciteAllCurrentIndex = 0;
            this.reciteViewMode = this.currentView;
            this.reciteShuffleState = this.isShuffled;
            
            // Store the names to recite based on current view
            if (this.currentView === 'favorites') {
                // Only recite favorites
                const favoriteNumbers = Array.from(this.favorites);
                this.namesToRecite = this.names.filter(name => favoriteNumbers.includes(name.number));
            } else {
                // Recite all names (using current order which may be shuffled)
                this.namesToRecite = [...this.names];
            }
        }
        
        this.updateReciteAllButton();
        
        // If no names to recite (empty favorites), show error and exit
        if (this.namesToRecite.length === 0) {
            this.showError(this.translations[this.currentLang]['no-favorites']);
            this.stopReciteAll();
            return;
        }
        
        // Ensure there are no existing timeouts
        if (this.reciteAllTimeout) {
            clearTimeout(this.reciteAllTimeout);
            this.reciteAllTimeout = null;
        }
        
        const reciteNext = () => {
            // Double-check we're still active and within bounds
            if (!this.isReciteAllActive || this.reciteAllCurrentIndex >= this.namesToRecite.length) {
                if (this.reciteAllCurrentIndex >= this.namesToRecite.length) {
                    this.stopReciteAll();
                }
                return;
            }
            
            // Find the correct index in the main names array
            const nameToRecite = this.namesToRecite[this.reciteAllCurrentIndex];
            const mainArrayIndex = this.names.findIndex(name => name.number === nameToRecite.number);
            
            // First highlight the current card
            this.highlightCurrentReciteCard();
            
            // Play the audio
            this.playNameAudio(mainArrayIndex); // _inReciteAllProcess is already true
            
            // Increment for next time
            this.reciteAllCurrentIndex++;
        };
        
        // Add a handler for utterance end that will schedule the next recitation
        this.utteranceEndHandler = () => {
            if (this.isReciteAllActive) {
                // Add a delay before playing the next name
                this.reciteAllTimeout = setTimeout(() => {
                    reciteNext();
                }, 1500); // 1.5 second gap between recitations
            }
        };
        
        // Start the first recitation
        reciteNext();
    }

    highlightCurrentReciteCard() {
        // Remove previous highlighting from all cards first
        document.querySelectorAll('.name-card.reciting').forEach(card => {
            card.classList.remove('reciting');
        });
        
        // Use the stored namesToRecite array
        if (!this.namesToRecite || this.reciteAllCurrentIndex >= this.namesToRecite.length) {
            return; // Safety check
        }
        
        // Find and highlight current card
        const currentName = this.namesToRecite[this.reciteAllCurrentIndex];
        if (currentName) {
            // Check if the card is on the current page
            const currentCard = document.querySelector(`[data-number="${currentName.number}"]`);
            
            if (currentCard) {
                // Card is on the current page, highlight it and scroll to it
                currentCard.classList.add('reciting');
                
                // Scroll to current card if it's in the current view
                if (currentCard.offsetParent !== null) { // Check if element is visible
                    currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Card is not on the current page, navigate to the correct page
                const nameIndex = this.filteredNames.findIndex(name => name.number === currentName.number);
                if (nameIndex !== -1) {
                    const totalPages = Math.ceil(this.filteredNames.length / this.itemsPerPage);
                    const correctPage = Math.floor(nameIndex / this.itemsPerPage) + 1;
                    
                    if (correctPage !== this.currentPage && correctPage <= totalPages) {
                        this.currentPage = correctPage;
                        this.renderNames();
                        this.updatePagination();
                        
                        // Now try to highlight and scroll again after the page renders
                        setTimeout(() => {
                            const newCurrentCard = document.querySelector(`[data-number="${currentName.number}"]`);
                            if (newCurrentCard) {
                                // Remove any stale highlights first
                                document.querySelectorAll('.name-card.reciting').forEach(card => {
                                    card.classList.remove('reciting');
                                });
                                
                                // Add highlight to the correct card
                                newCurrentCard.classList.add('reciting');
                                newCurrentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 100);
                    }
                }
            }
        }
    }

    toggleReciteAll() {
        if (this.isReciteAllActive) {
            // Currently playing - pause it
            this.pauseReciteAll();
        } else if (this.namesToRecite !== null && this.reciteAllCurrentIndex > 0) {
            // Check if view or shuffle state has changed since last recitation
            const viewChanged = this.reciteViewMode !== this.currentView;
            const shuffleChanged = this.reciteShuffleState !== this.isShuffled;
            
            if (viewChanged || shuffleChanged) {
                // View or shuffle state changed - stop and start fresh
                this.stopReciteAll();
                this.reciteAll();
            } else {
                // Same view and shuffle state - resume from where we left off
                this.reciteAll();
            }
        } else {
            // Not started yet or was stopped - start fresh
            this.reciteAll();
        }
    }

    pauseReciteAll() {
        // Mark as inactive first
        this.isReciteAllActive = false;
        this._inReciteAllProcess = false; // <--- Reset here
        
        // Cancel any speech synthesis
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        // Stop audio if needed
        if (!this._inStopAudio && this.currentAudio) {
            this._inPauseReciteAll = true;
            this.stopAudio();
            this._inPauseReciteAll = false;
        }
        
        // Clear any pending timeouts
        if (this.reciteAllTimeout) {
            clearTimeout(this.reciteAllTimeout);
            this.reciteAllTimeout = null;
        }
        
        // Update button appearance
        this.updateReciteAllButton();
        
        // Keep the current card highlighted to show where we'll resume from
        // Don't remove highlighting when pausing - keep track of the current card
        // The highlighting will remain so users know which card will play next when resuming
        
        // However, we need to go back by 1 because the index was already incremented
        // after the last card started playing
        if (this.reciteAllCurrentIndex > 0) {
            this.reciteAllCurrentIndex--;
        }
    }

    stopReciteAll() {
        // First, mark as inactive
        this.isReciteAllActive = false;
        this._inReciteAllProcess = false; // <--- Reset here
        
        // Cancel any speech synthesis directly
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        // Reset index
        this.reciteAllCurrentIndex = 0;
        
        // Clean up the utterance end handler
        this.utteranceEndHandler = null;
        
        // Make sure audio is stopped
        if (!this._inStopAudio && this.currentAudio) {
            this._inPauseReciteAll = true; // Reuse this flag to prevent recursion
            this.stopAudio();
            this._inPauseReciteAll = false;
        }
        
        // Clear any pending timeouts
        if (this.reciteAllTimeout) {
            clearTimeout(this.reciteAllTimeout);
            this.reciteAllTimeout = null;
        }
        
        // Remove highlighting from all cards
        document.querySelectorAll('.name-card.reciting').forEach(card => {
            card.classList.remove('reciting');
        });
        
        // Update button appearance
        this.updateReciteAllButton();
        
        // Show success message when completed (if not manually stopped)
        const wasCompleted = this.namesToRecite && 
                            this.reciteAllCurrentIndex >= this.namesToRecite.length;
        
        if (wasCompleted) {
            this.showSuccess(this.currentLang === 'bn' ? 'সব নাম পাঠ সম্পূর্ণ হয়েছে!' : 'All names recitation completed!');
        }
        
        // Clean up the namesToRecite array and state tracking
        this.namesToRecite = null;
        this.reciteViewMode = null;
        this.reciteShuffleState = null;
    }

    // Helper method to reset recitation state when view/order changes
    resetRecitationState() {
        // Stop any active recitation
        if (this.isReciteAllActive) {
            this.stopReciteAll();
        } else {
            // If not active but has saved state, clear it
            this.namesToRecite = null;
            this.reciteAllCurrentIndex = 0;
            this.reciteViewMode = null;
            this.reciteShuffleState = null;
            
            // Remove any highlighting
            document.querySelectorAll('.name-card.reciting').forEach(card => {
                card.classList.remove('reciting');
            });
            
            // Update button to show fresh start
            this.updateReciteAllButton();
        }
    }

    updateReciteAllButton() {
        const reciteAllBtn = document.getElementById('reciteAllBtn');
        const reciteAllIcon = reciteAllBtn.querySelector('i');
        const reciteAllSpan = reciteAllBtn.querySelector('span');
        
        if (this.isReciteAllActive) {
            // Active state - show pause
            reciteAllIcon.className = 'fas fa-pause-circle';
            reciteAllSpan.textContent = this.translations[this.currentLang][''];
            reciteAllBtn.classList.add('active');
        } else {
            // Inactive state - determine button text based on recitation state
            reciteAllIcon.className = 'fas fa-play-circle';
            
            // Check if we can resume (have saved state and index > 0)
            const canResume = this.namesToRecite !== null && 
                            this.reciteAllCurrentIndex > 0 && 
                            this.reciteAllCurrentIndex < this.namesToRecite.length &&
                            this.reciteViewMode === this.currentView &&
                            this.reciteShuffleState === this.isShuffled;
                
            if (canResume) {
                // Can resume from where we left off
                reciteAllSpan.textContent = this.translations[this.currentLang][''];
            } else {
                // Fresh start needed
                reciteAllSpan.textContent = this.translations[this.currentLang]['recite-al'];
            }
            reciteAllBtn.classList.remove('active');
        }
    }

    showRandomName() {
        // Shuffle all names
        this.shuffleAllNames();
    }

    shuffleAllNames() {
        // Reset recitation state when changing order
        this.resetRecitationState();
        
        // Fisher-Yates shuffle algorithm
        const shuffled = [...this.originalNames];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Update the names array with shuffled order
        this.names = shuffled;
        this.isShuffled = true;
        
        // Update filtered names based on current view
        if (this.currentView === 'favorites') {
            const favoriteNumbers = Array.from(this.favorites);
            this.filteredNames = shuffled.filter(name => favoriteNumbers.includes(name.number));
        } else {
            this.filteredNames = shuffled;
        }
        
        // Reset to first page and re-render
        this.currentPage = 1;
        this.renderNames();
        this.updatePagination();
        
        // Update random button
        this.updateRandomButtonText();
        document.getElementById('randomBtn').classList.add('active');
        
        // Show success message
        this.showSuccess(this.translations[this.currentLang]['cards-shuffled']);
    }

    restoreOriginalOrder() {
        // Reset recitation state when changing order
        this.resetRecitationState();
        
        // Restore original order
        this.names = [...this.originalNames];
        this.isShuffled = false;
        
        // Update filtered names based on current view
        if (this.currentView === 'favorites') {
            const favoriteNumbers = Array.from(this.favorites);
            this.filteredNames = this.names.filter(name => favoriteNumbers.includes(name.number));
        } else {
            this.filteredNames = [...this.names];
        }
        
        // Reset to first page and re-render
        this.currentPage = 1;
        this.renderNames();
        this.updatePagination();
        
        // Update random button
        this.updateRandomButtonText();
        document.getElementById('randomBtn').classList.remove('active');
        
        // Show success message
        this.showSuccess(this.translations[this.currentLang]['order-restored']);
    }

    shareNames() {
        if (navigator.share) {
            navigator.share({
                title: '99 Names of Allah',
                text: 'Discover the beautiful 99 names of Allah with meanings and audio pronunciation',
                url: window.location.href
            });
        } else {
            // Fallback for browsers that don't support native sharing
            const text = 'Check out the 99 Names of Allah: ' + window.location.href;
            navigator.clipboard.writeText(text).then(() => {
                this.showSuccess('Link copied to clipboard!');
            });
        }
    }

    shareName(number) {
        const name = this.names[number - 1];
        const text = `${name.arabic} - ${name.transliteration} - ${name.translation}\n${name.meaning}`;
        
        if (navigator.share) {
            navigator.share({
                title: name.transliteration,
                text: text
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showSuccess('Name copied to clipboard!');
            });
        }
    }

    saveFavorites() {
        if (!this.userId) {
            console.warn("99-Names: No user ID available. Saving favorites to localStorage only.");
            localStorage.setItem('99-names-favorites', JSON.stringify(Array.from(this.favorites)));
            return;
        }

        const favoritesArray = Array.from(this.favorites);
        const userDocRef = window.firebaseDoc(window.firebaseDb, "users", this.userId);

        window.firebaseSetDoc(userDocRef, { '99-names-favorites': favoritesArray }, { merge: true })
            .then(() => {
                console.log("99-Names: Favorites saved to Firebase successfully.");
            })
            .catch((error) => {
                console.error("99-Names: Error saving favorites to Firebase:", error);
                // Fallback to localStorage on error
                localStorage.setItem('99-names-favorites', JSON.stringify(favoritesArray));
                this.showError('Error saving favorites to cloud. Saved locally.');
            });
    }

    async loadFavorites() {
        if (!this.userId) {
            console.log("99-Names: No user ID available. Loading favorites from localStorage.");
            const saved = localStorage.getItem('99-names-favorites');
            if (saved) {
                try {
                    const favoriteArray = JSON.parse(saved);
                    this.favorites = new Set(favoriteArray);
                } catch (error) {
                    console.error('99-Names: Error loading favorites from localStorage:', error);
                }
            }
            return;
        }

        // Try loading from Firebase
        try {
            const userDocRef = window.firebaseDoc(window.firebaseDb, "users", this.userId);
            const docSnap = await window.firebaseGetDoc(userDocRef);

            if (docSnap.exists() && docSnap.data()['99-names-favorites']) {
                const firebaseFavorites = docSnap.data()['99-names-favorites'];
                this.favorites = new Set(firebaseFavorites);
                console.log("99-Names: Favorites loaded from Firebase successfully.");
            } else {
                console.log("99-Names: No favorites found in Firebase for this user. Checking localStorage.");
                // If no Firebase data, try loading from localStorage (for migration or initial sync)
                const saved = localStorage.getItem('99-names-favorites');
                if (saved) {
                    try {
                        const favoriteArray = JSON.parse(saved);
                        this.favorites = new Set(favoriteArray);
                        console.log("99-Names: Favorites loaded from localStorage. Uploading to Firebase.");
                        // Upload to Firebase for future consistency
                        this.saveFavorites();
                    } catch (error) {
                        console.error('99-Names: Error loading favorites from localStorage:', error);
                    }
                }
            }
        } catch (error) {
            console.error("99-Names: Error loading favorites from Firebase:", error);
            // Fallback to localStorage on Firebase error
            const saved = localStorage.getItem('99-names-favorites');
            if (saved) {
                try {
                    const favoriteArray = JSON.parse(saved);
                    this.favorites = new Set(favoriteArray);
                    this.showError('Error loading favorites from cloud. Using local data.');
                } catch (e) {
                    console.error('99-Names: Error loading favorites from localStorage after Firebase error:', e);
                }
            }
        }
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
        }, 3000);
    }

    // Language Management Functions
    toggleLanguage() {
        this.currentLang = this.currentLang === 'en' ? 'bn' : 'en';
        localStorage.setItem('language', this.currentLang);
        this.applyLanguage();
    }

    applyLanguage() {
        const translations = this.translations[this.currentLang];
        
        // Update static text elements
        Object.keys(translations).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = translations[key];
            }
        });

        // Update search placeholder
        const searchInput = document.getElementById('namesSearch');
        if (this.currentView === 'favorites') {
            searchInput.placeholder = translations['search-favorites-placeholder'];
        } else {
            searchInput.placeholder = translations['search-placeholder'];
        }

        // Update favorites/show all button text
        this.updateFavoritesButtonText();

        // Update random button text based on shuffle state
        this.updateRandomButtonText();

        // Update action buttons
        this.updateActionButtonsText();

        // Update recite all button state
        this.updateReciteAllButton();

        // Re-render names and featured name with new language
        this.setFeaturedName();
        this.renderNames();
    }

    updateFavoritesButtonText() {
        const favoriteBtn = document.getElementById('favoriteBtn');
        const favoriteSpan = favoriteBtn.querySelector('span');
        const favoriteIcon = favoriteBtn.querySelector('i');
        
        if (this.currentView === 'favorites') {
            favoriteIcon.className = 'fas fa-list';
           
        } else {
            favoriteIcon.className = 'fas fa-heart';
           
        }
    }

    updateRandomButtonText() {
        const randomBtn = document.getElementById('randomBtn');
        const randomSpan = randomBtn.querySelector('span');
        const randomIcon = randomBtn.querySelector('i');
        
        if (this.isShuffled) {
            randomIcon.className = 'fas fa-undo';
        } else {
            randomIcon.className = 'fas fa-random';
        }
    }

    updateActionButtonsText() {
        const reciteAllSpan = document.querySelector('#reciteAllBtn span');
        if (reciteAllSpan) {
        }
    }

  
    
}

// No automatic initialization - now handled in HTML

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NamesOfAllah;
}
