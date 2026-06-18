import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    let credential;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT.includes('YourPrivateKeyHere')) {
            // Using a single JSON string env var if available
            credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
        } else if (process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_PRIVATE_KEY.includes('YourPrivateKeyHere')) {
            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Handle private key formatting (can come as JSON string, with literal \n, or raw)
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$|^'|'$/g, '').replace(/\\n/g, '\n')
            });
        } else {
            // Fallback to application default credentials (works well on GCP/Firebase hosting)
            credential = admin.credential.applicationDefault();
        }

        admin.initializeApp({
            credential,
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

const auth = admin.auth();
const db = admin.firestore();

export { admin, auth, db };
