// Remove Firebase initialization imports and use the existing instance
import { auth, firestore } from './firebase-config.js';
import { showBodyDetailsModal, hideBodyDetailsModal } from './modals.js';

const provider = new firebase.auth.GoogleAuthProvider();

// Handle Authentication State Changes
export function initAuth() {
  auth.onAuthStateChanged(async (user) => {
    const loginPage = document.getElementById('loginPage');
    const appElement = document.getElementById('app');
    
    if (user) {
      try {
        // Check if user has body details
        const userDetailsRef = firestore.collection('body-details').doc(user.uid);
        const userDetailsDoc = await userDetailsRef.get();
        
        if (!userDetailsDoc.exists) {
          showBodyDetailsModal();
        }

        // Update UI
        loginPage.style.display = 'none';
        appElement.style.display = 'flex';
        
        // Update user info
        updateUserInfo(user);
      } catch (error) {
        console.error('Error checking body details:', error);
      }
    } else {
      loginPage.style.display = 'flex';
      appElement.style.display = 'none';
    }
  });
}

function updateUserInfo(user) {
  const userNameElements = document.querySelectorAll('.user-name');
  userNameElements.forEach(el => el.textContent = user.displayName);
  
  const userAvatars = document.querySelectorAll('.user-avatar');
  userAvatars.forEach(avatar => {
    avatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=4f46e5&color=fff`;
  });
}

export async function saveBodyDetails(details) {
  const user = auth.currentUser;
  if (user) {
    try {
      await firestore.collection('body-details').doc(user.uid).set({
        ...details,
        updatedAt: new Date().toISOString()
      });
      hideBodyDetailsModal();
    } catch (error) {
      console.error('Error saving body details:', error);
      alert('Failed to save body details. Please try again.');
    }
  }
}

export async function signInWithGoogle() {
  try {
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    document.getElementById('loginError').textContent = 'Error signing in. Please try again.';
  }
}

export async function handleSignOut() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
}