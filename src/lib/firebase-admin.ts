
import { initializeApp, getApp, getApps, App, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

try {
  if (serviceAccount) {
     app = getApps().length 
      ? getApp('admin') 
      : initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id
        }, 'admin');
  } else {
     app = getApps().length 
      ? getApp('admin') 
      : initializeApp({
          credential: applicationDefault(),
        }, 'admin');
  }
} catch (error) {
  console.error("Firebase Admin SDK initialization failed:", error);
  // Create a dummy app to avoid crashing the server on import
  app = {
    name: 'admin',
    options: {},
    auth: () => { throw new Error("Firebase Admin not initialized") },
    firestore: () => { throw new Error("Firebase Admin not initialized") },
  } as unknown as App;
}

const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };
