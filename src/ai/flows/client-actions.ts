
'use server';

import { z } from 'zod';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';

// --- Simulation de la base de données en mémoire ---
let clientsStore: Client[] = [...MOCK_CLIENTS];
// Utiliser un Set pour une recherche de SIRET rapide
let siretSet = new Set(MOCK_CLIENTS.map(c => c.siret));
// --- Fin de la simulation ---

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
  console.log("[SIMULATION] Adding client:", newClientData.name);
  try {
    const validatedData = AddClientInputSchema.parse(newClientData);
    
    if (siretSet.has(validatedData.siret)) {
        return { success: false, error: 'Un client avec ce SIRET existe déjà.' };
    }

    const newClient: Client = {
      ...validatedData,
      id: `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      newDocuments: 0,
      lastActivity: new Date().toISOString(),
    };

    clientsStore.push(newClient);
    siretSet.add(newClient.siret);

    console.log("[SIMULATION] Client added:", newClient.name);
    return { success: true, data: newClient };

  } catch (error) {
    console.error('[SIMULATION] Error adding client:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'ajout du client.';
    return { success: false, error: errorMessage };
  }
}

export async function getClients(): Promise<Client[]> {
    console.log("[SIMULATION] Fetching all clients.");
    return Promise.resolve([...clientsStore]);
}

export async function getClientById(id: string): Promise<Client | null> {
    console.log(`[SIMULATION] Fetching client by ID: ${id}`);
    const client = clientsStore.find(c => c.id === id);
    return Promise.resolve(client || null);
}

export async function updateClient({id, updates}: {id: string, updates: Partial<Client>}): Promise<ServerActionResponse<Client>> {
    console.log(`[SIMULATION] Updating client ID: ${id}`);
    const clientIndex = clientsStore.findIndex(c => c.id === id);
    
    if(clientIndex === -1) {
        return { success: false, error: 'Client non trouvé.'};
    }
    
    // Si le SIRET est mis à jour, vérifier qu'il n'est pas déjà pris par un autre client
    if (updates.siret && updates.siret !== clientsStore[clientIndex].siret) {
        if(siretSet.has(updates.siret)) {
             return { success: false, error: 'Un autre client utilise déjà ce SIRET.'};
        }
         // Mettre à jour le Set des SIRETs
        siretSet.delete(clientsStore[clientIndex].siret);
        siretSet.add(updates.siret);
    }
    
    clientsStore[clientIndex] = { ...clientsStore[clientIndex], ...updates };
    console.log(`[SIMULATION] Client ${id} updated.`);
    return { success: true, data: clientsStore[clientIndex] };
}


export async function deleteClient(id: string): Promise<{success: boolean}> {
    console.log(`[SIMULATION] Deleting client ID: ${id}`);
    const initialLength = clientsStore.length;
    const clientToDelete = clientsStore.find(c => c.id === id);

    clientsStore = clientsStore.filter(c => c.id !== id);

    if (clientToDelete && clientsStore.length < initialLength) {
        siretSet.delete(clientToDelete.siret);
        console.log(`[SIMULATION] Client ${id} deleted.`);
        return { success: true };
    }
    
    console.log(`[SIMULATION] Client ${id} not found for deletion.`);
    return { success: false };
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

    