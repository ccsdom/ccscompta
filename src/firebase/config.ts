type FirebaseConfigKey =
  | 'apiKey'
  | 'authDomain'
  | 'projectId'
  | 'storageBucket'
  | 'messagingSenderId'
  | 'appId';

function normalizeEnvValue(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

// Safe public fallback used when NEXT_PUBLIC_* variables are missing in deployment.
const embeddedFirebaseConfig = {
  apiKey: 'AIzaSyC1Wu-pJ12Ionb9dsjWmaGusuxGmh5LZB4',
  authDomain: 'ccs-compta.firebaseapp.com',
  projectId: 'ccs-compta',
  storageBucket: 'ccs-compta.firebasestorage.app',
  messagingSenderId: '641289397299',
  appId: '1:641289397299:web:160436367ad4dff3e6ef46',
} satisfies Record<FirebaseConfigKey, string>;

const envFirebaseConfig = {
  apiKey: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
} satisfies Record<FirebaseConfigKey, string | undefined>;

export const firebaseConfig = {
  apiKey: envFirebaseConfig.apiKey ?? embeddedFirebaseConfig.apiKey,
  authDomain: envFirebaseConfig.authDomain ?? embeddedFirebaseConfig.authDomain,
  projectId: envFirebaseConfig.projectId ?? embeddedFirebaseConfig.projectId,
  storageBucket: envFirebaseConfig.storageBucket ?? embeddedFirebaseConfig.storageBucket,
  messagingSenderId: envFirebaseConfig.messagingSenderId ?? embeddedFirebaseConfig.messagingSenderId,
  appId: envFirebaseConfig.appId ?? embeddedFirebaseConfig.appId,
} satisfies Record<FirebaseConfigKey, string>;

const requiredFirebaseConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const;

export function hasResolvedFirebaseConfig() {
  return requiredFirebaseConfigKeys.every((key) => Boolean(firebaseConfig[key]));
}

export function hasExplicitFirebaseConfig() {
  return requiredFirebaseConfigKeys.every((key) => Boolean(envFirebaseConfig[key]));
}

// Exporter le nom du bucket pour une utilisation centralisee
export const STORAGE_BUCKET = firebaseConfig.storageBucket;
