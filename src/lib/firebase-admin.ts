import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

function initializeAdminApp() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return;
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Les variables d'environnement Firebase Admin sont manquantes. L'accès à la base de données ne fonctionnera pas côté serveur.");
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
  }
}

// Initialiser l'application au chargement du module
initializeAdminApp();

function getDb(): Firestore | null {
  if (!adminApp) {
    initializeAdminApp(); // Tentative de ré-initialisation
    if (!adminApp) return null;
  }
  return getFirestore(adminApp);
}

function getAuthService(): Auth | null {
  if (!adminApp) {
    initializeAdminApp(); // Tentative de ré-initialisation
    if (!adminApp) return null;
  }
  return getAuth(adminApp);
}

export const db: { get: () => Firestore | null } = {
  get: getDb,
};

export const auth: { get: () => Auth | null } = {
  get: getAuthService,
};

    