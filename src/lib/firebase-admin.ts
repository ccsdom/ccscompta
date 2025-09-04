import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let firestoreDb: Firestore | undefined;

function initializeAdminApp() {
  if (getApps().length > 0 && getApps().some(app => app?.name === '[DEFAULT]')) {
    adminApp = getApps().find(app => app?.name === '[DEFAULT]');
    if (adminApp) return;
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace \\n with \n to ensure the private key is parsed correctly
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase Admin SDK variables d'environnement manquantes.");
    console.error("FIREBASE_PROJECT_ID:", !!projectId);
    console.error("FIREBASE_CLIENT_EMAIL:", !!clientEmail);
    console.error("FIREBASE_PRIVATE_KEY:", !!privateKey);
    
    throw new Error(
      "Impossible d'initialiser le SDK Admin de Firebase. Variables d'environnement manquantes."
    );
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
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