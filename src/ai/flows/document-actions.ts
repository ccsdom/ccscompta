
'use server';

import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import type { Document } from '@/lib/types';
import { documentConverter } from '@/lib/document-data';
import { MOCK_DOCUMENTS } from '@/data/mock-data';

const getDocumentsCollectionRef = () => collection(db, 'documents').withConverter(documentConverter);

export async function getDocuments(clientId: string): Promise<Document[]> {
    try {
        const q = query(getDocumentsCollectionRef(), where("clientId", "==", clientId));
        let snapshot = await getDocs(q);

        if (snapshot.empty && MOCK_DOCUMENTS[clientId]) {
            console.log(`No documents found for client ${clientId}. Seeding with mock data...`);
            for (const docData of MOCK_DOCUMENTS[clientId]) {
                await addDoc(getDocumentsCollectionRef(), docData);
            }
            snapshot = await getDocs(q);
        }

        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
    }
}

export async function getDocumentById(docId: string): Promise<Document | null> {
    try {
        const snapshot = await getDoc(doc(db, 'documents', docId).withConverter(documentConverter));
        if (snapshot.exists()) {
            return snapshot.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching document by ID:", error);
        return null;
    }
}

const DocumentSchemaForAdd = z.object({
    name: z.string(),
    uploadDate: z.string(),
    status: z.enum(['pending', 'processing', 'reviewing', 'approved', 'error']),
    dataUrl: z.string().optional(),
    storagePath: z.string(),
    type: z.string().optional(),
    confidence: z.number().optional(),
    extractedData: z.any().optional(),
    auditTrail: z.array(z.any()),
    comments: z.array(z.any()),
    clientId: z.string(),
});

export async function addDocument(docData: z.infer<typeof DocumentSchemaForAdd>): Promise<Document> {
    const validatedData = DocumentSchemaForAdd.parse(docData);
    try {
        const docRef = await addDoc(getDocumentsCollectionRef(), validatedData);
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
    const validatedData = UpdateDocumentInputSchema.parse({ id, updates });
    try {
        const docRef = doc(db, 'documents', validatedData.id).withConverter(documentConverter);
        await updateDoc(docRef, validatedData.updates);
    } catch (error) {
        console.error("Error updating document:", error);
        throw new Error("Failed to update document.");
    }
}

export async function deleteDocument(docId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'documents', docId));
    } catch (error) {
        console.error("Error deleting document:", error);
        throw new Error("Failed to delete document.");
    }
}
