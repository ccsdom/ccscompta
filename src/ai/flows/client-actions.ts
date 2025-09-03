
'use server';

import { z } from 'genkit';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  type DocumentData,
  type DocumentSnapshot,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';

const clientsCollection = collection(db, 'clients');

// ✅ Helper: normalise un doc Firestore vers Client sérialisable
const fromFirestore = (firestoreDoc: DocumentSnapshot<DocumentData>): Client => {
  const data = firestoreDoc.data();
  if (!data) {
    throw new Error(`Document ${firestoreDoc.id} has no data`);
  }

  let lastActivity: string;
  const activityData = data.lastActivity;

  if (activityData instanceof Timestamp) {
    lastActivity = activityData.toDate().toISOString().split('T')[0];
  } else if (typeof activityData === 'string') {
    lastActivity = activityData;
  } else {
    lastActivity = new Date().toISOString().split('T')[0];
  }

  return {
    id: firestoreDoc.id,
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

export async function getClients(): Promise<Client[]> {
  try {
    const snapshot = await getDocs(clientsCollection);
    if (snapshot.empty) {
      console.log('No clients found. Seeding mock data...');
      for (const client of MOCK_CLIENTS) {
        const { id, ...clientData } = client as any;
        await addDoc(clientsCollection, { ...clientData });
      }
      const seededSnapshot = await getDocs(clientsCollection);
      return seededSnapshot.docs.map(fromFirestore);
    }
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
}

export async function getClientById(id: string): Promise<Client | undefined> {
  try {
    const docRef = doc(db, 'clients', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return fromFirestore(docSnap);
    }
    return undefined;
  } catch (error) {
    console.error('Error fetching client:', error);
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
  try {
    const validatedData = AddClientInputSchema.parse(newClientData);

    const q = query(clientsCollection, where('siret', '==', validatedData.siret));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const existingClient = fromFirestore(querySnapshot.docs[0]);
      throw new Error(
        `Un client avec le SIRET ${validatedData.siret} existe déjà : ${existingClient.name}.`
      );
    }

    const dataToSave = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: Timestamp.fromDate(new Date()), // stocke Timestamp
    };
    const docRef = await addDoc(clientsCollection, dataToSave);
    const newDocSnap = await getDoc(docRef);

    if (!newDocSnap.exists()) {
      throw new Error('Failed to create and fetch the new client.');
    }

    const newClient = fromFirestore(newDocSnap);

    return { success: true, data: newClient };
  } catch (error) {
    console.error('Error adding client:', error);
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
  try {
    const validatedUpdates = UpdateClientInputSchema.parse({ id, updates });
    const docRef = doc(db, 'clients', validatedUpdates.id);

    const updatesWithActivity = {
      ...validatedUpdates.updates,
      lastActivity: Timestamp.fromDate(new Date()),
    };

    await updateDoc(docRef, updatesWithActivity);

    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
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
  try {
    const docRef = doc(db, 'clients', id);
    await deleteDoc(docRef);
    return { success: true, data: null };
  } catch (error) {
    console.error('Error deleting client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue.',
    };
  }
}
