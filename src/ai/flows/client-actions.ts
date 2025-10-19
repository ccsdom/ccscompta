'use server';

import { z } from 'zod';
import { db, auth } from '@/firebase';
import { collection, getDocs, query, where, limit, doc, getDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { MOCK_CLIENTS } from '@/data/mock-data';


type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };


export async function getClients(cabinetId?: string): Promise<Client[]> {
    console.log(`[Firestore] Fetching user profiles (clients and staff)${cabinetId ? ` for cabinet ${cabinetId}` : ''}.`);
    try {
        let q = query(collection(db, 'clients'));
        if (cabinetId) {
            q = query(q, where('cabinetId', '==', cabinetId));
        }

        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function getClientById(id: string): Promise<Client | null> {
    console.log(`[Firestore] Fetching user profile by ID: ${id}`);
    try {
        const docRef = doc(db, 'clients', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as Client;
    } catch(error) {
        console.error(`Error fetching user ${id}:`, error);
        return null;
    }
}

export async function getClientByEmail(email: string): Promise<Client | null> {
     console.log(`[Firestore] Fetching user profile by email: ${email}`);
    try {
        const q = query(collection(db, 'clients'), where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        const docData = snapshot.docs[0];
        return { id: docData.id, ...docData.data() } as Client;
    } catch (error) {
         console.error(`Error fetching user by email ${email}:`, error);
        return null;
    }
}

export async function updateClient({id, updates}: {id: string, updates: Partial<Omit<Client, 'id'>>}): Promise<ServerActionResponse<Client>> {
    console.log(`[Firestore] Updating user profile ID: ${id}`);
    try {
         if (updates.siret) {
            const siretQuery = query(collection(db, 'clients'), where('siret', '==', updates.siret));
            const siretSnapshot = await getDocs(siretQuery);
            const conflictingDoc = siretSnapshot.docs.find(docData => docData.id !== id);
             if (conflictingDoc) {
                return { success: false, error: 'Un autre utilisateur utilise déjà ce SIRET.'};
            }
        }
        
        const docRef = doc(db, 'clients', id);
        await setDoc(docRef, updates, { merge: true });

        const updatedDoc = await getClientById(id);
        if (!updatedDoc) throw new Error("Failed to fetch updated document.");

        console.log(`[Firestore] User profile ${id} updated.`);
        return { success: true, data: updatedDoc };
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue.';
        return { success: false, error: errorMessage};
    }
}


export async function deleteClient(id: string): Promise<{success: boolean}> {
    console.log(`[Firestore] Deleting user profile ID: ${id}`);
    try {
        // NOTE: The user is deleted from Auth via a Cloud Function for security reasons.
        // This action only deletes the Firestore document.
        await deleteDoc(doc(db, 'clients', id));
        console.log(`[Firestore] User profile ${id} deleted.`);
        
        return { success: true };
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        return { success: false };
    }
}


export interface Accountant {
    id: string;
    name: string;
}

const MOCK_ACCOUNTANTS: Accountant[] = [
    { id: 'user-comptable-ccs', name: 'Comptable CCS' },
];

export async function getAccountants(): Promise<Accountant[]> {
    console.log("[Firestore] Fetching accountants.");
    try {
        const q = query(collection(db, 'clients'), where('role', '==', 'accountant'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return MOCK_ACCOUNTANTS;
        return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
    } catch (e) {
        console.error("Error fetching accountants, returning mock data", e);
        return MOCK_ACCOUNTANTS;
    }
}
