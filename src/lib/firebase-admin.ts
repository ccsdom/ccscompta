
import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
}

let adminInstance: FirebaseAdmin | null = null;

function initializeAdminApp(): FirebaseAdmin {
  if (getApps().length > 0 && adminInstance) {
    return adminInstance;
  }

  const app = initializeApp();
  
  adminInstance = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
  return adminInstance;
}

export const { auth, db } = initializeAdminApp();
