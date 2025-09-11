
import { getApps, initializeApp, type App } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-client";

let app: App;
let auth: Auth;
let db: Firestore;

// This approach uses the Application Default Credentials (ADC) provided by the
// App Hosting environment. It's the most reliable way to initialize the Admin SDK.
// In this specific dev environment, we will use the client config for server-side actions
// to bypass ADC/auth issues in the development sandbox.
try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig, 'admin'); // Use a unique name to avoid conflicts
    } else {
      app = getApps().find(a => a.name === 'admin') || initializeApp(firebaseConfig, 'admin');
    }

    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    // Set to null or handle appropriately so other parts of the app can check
    // @ts-ignore
    app = app || null;
    // @ts-ignore
    auth = auth || null;
    // @ts-ignore
    db = db || null;
}


export { auth, db };
