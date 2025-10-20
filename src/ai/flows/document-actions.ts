
'use server';

import type { Document, AuditEvent, Bilan } from '@/lib/types';
import { createSupplier, findSupplier } from '@/services/cegid';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, query, where, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';


export async function getDocuments(clientId: string): Promise<Document[]> {
    console.log(`[Firestore] Fetching documents for client: ${clientId}`);
    try {
        const q = query(collection(db, 'documents'), where('clientId', '==', clientId));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
    } catch (error) {
        console.error(`Error fetching documents for client ${clientId}:`, error);
        return [];
    }
}

export async function getDocumentById(docId: string): Promise<Document | null> {
    console.log(`[Firestore] Fetching document by ID: ${docId}`);
    try {
        const docRef = doc(db, 'documents', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Document;
        }
        return null;
    } catch(e) {
         console.error(`[Firestore] Error fetching document ${docId}:`, e);
         return null;
    }
}

export async function addDocument(docData: Omit<Document, 'id'>): Promise<Document> {
    try {
        const docRef = await addDoc(collection(db, 'documents'), docData);
        console.log(`[Firestore] Added new document for client ${docData.clientId} with ID: ${docRef.id}`);
        const newDoc = await getDocumentById(docRef.id);
        if (!newDoc) {
            throw new Error('Could not retrieve newly created document');
        }
        return newDoc;
    } catch (error) {
        console.error(`[Firestore] Error adding document:`, error);
        // Re-throw the error to be handled by the caller
        throw error;
    }
}


export async function updateDocument({ id, updates }: {id: string, updates: Partial<Document> }): Promise<void> {
    console.log(`[Firestore] Updating document ${id}`);
    try {
        const docRef = doc(db, 'documents', id);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error(`[Firestore] Failed to update document ${id}:`, error);
    }
}

export async function deleteDocument(docId: string): Promise<void> {
    console.log(`[Firestore] Deleting document ${docId}`);
    try {
        await deleteDoc(doc(db, 'documents', docId));
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
        await updateDocument({ id: docId, updates: { status: "approved", auditTrail: trail } });

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
        const q = query(collection(db, 'bilans'), where('clientId', '==', clientId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bilan));
    } catch (error) {
        console.error(`Error fetching bilans for client ${clientId}:`, error);
        return [];
    }
}
