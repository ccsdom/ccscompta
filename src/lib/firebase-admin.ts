
import { initializeApp, getApps, getApp, type App } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-client";

let app: App;
let auth: Auth;
let db: Firestore;

try {
    const appName = 'admin-app';
    const existingApp = getApps().find(app => app.name === appName);
    app = existingApp || initializeApp(firebaseConfig, appName);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    // Fallback in case of error
    // @ts-ignore
    app = app || null;
     // @ts-ignore
    auth = auth || null;
     // @ts-ignore
    db = db || null;
}

export { auth, db };
