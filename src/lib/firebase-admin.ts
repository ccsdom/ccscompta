import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let firestoreDb: Firestore | undefined;

function initializeAdminApp() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return;
  }

  // Cette approche est plus robuste pour les environnements de déploiement.
  const base64Config = process.env.FIREBASE_ADMIN_SDK_CONFIG_BASE64;
  
  if (!base64Config) {
      console.error("❌ La variable d'environnement FIREBASE_ADMIN_SDK_CONFIG_BASE64 n'est pas définie.");
      throw new Error(
        "Impossible d'initialiser le SDK Admin de Firebase. La configuration est manquante."
      );
  }

  try {
    const serviceAccountJson = Buffer.from(base64Config, "base64").toString("utf8");
    const serviceAccount = JSON.parse(serviceAccountJson);

    console.info("✅ Initialisation Firebase Admin SDK...");

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });

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

// Exporte une instance unique de Firestore avec initialisation paresseuse
export const db: { get: () => Firestore } = {
  get: getDb,
};
