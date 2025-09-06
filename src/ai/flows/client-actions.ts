
'use server';

import { z } from 'zod';
import { db as adminDb, auth as adminAuth } from '@/lib/firebase-admin';
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
  } else if (typeof activityData === 'string') {
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

export const ensureDemoUsers = async () => {
    const auth = adminAuth.get();
    const db = adminDb.get();

    if (!auth || !db) {
        console.warn("Auth ou DB admin non disponible, impossible de créer les utilisateurs de démo.");
        return;
    }

    const usersToSeed = [
        { email: 'admin@ccs-compta.com', password: 'demodemo', displayName: 'Super Admin', role: 'admin' },
        { email: 'secretaire@ccs-compta.com', password: 'demodemo', displayName: 'Secrétaire Dévouée', role: 'secretary' },
        { email: 'app.ccs94@gmail.com', password: 'demodemo', displayName: 'Comptable CCS', role: 'accountant' },
    ];

    for (const user of usersToSeed) {
        try {
            await auth.getUserByEmail(user.email);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                try {
                    const newUserRecord = await auth.createUser({
                        email: user.email,
                        password: user.password,
                        displayName: user.displayName,
                    });
                    
                    const userProfileRef = db.collection('users').doc(newUserRecord.uid);
                    await userProfileRef.set({
                        name: user.displayName,
                        email: user.email,
                        role: user.role,
                    });
                    console.log(`✅ Utilisateur de démo ${user.email} et profil créés.`);
                } catch (createError) {
                    console.error(`❌ Échec de la création de l'utilisateur ${user.email}:`, createError);
                }
            }
        }
    }
};

export async function getUserProfile(uid: string): Promise<{role: string, name: string, email: string, clientId?: string} | null> {
    const db = adminDb.get();
    if (!db) return null;

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        return null;
    }
    const data = userSnap.data();
    return {
        role: data?.role || 'client',
        name: data?.name || '',
        email: data?.email || '',
        clientId: data?.clientId
    };
}


export async function getClients(): Promise<Client[]> {
  const db = adminDb.get();
  if (!db) return MOCK_CLIENTS;

  const clientsCollection = db.collection('clients');
  try {
    const snapshot = await clientsCollection.get();
    let clients = snapshot.docs.map(fromFirestore);

    const alphaClientExists = clients.some(c => c.id === 'alpha');

    if (!alphaClientExists) {
      console.log('Clients de démo non trouvés. Création des données de démo...');
      const batch = db.batch();
      const existingClientIds = new Set(clients.map(c => c.id));
      
      for (const client of MOCK_CLIENTS) {
        if (!existingClientIds.has(client.id)) {
            const { id, ...clientData } = client;
            const docRef = clientsCollection.doc(id); 
            batch.set(docRef, clientData);
        }
      }
      await batch.commit();
      
      const seededSnapshot = await clientsCollection.get();
      clients = seededSnapshot.docs.map(fromFirestore);
    }
    
    return clients;

  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return [];
  }
}

export async function getClientById(id: string): Promise<Client | undefined> {
  const db = adminDb.get();
  if (!db) return undefined;

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
  name: z.string(),
  siret: z.string(),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
  legalRepresentative: z.string(),
  address: z.string(),
  fiscalYearEndDate: z.string(),
  status: z.enum(['active', 'inactive', 'onboarding']),
  assignedAccountantId: z.string().optional(),
});

type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function addClient(
  newClientData: z.infer<typeof AddClientInputSchema>
): Promise<ServerActionResponse<Client>> {
  const db = adminDb.get();
  if (!db) return { success: false, error: "La base de données n'est pas disponible." };

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

    const dataToSave = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: Timestamp.fromDate(new Date()),
    };
    const docRef = await clientsCollection.add(dataToSave);
    const newDocSnap = await docRef.get();

    if (!newDocSnap.exists) {
      throw new Error('Failed to create and fetch the new client.');
    }

    const newClient = fromFirestore(newDocSnap);

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
  const db = adminDb.get();
  if (!db) return { success: false, error: "La base de données n'est pas disponible." };
  
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
  const db = adminDb.get();
  if (!db) return { success: false, error: "La base de données n'est pas disponible." };

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
    const db = adminDb.get();
    if (!db) return { success: false, updatedCount: 0, error: "La base de données n'est pas disponible." };
    
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
    const db = adminDb.get();
    if (!db) return [];

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
