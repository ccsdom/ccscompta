'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles and creating users.
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });

// Initialize the Firebase Admin SDK.
initializeApp();

/**
 * Function to set current authenticated user as admin.
 * This is a Callable Function.
 */
export const setAdminRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté pour effectuer cette action.');
  }

  const uid = request.auth.uid;
  const db = getFirestore();

  try {
    await getAuth().setCustomUserClaims(uid, { role: 'admin' });
    const userDocRef = db.collection('clients').doc(uid);
    await userDocRef.update({ role: 'admin' });

    logger.info(`Successfully set user ${uid} as admin`);
    return {
      success: true,
      message: "Rôle admin défini avec succès. Veuillez vous déconnecter et vous reconnecter.",
    };
  } catch (error: any) {
    logger.error('Error setting admin role:', error);
    throw new HttpsError('internal', "Une erreur est survenue lors de l'assignation du rôle admin.", error.message);
  }
});


/**
 * Function to create a new user with a specific role.
 * This is now an onRequest function to handle CORS explicitly.
 */
export const createUserWithRole = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    // Manually handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // 1. Verify admin from the ID token sent in the Authorization header
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        res.status(401).send({ error: { message: 'Jeton d\'authentification manquant.', status: 'UNAUTHENTICATED' } });
        return;
    }
    
    const auth = getAuth();
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        if (decodedToken.role !== 'admin') {
             res.status(403).send({ error: { message: 'Seul un administrateur peut effectuer cette action.', status: 'PERMISSION_DENIED' } });
             return;
        }
    } catch(error) {
        logger.error('Token verification failed', error);
        res.status(401).send({ error: { message: 'Jeton d\'authentification invalide.', status: 'UNAUTHENTICATED' } });
        return;
    }

    // 2. Get payload from request body.
    const { email, password, ...profileData } = req.body.data;
    if (!email) {
       res.status(400).send({ error: { message: 'Email requis pour la création.', status: 'INVALID_ARGUMENT' } });
       return;
    }

    const db = getFirestore();

    try {
        // 3. Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password: password || 'password', // Default password if not provided
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
        res.status(200).send({ data: { success: true, uid, message: 'Utilisateur créé avec succès.' } });
    } catch (error: any) {
        logger.error('Error creating new user:', error);
        let status = 500;
        let code = 'INTERNAL';
        let message = "Une erreur est survenue lors de la création de l'utilisateur.";

        if (error.code === 'auth/email-already-exists') {
            status = 409;
            code = 'ALREADY_EXISTS';
            message = "Un compte avec cette adresse email existe déjà.";
        }
        if (error.code === 'auth/invalid-password') {
            status = 400;
            code = 'INVALID_ARGUMENT';
            message = "Le mot de passe doit comporter au moins 6 caractères.";
        }

        res.status(status).send({ error: { message, status: code }});
    }
  });
});
