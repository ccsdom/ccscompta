
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const getAdminApp = (): App => {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin SDK credentials are not configured in environment variables.");
    }

    try {
        return initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error("Error initializing Firebase Admin SDK:", error);
        throw new Error("Could not initialize Firebase Admin SDK.");
    }
};

const adminApp: App = getAdminApp();
const auth: Auth = getAuth(adminApp);
const db: Firestore = getFirestore(adminApp);

export { auth, db };
