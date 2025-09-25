
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-client';
import { collection, getDocs, query, where, limit, updateDoc, doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { auth as adminAuth } from '@/lib/firebase-admin';
import type { Client } from '@/lib/types';
import { MOCK_CLIENTS } from '@/data/mock-data';

type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const AddClientInputSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  siret: z.string().length(14, "Le SIRET doit contenir 14 chiffres."),
  email: z.string().email("Email invalide."),
  phone: z.string(),
  legalRepresentative: z.string(),
  address: z.string(),
  fiscalYearEndDate: z.string().regex(/^(3[01]|[12][0-9]|0[1-9])\/(1[0-2]|0[1-9])$/, "Format JJ/MM invalide."),
  status: z.enum(['active', 'inactive', 'onboarding']),
  assignedAccountantId: z.string().optional(),
});

/**
 * Creates a new user in Firebase Authentication.
 * This function should only be called from a secure server-side environment.
 * @param email The user's email.
 * @param password The user's initial password.
 * @returns The new user's UID.
 */
export async function createFirebaseUser(email: string, password?: string): Promise<string> {
    console.log(`[Admin SDK] Attempting to create Firebase user for ${email}`);
    try {
        const userRecord = await adminAuth.createUser({
            email,
            emailVerified: true,
            password: password,
        });
        console.log(`[Admin SDK] User created successfully with UID: ${userRecord.uid}`);
        return userRecord.uid;
    } catch (error: any) {
        // Log the full error for debugging but re-throw a more specific error for the caller to handle.
        console.error('[Admin SDK] Error creating Firebase user:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Un compte utilisateur avec cet email existe déjà dans Firebase Authentication.');
        }
        throw new Error(`La création de l'utilisateur Firebase Auth a échoué: ${error.message}`);
    }
}


export async function addClient(
  newClientData: z.infer<typeof AddClientInputSchema>
): Promise<ServerActionResponse<Client>> {
  console.log("[Firestore] Adding client:", newClientData.name);
  try {
    const validatedData = AddClientInputSchema.parse(newClientData);
    
    // 1. Check for existing SIRET in Firestore
    const siretQuery = query(collection(db, 'clients'), where('siret', '==', validatedData.siret), limit(1));
    const siretSnapshot = await getDocs(siretQuery);
    if (!siretSnapshot.empty) {
        return { success: false, error: 'Un client avec ce SIRET existe déjà.' };
    }

    // 2. Create Firebase Auth user, using SIRET as the initial password
    const uid = await createFirebaseUser(validatedData.email, validatedData.siret);

    // 3. Add client profile to Firestore using the UID from Auth as the document ID
    const clientDocRef = doc(db, 'clients', uid);
    const newClient: Omit<Client, 'id'> = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: new Date().toISOString(),
    };

    await setDoc(clientDocRef, newClient);
    console.log("[Firestore] Client added with ID:", uid);
    
    return { 
        success: true, 
        data: { 
            ...newClient, 
            id: uid,
            password: validatedData.siret // Pass back the initial password for info
        } 
    };

  } catch (error) {
    console.error('[Firestore] Error adding client:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'ajout du client.';
    return { success: false, error: errorMessage };
  }
}

export async function getClients(): Promise<Client[]> {
    console.log("[Firestore] Fetching all clients.");
    try {
        const snapshot = await getDocs(collection(db, 'clients'));
        if (snapshot.empty && MOCK_CLIENTS.length > 0) {
            console.log("No clients found in Firestore, seeding with mock data...");
            const seedingPromises = MOCK_CLIENTS.map(client => {
                 // We don't seed with a hardcoded ID. The ID will be the Firebase Auth UID.
                const { id, ...clientDataToSeed } = client; 
                return addClient(clientDataToSeed);
            });
            await Promise.all(seedingPromises);
            
            console.log("Seeding complete. Refetching clients...");
            const seededSnapshot = await getDocs(collection(db, 'clients'));
             return seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}

export async function getClientById(id: string): Promise<Client | null> {
    console.log(`[Firestore] Fetching client by ID: ${id}`);
    try {
        const docRef = doc(db, 'clients', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as Client;
    } catch(error) {
        console.error(`Error fetching client ${id}:`, error);
        return null;
    }
}

export async function updateClient({id, updates}: {id: string, updates: Partial<Client>}): Promise<ServerActionResponse<Client>> {
    console.log(`[Firestore] Updating client ID: ${id}`);
    try {
         if (updates.siret) {
            const siretQuery = query(collection(db, 'clients'), where('siret', '==', updates.siret));
            const siretSnapshot = await getDocs(siretQuery);
            const conflictingDoc = siretSnapshot.docs.find(docData => docData.id !== id);
             if (conflictingDoc) {
                return { success: false, error: 'Un autre client utilise déjà ce SIRET.'};
            }
        }
        
        const docRef = doc(db, 'clients', id);
        await updateDoc(docRef, updates);

        if (updates.email) {
            console.log(`[Admin SDK] Updating auth email for user ${id}`);
            await adminAuth.updateUser(id, { email: updates.email });
        }

        const updatedDoc = await getClientById(id);
        if (!updatedDoc) throw new Error("Failed to fetch updated document.");

        console.log(`[Firestore] Client ${id} updated.`);
        return { success: true, data: updatedDoc };
    } catch(error) {
        console.error(`Error updating client ${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue.';
        return { success: false, error: errorMessage};
    }
}


export async function deleteClient(id: string): Promise<{success: boolean}> {
    console.log(`[Firestore] Deleting client ID: ${id}`);
    try {
        // In a real app, you would also delete subcollections (documents, etc.)
        await deleteDoc(doc(db, 'clients', id));
        console.log(`[Firestore] Client ${id} deleted.`);
        
        console.log(`[Admin SDK] Deleting auth user ${id}`);
        await adminAuth.deleteUser(id);
        console.log(`[Admin SDK] Auth user ${id} deleted.`);

        return { success: true };
    } catch (error) {
        console.error(`Error deleting client ${id}:`, error);
        return { success: false };
    }
}


export interface Accountant {
    id: string;
    name: string;
}

const MOCK_ACCOUNTANTS: Accountant[] = [
    { id: 'acc-01', name: 'Alain Comptable' },
    { id: 'acc-02', name: 'Béatrice Fiscale' },
];

export async function getAccountants(): Promise<Accountant[]> {
    console.log("[SIMULATION] Fetching mock accountants.");
    return Promise.resolve(MOCK_ACCOUNTANTS);
}



    