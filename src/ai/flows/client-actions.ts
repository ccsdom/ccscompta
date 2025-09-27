
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-client';
import { collection, getDocs, query, where, limit, doc, getDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { MOCK_CLIENTS } from '@/data/mock-data';
import { auth as adminAuth } from '@/lib/firebase-admin';


type ServerActionResponse<T> =
  | { success: true; data: T, password?: string }
  | { success: false; error: string };

const AddClientInputSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  siret: z.string().length(14, "Le SIRET doit contenir 14 chiffres.").optional().or(z.literal('')),
  email: z.string().email("Email invalide."),
  phone: z.string().optional(),
  legalRepresentative: z.string().optional(),
  address: z.string().optional(),
  fiscalYearEndDate: z.string().regex(/^(3[01]|[12][0-9]|0[1-9])\/(1[0-2]|0[1-9])$/, "Format JJ/MM invalide.").optional(),
  role: z.enum(['client', 'admin', 'accountant', 'secretary']),
  assignedAccountantId: z.string().optional(),
  cabinetId: z.string().optional(),
});


export async function getClients(cabinetId?: string): Promise<Client[]> {
    console.log(`[Firestore] Fetching user profiles (clients and staff)${cabinetId ? ` for cabinet ${cabinetId}` : ''}.`);
    try {
        let q = query(collection(db, 'clients'));
        if (cabinetId) {
            q = query(q, where('cabinetId', '==', cabinetId));
        }

        const snapshot = await getDocs(q);
        
        if (snapshot.empty && MOCK_CLIENTS.length > 0 && !cabinetId) {
            console.log("No users found in Firestore, seeding with mock data...");
            const batch = writeBatch(db);

            for (const client of MOCK_CLIENTS) {
                try {
                     // Try to delete user if exists, to ensure clean state
                    try {
                        const existingUser = await adminAuth.getUserByEmail(client.email);
                        await adminAuth.deleteUser(existingUser.uid);
                    } catch (e) {
                        // Ignore if user does not exist
                    }

                    const userRecord = await adminAuth.createUser({
                        email: client.email,
                        password: client.password,
                        emailVerified: true,
                        disabled: false,
                        displayName: client.name,
                    });
                    
                    await adminAuth.setCustomUserClaims(userRecord.uid, { role: client.role });
                    
                    const docRef = doc(db, 'clients', userRecord.uid);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id, password, ...clientData } = client; 
                    batch.set(docRef, clientData);

                } catch (error: any) {
                    console.error(`Error seeding user ${client.email}:`, error.message);
                }
            }
            await batch.commit();
            console.log("Seeding complete. Refetching users...");
            const seededSnapshot = await getDocs(collection(db, 'clients'));
             return seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        }
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
        
        if (updates.email && updates.email !== (await adminAuth.getUser(id)).email) {
             await adminAuth.updateUser(id, { email: updates.email });
        }
        
        // If the role is being updated, also update the custom claim
        if (updates.role) {
            await adminAuth.setCustomUserClaims(id, { role: updates.role });
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
        // Use Admin SDK to delete the user from Auth
        await adminAuth.deleteUser(id);
        console.log(`[Admin SDK] Auth user ${id} deleted.`);
        
        // Delete Firestore document
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
