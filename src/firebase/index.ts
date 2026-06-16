
'use client';

import { firebaseConfig, hasResolvedFirebaseConfig, isUsingLegacyFirebaseConfigOnly } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

export function initializeFirebase() {
  if (!getApps().length) {
    if (!hasResolvedFirebaseConfig()) {
      throw new Error(
        '[Firebase] Configuration incomplete. Define NEXT_PUBLIC_FIREBASE_* variables (preferred) or FIREBASE_* variables.'
      );
    }

    if (isUsingLegacyFirebaseConfigOnly()) {
      console.warn(
        '[Firebase] Using legacy FIREBASE_* variables. Migrate to NEXT_PUBLIC_FIREBASE_* to avoid deployment drift.'
      );
    }

    const firebaseApp = initializeApp(firebaseConfig);

    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (typeof window !== 'undefined') {
      // Pour le développement local, si NEXT_PUBLIC_RECAPTCHA_SITE_KEY n'est pas défini, 
      // on utilise une clé de test reCAPTCHA publique ou le mode debug.
      if (process.env.NODE_ENV === 'development') {
          (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      try {
          initializeAppCheck(firebaseApp, {
              provider: new ReCaptchaV3Provider(
                  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Dummy fallback key
              ),
              isTokenAutoRefreshEnabled: true
          });
      } catch (e) {
          console.warn('AppCheck non initialisé:', e);
      }
  }

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
