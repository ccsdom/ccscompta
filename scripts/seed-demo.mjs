#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

async function resolveCredential() {
  const serviceAccount = parseServiceAccountEnv();
  if (serviceAccount) return cert(serviceAccount);
  
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log("Using Emulator credentials");
    return applicationDefault(); // Emulator doesn't need strict credentials
  }

  try {
    return await credentialFromFirebaseCliAuth();
  } catch(e) {
    return applicationDefault();
  }
}

async function main() {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "demo-ccs-compta";

  if (!getApps().length) {
    initializeApp({
      projectId,
    });
  }

  const db = getFirestore();
  const auth = getAuth();

  console.log("🌱 Début du Seeding de la Démo Magique...");

  // 1. Créer le Cabinet
  const cabinetRef = db.collection('cabinets').doc('demo-cabinet');
  await cabinetRef.set({
    name: 'Cabinet Vision SaaS',
    createdAt: FieldValue.serverTimestamp(),
    branding: {
        theme: 'modern',
        primaryColor: '#10b981'
    }
  });
  console.log("✅ Cabinet 'Cabinet Vision SaaS' créé.");

  // 2. Créer le Client
  const clientUid = 'demo-client-user';
  try {
    await auth.getUser(clientUid);
    console.log("✅ Utilisateur Auth existant.");
  } catch (e) {
    await auth.createUser({
        uid: clientUid,
        email: 'demo@vision-saas.com',
        password: 'Password123!',
        displayName: 'TechCorp Zero-Touch'
    });
    console.log("✅ Utilisateur Auth 'TechCorp' créé (demo@vision-saas.com / Password123!).");
  }

  // Set Custom Claims for security rules
  await auth.setCustomUserClaims(clientUid, { role: 'client', cabinetId: 'demo-cabinet' });

  // Create Client Profile in Firestore
  const clientRef = db.collection('clients').doc(clientUid);
  await clientRef.set({
    name: 'TechCorp Zero-Touch',
    email: 'demo@vision-saas.com',
    cabinetId: 'demo-cabinet',
    role: 'client',
    siret: '12345678900012',
    address: '10 Rue de la Paix, 75000 Paris',
    createdAt: FieldValue.serverTimestamp()
  });
  console.log("✅ Profil Firestore Client créé.");

  // 3. Fake Invoices
  console.log("📄 Création de 5 factures...");
  const invoices = [
    { name: 'Facture AWS - Mai', amount: 154.20, date: '2026-05-10', vendor: 'Amazon Web Services' },
    { name: 'Abonnement GitHub', amount: 48.00, date: '2026-05-12', vendor: 'GitHub Inc.' },
    { name: 'Achat Matériel Apple', amount: 2499.00, date: '2026-05-15', vendor: 'Apple Store' },
    { name: 'Note de Frais Déjeuner', amount: 35.50, date: '2026-05-16', vendor: 'Bistro Parisien' },
    { name: 'Facture Free Mobile', amount: 19.99, date: '2026-05-20', vendor: 'Free Mobile' },
  ];

  const batch = db.batch();
  for (const inv of invoices) {
      const docRef = db.collection('documents').doc();
      batch.set(docRef, {
          clientId: clientUid,
          name: inv.name,
          type: 'invoice',
          status: 'pending',
          uploadDate: new Date().toISOString(),
          storagePath: 'fake/path',
          extractedData: {
              vendorNames: [inv.vendor],
              amounts: [inv.amount],
              dates: [inv.date],
              category: 'Achats',
          }
      });
  }

  // 4. Fake Bank Statements with Transactions
  console.log("🏦 Création du relevé bancaire avec transactions...");
  const bankDocRef = db.collection('documents').doc();
  batch.set(bankDocRef, {
      clientId: clientUid,
      name: 'Relevé Qonto Mai 2026',
      type: 'bank statement',
      status: 'approved',
      uploadDate: new Date().toISOString(),
      storagePath: 'fake/path',
      extractedData: {
          transactions: [
              { date: '2026-05-10', amount: -154.20, description: 'PRLV SEPA AMAZON WEB SERVICES', isAnomaly: false },
              { date: '2026-05-12', amount: -48.00, description: 'CB GITHUB INC', isAnomaly: false },
              { date: '2026-05-15', amount: -2499.00, description: 'CB APPLE STORE PARIS', isAnomaly: false },
              { date: '2026-05-16', amount: -35.50, description: 'CB BISTRO PARISIEN', isAnomaly: false },
              { date: '2026-05-20', amount: -19.99, description: 'PRLV SEPA FREE MOBILE', isAnomaly: false },
              // Anomaly: Transaction with no matching invoice
              { date: '2026-05-22', amount: -120.00, description: 'CB RESTAURANT LE GOURMAND', isAnomaly: true },
          ]
      }
  });

  await batch.commit();
  console.log("✅ Factures et Relevé bancaire injectés.");

  console.log("\n🎉 Seeding terminé avec succès !");
  console.log("Vous pouvez maintenant vous connecter avec :");
  console.log("Email: demo@vision-saas.com");
  console.log("Mot de passe: Password123!");
}

main().catch((error) => {
  console.error("Erreur lors du seeding:", error);
  process.exitCode = 1;
});
