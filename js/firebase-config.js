// Firebase Configuration for Vintage Shop
// Using Firebase v9+ modular SDK via CDN

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB3xqkDHLiak3SyJ5BYxGYSOAIuZtHT0qA",
    authDomain: "antiqueshop-43587.firebaseapp.com",
    databaseURL: "https://antiqueshop-43587-default-rtdb.firebaseio.com",
    projectId: "antiqueshop-43587",
    storageBucket: "antiqueshop-43587.firebasestorage.app",
    messagingSenderId: "878053922342",
    appId: "1:878053922342:web:1e0c32efc394aac1baf8e7",
    measurementId: "G-R2PPE9038B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence for Firestore
db.enablePersistence().catch((err) => {
    console.log('Persistence error:', err.code);
});

console.log('Firebase initialized successfully!');
