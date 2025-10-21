
'use server';

// This file is being deprecated for most of its functions.
// Data fetching logic is moving to client-side hooks (useCollection, useDoc).
// Mutations will be handled by client-side Firebase SDK calls directly in components.
// The 'sendDocumentToCegid' function is an exception and will remain as a server action
// because it interacts with an external service (Cegid).

import type { Bilan } from '@/lib/types';
import { createSupplier, findSupplier } from '@/services/cegid';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';


async function getDocumentById(docId: string): Promise<any | null> {
    try {
        const docRef = doc(db, 'documents', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch(e) {
         console.error(`[Firestore] Error fetching document ${docId}:`, e);
         return null;
    }
}

async function updateDocumentServer(id: string, updates: any): Promise<void> {
    try {
        const docRef = doc(db, 'documents', id);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error(`[Firestore] Failed to update document ${id}:`, error);
    }
}


const addAuditEvent = (trail: any[], action: string, user: string = 'Système'): any[] => {
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
        await updateDocumentServer(docId, { auditTrail: trail });

        const existingSupplier = await findSupplier(vendorName);
        
        if (!existingSupplier) {
            trail = addAuditEvent(trail, `Fournisseur "${vendorName}" non trouvé dans Cegid. Tentative de création...`);
            await updateDocumentServer(docId, { auditTrail: trail });

            const newSupplier = await createSupplier({ name: vendorName, email: '' });
            trail = addAuditEvent(trail, `Fournisseur "${newSupplier.name}" créé avec succès dans Cegid.`);
            await updateDocumentServer(docId, { auditTrail: trail });
        } else {
             trail = addAuditEvent(trail, `Fournisseur "${vendorName}" trouvé dans Cegid.`);
             await updateDocumentServer(docId, { auditTrail: trail });
        }

        trail = addAuditEvent(trail, "Écriture comptable envoyée avec succès à Cegid.");
        await updateDocumentServer(docId, { status: "approved", auditTrail: trail });

        return { success: true };

    } catch (error) {
        console.error("Erreur lors de l'envoi à Cegid:", error);
        let errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
        let doc = await getDocumentById(docId);
        if (doc) {
             const trail = addAuditEvent(doc.auditTrail, `Échec de l'envoi à Cegid: ${errorMessage}`);
             await updateDocumentServer(docId, { auditTrail: trail });
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
