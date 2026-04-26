
'use server';
/**
 * @fileOverview Server actions related to document management.
 */

import { db } from '@/lib/firebase-server';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import type { Document } from '@/lib/types';


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

