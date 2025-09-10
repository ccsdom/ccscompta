
'use server';

import type { Document, AuditEvent, Bilan } from '@/lib/types';
import { MOCK_DOCUMENTS, MOCK_BILANS } from '@/data/mock-data';
import { createSupplier, findSupplier } from '@/services/cegid';

// --- Simulation de la base de données en mémoire ---
let documentsStore: Record<string, Document[]> = {};
// Initialiser avec les données mock
for (const clientId in MOCK_DOCUMENTS) {
    documentsStore[clientId] = MOCK_DOCUMENTS[clientId].map((doc, index) => ({
        ...doc,
        id: `${clientId}-doc-${index + 1}`
    }));
}

let bilansStore: Record<string, Bilan[]> = { ...MOCK_BILANS };
// --- Fin de la simulation ---


export async function getDocuments(clientId: string): Promise<Document[]> {
    console.log(`[SIMULATION] Fetching documents for client: ${clientId}`);
    return Promise.resolve(documentsStore[clientId] || []);
}

export async function getDocumentById(docId: string): Promise<Document | null> {
    for (const clientId in documentsStore) {
        const doc = documentsStore[clientId].find(d => d.id === docId);
        if (doc) {
            console.log(`[SIMULATION] Found document by ID: ${docId}`);
            return Promise.resolve(doc);
        }
    }
    console.log(`[SIMULATION] Document with ID ${docId} not found.`);
    return Promise.resolve(null);
}

export async function addDocument(docData: Omit<Document, 'id'>): Promise<Document | null> {
    const { clientId } = docData;
    if (!documentsStore[clientId]) {
        documentsStore[clientId] = [];
    }
    const newDoc: Document = {
        ...docData,
        id: `${clientId}-doc-${Date.now()}`
    };
    documentsStore[clientId].push(newDoc);
    console.log(`[SIMULATION] Added new document for client ${clientId}:`, newDoc.name);
    return Promise.resolve(newDoc);
}


export async function updateDocument({ id, updates }: {id: string, updates: Partial<Document> }): Promise<void> {
    for (const clientId in documentsStore) {
        const docIndex = documentsStore[clientId].findIndex(d => d.id === id);
        if (docIndex !== -1) {
            documentsStore[clientId][docIndex] = { ...documentsStore[clientId][docIndex], ...updates };
            console.log(`[SIMULATION] Updated document ${id} for client ${clientId}`);
            return Promise.resolve();
        }
    }
    console.log(`[SIMULATION] Failed to update document ${id}, not found.`);
    return Promise.resolve();
}

export async function deleteDocument(docId: string): Promise<void> {
    for (const clientId in documentsStore) {
        const initialLength = documentsStore[clientId].length;
        documentsStore[clientId] = documentsStore[clientId].filter(d => d.id !== docId);
        if (documentsStore[clientId].length < initialLength) {
            console.log(`[SIMULATION] Deleted document ${docId} for client ${clientId}`);
            return Promise.resolve();
        }
    }
     console.log(`[SIMULATION] Failed to delete document ${docId}, not found.`);
    return Promise.resolve();
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
    console.log(`[SIMULATION] Fetching bilans for client: ${clientId}`);
    return Promise.resolve(bilansStore[clientId] || []);
}
