
// firebaseClient.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "ccs-compta",
  "appId": "1:641289397299:web:160436367ad4dff3e6ef46",
  "storageBucket": "ccs-compta.firebasestorage.app",
  "apiKey": "AIzaSyC1Wu-pJ12Ionb9dsjWmaGusuxGmh5LZB4",
  "authDomain": "ccs-compta.firebaseapp.com",
  "messagingSenderId": "641289397299"
};

// Singleton pattern to ensure Firebase is initialized only once
let clientApp: FirebaseApp;
if (!getApps().length) {
  clientApp = initializeApp(firebaseConfig);
} else {
  clientApp = getApp();
}

const auth = getAuth(clientApp);
const storage = getStorage(clientApp);
const db = getFirestore(clientApp);

// Centralized auth state observer
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("Firebase Auth state: Logged in", user.uid);
  } else {
    console.log("Firebase Auth state: Logged out");
  }
});

export { clientApp as app, auth, storage, db };
