
import { initializeApp, getApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

try {
  // Try to get the existing app, otherwise initialize a new one.
  // Using applicationDefault() allows the SDK to automatically find the credentials
  // in a standard Google Cloud environment.
  app = getApps().length ? getApp('admin') : initializeApp({
    credential: applicationDefault(),
  } , 'admin');
} catch (error) {
  console.error("Firebase Admin SDK initialization failed:", error);
  // If initialization fails, we create a dummy app object to avoid crashing the server on import,
  // though subsequent Firebase calls will fail. This helps in environments where credentials
  // might not be set, allowing the rest of the app to potentially run.
  app = {
    name: 'admin',
    options: {},
    auth: () => { throw new Error("Firebase Admin not initialized") },
    firestore: () => { throw new Error("Firebase Admin not initialized") },
    // Add other methods that might be called if necessary
  } as unknown as App;
}


const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };
