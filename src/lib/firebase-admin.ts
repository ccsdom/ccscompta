
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let firestoreDb: Firestore | undefined;

function initializeAdminApp() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return;
  }

  // Vérification des variables d'environnement
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Variables d'environnement manquantes pour Firebase Admin");
    console.error("FIREBASE_PROJECT_ID:", !!projectId);
    console.error("FIREBASE_CLIENT_EMAIL:", !!clientEmail);
    console.error("FIREBASE_PRIVATE_KEY:", !!privateKey);
    
    throw new Error(
      "Impossible d'initialiser le SDK Admin de Firebase. Variables d'environnement manquantes."
    );
  }

  try {
    // Format correct de la private key
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    console.info("✅ Initialisation Firebase Admin SDK avec variables individuelles...");

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
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

// Exporte une instance unique de Firestore avec initialisation paresseuse
export const db: { get: () => Firestore } = {
  get: getDb,
};

// Export pour une utilisation directe si nécessaire
export { getDb as getFirestoreAdmin };
