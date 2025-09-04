import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

let adminApp: App;

if (getApps().length === 0) {
  const base64Config = process.env.FIREBASE_ADMIN_SDK_CONFIG_BASE64;

  if (!base64Config) {
    throw new Error('La variable d\'environnement FIREBASE_ADMIN_SDK_CONFIG_BASE64 n\'est pas définie. Veuillez encoder votre fichier JSON de service account en Base64.');
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

} else {
  adminApp = getApps()[0];
}

export const db = getAdminFirestore(adminApp);
