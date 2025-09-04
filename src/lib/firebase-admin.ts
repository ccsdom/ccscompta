import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

let adminApp: App;

if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // This handles the private key, removing potential quotes and parsing escaped newlines.
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Firebase Admin SDK credentials are not set or are invalid in .env file.');
  }

  // Clean the private key: remove quotes and replace escaped newlines
  const privateKey = privateKeyRaw.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

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

export const db = getAdminFirestore(adminApp);
