import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let firestoreDb: Firestore | undefined;

function initializeAdminApp() {
  if (getApps().length > 0 && getApps().some(app => app?.name === '[DEFAULT]')) {
    adminApp = getApps().find(app => app?.name === '[DEFAULT]');
    if (adminApp) return;
  }

  const base64Config = process.env.FIREBASE_ADMIN_SDK_CONFIG_BASE64;
  
  if (!base64Config) {
      console.error("❌ La variable d'environnement FIREBASE_ADMIN_SDK_CONFIG_BASE64 n'est pas définie.");
      throw new Error(
        "Impossible d'initialiser le SDK Admin de Firebase. La configuration est manquante."
      );
  }

  try {
    const serviceAccount = JSON.parse(Buffer.from(base64Config, 'base64').toString('utf8'));

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.info("✅ Firebase Admin SDK initialisé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'analyse ou de l'initialisation des credentials Firebase Admin:", error);
    throw new Error("Impossible d'initialiser le SDK Admin de Firebase. Vérifiez le format de votre variable d'environnement FIREBASE_ADMIN_SDK_CONFIG_BASE64.");
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
