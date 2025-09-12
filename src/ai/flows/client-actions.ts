
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { collection, addDoc, getDocs, query, where, limit, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import type { Client } from '@/lib/client-data';
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


export async function addClient(
  newClientData: z.infer<typeof AddClientInputSchema>
): Promise<ServerActionResponse<Client>> {
  console.log("[Firestore] Adding client:", newClientData.name);
  try {
    const validatedData = AddClientInputSchema.parse(newClientData);
    
    const siretQuery = query(collection(db, 'clients'), where('siret', '==', validatedData.siret), limit(1));
    const siretSnapshot = await getDocs(siretQuery);
    if (!siretSnapshot.empty) {
        return { success: false, error: 'Un client avec ce SIRET existe déjà.' };
    }

    const newClient: Omit<Client, 'id'> = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'clients'), newClient);

    console.log("[Firestore] Client added with ID:", docRef.id);
    return { success: true, data: { ...newClient, id: docRef.id } };

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
        const firestoreClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        
        // Combine mock clients and firestore clients, ensuring no duplicates by ID
        const allClients = [...MOCK_CLIENTS];
        const firestoreClientIds = new Set(firestoreClients.map(c => c.id));
        
        firestoreClients.forEach(fc => {
            const existingIndex = allClients.findIndex(mc => mc.id === fc.id);
            if (existingIndex !== -1) {
                allClients[existingIndex] = fc; // Update mock with firestore data if ID matches
            } else {
                allClients.push(fc); // Add new client from firestore
            }
        });

        // Seed initial mock data if the collection is completely empty
        if (snapshot.empty) {
             console.log("No clients found in Firestore, seeding with mock data...");
            for (const client of MOCK_CLIENTS) {
                // Do not re-add if it was just added to the combined list
                if (!firestoreClientIds.has(client.id)) {
                    await addDoc(collection(db, 'clients'), client);
                }
            }
             console.log(`${MOCK_CLIENTS.length} mock clients may have been seeded.`);
        }
        
        return allClients;
    } catch (error) {
        console.error("Error fetching clients:", error);
        // Fallback to mock data in case of firestore error
        return MOCK_CLIENTS;
    }
}

export async function getClientById(id: string): Promise<Client | null> {
    console.log(`[Firestore] Fetching client by ID: ${id}`);
    try {
        const docRef = doc(db, 'clients', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            // Fallback to check mock clients
            return MOCK_CLIENTS.find(c => c.id === id) || null;
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
