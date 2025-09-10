
'use server';

import { z } from 'zod';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';

// --- THIS IS NOW A MOCK IMPLEMENTATION TO BYPASS SERVER AUTH ISSUES ---
// We will operate directly on an in-memory array that is a copy of MOCK_CLIENTS.
// This is not a production-ready solution, but a workaround for the current environment.

// The serverless nature of the environment means this store is reset on each call.
// The actual state management will be handled on the client-side via localStorage.
let clientsStore: Client[] = JSON.parse(JSON.stringify(MOCK_CLIENTS));


export async function getClients(): Promise<Client[]> {
  console.log("MOCK getClients: Returning the initial list of clients.");
  // This will always return the base list, client-side will manage additions.
  return Promise.resolve(JSON.parse(JSON.stringify(MOCK_CLIENTS)));
}

export async function getClientById(id: string): Promise<Client | undefined> {
  console.log(`MOCK getClientById: Searching for ID ${id}`);
  // We need to check the mock data as the store is not persistent.
  return Promise.resolve(MOCK_CLIENTS.find(c => c.id === id));
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
  console.log("MOCK addClient: Simulating adding a client.");
  try {
    const validatedData = AddClientInputSchema.parse(newClientData);

    // This check is against the base list, as the store is not persistent.
    if (MOCK_CLIENTS.some(c => c.siret === validatedData.siret)) {
        return { success: false, error: "Un client avec ce numéro de SIRET existe déjà dans la liste de base." };
    }

    const newClient: Client = {
      ...validatedData,
      id: `client-${Date.now()}`, // Generate a unique ID
      newDocuments: 0,
      lastActivity: new Date().toISOString().split('T')[0],
    };
    
    // We return success, and the client-side will handle adding it to its local state.
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
   console.log(`MOCK updateClient: Simulating update for client ${id}`);
    const clientToUpdate = MOCK_CLIENTS.find(c => c.id === id);
    if (!clientToUpdate) {
       return { success: false, error: "Client non trouvé." };
    }
    const updatedClient = { ...clientToUpdate, ...updates };
    return { success: true, data: updatedClient as Client };
}

export async function deleteClient(
  id: string
): Promise<ServerActionResponse<null>> {
   console.log(`MOCK deleteClient: Simulating deletion for client ${id}`);
   // This is just a simulation, client-side will handle the actual removal from the UI.
   return { success: true, data: null };
}

const UpdateClientsStatusInputSchema = z.object({
  clientIds: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'onboarding']),
});

export async function updateClientsStatus(
    { clientIds, status }: z.infer<typeof UpdateClientsStatusInputSchema>
): Promise<{ success: boolean; updatedCount: number, error?: string }> {
    console.log(`MOCK updateClientsStatus: Simulating status update for ${clientIds.length} clients to ${status}`);
    // Simulate success, client-side will perform the update on its local state.
    return { success: true, updatedCount: clientIds.length };
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
