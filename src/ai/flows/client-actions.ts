
'use server';

import { z } from 'zod';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';
import { db } from '@/lib/firebase-admin';
import { Timestamp, type FirestoreDataConverter, type QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Firestore data converter to ensure type safety with Firestore
const clientConverter: FirestoreDataConverter<Client> = {
    toFirestore: (clientData: Omit<Client, 'id'>) => {
        const dataToSave = { ...clientData };
         if (typeof dataToSave.lastActivity === 'string') {
            (dataToSave as any).lastActivity = Timestamp.fromDate(new Date(dataToSave.lastActivity));
        }
        return dataToSave;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Client => {
        const data = snapshot.data();
        const lastActivityTimestamp = data.lastActivity as Timestamp;
        return {
            id: snapshot.id,
            name: data.name,
            siret: data.siret,
            address: data.address,
            legalRepresentative: data.legalRepresentative,
            fiscalYearEndDate: data.fiscalYearEndDate,
            status: data.status,
            newDocuments: data.newDocuments,
            lastActivity: lastActivityTimestamp.toDate().toISOString().split('T')[0],
            email: data.email,
            phone: data.phone,
            assignedAccountantId: data.assignedAccountantId,
        };
    }
};

const getClientsCollectionRef = () => {
    if (!db) {
        throw new Error("Firestore Admin DB not available.");
    }
    return db.collection('clients').withConverter(clientConverter);
}


export async function getClients(): Promise<Client[]> {
    const clientsCollection = getClientsCollectionRef();
    try {
        let snapshot = await clientsCollection.orderBy('name').get();

        // If no documents are found, seed with mock data
        if (snapshot.empty) {
            console.log("No clients found. Seeding with mock data...");
            const batch = db.batch();
            for (const clientData of MOCK_CLIENTS) {
                const docRef = clientsCollection.doc(clientData.id);
                batch.set(docRef, clientData);
            }
            await batch.commit();
            snapshot = await clientsCollection.orderBy('name').get(); // Re-fetch after seeding
        }

        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching clients:", error);
        return []; // Return empty array on error
    }
}

export async function getClientById(id: string): Promise<Client | undefined> {
    try {
        const docRef = getClientsCollectionRef().doc(id);
        const snapshot = await docRef.get();
        return snapshot.exists ? snapshot.data() : undefined;
    } catch (error) {
        console.error(`Error fetching client by ID ${id}:`, error);
        return undefined;
    }
}

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

type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function addClient(
  newClientData: z.infer<typeof AddClientInputSchema>
): Promise<ServerActionResponse<Client>> {
  try {
    const validatedData = AddClientInputSchema.parse(newClientData);
    
    const newClient: Omit<Client, 'id'> = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: new Date().toISOString().split('T')[0],
    };
    
    const docRef = await getClientsCollectionRef().add(newClient);
    const createdClient = await getClientById(docRef.id);

    if (!createdClient) {
        throw new Error("Failed to retrieve the newly created client.");
    }

    return { success: true, data: createdClient };

  } catch (error) {
    console.error('Error adding client:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'ajout du client.';
    
    // Check for specific Firestore errors if possible
    if (errorMessage.includes('ALREADY_EXISTS')) {
        return { success: false, error: 'Un client avec cet identifiant existe déjà.' };
    }

    return { success: false, error: errorMessage };
  }
}

const UpdateClientInputSchema = z.object({
  id: z.string(),
  updates: AddClientInputSchema.partial(),
});

export async function updateClient(
  { id, updates }: z.infer<typeof UpdateClientInputSchema>
): Promise<ServerActionResponse<Client>> {
   try {
       const docRef = getClientsCollectionRef().doc(id);
       await docRef.update(updates);
       const updatedClient = await getClientById(id);
       if (!updatedClient) {
           throw new Error("Failed to retrieve updated client.");
       }
       return { success: true, data: updatedClient };
   } catch(error) {
       console.error(`Error updating client ${id}:`, error);
       const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour.';
       return { success: false, error: errorMessage };
   }
}

export async function deleteClient(
  id: string
): Promise<ServerActionResponse<null>> {
   try {
       const docRef = getClientsCollectionRef().doc(id);
       await docRef.delete();
       return { success: true, data: null };
   } catch (error) {
       console.error(`Error deleting client ${id}:`, error);
       const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la suppression.';
       return { success: false, error: errorMessage };
   }
}

const UpdateClientsStatusInputSchema = z.object({
  clientIds: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'onboarding']),
});

export async function updateClientsStatus(
    { clientIds, status }: z.infer<typeof UpdateClientsStatusInputSchema>
): Promise<{ success: boolean; updatedCount: number, error?: string }> {
    const batch = db.batch();
    const clientsCollection = getClientsCollectionRef();
    clientIds.forEach(id => {
        const docRef = clientsCollection.doc(id);
        batch.update(docRef, { status });
    });
    try {
        await batch.commit();
        return { success: true, updatedCount: clientIds.length };
    } catch(error) {
        console.error("Error updating client statuses:", error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour des statuts.';
        return { success: false, updatedCount: 0, error: errorMessage };
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
    console.log("MOCK getAccountants: Returning mock accountants.");
    return Promise.resolve(MOCK_ACCOUNTANTS);
}
