import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // The Project ID can be found in your Firebase project settings.
      // It's a unique identifier for your project.
      // projectId: 'VOTRE_PROJECT_ID', // You might need to set this explicitly in some environments
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
