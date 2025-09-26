
'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * This file contains the backend logic for assigning user roles.
 */

import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {onCall, HttpsError} from 'firebase-functions/v2/https';

// Initialize the Firebase Admin SDK.
initializeApp();

/**
 * An onCall Cloud Function that allows a user to grant themselves the 'admin' role.
 *
 * This function performs the following steps:
 * 1. Checks if the user calling the function is authenticated.
 * 2. Fetches the user's record using the Admin SDK.
 * 3. Sets a custom user claim `role: 'admin'`.
 * 4. Updates the user's profile in the 'clients' Firestore collection with `role: 'admin'`.
 * 5. Returns a success message.
 *
 * This function should ideally be protected to only allow the first user or a specific set of users
 * to call it, but for initial setup, it allows any authenticated user to become an admin.
 */
export const setAdminRole = onCall(async request => {
  // 1. Check if the user is authenticated.
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Vous devez être connecté pour effectuer cette action.'
    );
  }

  const uid = request.auth.uid;
  const db = getFirestore();

  try {
    // 2. Set the custom claim 'admin' on the user's auth token.
    await getAuth().setCustomUserClaims(uid, {role: 'admin'});

    // 3. Update the user's document in Firestore to reflect the new role.
    const userDocRef = db.collection('clients').doc(uid);
    await userDocRef.update({role: 'admin'});

    console.log(`Successfully set user ${uid} as an admin.`);
    return {
      success: true,
      message:
        "Rôle admin défini avec succès. Veuillez vous déconnecter et vous reconnecter.",
    };
  } catch (error) {
    console.error('Error setting admin role:', error);
    throw new HttpsError(
      'internal',
      "Une erreur est survenue lors de l'assignation du rôle admin.",
      error
    );
  }
});
