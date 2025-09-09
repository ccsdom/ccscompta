import { getApps, initializeApp, type App, cert } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
         app = initializeApp({
            credential: cert({
                projectId: process.env.GCLOUD_PROJECT || 'ccs-compta',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
    } else {
        // Fallback for local development or environments without these variables
        console.warn("Firebase Admin credentials not found in environment variables. Initializing with default credentials.");
        app = initializeApp();
    }
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { auth, db };
