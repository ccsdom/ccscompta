
// firebaseClient.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(config = firebaseConfig): FirebaseApp {
    return getApps().length ? getApp() : initializeApp(config);
}

const app = getFirebaseApp();
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// Centralized auth state observer
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("Firebase Auth state: Logged in", user.uid);
  } else {
    console.log("Firebase Auth state: Logged out");
  }
});

export { app, auth, storage, db, getFirebaseApp };
