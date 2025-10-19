import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp(); // Call without arguments to use Application Default Credentials
}

const db = getFirestore();
const auth = getAuth();
const adminApp = getApp();

export { db, auth, adminApp };
