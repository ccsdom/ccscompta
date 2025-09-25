
import { initializeApp, getApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This is a placeholder for the service account key.
// In a real production environment, this should be loaded securely,
// for example, from Google Cloud Secret Manager.
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
}

// Ensure the service account has the necessary values
if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  if (process.env.NODE_ENV === 'production') {
    console.error("Firebase Admin SDK service account is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.");
    // In production, you might want to throw an error to prevent the app from starting without proper config.
    // For now, we will log the error and allow the app to continue, but auth-related server actions will fail.
  } else {
     console.warn("Firebase Admin SDK not configured. Server-side auth actions will fail. This is expected in a local development environment without the service account key.");
  }
}

const app = getApps().length
  ? getApp('admin')
  : initializeApp({
      credential: cert(serviceAccount)
    }, 'admin');

const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };
