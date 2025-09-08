import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let firestoreDb: Firestore | undefined;
let adminAuth: Auth | undefined;

function initializeAdminApp() {
  if (getApps().length > 0 && getApps().some(app => app?.name === '[DEFAULT]')) {
    adminApp = getApps().find(app => app?.name === '[DEFAULT]');
    if (adminApp) return;
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Les variables d'environnement Firebase Admin sont manquantes. Certaines fonctionnalités (ex: création d'utilisateurs de démo) peuvent être désactivées.");
    return;
  }

  try {
    adminApp = initializeApp({
      credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.info("✅ Firebase Admin SDK initialisé avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation Firebase Admin:", error);
    // Ne pas lancer d'erreur ici pour permettre à l'app de fonctionner même sans le SDK Admin
  }
}

function getDb(): Firestore | null {
  if (!adminApp) {
    initializeAdminApp();
  }
  // Si l'initialisation a échoué, adminApp sera undefined
  if (!adminApp) return null;

  if (!firestoreDb) {
    firestoreDb = getFirestore(adminApp);
  }
  return firestoreDb;
}

function getAuthService(): Auth | null {
  if (!adminApp) {
    initializeAdminApp();
  }
  if (!adminApp) return null;

  if (!adminAuth) {
    adminAuth = getAuth(adminApp);
  }
  return adminAuth;
}

export const db: { get: () => Firestore | null } = {
  get: getDb,
};

export const auth: { get: () => Auth | null } = {
  get: getAuthService,
};
