#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const VALID_ROLES = new Set(['admin', 'accountant', 'secretary', 'client']);

function parseArgs(argv) {
  const args = {
    apply: false,
    project: undefined,
    limit: undefined,
    uid: undefined,
    credentials: undefined,
    firebaseCliAuth: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--project') args.project = argv[++i];
    else if (arg === '--limit') args.limit = Number(argv[++i]);
    else if (arg === '--uid') args.uid = argv[++i];
    else if (arg === '--credentials') args.credentials = argv[++i];
    else if (arg === '--firebase-cli-auth') args.firebaseCliAuth = true;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Argument inconnu: ${arg}`);
    }
  }

  if (args.limit !== undefined && (!Number.isInteger(args.limit) || args.limit <= 0)) {
    throw new Error('--limit doit etre un entier positif.');
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run claims:backfill -- [--project ccs-compta] [--credentials ./service-account.json] [--firebase-cli-auth] [--limit 50] [--uid USER_ID] [--apply]

Par defaut, le script est en dry-run et ne modifie rien.

Variables d'environnement supportees:
  FIREBASE_SERVICE_ACCOUNT_KEY   JSON complet du compte de service
  FIREBASE_SERVICE_ACCOUNT_JSON  JSON complet du compte de service
  GOOGLE_APPLICATION_CREDENTIALS Chemin vers un fichier JSON de compte de service
  GOOGLE_CLOUD_PROJECT           Projet Firebase cible si --project absent
`);
}

function loadProjectFromFirebaserc() {
  if (!existsSync('.firebaserc')) return undefined;
  const firebaserc = JSON.parse(readFileSync('.firebaserc', 'utf8'));
  return firebaserc.projects?.default;
}

function parseServiceAccountEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return undefined;
  return JSON.parse(raw);
}

function findFirebaseToolsRoot() {
  const candidates = [];
  if (process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, 'npm', 'node_modules', 'firebase-tools'));
  }
  if (process.env.npm_config_prefix) {
    candidates.push(path.join(process.env.npm_config_prefix, 'node_modules', 'firebase-tools'));
  }

  return candidates.find((candidate) => existsSync(path.join(candidate, 'package.json')));
}

async function credentialFromFirebaseCliAuth() {
  const toolsRoot = findFirebaseToolsRoot();
  if (!toolsRoot) {
    throw new Error('firebase-tools global introuvable pour --firebase-cli-auth.');
  }

  const requireFromFirebaseTools = createRequire(path.join(toolsRoot, 'package.json'));
  const auth = requireFromFirebaseTools('./lib/auth.js');
  const defaultCredentials = requireFromFirebaseTools('./lib/defaultCredentials.js');
  const account = auth.getProjectDefaultAccount(process.cwd()) || auth.getGlobalDefaultAccount();

  if (!account) {
    throw new Error('Aucun compte Firebase CLI connecte. Lance firebase login avant --firebase-cli-auth.');
  }

  const credentialPath = await defaultCredentials.getCredentialPathAsync(account);
  if (!credentialPath) {
    throw new Error('Impossible de generer les credentials depuis Firebase CLI.');
  }

  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
  console.log(`Credentials: Firebase CLI (${account.user.email})`);
  return applicationDefault();
}

async function resolveCredential(args) {
  const serviceAccount = parseServiceAccountEnv();
  if (serviceAccount) {
    return cert(serviceAccount);
  }

  const credentialsPath = args.credentials || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && existsSync(credentialsPath)) {
    return cert(JSON.parse(readFileSync(credentialsPath, 'utf8')));
  }

  if (args.firebaseCliAuth) {
    return credentialFromFirebaseCliAuth();
  }

  return applicationDefault();
}

function normalizeRole(value) {
  if (typeof value !== 'string') return undefined;
  const role = value.trim();
  return VALID_ROLES.has(role) ? role : undefined;
}

function expectedClaimsForProfile(profile) {
  const role = normalizeRole(profile.role);
  if (!role) {
    return { skipReason: `role invalide ou manquant (${profile.role ?? 'absent'})` };
  }

  const claims = { role };
  if (role !== 'admin') {
    if (typeof profile.cabinetId !== 'string' || !profile.cabinetId.trim()) {
      return { skipReason: `cabinetId manquant pour le role ${role}` };
    }
    claims.cabinetId = profile.cabinetId.trim();
  }

  return { claims };
}

function mergeClaims(currentClaims, expectedClaims) {
  const nextClaims = { ...(currentClaims || {}), ...expectedClaims };
  if (expectedClaims.role === 'admin') {
    delete nextClaims.cabinetId;
  }
  return nextClaims;
}

function claimsEqual(a, b) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.project || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || loadProjectFromFirebaserc();

  if (!projectId) {
    throw new Error('Projet Firebase introuvable. Fournis --project ou configure .firebaserc.');
  }

  if (!getApps().length) {
    initializeApp({
      credential: await resolveCredential(args),
      projectId,
    });
  }

  const db = getFirestore();
  const auth = getAuth();
  let query = db.collection('clients').orderBy('__name__');

  if (args.uid) {
    query = db.collection('clients').where('__name__', '==', args.uid);
  } else if (args.limit) {
    query = query.limit(args.limit);
  }

  const stats = {
    scanned: 0,
    changed: 0,
    upToDate: 0,
    skipped: 0,
    authMissing: 0,
  };

  console.log(`Projet: ${projectId}`);
  console.log(`Mode: ${args.apply ? 'APPLY' : 'DRY-RUN'}`);

  const snap = await query.get();
  for (const doc of snap.docs) {
    stats.scanned += 1;
    const profile = doc.data();
    const { claims: expectedClaims, skipReason } = expectedClaimsForProfile(profile);

    if (skipReason || !expectedClaims) {
      stats.skipped += 1;
      console.log(`[SKIP] ${doc.id}: ${skipReason}`);
      continue;
    }

    let user;
    try {
      user = await auth.getUser(doc.id);
    } catch (error) {
      if (error?.code === 'auth/user-not-found') {
        stats.authMissing += 1;
        console.log(`[NO-AUTH] ${doc.id}: profil Firestore sans utilisateur Auth`);
        continue;
      }
      throw error;
    }

    const currentClaims = user.customClaims || {};
    const nextClaims = mergeClaims(currentClaims, expectedClaims);

    if (claimsEqual(currentClaims, nextClaims)) {
      stats.upToDate += 1;
      console.log(`[OK] ${doc.id}: role=${expectedClaims.role}${expectedClaims.cabinetId ? ` cabinetId=${expectedClaims.cabinetId}` : ''}`);
      continue;
    }

    stats.changed += 1;
    console.log(
      `[CHANGE] ${doc.id}: ${JSON.stringify(currentClaims)} -> ${JSON.stringify(nextClaims)}`
    );

    if (args.apply) {
      await auth.setCustomUserClaims(doc.id, nextClaims);
    }
  }

  console.log('\nResume');
  console.table(stats);

  if (!args.apply && stats.changed > 0) {
    console.log('Dry-run termine. Relance avec --apply pour appliquer les corrections.');
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Could not load the default credentials')) {
    console.error(
      'Credentials Admin SDK introuvables. Lance avec --credentials ./service-account.json ' +
      'ou configure GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_SERVICE_ACCOUNT_KEY.'
    );
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
