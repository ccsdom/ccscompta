import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let firestoreDb: Firestore | undefined;
let adminAuth: Auth | undefined;

function initializeAdminApp() {
  // Si l'app existe déjà, on la récupère.
  if (getApps().length > 0 && getApps()[0]) {
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
    // Ne pas lancer d'erreur ici pour permettre à l'app de fonctionner même sans le SDK Admin
  }
}

// Initialiser l'application au chargement du module
initializeAdminApp();

function getDb(): Firestore | null {
  if (!adminApp) return null;
  if (!firestoreDb) {
    firestoreDb = getFirestore(adminApp);
  }
  return firestoreDb;
}

function getAuthService(): Auth | null {
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
