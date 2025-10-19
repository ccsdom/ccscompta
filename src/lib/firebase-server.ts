
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!getApps().length) {
    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey) as ServiceAccount;
            initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (error) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
            initializeApp();
        }
    } else {
        // This will work in Firebase environments (Functions, App Hosting)
        // where Application Default Credentials are automatically available.
        initializeApp();
    }
}

const db = getFirestore();

export { db };
