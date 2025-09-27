
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
 * 2. Sets a custom user claim `role: 'admin'`.
 * 3. Updates the user's profile in the 'clients' Firestore collection with `role: 'admin'`.
 * 4. Returns a success message.
 *
 * This function should ideally be protected to only allow the first user or a specific set of users
 * to call it, but for initial setup, it allows any authenticated user to become an admin.
 */
export const setAdminRole = onCall({ cors: true }, async (request) => {
    // 1. Check if the user is authenticated.
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Vous devez être connecté pour effectuer cette action.');
    }
    const uid = request.auth.uid;
    const db = getFirestore();
    try {
        // 2. Set the custom claim 'admin' on the user's auth token.
        await getAuth().setCustomUserClaims(uid, { role: 'admin' });
        // 3. Update the user's document in Firestore to reflect the new role.
        const userDocRef = db.collection('clients').doc(uid);
        await userDocRef.update({ role: 'admin' });
        console.log(`Successfully set user ${uid} as an admin.`);
        return {
            success: true,
            message: "Rôle admin défini avec succès. Veuillez vous déconnecter et vous reconnecter.",
        };
    }
    catch (error) {
        console.error('Error setting admin role:', error);
        throw new HttpsError('internal', "Une erreur est survenue lors de l'assignation du rôle admin.", error);
    }
});

/**
 * An onCall Cloud Function to create a new user with a specific role.
 *
 * This function performs the following steps:
 * 1. Checks if the caller is an admin.
 * 2. Creates a new user in Firebase Authentication.
 * 3. Sets a custom user claim for the specified role.
 * 4. Creates a corresponding user profile document in Firestore.
 */
export const createUserWithRole = onCall({ cors: true }, async (request) => {
    // 1. Check if the caller is an admin
    if (request.auth?.token.role !== 'admin') {
         throw new HttpsError('permission-denied', 'Seul un administrateur peut créer des utilisateurs.');
    }

    const { email, password, ...profileData } = request.data;
    
    if (!email || !password) {
        throw new HttpsError('invalid-argument', 'Email et mot de passe sont requis.');
    }

    const db = getFirestore();
    const auth = getAuth();
    
    try {
        // 2. Create the user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            emailVerified: true, // Set to true for simplicity, can be false to require email verification
            disabled: false,
            displayName: profileData.name,
        });

        const uid = userRecord.uid;
        const role = profileData.role || 'client'; // Default to 'client' role
        
        // 3. Set the custom claim (role) for the new user
        await auth.setCustomUserClaims(uid, { role });
        
        // 4. Create the user profile in Firestore
        const userDocRef = db.collection('clients').doc(uid);
        const newUserProfile = {
            ...profileData,
            newDocuments: 0,
            lastActivity: new Date().toISOString(),
            status: 'onboarding',
        };
        await userDocRef.set(newUserProfile);
        
        console.log(`Successfully created user ${uid} with role ${role}.`);
        return { success: true, uid: userRecord.uid, message: "Utilisateur créé avec succès." };

    } catch(error: any) {
        console.error('Error creating new user:', error);
        let message = "Une erreur est survenue lors de la création de l'utilisateur.";
        if (error.code === 'auth/email-already-exists') {
            message = "Un compte avec cette adresse email existe déjà."
        }
        // Instead of throwing a generic error, throw a specific HttpsError
        throw new HttpsError('internal', message, error);
    }
});
