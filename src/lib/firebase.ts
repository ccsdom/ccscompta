// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "ccs-compta",
  "appId": "1:641289397299:web:160436367ad4dff3e6ef46",
  "storageBucket": "ccs-compta.appspot.com",
  "apiKey": "AIzaSyC1Wu-pJ12Ionb9dsjWmaGusuxGmh5LZB4",
  "authDomain": "ccs-compta.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "641289397299"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
