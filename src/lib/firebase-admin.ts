import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
    admin.initializeApp();
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
