/**
 * STUDY DESK - FIREBASE & STORAGE ADAPTER
 * Connects with Firebase Auth, Firestore, and Cloud Storage.
 * Seamlessly operates with local store when Firebase config is not yet supplied.
 */

import { store } from './store.js';

let firebaseApp = null;
let authInstance = null;
let firestoreDb = null;
let storageInstance = null;

export async function initFirebase(config) {
  if (!config || !config.apiKey || !config.projectId) {
    return { initialized: false, mode: 'local' };
  }

  try {
    // Dynamic import of official Firebase v10 ESM from CDN
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    const { getFirestore, doc, setDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js');

    firebaseApp = initializeApp(config);
    authInstance = getAuth(firebaseApp);
    firestoreDb = getFirestore(firebaseApp);
    storageInstance = getStorage(firebaseApp);

    onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        store.setState(s => ({
          ...s,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL
          }
        }), 'auth_change');

        // Sync remote user data
        try {
          const userDocRef = doc(firestoreDb, 'users', user.uid, 'settings', 'profile');
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.theme) store.setState(s => ({ ...s, theme: data.theme }));
          }
        } catch (syncErr) {
          console.warn('Firestore sync initial read error:', syncErr);
        }
      } else {
        store.setState(s => ({ ...s, user: null }), 'auth_change');
      }
    });

    return {
      initialized: true,
      mode: 'cloud',
      auth: {
        signInWithEmailAndPassword: (email, pass) => signInWithEmailAndPassword(authInstance, email, pass),
        createUserWithEmailAndPassword: (email, pass) => createUserWithEmailAndPassword(authInstance, email, pass),
        signInWithGoogle: () => signInWithPopup(authInstance, new GoogleAuthProvider()),
        sendPasswordResetEmail: (email) => sendPasswordResetEmail(authInstance, email),
        signOut: () => signOut(authInstance)
      },
      storage: {
        uploadFile: async (path, file) => {
          const storageRef = ref(storageInstance, path);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        }
      }
    };
  } catch (err) {
    console.warn('Firebase initialization error, continuing in local mode:', err);
    return { initialized: false, mode: 'local', error: err.message };
  }
}

export function isCloudActive() {
  return firebaseApp !== null && store.getState().user !== null;
}
