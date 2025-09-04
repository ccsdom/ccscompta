'use server';

import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import type { Document } from '@/lib/types';
import { MOCK_DOCUMENTS } from '@/data/mock-data';
import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase-admin/firestore';


// Firestore data converter to ensure type safety with Firestore
const documentConverter: FirestoreDataConverter<Document> = {
    toFirestore: (docData: Omit<Document, 'id'>) => {
        // The dataUrl is for client-side use only and should not be persisted.
        const { dataUrl, ...rest } = docData;
        return rest;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Document => {
        const data = snapshot.data();
        return {
            id: snapshot.id,
            name: data.name,
            uploadDate: data.uploadDate,
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


const getDocumentsCollectionRef = () => db.collection('documents').withConverter(documentConverter);

export async function getDocuments(clientId: string): Promise<Document[]> {
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

export async function addDocument(docData: z.infer<typeof DocumentSchemaForAdd>): Promise<Document> {
    const documentsCollection = getDocumentsCollectionRef();
    const validatedData = DocumentSchemaForAdd.parse(docData);
    try {
        const docRef = await documentsCollection.add(validatedData);
        // Return the full document object including the newly generated ID
        return {
            id: docRef.id,
            ...validatedData
        };
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
        await docRef.update(validatedData.updates);
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
