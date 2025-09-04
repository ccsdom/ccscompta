import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeApp as initializeClientApp, getApp, getApps as getClientApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore as getClientFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "ccs-compta",
  "appId": "1:641289397299:web:160436367ad4dff3e6ef46",
  "storageBucket": "ccs-compta.appspot.com",
  "apiKey": "AIzaSyC1Wu-pJ12Ionb9dsjWmaGusuxGmh5LZB4",
  "authDomain": "ccs-compta.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "641289397299"
};


let adminApp: App;
let clientApp: any;

if (typeof window === 'undefined') { // Côté serveur
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    adminApp = getApps()[0];
  }
} else { // Côté client
  if (getClientApps().length === 0) {
    clientApp = initializeClientApp(firebaseConfig);
  } else {
    clientApp = getApp();
  }
}

export const db = typeof window === 'undefined' ? getAdminFirestore(adminApp) : getClientFirestore(clientApp);
export const auth = typeof window !== 'undefined' ? getAuth(clientApp) : null;
export const storage = typeof window !== 'undefined' ? getStorage(clientApp) : null;
