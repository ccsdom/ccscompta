import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
    return applicationDefault();
  }

  const requireFromFirebaseTools = createRequire(path.join(toolsRoot, 'package.json'));
  const auth = requireFromFirebaseTools('./lib/auth.js');
  const defaultCredentials = requireFromFirebaseTools('./lib/defaultCredentials.js');
  const account = auth.getProjectDefaultAccount(process.cwd()) || auth.getGlobalDefaultAccount();

  if (!account) {
    return applicationDefault();
  }

  const credentialPath = await defaultCredentials.getCredentialPathAsync(account);
  if (!credentialPath) {
    return applicationDefault();
  }

  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
  return applicationDefault();
}

async function main() {
  const credential = await credentialFromFirebaseCliAuth();
  
  if (!getApps().length) {
    initializeApp({
      credential,
      projectId: 'ccs-compta',
    });
  }

  // Connect to firestore emulator if active in env
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

  const db = getFirestore();
  
  console.log("Checking clients...");
  const clientsSnap = await db.collection('clients').get();
  clientsSnap.forEach(doc => {
     console.log(`Client: ${doc.id} -> name: ${doc.data().name}, role: ${doc.data().role}, cabinetId: ${doc.data().cabinetId}`);
  });

  console.log("\nChecking cabinets...");
  const cabinetsSnap = await db.collection('cabinets').get();
  cabinetsSnap.forEach(doc => {
     console.log(`Cabinet: ${doc.id} -> name: ${doc.data().name}, primaryColor: ${doc.data().primaryColor}`);
  });
}

main().catch(console.error);
