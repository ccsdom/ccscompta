'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles and creating users.
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

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
 * This is a Callable Function.
 */
export const createUserWithRole = onCall(async (request) => {
    // 1. Verify admin
    if (request.auth?.token.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Seul un administrateur peut effectuer cette action.');
    }

    // 2. Get payload from request.data
    const { email, password, ...profileData } = request.data;
    if (!email) {
      throw new HttpsError('invalid-argument', 'Email requis pour la création.');
    }

    const auth = getAuth();
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
        return { success: true, uid, message: 'Utilisateur créé avec succès.' };
    } catch (error: any) {
        logger.error('Error creating new user:', error);

        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', "Un compte avec cette adresse email existe déjà.");
        }
        if (error.code === 'auth/invalid-password') {
             throw new HttpsError('invalid-argument', "Le mot de passe doit comporter au moins 6 caractères.");
        }

        throw new HttpsError('internal', "Une erreur est survenue lors de la création de l'utilisateur.", error.message);
    }
});
