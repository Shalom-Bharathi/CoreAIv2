// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot,
  FieldValue
} from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAtBxeZrh4cej7ZzsKZ5uN-BqC_wxoTmdE",
  authDomain: "coreai-82c79.firebaseapp.com",
  databaseURL: "https://coreai-82c79-default-rtdb.firebaseio.com",
  projectId: "coreai-82c79",
  storageBucket: "coreai-82c79.firebasestorage.app",
  messagingSenderId: "97395011364",
  appId: "1:97395011364:web:1e8f6a06fce409bfd80db1",
  measurementId: "G-0J1RLMVEGC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export initialized services
export { auth, storage };

// Export Firestore with all its methods
export const firestore = {
  db,
  collection: (path) => collection(db, path),
  getDocs,
  addDoc,
  doc: (path, ...segments) => doc(db, path, ...segments),
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp: () => serverTimestamp(),
  FieldValue
}; 