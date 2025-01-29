// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtBxeZrh4cej7ZzsKZ5uN-BqC_wxoTmdE",
  authDomain: "total-treat-423211-a1.firebaseapp.com",
  projectId: "total-treat-423211-a1",
  storageBucket: "total-treat-423211-a1.appspot.com",
  messagingSenderId: "1051641122651",
  appId: "1:1051641122651:web:c4c5c0a0a0a0a0a0a0a0a0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage(); 