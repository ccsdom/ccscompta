import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let firestoreDb: Firestore | undefined;

function initializeAdminApp() {
  if (getApps().length > 0 && getApps().some(app => app?.name === '[DEFAULT]')) {
    adminApp = getApps().find(app => app?.name === '[DEFAULT]');
    if (adminApp) return;
  }
  
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!serviceAccountJson) {
    console.error("❌ La variable d'environnement GOOGLE_APPLICATION_CREDENTIALS_JSON est manquante.");
    throw new Error(
      "Impossible d'initialiser le SDK Admin de Firebase. La configuration est manquante."
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.info("✅ Firebase Admin SDK initialisé avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation Firebase Admin:", error);
    throw new Error(
      "Impossible d'initialiser le SDK Admin de Firebase. Vérifiez vos variables d'environnement."
    );
  }
}

function getDb(): Firestore {
  if (!adminApp) {
    initializeAdminApp();
  }
  if (!firestoreDb && adminApp) {
    firestoreDb = getFirestore(adminApp);
  }
  if (!firestoreDb) {
    throw new Error("❌ L'initialisation de Firestore a échoué.");
  }
  return firestoreDb;
}

export const db: { get: () => Firestore } = {
  get: getDb,
};
