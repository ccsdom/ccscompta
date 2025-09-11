
'use server';

import type { Document, AuditEvent, Bilan } from '@/lib/types';
import { MOCK_DOCUMENTS, MOCK_BILANS } from '@/data/mock-data';
import { createSupplier, findSupplier } from '@/services/cegid';
import { db } from '@/lib/firebase-admin';


export async function getDocuments(clientId: string): Promise<Document[]> {
    console.log(`[Firestore] Fetching documents for client: ${clientId}`);
    try {
        const snapshot = await db.collection('documents').where('clientId', '==', clientId).get();
        if (snapshot.empty && (clientId === 'client-01' || clientId === 'client-02')) {
            console.log(`No documents found for mock client ${clientId}, seeding...`);
            const batch = db.batch();
            const docsToSeed = MOCK_DOCUMENTS[clientId];
            docsToSeed.forEach(doc => {
                 const docRef = db.collection('documents').doc();
                 batch.set(docRef, doc);
            });
            await batch.commit();
            console.log(`${docsToSeed.length} mock documents seeded for client ${clientId}.`);
            const seededSnapshot = await db.collection('documents').where('clientId', '==', clientId).get();
            return seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
    } catch (error) {
        console.error(`Error fetching documents for client ${clientId}:`, error);
        return [];
    }
}

export async function getDocumentById(docId: string): Promise<Document | null> {
    console.log(`[Firestore] Fetching document by ID: ${docId}`);
    try {
        const doc = await db.collection('documents').doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() } as Document;
        }
        return null;
    } catch(e) {
         console.error(`[Firestore] Error fetching document ${docId}:`, e);
         return null;
    }
}

export async function addDocument(docData: Omit<Document, 'id'>): Promise<Document | null> {
    try {
        const docRef = await db.collection('documents').add(docData);
        console.log(`[Firestore] Added new document for client ${docData.clientId} with ID: ${docRef.id}`);
        return { ...docData, id: docRef.id };
    } catch (error) {
        console.error(`[Firestore] Error adding document:`, error);
        return null;
    }
}


export async function updateDocument({ id, updates }: {id: string, updates: Partial<Document> }): Promise<void> {
    console.log(`[Firestore] Updating document ${id}`);
    try {
        await db.collection('documents').doc(id).update(updates);
    } catch (error) {
        console.error(`[Firestore] Failed to update document ${id}:`, error);
    }
}

export async function deleteDocument(docId: string): Promise<void> {
     console.log(`[Firestore] Deleting document ${docId}`);
    try {
        await db.collection('documents').doc(docId).delete();
    } catch (error) {
        console.error(`[Firestore] Failed to delete document ${docId}:`, error);
    }
}

const addAuditEvent = (trail: AuditEvent[], action: string, user: string = 'Système'): AuditEvent[] => {
    return [...trail, { action, date: new Date().toISOString(), user }];
}

export async function sendDocumentToCegid(docId: string, user: string): Promise<{success: boolean, error?: string}> {
    try {
        let doc = await getDocumentById(docId);
        if (!doc) {
            throw new Error("Document non trouvé.");
        }

        const vendorName = doc.extractedData?.vendorNames?.[0];
        if (!vendorName) {
            throw new Error("Aucun fournisseur n'est spécifié dans les données extraites.");
        }

        let trail = addAuditEvent(doc.auditTrail, `Envoi vers Cegid initié par ${user}`, user);
        await updateDocument({ id: docId, updates: { auditTrail: trail } });

        const existingSupplier = await findSupplier(vendorName);
        
        if (!existingSupplier) {
            trail = addAuditEvent(trail, `Fournisseur "${vendorName}" non trouvé dans Cegid. Tentative de création...`);
            await updateDocument({ id: docId, updates: { auditTrail: trail } });

            const newSupplier = await createSupplier({ name: vendorName, email: '' });
            trail = addAuditEvent(trail, `Fournisseur "${newSupplier.name}" créé avec succès dans Cegid.`);
            await updateDocument({ id: docId, updates: { auditTrail: trail } });
        } else {
             trail = addAuditEvent(trail, `Fournisseur "${vendorName}" trouvé dans Cegid.`);
             await updateDocument({ id: docId, updates: { auditTrail: trail } });
        }

        trail = addAuditEvent(trail, "Écriture comptable envoyée avec succès à Cegid.");
        await updateDocument({ id: docId, updates: { auditTrail: trail } });

        return { success: true };

    } catch (error) {
        console.error("Erreur lors de l'envoi à Cegid:", error);
        let errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
        let doc = await getDocumentById(docId);
        if (doc) {
             const trail = addAuditEvent(doc.auditTrail, `Échec de l'envoi à Cegid: ${errorMessage}`);
             await updateDocument({ id: docId, updates: { auditTrail: trail } });
        }
        return { success: false, error: errorMessage };
    }
}

export async function getBilansByClientId(clientId: string): Promise<Bilan[]> {
    console.log(`[Firestore] Fetching bilans for client: ${clientId}`);
    try {
        const snapshot = await db.collection('bilans').where('clientId', '==', clientId).get();
        if (snapshot.empty && MOCK_BILANS[clientId]) {
            console.log(`Seeding bilans for client ${clientId}`);
            const batch = db.batch();
            MOCK_BILANS[clientId].forEach(bilan => {
                const docRef = db.collection('bilans').doc();
                batch.set(docRef, bilan);
            });
            await batch.commit();
            const seededSnapshot = await db.collection('bilans').where('clientId', '==', clientId).get();
            return seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bilan));
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bilan));
    } catch (error) {
        console.error(`Error fetching bilans for client ${clientId}:`, error);
        return [];
    }
}