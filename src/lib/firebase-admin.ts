
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
}

let adminInstance: FirebaseAdmin | null = null;

function initializeAdminApp(): FirebaseAdmin {
  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    return {
      app: existingApp,
      auth: getAuth(existingApp),
      db: getFirestore(existingApp),
    };
  }

  let app: App;
  
  try {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    if (serviceAccount.privateKey) {
       app = initializeApp({
          credential: cert(serviceAccount),
        });
    } else {
        console.warn("Firebase Admin private key is not available. Initializing with default credentials for emulator or cloud environment.");
        app = initializeApp();
    }
  } catch(error) {
      console.error("Firebase Admin SDK Initialization Error, falling back to default:", error);
      app = initializeApp();
  }
  
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}


function getFirebaseAdmin(): FirebaseAdmin {
  if (!adminInstance) {
    adminInstance = initializeAdminApp();
  }
  return adminInstance;
}

export const { auth, db } = getFirebaseAdmin();
