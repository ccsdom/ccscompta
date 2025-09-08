
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

// This function ensures Firebase Admin is initialized, but only once.
function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // Check if an app is already initialized
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }
  
  // If no app is initialized, create a new one.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // This is a server-side log, will appear in the function logs.
    console.error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY is not set.");
    // In a real app, you might want to throw an error here to prevent the app from starting.
    // For this environment, we'll log the error and let it fail gracefully later.
    throw new Error("Firebase Admin SDK credentials are not configured.");
  }

  try {
    const credentials = {
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
    };
    
    adminApp = initializeApp({
      credential: cert(credentials),
    });

    console.info("✅ Firebase Admin SDK initialized successfully.");
    return adminApp;

  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error);
    throw error; // Rethrow the error to make it clear that initialization failed.
  }
}


function getDb(): Firestore | null {
  try {
    const app = getAdminApp();
    return getFirestore(app);
  } catch (error) {
    console.error("Failed to get Firestore instance:", error);
    return null;
  }
}

function getAuthService(): Auth | null {
  try {
    const app = getAdminApp();
    return getAuth(app);
  } catch (error) {
    console.error("Failed to get Auth instance:", error);
    return null;
  }
}

// Export getters that will be used by server-side functions.
export const db = {
  get: getDb,
};

export const auth = {
  get: getAuthService,
};
