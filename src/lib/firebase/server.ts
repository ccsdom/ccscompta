
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// Initialize Firebase Admin SDK
// This is for server-side operations, like in API routes or server-side rendering.
if (!getApps().length) {
    try {
        // In a deployed environment (like Vercel or Firebase Functions),
        // GOOGLE_APPLICATION_CREDENTIALS will be set automatically.
        initializeApp({
            credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!)),
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
        });
    } catch(e) {
        // For local development, it might fall back or need a specific setup
        // but often the emulator will be used instead.
        // If not using emulator and running server locally, you'd need to set up
        // the GOOGLE_APPLICATION_CREDENTIALS env var to point to your service account key file.
        console.warn("Could not initialize Firebase Admin SDK automatically. This is expected in local development without a service account key.", e);
        // Fallback for local dev without emulators but with service account in env var
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            initializeApp({
                credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
            });
        } else {
             // If no credentials, initialize without them, relying on emulators or other auth.
            initializeApp();
        }
    }
}

const db = getFirestore();

export { db };
