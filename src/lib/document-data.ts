
// This file only defines the types and mock data.
// All server-side logic has been moved to src/ai/flows/document-actions.ts
import type { Document } from './types';

// Firestore data converter
// This is kept here as it's related to the type, but it's used by the server action.
export const documentConverter = {
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
