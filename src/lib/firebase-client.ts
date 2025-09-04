import { initializeApp as initializeClientApp, getApp, getApps as getClientApps, type FirebaseApp } from "firebase/app";
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


let clientApp: FirebaseApp;

if (getClientApps().length === 0) {
    clientApp = initializeClientApp(firebaseConfig);
  } else {
    clientApp = getApp();
}

export const db = getClientFirestore(clientApp);
export const auth = getAuth(clientApp);
export const storage = getStorage(clientApp);
