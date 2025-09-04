// firebaseClient.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let clientApp: FirebaseApp;

// Check if all config values are provided
const isConfigured = Object.values(firebaseConfig).every(Boolean);

if (isConfigured) {
    if (getApps().length === 0) {
      clientApp = initializeApp(firebaseConfig);
    } else {
      clientApp = getApp();
    }
} else {
    console.warn("Firebase client configuration is incomplete. Skipping initialization.");
    // Provide a mock/dummy app object if not configured to avoid crashes on auth/storage calls
    clientApp = {
        name: 'mock-app',
        options: {},
        automaticDataCollectionEnabled: false,
    } as FirebaseApp;
}


export const app = clientApp;
export const db = isConfigured ? getFirestore(clientApp) : ({} as any);
export const auth = isConfigured ? getAuth(clientApp) : ({} as any);
export const storage = isConfigured ? getStorage(clientApp) : ({} as any);