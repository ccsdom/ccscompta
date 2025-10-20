'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles, creating users and processing documents.
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { getStorage } from 'firebase-admin/storage';

// Genkit/AI imports - these will be dynamically available in the cloud function environment
declare function recognizeDocumentType(input: { documentDataUri: string }): Promise<{ documentType: string; confidence: number; }>;
declare function extractData(input: { documentDataUri: string; documentType: string; clientId: string; }): Promise<any>;


// Initialize the Firebase Admin SDK.
initializeApp();
const db = getFirestore();

/**
 * Function to set current authenticated user as admin.
 * This is a Callable Function.
 */
export const setAdminRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté pour effectuer cette action.');
  }

  const uid = request.auth.uid;

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
    // 1. Verify admin from the ID token
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Jeton d\'authentification manquant.');
    }
    const callingUserRole = request.auth.token.role;
    if (callingUserRole !== 'admin' && callingUserRole !== 'accountant' && callingUserRole !== 'secretary') {
        throw new HttpsError('permission-denied', 'Action non autorisée.');
    }
    
    // 2. Get payload from request body.
    const { email, password, ...profileData } = request.data;
    if (!email) {
       throw new HttpsError('invalid-argument', 'Email requis pour la création.');
    }

    const auth = getAuth();
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


/**
 * Triggered when a new document is created. This function runs the AI processing.
 */
export const processDocument = onDocumentCreated("documents/{docId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.log("No data associated with the event");
        return;
    }
    const docData = snapshot.data();
    const docId = event.params.docId;

    logger.log(`Processing document: ${docId}`);

    const docRef = db.collection('documents').doc(docId);

    try {
        await docRef.update({ 
            status: 'processing',
            auditTrail: db.FieldValue.arrayUnion({ action: 'Traitement IA initié', date: Timestamp.now().toDate().toISOString(), user: 'Système' })
        });
        
        // Directly download the file from Storage using the Admin SDK
        const bucket = getStorage().bucket();
        const file = bucket.file(docData.storagePath);
        
        const [fileBuffer, metadata] = await Promise.all([
          file.download(),
          file.getMetadata()
        ]);
        
        const base64 = fileBuffer[0].toString('base64');
        const mimeType = metadata[0].contentType || 'application/octet-stream';
        const dataUrl = `data:${mimeType};base64,${base64}`;

        const recognition = await recognizeDocumentType({ documentDataUri: dataUrl });
        await docRef.update({ 
            auditTrail: db.FieldValue.arrayUnion({ action: `Type reconnu: ${recognition.documentType}`, date: Timestamp.now().toDate().toISOString(), user: 'Système' })
        });
        
        const extracted = await extractData({ documentDataUri: dataUrl, documentType: recognition.documentType, clientId: docData.clientId });
        
        const finalUpdates = {
            status: 'reviewing',
            extractedData: extracted,
            type: recognition.documentType,
            confidence: recognition.confidence,
            auditTrail: db.FieldValue.arrayUnion({ action: 'Données extraites par IA', date: Timestamp.now().toDate().toISOString(), user: 'Système' })
        };

        await docRef.update(finalUpdates);

        logger.log(`Document ${docId} processed successfully.`);

    } catch (error) {
        logger.error(`Error processing document ${docId}:`, error);
        await docRef.update({ 
            status: 'error',
            auditTrail: db.FieldValue.arrayUnion({ action: `Erreur de traitement IA: ${error instanceof Error ? error.message : 'Inconnue'}`, date: Timestamp.now().toDate().toISOString(), user: 'Système' })
        });
    }
});
