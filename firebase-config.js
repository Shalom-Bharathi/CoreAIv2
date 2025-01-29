// Initialize Firebase only if it hasn't been initialized yet
let app;
try {
  app = firebase.app();
} catch (error) {
  app = firebase.initializeApp({
    apiKey: "AIzaSyAtBxeZrh4cej7ZzsKZ5uN-BqC_wxoTmdE",
    authDomain: "coreai-82c79.firebaseapp.com",
    databaseURL: "https://coreai-82c79-default-rtdb.firebaseio.com",
    projectId: "coreai-82c79",
    storageBucket: "coreai-82c79.firebasestorage.app",
    messagingSenderId: "97395011364",
    appId: "1:97395011364:web:1e8f6a06fce409bfd80db1",
    measurementId: "G-0J1RLMVEGC"
  });
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();

// Export the initialized app
export default app; 