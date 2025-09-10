
'use server';

import { z } from 'zod';
import { db, auth } from '@/lib/firebase-admin';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';
import { Timestamp, type DocumentSnapshot, type DocumentData } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import { UserRecord } from 'firebase-admin/auth';


// --- THIS IS NOW A MOCK IMPLEMENTATION TO BYPASS SERVER AUTH ISSUES ---
// We will operate directly on an in-memory array that is a copy of MOCK_CLIENTS.
// This is not a production-ready solution, but a workaround for the current environment.

let clientsStore: Client[] = [...MOCK_CLIENTS];


// Helper pour convertir les données de Firestore (côté admin)
const fromFirestore = (doc: DocumentSnapshot<DocumentData>): Client => {
  const data = doc.data();
  if (!data) {
    throw new Error(`Document ${doc.id} has no data`);
  }
  
  let lastActivity: string;
  const activityData = data.lastActivity;

  if (activityData instanceof Timestamp) {
    lastActivity = activityData.toDate().toISOString().split('T')[0];
  } else if (typeof typeof activityData === 'string') {
    // Handle mock data seeding case where date might be a string
    lastActivity = activityData;
  } else {
    lastActivity = new Date().toISOString().split('T')[0];
  }

  return {
    id: doc.id,
    name: data.name ?? '',
    siret: data.siret ?? '',
    address: data.address ?? '',
    legalRepresentative: data.legalRepresentative ?? '',
    fiscalYearEndDate: data.fiscalYearEndDate ?? '',
    status: data.status ?? 'inactive',
    newDocuments: data.newDocuments ?? 0,
    lastActivity,
    email: data.email ?? '',
    phone: data.phone ?? '',
    assignedAccountantId: data.assignedAccountantId ?? undefined,
  };
};

export async function getUserProfile(uid: string): Promise<{role: string, name: string, email: string, clientId?: string} | null> {
    if (!db) {
        throw new Error("Firestore Admin DB is not available. Check server-side Firebase initialization.");
    }
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data() as {role: string, name: string, email: string, clientId?: string};
        }
        
        console.warn(`No profile found for UID ${uid}.`);
        return null;

    } catch (error) {
        console.error(`Error in getUserProfile for UID ${uid}:`, error);
        return null;
    }
}


export async function getClients(): Promise<Client[]> {
  console.log("MOCK getClients: Returning in-memory clients.");
  return Promise.resolve(clientsStore);
}

export async function getClientById(id: string): Promise<Client | undefined> {
  console.log(`MOCK getClientById: Searching for ID ${id}`);
  return Promise.resolve(clientsStore.find(c => c.id === id));
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
  console.log("MOCK addClient: Adding new client to in-memory store.");
  try {
    const validatedData = AddClientInputSchema.parse(newClientData);

    // Check for duplicate SIRET
    if (clientsStore.some(c => c.siret === validatedData.siret)) {
        return { success: false, error: "Un client avec ce numéro de SIRET existe déjà." };
    }

    const newClient: Client = {
      ...validatedData,
      id: `client-${Date.now()}`, // Generate a unique ID
      newDocuments: 0,
      lastActivity: new Date().toISOString().split('T')[0],
    };
    
    clientsStore.push(newClient);
    
    return { success: true, data: newClient };

  } catch (error) {
    console.error('MOCK Error adding client:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'ajout du client.',
    };
  }
}

const UpdateClientInputSchema = z.object({
  id: z.string(),
  updates: AddClientInputSchema.partial(),
});

export async function updateClient(
  { id, updates }: z.infer<typeof UpdateClientInputSchema>
): Promise<ServerActionResponse<Client>> {
   console.log(`MOCK updateClient: Updating client ${id}`);
  try {
    const validatedUpdates = UpdateClientInputSchema.parse({ id, updates });
    const clientIndex = clientsStore.findIndex(c => c.id === validatedUpdates.id);

    if (clientIndex === -1) {
        return { success: false, error: "Client non trouvé." };
    }

    const updatedClient = {
      ...clientsStore[clientIndex],
      ...validatedUpdates.updates,
      lastActivity: new Date().toISOString().split('T')[0],
    };

    clientsStore[clientIndex] = updatedClient;

    return { success: true, data: updatedClient };
  } catch (error) {
    console.error('MOCK Error updating client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue.',
    };
  }
}

export async function deleteClient(
  id: string
): Promise<ServerActionResponse<null>> {
   console.log(`MOCK deleteClient: Deleting client ${id}`);
   const initialLength = clientsStore.length;
   clientsStore = clientsStore.filter(c => c.id !== id);

   if (clientsStore.length < initialLength) {
       return { success: true, data: null };
   } else {
       return { success: false, error: "Client non trouvé." };
   }
}

const UpdateClientsStatusInputSchema = z.object({
  clientIds: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'onboarding']),
});

export async function updateClientsStatus(
    { clientIds, status }: z.infer<typeof UpdateClientsStatusInputSchema>
): Promise<{ success: boolean; updatedCount: number, error?: string }> {
    console.log(`MOCK updateClientsStatus: Updating status for ${clientIds.length} clients to ${status}`);
    let updatedCount = 0;
    clientsStore.forEach((client, index) => {
        if (clientIds.includes(client.id)) {
            clientsStore[index] = {
                ...client,
                status: status,
                lastActivity: new Date().toISOString().split('T')[0],
            };
            updatedCount++;
        }
    });

    return { success: true, updatedCount };
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
