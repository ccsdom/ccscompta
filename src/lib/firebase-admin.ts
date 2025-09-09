import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  // When deployed to App Hosting, the SDK will automatically detect the project
  // credentials and initialize correctly without any explicit config.
  app = initializeApp();
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { auth, db };
