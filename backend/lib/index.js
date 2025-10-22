'use server';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
const logger = __importStar(require("firebase-functions/logger"));
const storage_1 = require("firebase-admin/storage");
const v2_1 = require("firebase-functions/v2");
// Set the region for all functions in this file
(0, v2_1.setGlobalOptions)({ region: 'europe-west9' });
// Initialize the Firebase Admin SDK.
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
/**
 * Function to set current authenticated user as admin.
 * This is a Callable Function.
 */
exports.setAdminRole = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Vous devez être connecté pour effectuer cette action.');
    }
    const uid = request.auth.uid;
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
 * This is a Callable Function.
 */
exports.createUserWithRole = (0, https_1.onCall)(async (request) => {
    // 1. Verify admin from the ID token
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Jeton d\'authentification manquant.');
    }
    const callingUserRole = request.auth.token.role;
    if (callingUserRole !== 'admin' && callingUserRole !== 'accountant' && callingUserRole !== 'secretary') {
        throw new https_1.HttpsError('permission-denied', 'Action non autorisée.');
    }
    // 2. Get payload from request body.
    const _a = request.data, { email, password } = _a, profileData = __rest(_a, ["email", "password"]);
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'Email requis pour la création.');
    }
    const auth = (0, auth_1.getAuth)();
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
        await db.collection('clients').doc(uid).set(Object.assign(Object.assign({}, profileData), { email,
            role, newDocuments: 0, lastActivity: new Date().toISOString(), status: 'onboarding' }));
        logger.info(`Successfully created user ${uid} with role ${role}`);
        return { success: true, uid, message: 'Utilisateur créé avec succès.' };
    }
    catch (error) {
        logger.error('Error creating new user:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', "Un compte avec cette adresse email existe déjà.");
        }
        if (error.code === 'auth/invalid-password') {
            throw new https_1.HttpsError('invalid-argument', "Le mot de passe doit comporter au moins 6 caractères.");
        }
        throw new https_1.HttpsError('internal', "Une erreur est survenue lors de la création de l'utilisateur.", error.message);
    }
});
/**
 * Triggered when a new document is created. This function runs the AI processing.
 */
exports.processDocument = (0, firestore_2.onDocumentCreated)("documents/{docId}", async (event) => {
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
            auditTrail: firestore_1.FieldValue.arrayUnion({ action: 'Traitement IA initié', date: firestore_1.Timestamp.now().toDate().toISOString(), user: 'Système' })
        });
        // Generate a signed URL to read the file for AI processing
        const bucket = (0, storage_1.getStorage)().bucket();
        const file = bucket.file(docData.storagePath);
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
        const response = await fetch(signedUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch file with signed URL: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';
        const dataUrl = `data:${mimeType};base64,${base64}`;
        const recognition = await recognizeDocumentType({ documentDataUri: dataUrl });
        await docRef.update({
            auditTrail: firestore_1.FieldValue.arrayUnion({ action: `Type reconnu: ${recognition.documentType}`, date: firestore_1.Timestamp.now().toDate().toISOString(), user: 'Système' })
        });
        const extracted = await extractData({ documentDataUri: dataUrl, documentType: recognition.documentType, clientId: docData.clientId });
        const finalUpdates = {
            status: 'reviewing',
            extractedData: extracted,
            type: recognition.documentType,
            confidence: recognition.confidence,
            auditTrail: firestore_1.FieldValue.arrayUnion({ action: 'Données extraites par IA', date: firestore_1.Timestamp.now().toDate().toISOString(), user: 'Système' })
        };
        await docRef.update(finalUpdates);
        logger.log(`Document ${docId} processed successfully.`);
    }
    catch (error) {
        logger.error(`Error processing document ${docId}:`, error);
        await docRef.update({
            status: 'error',
            auditTrail: firestore_1.FieldValue.arrayUnion({ action: `Erreur de traitement IA: ${error instanceof Error ? error.message : 'Inconnue'}`, date: firestore_1.Timestamp.now().toDate().toISOString(), user: 'Système' })
        });
    }
});
//# sourceMappingURL=index.js.map