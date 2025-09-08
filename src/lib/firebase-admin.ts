
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App;
let auth: Auth;
let db: Firestore;

try {
    const apps = getApps();
    if (apps.length > 0) {
        adminApp = apps[0];
    } else {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            throw new Error("Les informations d'identification Firebase Admin ne sont pas définies dans les variables d'environnement.");
        }
        
        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }

    auth = getAuth(adminApp);
    db = getFirestore(adminApp);

} catch (error) {
    console.error("Erreur d'initialisation de Firebase Admin:", error);
    // Pour éviter de bloquer l'application, nous n'allons pas lancer d'erreur ici,
    // mais les fonctions qui dépendent de db/auth échoueront avec des logs plus clairs.
}

// @ts-ignore
export { auth, db };
