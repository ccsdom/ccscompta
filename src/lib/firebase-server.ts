
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Dans un environnement Google Cloud (comme celui-ci), appeler initializeApp()
// sans argument utilise automatiquement les "Application Default Credentials".
// C'est la méthode la plus simple et la plus fiable.
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export { db };
