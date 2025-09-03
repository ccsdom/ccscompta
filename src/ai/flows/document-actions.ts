
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import type { Document } from '@/lib/types';
import { documentConverter } from '@/lib/document-data';
import { MOCK_DOCUMENTS } from '@/data/mock-data';

const getDocumentsCollectionRef = () => collection(db, 'documents').withConverter(documentConverter);

export const getDocuments = ai.defineFlow(
    { name: 'getDocuments', inputSchema: z.string(), outputSchema: z.array(z.any()) },
    async (clientId) => {
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
);

export const getDocumentById = ai.defineFlow(
    { name: 'getDocumentById', inputSchema: z.string(), outputSchema: z.any().nullable() },
    async (docId) => {
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
);

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

export const addDocument = ai.defineFlow(
    { name: 'addDocument', inputSchema: DocumentSchemaForAdd, outputSchema: z.any() },
    async (docData) => {
        try {
            const docRef = await addDoc(getDocumentsCollectionRef(), docData);
            return {
                id: docRef.id,
                ...docData
            };
        } catch (error) {
            console.error("Error adding document:", error);
            throw error;
        }
    }
);

const UpdateDocumentInputSchema = z.object({
    id: z.string(),
    updates: DocumentSchemaForAdd.partial(),
});

export const updateDocument = ai.defineFlow(
    { name: 'updateDocument', inputSchema: UpdateDocumentInputSchema, outputSchema: z.void() },
    async ({ id, updates }) => {
        try {
            const docRef = doc(db, 'documents', id).withConverter(documentConverter);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating document:", error);
            throw error;
        }
    }
);

export const deleteDocument = ai.defineFlow(
    { name: 'deleteDocument', inputSchema: z.string(), outputSchema: z.void() },
    async (docId) => {
        try {
            await deleteDoc(doc(db, 'documents', docId));
        } catch (error) {
            console.error("Error deleting document:", error);
            throw error;
        }
    }
);
