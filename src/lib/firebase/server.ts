import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: undefined, // Will use Application Default Credentials
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

const db = getFirestore();
const auth = getAuth();
const adminApp = getApp();

export { db, auth, adminApp };
