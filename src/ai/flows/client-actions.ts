
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
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
    
    const siretQuery = await db.collection('clients').where('siret', '==', validatedData.siret).limit(1).get();
    if (!siretQuery.empty) {
        return { success: false, error: 'Un client avec ce SIRET existe déjà.' };
    }

    const newClient: Omit<Client, 'id'> = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: new Date().toISOString(),
    };

    const docRef = await db.collection('clients').add(newClient);

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
        const snapshot = await db.collection('clients').get();
        if (snapshot.empty) {
            console.log("No clients found in Firestore, seeding with mock data...");
            const batch = db.batch();
            MOCK_CLIENTS.forEach(client => {
                // remove id from mock object before sending to firestore
                const { id, ...clientData } = client; 
                const docRef = db.collection('clients').doc();
                batch.set(docRef, clientData);
            });
            await batch.commit();
            console.log(`${MOCK_CLIENTS.length} mock clients seeded.`);
            // Fetch again after seeding
            const seededSnapshot = await db.collection('clients').get();
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
        const doc = await db.collection('clients').doc(id).get();
        if (!doc.exists) {
            return null;
        }
        return { id: doc.id, ...doc.data() } as Client;
    } catch(error) {
        console.error(`Error fetching client ${id}:`, error);
        return null;
    }
}

export async function updateClient({id, updates}: {id: string, updates: Partial<Client>}): Promise<ServerActionResponse<Client>> {
    console.log(`[Firestore] Updating client ID: ${id}`);
    try {
         if (updates.siret) {
            const siretQuery = await db.collection('clients').where('siret', '==', updates.siret).get();
            const conflictingDoc = siretQuery.docs.find(doc => doc.id !== id);
             if (conflictingDoc) {
                return { success: false, error: 'Un autre client utilise déjà ce SIRET.'};
            }
        }

        await db.collection('clients').doc(id).update(updates);
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
        await db.collection('clients').doc(id).delete();
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