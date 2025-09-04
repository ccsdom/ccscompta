import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let firestoreDb: Firestore | undefined;

function initializeAdminApp() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return;
  }

  const base64Config = process.env.FIREBASE_ADMIN_SDK_CONFIG_BASE64;

  if (!base64Config) {
    throw new Error('La variable d\'environnement FIREBASE_ADMIN_SDK_CONFIG_BASE64 n\'est pas définie.');
  }

  try {
    const serviceAccountJson = Buffer.from(base64Config, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
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
        firestoreDb = getAdminFirestore(adminApp);
    }
    if (!firestoreDb) {
        throw new Error("L'initialisation de Firestore a échoué.");
    }
    return firestoreDb;
}

// Exporte une propriété 'db' qui utilise un getter pour l'initialisation paresseuse.
export const db = {
    get: getDb
};
