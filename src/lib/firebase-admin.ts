
import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let auth: Auth;
let db: Firestore;

// This approach uses the Application Default Credentials (ADC) provided by the
// App Hosting environment. It's the most reliable way to initialize the Admin SDK.
try {
    if (getApps().length === 0) {
      app = initializeApp();
    } else {
      app = getApps()[0];
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
