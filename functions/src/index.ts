
'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * This file contains the backend logic for assigning user roles.
 */

import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {onCall, HttpsError, onRequest} from 'firebase-functions/v2/https';
import * as cors from 'cors';

const corsHandler = cors({origin: true});


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
export const setAdminRole = onRequest((request, response) => {
    corsHandler(request, response, async () => {
        if (request.method !== 'POST') {
          response.status(405).send('Method Not Allowed');
          return;
        }

        if (!request.headers.authorization || !request.headers.authorization.startsWith('Bearer ')) {
            response.status(401).send('Unauthorized');
            return;
        }

        const idToken = request.headers.authorization.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(idToken);
        } catch(error) {
            response.status(401).send('Unauthorized');
            return;
        }
        
        const uid = decodedToken.uid;
        const db = getFirestore();

        try {
            await getAuth().setCustomUserClaims(uid, {role: 'admin'});
            const userDocRef = db.collection('clients').doc(uid);
            await userDocRef.update({role: 'admin'});

            console.log(`Successfully set user ${uid} as an admin.`);
            response.status(200).send({ data: {
                success: true,
                message: "Rôle admin défini avec succès. Veuillez vous déconnecter et vous reconnecter.",
            }});

        } catch (error) {
            console.error('Error setting admin role:', error);
            response.status(500).send({ error: { message: "Une erreur est survenue lors de l'assignation du rôle admin." }});
        }
    });
});


export const createUserWithRole = onRequest(async (request, response) => {
    corsHandler(request, response, async () => {
        if (request.method !== 'POST') {
          response.status(405).send('Method Not Allowed');
          return;
        }
        
        if (!request.headers.authorization || !request.headers.authorization.startsWith('Bearer ')) {
            response.status(401).send('Unauthorized');
            return;
        }

        const idToken = request.headers.authorization.split('Bearer ')[1];
        try {
            const decodedToken = await getAuth().verifyIdToken(idToken);
            if (decodedToken.role !== 'admin') {
                response.status(403).send('Permission Denied');
                return;
            }
        } catch(error) {
            response.status(401).send('Unauthorized');
            return;
        }

        const { email, password, ...profileData } = request.body.data;
        
        if (!email || !password) {
            response.status(400).send({ error: 'Email and password are required.' });
            return;
        }

        const db = getFirestore();
        const auth = getAuth();
        
        try {
            const userRecord = await auth.createUser({
                email,
                password,
                emailVerified: true,
                disabled: false,
                displayName: profileData.name,
            });

            const uid = userRecord.uid;
            const role = profileData.role || 'client';
            
            await auth.setCustomUserClaims(uid, { role });
            
            const userDocRef = db.collection('clients').doc(uid);
            const newUserProfile = {
                ...profileData,
                newDocuments: 0,
                lastActivity: new Date().toISOString(),
                status: 'onboarding',
            };
            await userDocRef.set(newUserProfile);
            
            response.status(200).send({ data: { success: true, uid: userRecord.uid, message: "Utilisateur créé avec succès." } });

        } catch(error: any) {
            console.error('Error creating new user:', error);
            let message = "Une erreur est survenue lors de la création de l'utilisateur.";
            if (error.code === 'auth/email-already-exists') {
                message = "Un compte avec cette adresse email existe déjà."
            }
            response.status(500).send({ error: { message } });
        }
    });
});
