'use server';

import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Document } from './types';

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

const documentsCollection = (clientId: string) => collection(db, 'clients', clientId, 'documents').withConverter(documentConverter);
const singleDocumentRef = (docId: string) => {
    // This is a bit of a hack as we don't know the clientID here.
    // In a real multi-tenant app, this would be handled with security rules
    // or by passing the clientId through. For this demo, we assume a flat
    // 'documents' collection at the root for single-doc operations.
     const parts = docId.split('/');
     if (parts.length > 2) {
        return doc(db, 'clients', parts[0], 'documents', parts[1]).withConverter(documentConverter);
     }
     // Fallback for old format or direct ID - requires searching, which is inefficient.
     // This part is a simplification for the demo.
     // A robust solution would always include the client context.
     console.warn("Document ID does not contain client context. This is inefficient.");
     return doc(db, 'documents', docId).withConverter(documentConverter);
}

const getDocumentsCollectionRef = () => collection(db, 'documents').withConverter(documentConverter);


// Get all documents for a specific client
export async function getDocuments(clientId: string): Promise<Document[]> {
    try {
        const q = query(getDocumentsCollectionRef(), where("clientId", "==", clientId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
    }
}

// Get a single document by its ID
export async function getDocumentById(docId: string): Promise<Document | null> {
    try {
        // This is simplified. In a real app, you'd need the clientId to find the doc.
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