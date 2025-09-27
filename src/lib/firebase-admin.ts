
import { initializeApp, getApp, getApps, App, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

// Simpler initialization to rely on Application Default Credentials
try {
  app = getApps().length 
    ? getApp() 
    : initializeApp({
        credential: applicationDefault(),
      });
} catch (error) {
  console.error("Firebase Admin SDK initialization failed:", error);
  // Create a dummy app to avoid crashing the server on import
  // This allows the app to run, although Firebase Admin features will fail.
  app = {
    name: '[DEFAULT]',
    options: {},
    auth: () => { throw new Error("Firebase Admin not initialized") },
    firestore: () => { throw new Error("Firebase Admin not initialized") },
    // Add other methods you use if necessary
  } as unknown as App;
}

const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };
