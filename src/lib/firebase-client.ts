
// firebaseClient.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "ccs-compta",
  "appId": "1:641289397299:web:160436367ad4dff3e6ef46",
  "storageBucket": "ccs-compta-storage.appspot.com",
  "apiKey": "AIzaSyC1Wu-pJ12Ionb9dsjWmaGusuxGmh5LZB4",
  "authDomain": "ccs-compta.firebaseapp.com",
  "messagingSenderId": "641289397299"
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
