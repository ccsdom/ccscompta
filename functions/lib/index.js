
"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDocument = exports.createUserWithRole = exports.setAdminRole = void 0;
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles, creating users and processing documents.
 */
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const firestore_2 = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const cors = require("cors");
const corsHandler = cors({ origin: true });
// Initialize the Firebase Admin SDK.
(0, app_1.initializeApp)();
/**
 * Function to set current authenticated user as admin.
 * This is a Callable Function.
 */
exports.setAdminRole = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Vous devez être connecté pour effectuer cette action.');
    }
    const uid = request.auth.uid;
    const db = (0, firestore_1.getFirestore)();
    try {
        await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role: 'admin' });
        const userDocRef = db.collection('clients').doc(uid);
        await userDocRef.update({ role: 'admin' });
        logger.info(`Successfully set user ${uid} as admin`);
        return {
            success: true,
            message: "Rôle admin défini avec succès. Veuillez vous déconnecter et vous reconnecter.",
        };
    }
    catch (error) {
        logger.error('Error setting admin role:', error);
        throw new https_1.HttpsError('internal', "Une erreur est survenue lors de l'assignation du rôle admin.", error.message);
    }
});
/**
 * Function to create a new user with a specific role.
 * This is an HTTP onRequest function with explicit CORS handling via middleware.
 */
exports.createUserWithRole = (0, https_1.onRequest)(async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).send({ error: { message: 'Method Not Allowed' } });
            return;
        }
        // 1. Verify admin from the ID token sent in the Authorization header
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).send({ error: { message: 'Jeton d\'authentification manquant.', status: 'UNAUTHENTICATED' } });
            return;
        }
        const auth = (0, auth_1.getAuth)();
        try {
            const decodedToken = await auth.verifyIdToken(idToken);
            if (decodedToken.role !== 'admin') {
                res.status(403).send({ error: { message: 'Seul un administrateur peut effectuer cette action.', status: 'PERMISSION_DENIED' } });
                return;
            }
        }
        catch (error) {
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
        const db = (0, firestore_1.getFirestore)();
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
        }
        catch (error) {
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
            res.status(status).send({ error: { message, status: code } });
        }
    });
});
/**
 * Triggered when a new document is created in Firestore.
 * This function processes the document using AI.
 */
exports.processDocument = (0, firestore_2.onDocumentCreated)("documents/{docId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.log("No data associated with the event");
        return;
    }
    const doc = snapshot.data();
    const docId = event.params.docId;
    const db = (0, firestore_1.getFirestore)();
    const docRef = db.collection('documents').doc(docId);
    try {
        await docRef.update({ status: 'processing', auditTrail: [...doc.auditTrail, { action: 'Traitement IA initié par le serveur', date: new Date().toISOString(), user: 'Système' }] });
        // Construct the full path for the storage object
        const bucket = `gs://${process.env.GCLOUD_PROJECT}.appspot.com`;
        const filePath = doc.storagePath;
        const gcsUri = `${bucket}/${filePath}`;
        // Convert to data URI for Genkit
        const dataUrl = `data:${doc.fileType || 'application/octet-stream'};base64,${gcsUri}`;
        const recognition = await recognizeDocumentType({ documentDataUri: dataUrl });
        await docRef.update({
            auditTrail: [...doc.auditTrail, { action: `Type reconnu: ${recognition.documentType} (Confiance: ${Math.round(recognition.confidence * 100)}%)`, date: new Date().toISOString(), user: 'Système' }]
        });
        const extracted = await extractData({
            documentDataUri: dataUrl,
            documentType: recognition.documentType,
            clientId: doc.clientId
        });
        const finalUpdates = {
            status: 'reviewing',
            type: recognition.documentType,
            confidence: recognition.confidence,
            extractedData: extracted,
            auditTrail: [...doc.auditTrail, { action: 'Traitement IA terminé, prêt pour examen', date: new Date().toISOString(), user: 'Système' }]
        };
        await docRef.update(finalUpdates);
        logger.info(`Document ${docId} processed successfully.`);
    }
    catch (error) {
        logger.error(`Error processing document ${docId}:`, error);
        await docRef.update({
            status: 'error',
            auditTrail: [...doc.auditTrail, { action: `Échec du traitement IA: ${error.message}`, date: new Date().toISOString(), user: 'Système' }]
        });
    }
});
//# sourceMappingURL=index.js.map
