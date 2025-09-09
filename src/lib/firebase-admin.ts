
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App;
let auth: Auth;
let db: Firestore;

try {
  const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
  
  if (getApps().length) {
    adminApp = getApps()[0];
  } else {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  }
  
  auth = getAuth(adminApp);
  db = getFirestore(adminApp);

} catch (error) {
    console.error("Firebase Admin SDK Initialization Error:", error);
    // @ts-ignore
    db = null;
    // @ts-ignore
    auth = null;
}


export { auth, db };
