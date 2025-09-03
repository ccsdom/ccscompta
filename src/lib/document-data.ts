
'use server';

import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Document } from './types';
import { MOCK_DOCUMENTS } from '@/data/mock-data';

// Firestore data converter
const documentConverter = {
    toFirestore: (docData: Omit<Document, 'id'>) => {
        // Remove client-only fields before sending to Firestore
        const { dataUrl, ...rest } = docData;
        return rest;
    },
    fromFirestore: (snapshot: any, options: any): Document => {
        const data = snapshot.data(options);
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

const getDocumentsCollectionRef = () => collection(db, 'documents').withConverter(documentConverter);


// Get all documents for a specific client
export async function getDocuments(clientId: string): Promise<Document[]> {
    try {
        const q = query(getDocumentsCollectionRef(), where("clientId", "==", clientId));
        let snapshot = await getDocs(q);

        // If no documents found for this client, seed them
        if (snapshot.empty && MOCK_DOCUMENTS[clientId]) {
            console.log(`No documents found for client ${clientId}. Seeding with mock data...`);
            for (const docData of MOCK_DOCUMENTS[clientId]) {
                 await addDoc(getDocumentsCollectionRef(), docData);
            }
            // Re-fetch after seeding
            snapshot = await getDocs(q);
        }

        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
    }
}

// Get a single document by its ID
export async function getDocumentById(docId: string): Promise<Document | null> {
    try {
        const snapshot = await getDoc(doc(db, 'documents', docId).withConverter(documentConverter));
        if(snapshot.exists()) {
            return snapshot.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching document by ID:", error);
        return null;
    }
}

// Add a new document's metadata
export async function addDocument(docData: Omit<Document, 'id'>): Promise<Document> {
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

// Update a document's metadata
export async function updateDocument(docId: string, updates: Partial<Omit<Document, 'id'>>): Promise<void> {
    try {
        const docRef = doc(db, 'documents', docId).withConverter(documentConverter);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Error updating document:", error);
        throw error;
    }
}

// Delete a document's metadata
export async function deleteDocument(docId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'documents', docId));
    } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
    }
}
