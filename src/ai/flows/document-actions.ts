
'use server';
/**
 * @fileOverview Server actions related to document management.
 */

import { db } from '@/lib/firebase-server';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import type { Document } from '@/lib/types';
import { sendDocumentToCegid as sendToCegidFlow } from './cegid-actions';

/**
 * Adds a new document to the Firestore 'documents' collection.
 * This function is intended to be called from the server-side after a file has been uploaded to storage.
 * @param documentData - The document data to add, excluding the Firestore ID.
 * @returns The ID of the newly created document.
 */
export async function addDocument(documentData: Omit<Document, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'documents'), documentData);
    console.log(`[Action] Document added with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[Action] Error adding document:', error);
    throw new Error('Failed to add document to Firestore.');
  }
}

/**
 * Calls the flow to send a document to Cegid and updates its audit trail.
 * @param docId The ID of the document to send.
 * @param user The name of the user performing the action.
 * @returns The result of the Cegid send operation.
 */
export async function sendDocumentToCegid(docId: string, user: string) {
    const result = await sendToCegidFlow({ documentId: docId, triggeredBy: user });

    // Even if it fails, the flow itself updates the audit trail with the error.
    // Here, we just log the outcome.
    if (result.success) {
        console.log(`[Action] Successfully queued sending of document ${docId} to Cegid.`);
    } else {
        console.error(`[Action] Failed to send document ${docId} to Cegid: ${result.error}`);
    }
    return result;
}

