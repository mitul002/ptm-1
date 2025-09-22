const firebaseConfig = {
  apiKey: "AIzaSyD8nMy_fmfFiy2wN928KENp3mTjAilTMkE",
  authDomain: "prayer-times123.firebaseapp.com",
  projectId: "prayer-times123",
  storageBucket: "prayer-times123.firebasestorage.app",
  messagingSenderId: "347872839061",
  appId: "1:347872839061:web:cad7b831799e7d88ace29c",
  measurementId: "G-RBE4169XBF"
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, EmailAuthProvider, updatePassword, reauthenticateWithCredential, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Set default persistence to LOCAL to keep users logged in across tabs and sessions
setPersistence(auth, browserLocalPersistence).then(() => {
    console.log("Firebase persistence set to LOCAL - users will stay logged in");
}).catch((error) => {
    console.warn("Failed to set Firebase persistence:", error);
});

// Make them globally available
window.firebaseAuth = auth;
window.firebaseAnalytics = analytics;
window.firebaseDb = db;
window.firebaseDoc = doc;
window.firebaseSetDoc = setDoc;
window.firebaseGetDoc = getDoc;
window.firebaseCollection = collection;
window.firebaseQuery = query;
window.firebaseWhere = where;
window.firebaseGetDocs = getDocs;
window.firebaseDeleteDoc = deleteDoc;
window.firebaseEmailAuthProvider = EmailAuthProvider;
window.firebaseUpdatePassword = updatePassword;
window.firebaseReauthenticateWithCredential = reauthenticateWithCredential;
window.firebaseOnAuthStateChanged = onAuthStateChanged;
window.firebaseSendEmailVerification = sendEmailVerification;
window.firebaseSendPasswordResetEmail = sendPasswordResetEmail;
window.firebaseSetPersistence = setPersistence;
window.firebaseBrowserSessionPersistence = browserSessionPersistence;
window.firebaseBrowserLocalPersistence = browserLocalPersistence;

// Log Firebase initialization
console.log("Firebase initialized successfully:", {
    auth: !!window.firebaseAuth,
    db: !!window.firebaseDb,
    projectId: firebaseConfig.projectId
});