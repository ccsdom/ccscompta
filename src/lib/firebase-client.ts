
// firebaseClient.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyC1Wu-pJ12Ionb9dsjWmaGusuxGmh5LZB4",
  authDomain: "ccs-compta.firebaseapp.com",
  projectId: "ccs-compta",
  storageBucket: "ccs-compta.appspot.com",
  messagingSenderId: "641289397299",
  appId: "1:641289397299:web:160436367ad4dff3e6ef46"
};


// Singleton pattern to ensure Firebase is initialized only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

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

export { app, auth, storage, db };
