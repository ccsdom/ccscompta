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

const nextPublicFirebaseConfig = {
  apiKey: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
} satisfies Record<FirebaseConfigKey, string | undefined>;

const legacyFirebaseConfig = {
  apiKey: normalizeEnvValue(process.env.FIREBASE_API_KEY),
  authDomain: normalizeEnvValue(process.env.FIREBASE_AUTH_DOMAIN),
  projectId: normalizeEnvValue(process.env.FIREBASE_PROJECT_ID),
  storageBucket: normalizeEnvValue(process.env.FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalizeEnvValue(process.env.FIREBASE_MESSAGING_SENDER_ID),
  appId: normalizeEnvValue(process.env.FIREBASE_APP_ID),
} satisfies Record<FirebaseConfigKey, string | undefined>;

export const firebaseConfig = {
  apiKey: nextPublicFirebaseConfig.apiKey ?? legacyFirebaseConfig.apiKey ?? '',
  authDomain: nextPublicFirebaseConfig.authDomain ?? legacyFirebaseConfig.authDomain ?? '',
  projectId: nextPublicFirebaseConfig.projectId ?? legacyFirebaseConfig.projectId ?? '',
  storageBucket: nextPublicFirebaseConfig.storageBucket ?? legacyFirebaseConfig.storageBucket ?? '',
  messagingSenderId: nextPublicFirebaseConfig.messagingSenderId ?? legacyFirebaseConfig.messagingSenderId ?? '',
  appId: nextPublicFirebaseConfig.appId ?? legacyFirebaseConfig.appId ?? '',
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
  return requiredFirebaseConfigKeys.every(
    (key) => Boolean(nextPublicFirebaseConfig[key] || legacyFirebaseConfig[key])
  );
}

export function isUsingLegacyFirebaseConfigOnly() {
  const hasNextPublic = requiredFirebaseConfigKeys.every((key) => Boolean(nextPublicFirebaseConfig[key]));
  const hasLegacy = requiredFirebaseConfigKeys.every((key) => Boolean(legacyFirebaseConfig[key]));
  return !hasNextPublic && hasLegacy;
}

// Exporter le nom du bucket pour une utilisation centralisee
export const STORAGE_BUCKET = firebaseConfig.storageBucket;
