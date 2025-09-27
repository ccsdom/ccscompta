'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles and creating users.
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import cors from 'cors';

// Initialize the Firebase Admin SDK.
initializeApp();

// CORS middleware
const corsHandler = cors({ origin: true });

/**
 * Function to set current authenticated user as admin.
 */
export const setAdminRole = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // 1. Check authentication (Firebase Auth ID token must be passed in headers)
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Vous devez être connecté.' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await getAuth().verifyIdToken(idToken);

      const uid = decoded.uid;
      const db = getFirestore();

      // 2. Set admin claim
      await getAuth().setCustomUserClaims(uid, { role: 'admin' });

      // 3. Update Firestore
      await db.collection('clients').doc(uid).update({ role: 'admin' });

      logger.info(`Successfully set user ${uid} as admin`);
      res.json({
        success: true,
        message: "Rôle admin défini avec succès. Veuillez vous déconnecter et vous reconnecter.",
      });
    } catch (error: any) {
      logger.error('Error setting admin role:', error);
      res.status(500).json({
        error: "Une erreur est survenue lors de l'assignation du rôle admin.",
        details: error.message,
      });
    }
  });
});

/**
 * Function to create a new user with a specific role.
 */
export const createUserWithRole = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Méthode non autorisée' });
        return;
      }

      // 1. Verify admin
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await getAuth().verifyIdToken(idToken);

      if (decoded.role !== 'admin') {
        res.status(403).json({ error: 'Seul un administrateur peut effectuer cette action.' });
        return;
      }

      // 2. Get payload
      const { email, password = 'password', ...profileData } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email requis pour la création.' });
        return;
      }

      const auth = getAuth();
      const db = getFirestore();

      // 3. Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: true,
        disabled: false,
        displayName: profileData.name,
      });

      const uid = userRecord.uid;
      const role = profileData.role || 'client';

      // 4. Set custom claim
      await auth.setCustomUserClaims(uid, { role });

      // 5. Create Firestore document
      await db.collection('clients').doc(uid).set({
        ...profileData,
        email,
        role,
        newDocuments: 0,
        lastActivity: new Date().toISOString(),
        status: 'onboarding',
      });

      logger.info(`Successfully created user ${uid} with role ${role}`);
      res.json({ success: true, uid, message: 'Utilisateur créé avec succès.' });
    } catch (error: any) {
      logger.error('Error creating new user:', error);

      if (error.code === 'auth/email-already-exists') {
        res.status(400).json({ error: "Un compte avec cette adresse email existe déjà." });
        return;
      }
      if (error.code === 'auth/invalid-password') {
        res.status(400).json({ error: "Le mot de passe doit comporter au moins 6 caractères." });
        return;
      }

      res.status(500).json({
        error: "Une erreur est survenue lors de la création de l'utilisateur.",
        details: error.message,
      });
    }
  });
});