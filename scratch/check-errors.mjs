import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
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
  // Production connection using CLI credentials
  const credential = await credentialFromFirebaseCliAuth();
  initializeApp({
    projectId: 'ccs-compta',
    credential
  });

  const db = getFirestore();
  const snapshot = await db.collection('documents')
    .where('status', '==', 'error')
    .limit(5)
    .get();

  if (snapshot.empty) {
    console.log("No documents in 'error' state found.");
    return;
  }

  console.log(`Found ${snapshot.size} documents in error state:`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`\nDocument ID: ${doc.id}`);
    console.log(`Name: ${data.name}`);
    console.log(`Upload Date: ${data.uploadDate}`);
    console.log(`Audit Trail:`, JSON.stringify(data.auditTrail, null, 2));
  });
}

main().catch(console.error);
