
'use server';

import { z } from 'zod';
import { db as adminDb, auth as adminAuth } from '@/lib/firebase-admin';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';
import { Timestamp, type DocumentSnapshot, type DocumentData } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import { UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';


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
    const db = getFirestore();

    if (!auth || !db) {
        console.warn("Auth ou DB admin non disponible, impossible de créer les utilisateurs de démo.");
        return;
    }

    const usersToSeed = [
        { email: 'admin@ccs-compta.com', password: 'demodemo', displayName: 'Super Admin', role: 'admin' },
        { email: 'secretaire@ccs-compta.com', password: 'demodemo', displayName: 'Secrétaire Dévouée', role: 'secretary' },
        { email: 'app.ccs94@gmail.com', password: 'demodemo', displayName: 'Comptable CCS', role: 'accountant' },
        { email: 'vsw.contact@gmail.com', password: 'Aylan@2021', displayName: 'VSW Contact', role: 'client', clientId: 'client-09' }, // Link to EASYLIAGE
    ];

    for (const user of usersToSeed) {
        let userRecord: UserRecord | null = null;
        try {
            userRecord = await auth.getUserByEmail(user.email);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                try {
                    userRecord = await auth.createUser({
                        email: user.email,
                        password: user.password,
                        displayName: user.displayName,
                    });
                    console.log(`✅ Utilisateur de démo ${user.email} créé dans Auth.`);
                } catch (createError) {
                    console.error(`❌ Échec de la création de l'utilisateur Auth ${user.email}:`, createError);
                    continue; // Skip to next user if Auth creation fails
                }
            } else {
                console.error(`❌ Erreur lors de la recherche de l'utilisateur Auth ${user.email}:`, error);
                continue;
            }
        }
        
        if (userRecord) {
            const userProfileRef = db.collection('users').doc(userRecord.uid);
            const userProfileSnap = await userProfileRef.get();

            const profileData: { name: string, email: string, role: string, clientId?: string } = {
                name: user.displayName,
                email: user.email,
                role: user.role,
            };

            if (user.clientId) {
                profileData.clientId = user.clientId;
            }

            if (!userProfileSnap.exists) {
                 try {
                    await userProfileRef.set(profileData);
                    console.log(`✅ Profil Firestore créé pour ${user.email}.`);
                } catch (dbError) {
                     console.error(`❌ Échec de la création du profil Firestore pour ${user.email}:`, dbError);
                }
            } else {
                 // Ensure existing profile has the clientId if specified in seed
                if (user.clientId && userProfileSnap.data()?.clientId !== user.clientId) {
                    try {
                        await userProfileRef.update({ clientId: user.clientId });
                        console.log(`✅ Profil Firestore mis à jour pour ${user.email} avec le clientId.`);
                    } catch (dbError) {
                        console.error(`❌ Échec de la mise à jour du profil Firestore pour ${user.email}:`, dbError);
                    }
                }
            }
        }
    }
};

export async function getUserProfile(uid: string): Promise<{role: string, name: string, email: string, clientId?: string} | null> {
    const db = getFirestore();
    if (!db) return null;

    try {
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            console.error(`No profile found for UID: ${uid}.`);
            return null;
        }
        
        const data = userSnap.data();
        if (!data) return null;

        return {
            role: data.role || 'client',
            name: data.name || '',
            email: data.email || '',
            clientId: data.clientId
        };
    } catch(error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}


export async function getClients(): Promise<Client[]> {
  const db = getFirestore();
  if (!db) return MOCK_CLIENTS;

  const clientsCollection = db.collection('clients');
  try {
    const snapshot = await clientsCollection.get();
    let clients = snapshot.docs.map(fromFirestore);

    // Check if any of the mock clients exist to decide whether to seed.
    const mockClientIds = new Set(MOCK_CLIENTS.map(c => c.id));
    const existingMockClients = clients.filter(c => mockClientIds.has(c.id));

    if (existingMockClients.length === 0) {
      console.log('Clients de démo non trouvés. Création des données de démo...');
      const batch = db.batch();
      
      for (const client of MOCK_CLIENTS) {
        const { id, ...clientData } = client;
        const docRef = clientsCollection.doc(id); 
        batch.set(docRef, clientData);
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
  const db = getFirestore();
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
  email: z.string().email(),
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
  const db = getFirestore();
  const auth = adminAuth.get();
  if (!db || !auth) return { success: false, error: "La base de données ou le service d'authentification n'est pas disponible." };

  const clientsCollection = db.collection('clients');
  const usersCollection = db.collection('users');

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

    // 1. Create client document in Firestore
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

    // 2. Create user in Firebase Authentication
    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(validatedData.email);
        console.log(`User ${validatedData.email} already exists in Auth.`);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            userRecord = await auth.createUser({
                email: validatedData.email,
                displayName: validatedData.legalRepresentative,
                // A password is required, but the user should reset it.
                // It's recommended to send a password reset email in a real scenario.
                password: `temp_${Date.now()}` 
            });
             console.log(`User ${validatedData.email} created in Auth.`);
        } else {
            throw error; // Rethrow other auth errors
        }
    }

    // 3. Create user profile in 'users' collection and link it to the client
    const userProfileRef = usersCollection.doc(userRecord.uid);
    await userProfileRef.set({
        name: validatedData.legalRepresentative,
        email: validatedData.email,
        role: 'client',
        clientId: newClient.id, // Link user profile to client document ID
    });
     console.log(`User profile for ${validatedData.email} created in Firestore.`);


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
  const db = getFirestore();
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
  const db = getFirestore();
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
    const db = getFirestore();
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
    const db = getFirestore();
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
    

    

    

    
