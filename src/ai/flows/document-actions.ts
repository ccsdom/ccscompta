
'use server';

import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import type { Document, AuditEvent, Bilan } from '@/lib/types';
import { MOCK_DOCUMENTS, MOCK_BILANS } from '@/data/mock-data';
import { Timestamp, type FirestoreDataConverter, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { createSupplier, findSupplier } from '@/services/cegid';


// Firestore data converter to ensure type safety with Firestore
const documentConverter: FirestoreDataConverter<Document> = {
    toFirestore: (docData: Omit<Document, 'id'>) => {
        // The dataUrl is for client-side use only and should not be persisted.
        const { dataUrl, ...rest } = docData;
        const dataToSave = { ...rest };
        if (typeof dataToSave.uploadDate === 'string') {
            dataToSave.uploadDate = Timestamp.fromDate(new Date(dataToSave.uploadDate));
        }
        return dataToSave;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Document => {
        const data = snapshot.data();
        const uploadDateTimestamp = data.uploadDate as Timestamp;
        return {
            id: snapshot.id,
            name: data.name,
            uploadDate: uploadDateTimestamp.toDate().toISOString(),
            status: data.status,
            storagePath: data.storagePath,
            type: data.type,
            confidence: data.confidence,
            extractedData: data.extractedData,
            auditTrail: data.auditTrail,
            comments: data.comments,
            clientId: data.clientId,
        };
    }
};


const getDocumentsCollectionRef = () => {
    if (!db) {
        throw new Error("Firestore Admin DB not available.");
    }
    return db.collection('documents').withConverter(documentConverter);
}

export async function getDocuments(clientId: string): Promise<Document[]> {
    if (!db) {
        console.error("Firestore Admin DB not available.");
        return MOCK_DOCUMENTS[clientId] || [];
    }

    const documentsCollection = getDocumentsCollectionRef();

    try {
        const q = documentsCollection.where("clientId", "==", clientId);
        let snapshot = await q.get();

        // If no documents are found for the client, seed with mock data for demo purposes
        if (snapshot.empty && MOCK_DOCUMENTS[clientId]) {
            console.log(`No documents found for client ${clientId}. Seeding with mock data...`);
            const batch = db.batch();
            for (const docData of MOCK_DOCUMENTS[clientId]) {
                 const docRef = documentsCollection.doc();
                 batch.set(docRef, docData);
            }
            await batch.commit();
            snapshot = await q.get(); // Re-fetch after seeding
        }

        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
    }
}

export async function getDocumentById(docId: string): Promise<Document | null> {
    const documentsCollection = getDocumentsCollectionRef();
    try {
        const docRef = documentsCollection.doc(docId);
        const snapshot = await docRef.get();
        if (snapshot.exists) {
            return snapshot.data() as Document;
        }
        return null;
    } catch (error) {
        console.error("Error fetching document by ID:", error);
        return null;
    }
}

// Zod schema for validating data when adding a new document
const DocumentSchemaForAdd = z.object({
    name: z.string(),
    uploadDate: z.string(),
    status: z.enum(['pending', 'processing', 'reviewing', 'approved', 'error']),
    dataUrl: z.string().optional(), // dataUrl is optional and client-side only
    storagePath: z.string(),
    type: z.string().optional(),
    confidence: z.number().optional(),
    extractedData: z.any().optional(),
    auditTrail: z.array(z.any()),
    comments: z.array(z.any()),
    clientId: z.string(),
});

export async function addDocument(docData: z.infer<typeof DocumentSchemaForAdd>): Promise<Document | null> {
    const documentsCollection = getDocumentsCollectionRef();
    const validatedData = DocumentSchemaForAdd.parse(docData);
    try {
        const docRef = await documentsCollection.add(validatedData);
        const newDocSnap = await docRef.get();
        if (newDocSnap.exists) {
             return newDocSnap.data() as Document;
        }
        return null;
    } catch (error) {
        console.error("Error adding document:", error);
        throw new Error("Failed to add document to Firestore.");
    }
}

const UpdateDocumentInputSchema = z.object({
    id: z.string(),
    updates: DocumentSchemaForAdd.partial(),
});

export async function updateDocument({ id, updates }: z.infer<typeof UpdateDocumentInputSchema>): Promise<void> {
    const documentsCollection = getDocumentsCollectionRef();
    const validatedData = UpdateDocumentInputSchema.parse({ id, updates });
    try {
        const docRef = documentsCollection.doc(validatedData.id);
        
        // Convert any date strings to Timestamps before updating
        const updatePayload = { ...validatedData.updates };
        if (updatePayload.uploadDate && typeof updatePayload.uploadDate === 'string') {
            updatePayload.uploadDate = Timestamp.fromDate(new Date(updatePayload.uploadDate)) as any;
        }

        await docRef.update(updatePayload);
    } catch (error) {
        console.error("Error updating document:", error);
        throw new Error("Failed to update document.");
    }
}

export async function deleteDocument(docId: string): Promise<void> {
    const documentsCollection = getDocumentsCollectionRef();
    try {
        const docRef = documentsCollection.doc(docId);
        await docRef.delete();
    } catch (error) {
        console.error("Error deleting document:", error);
        throw new Error("Failed to delete document.");
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

        // 1. Check if supplier exists in Cegid
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

        // 2. Simulate sending the accounting entry
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
    if (!db) {
        console.error("Firestore Admin DB not available.");
        return [];
    }
    // This is a mock implementation. In a real app, you would fetch this from Firestore.
    return Promise.resolve(MOCK_BILANS[clientId] || []);
}
