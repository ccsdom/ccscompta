
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App;
let auth: Auth;
let db: Firestore;

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error("Firebase Admin credentials are not set in environment variables.");
}

try {
    if (!getApps().length) {
        adminApp = initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        adminApp = getApps()[0];
    }
    auth = getAuth(adminApp);
    db = getFirestore(adminApp);
} catch (error) {
    console.error("Firebase Admin SDK Initialization Error:", error);
}

// @ts-ignore
export { auth, db };
