import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

let adminApp: App;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(
            'Firebase Admin credentials not found in environment variables. Skipping admin initialization.'
        );
    }
} else {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      adminApp = getApps()[0];
    }
}


// @ts-ignore - adminApp might not be initialized, but we check before using it.
export const db = adminApp ? getAdminFirestore(adminApp) : null;

if (!db) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Firestore Admin SDK is not initialized. Database operations will fail.');
    } else {
        throw new Error('Firestore Admin SDK failed to initialize. Check environment variables.');
    }
}
