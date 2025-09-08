
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App;
let auth: Auth;
let db: Firestore;

try {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
    } else {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        // This is the crucial part: the private key from environment variables needs to have its newlines properly escaped.
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error("Firebase Admin SDK credentials are not configured in environment variables.");
        }
        
        adminApp = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    }

    auth = getAuth(adminApp);
    db = getFirestore(adminApp);

} catch (error) {
    console.error("Firebase admin initialization error:", error);
    // In a non-production environment, you might want to avoid throwing
    // and instead have fallback logic or mock services.
    // For this app, we'll allow it to fail to make it clear configuration is needed.
}


// @ts-ignore
export { auth, db };
