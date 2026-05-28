
'use client';

import { firebaseConfig, hasExplicitFirebaseConfig, hasResolvedFirebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

export function initializeFirebase() {
  if (!getApps().length) {
    if (!hasResolvedFirebaseConfig()) {
      throw new Error(
        '[Firebase] Configuration incomplete. Define NEXT_PUBLIC_FIREBASE_* variables or provide a valid embedded fallback config.'
      );
    }

    if (!hasExplicitFirebaseConfig()) {
      console.warn(
        '[Firebase] NEXT_PUBLIC_FIREBASE_* variables are missing. Using embedded public fallback config.'
      );
    }

    const firebaseApp = initializeApp(firebaseConfig);

    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    functions: getFunctions(firebaseApp, 'europe-west9')
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

// Client-side db instance for direct use in client components if needed
const { firestore: db, auth, storage, functions } = initializeFirebase();
export { db, auth, storage, functions };
