import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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
    console.warn('firebase-tools global introuvable. On tente applicationDefault().');
    return applicationDefault();
  }

  const requireFromFirebaseTools = createRequire(path.join(toolsRoot, 'package.json'));
  const auth = requireFromFirebaseTools('./lib/auth.js');
  const defaultCredentials = requireFromFirebaseTools('./lib/defaultCredentials.js');
  const account = auth.getProjectDefaultAccount(process.cwd()) || auth.getGlobalDefaultAccount();

  if (!account) {
    console.warn('Aucun compte Firebase CLI connecte. Lance firebase login.');
    return applicationDefault();
  }

  const credentialPath = await defaultCredentials.getCredentialPathAsync(account);
  if (!credentialPath) {
    return applicationDefault();
  }

  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
  console.log(`Credentials: Firebase CLI (${account.user.email})`);
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

  const auth = getAuth();
  const uid = 'CmupX1akioRPgRvOfw9nG1UJCWu2';
  
  console.log(`Setting custom claims for uid ${uid} to cabinet-vgpdc1wyw...`);
  
  try {
    await auth.setCustomUserClaims(uid, {
      role: 'accountant',
      cabinetId: 'cabinet-vgpdc1wyw'
    });
    console.log(`✅ Custom claims successfully updated for cabinet-vgpdc1wyw`);
  } catch (error) {
    console.error(`❌ Error setting custom claims:`, error);
  }
}

main().catch(console.error);
