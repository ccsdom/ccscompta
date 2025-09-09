
'use server';

import { z } from 'zod';
import { db, auth } from '@/lib/firebase-admin';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';
import { Timestamp, type DocumentSnapshot, type DocumentData } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import { UserRecord } from 'firebase-admin/auth';


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
    if (!db) {
        console.error("Firestore Admin DB not available for getClients.");
        return MOCK_CLIENTS;
    }
  const clientsCollection = db.collection('clients');
  try {
    const snapshot = await clientsCollection.get();
    let clients = snapshot.docs.map(fromFirestore);

    if (clients.length === 0) {
      console.log('No clients found in DB, attempting to seed with mock data...');
      const batch = db.batch();
      
      for (const client of MOCK_CLIENTS) {
        const { id, ...clientData } = client;
        const docRef = clientsCollection.doc(id); 
        batch.set(docRef, clientData);
      }
      await batch.commit();
      
      console.log("Mock clients seeded.");
      const seededSnapshot = await clientsCollection.get();
      clients = seededSnapshot.docs.map(fromFirestore);
    }
    
    return clients;

  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    console.log("Returning mock clients as a fallback.");
    return MOCK_CLIENTS;
  }
}

export async function getClientById(id: string): Promise<Client | undefined> {
    if (!db) {
        console.error("Firestore Admin DB not available for getClientById.");
        return MOCK_CLIENTS.find(c => c.id === id);
    }
  const clientsCollection = db.collection('clients');
  try {
    const docRef = clientsCollection.doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return fromFirestore(docSnap);
    }
    return undefined;
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
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
  if (!db) {
    return { success: false, error: "La base de données n'est pas disponible." };
  }

  const clientsCollection = db.collection('clients');

  try {
    const validatedData = AddClientInputSchema.parse(newClientData);

    const q = clientsCollection.where('siret', '==', validatedData.siret);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
      const existingClient = fromFirestore(querySnapshot.docs[0]);
      throw new Error(
        `Un client avec le SIRET ${validatedData.siret} existe déjà : ${existingClient.name}.`
      );
    }
    
    // 1. Create client document in 'clients' collection
    const dataToSave = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: Timestamp.fromDate(new Date()),
    };
    const clientDocRef = await clientsCollection.add(dataToSave);
    const newDocSnap = await clientDocRef.get();

    if (!newDocSnap.exists) {
      throw new Error('Failed to create and fetch the new client.');
    }
    const newClient = fromFirestore(newDocSnap);
    
    // Create user profile in 'users' collection on the client-side upon first login
    // This server-side code block is removed to prevent auth errors.

    return { success: true, data: newClient };
  } catch (error) {
    console.error('Error adding client:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue.',
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
   if (!db) {
    return { success: false, error: "La base de données n'est pas disponible." };
  }
  const clientsCollection = db.collection('clients');
  try {
    const validatedUpdates = UpdateClientInputSchema.parse({ id, updates });
    const docRef = clientsCollection.doc(validatedUpdates.id);

    const updatesWithActivity = {
      ...validatedUpdates.updates,
      lastActivity: Timestamp.fromDate(new Date()),
    };

    await docRef.update(updatesWithActivity);

    const updatedDoc = await docRef.get();
    if (updatedDoc.exists) {
      return { success: true, data: fromFirestore(updatedDoc) };
    }
    throw new Error('Document not found after update.');
  } catch (error) {
    console.error('Error updating client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue.',
    };
  }
}

export async function deleteClient(
  id: string
): Promise<ServerActionResponse<null>> {
   if (!db) {
    return { success: false, error: "La base de données n'est pas disponible." };
  }
  const clientsCollection = db.collection('clients');
  try {
    const docRef = clientsCollection.doc(id);
    await docRef.delete();
    return { success: true, data: null };
  } catch (error) {
    console.error('Error deleting client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue.',
    };
  }
}

const UpdateClientsStatusInputSchema = z.object({
  clientIds: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'onboarding']),
});

export async function updateClientsStatus(
    { clientIds, status }: z.infer<typeof UpdateClientsStatusInputSchema>
): Promise<{ success: boolean; updatedCount: number, error?: string }> {
    if (!db) {
      return { success: false, updatedCount: 0, error: "La base de données n'est pas disponible." };
    }
    const batch = db.batch();

    try {
        if (clientIds.length === 0) {
            return { success: true, updatedCount: 0 };
        }

        clientIds.forEach(id => {
            const docRef = db.collection('clients').doc(id);
            batch.update(docRef, { status: status, lastActivity: Timestamp.fromDate(new Date()) });
        });

        await batch.commit();
        
        return { success: true, updatedCount: clientIds.length };
    } catch (error) {
        console.error("Error updating clients status:", error);
        return { success: false, updatedCount: 0, error: error instanceof Error ? error.message : 'Erreur inconnue.' };
    }
}

export interface Accountant {
    id: string;
    name: string;
}

export async function getAccountants(): Promise<Accountant[]> {
    if (!db) {
        console.error("Firestore Admin DB not available for getAccountants.");
        return [];
    }
    try {
        const usersCollection = db.collection('users');
        const q = usersCollection.where('role', '==', 'accountant');
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return [];
        }

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Nom inconnu',
        }));
    } catch (error) {
        console.error('Error fetching accountants:', error);
        return [];
    }
}

    
