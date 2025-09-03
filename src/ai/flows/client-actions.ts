
'use server';

import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, type DocumentData, Timestamp } from 'firebase/firestore';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';


const clientsCollection = collection(db, 'clients');

// Helper to convert Firestore doc to Client type
const fromFirestore = (firestoreDoc: DocumentData): Client => {
    const data = firestoreDoc.data();
    
    let lastActivity = data.lastActivity;
    if (lastActivity instanceof Timestamp) {
        lastActivity = lastActivity.toDate().toISOString().split('T')[0];
    } else if (typeof lastActivity !== 'string') {
        lastActivity = new Date().toISOString().split('T')[0];
    }

    return {
        id: firestoreDoc.id,
        name: data.name,
        siret: data.siret,
        address: data.address,
        legalRepresentative: data.legalRepresentative,
        fiscalYearEndDate: data.fiscalYearEndDate,
        status: data.status,
        newDocuments: data.newDocuments,
        lastActivity: lastActivity,
        email: data.email,
        phone: data.phone,
        assignedAccountantId: data.assignedAccountantId,
    };
}

export async function getClients(): Promise<Client[]> {
    try {
        const snapshot = await getDocs(clientsCollection);
        if (snapshot.empty) {
            console.log("No clients found in Firestore. Seeding with mock data...");
            for (const client of MOCK_CLIENTS) {
                const { id, ...clientData } = client as any;
                await addDoc(clientsCollection, { ...clientData });
            }
            const seededSnapshot = await getDocs(clientsCollection);
            return seededSnapshot.docs.map(fromFirestore);
        }
        return snapshot.docs.map(fromFirestore);
    } catch (error) {
        console.error("Error fetching clients from Firestore:", error);
        return [];
    }
}

export async function getClientById(id: string): Promise<Client | undefined> {
     try {
        const docRef = doc(db, 'clients', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return fromFirestore(docSnap);
        } else {
            console.log("No such document!");
            return undefined;
        }
    } catch (error) {
        console.error("Error fetching client from Firestore:", error);
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


export async function addClient(newClientData: z.infer<typeof AddClientInputSchema>): Promise<Client> {
    const validatedData = AddClientInputSchema.parse(newClientData);
    try {
        const dataToSave = {
            ...validatedData,
            newDocuments: 0,
            lastActivity: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        };
        const docRef = await addDoc(clientsCollection, dataToSave);
        const newDoc = await getDoc(docRef);
        return fromFirestore(newDoc);
        
    } catch (error) {
        console.error("Error adding client to Firestore:", error);
        throw new Error("Failed to add client to Firestore.");
    }
}

const UpdateClientInputSchema = z.object({
    id: z.string(),
    updates: AddClientInputSchema.partial(),
});

export async function updateClient({ id, updates }: z.infer<typeof UpdateClientInputSchema>): Promise<Client | null> {
    const validatedUpdates = UpdateClientInputSchema.parse({ id, updates });
    try {
        const docRef = doc(db, 'clients', validatedUpdates.id);
        const updatesWithActivity = {
            ...validatedUpdates.updates,
            lastActivity: new Date().toISOString().split('T')[0],
        };
        await updateDoc(docRef, updatesWithActivity);
        
        const updatedDoc = await getDoc(docRef);
        if (updatedDoc.exists()) {
            return fromFirestore(updatedDoc)
        }
        return null;

    } catch (error) {
        console.error("Error updating client in Firestore:", error);
        return null;
    }
}

export async function deleteClient(id: string): Promise<boolean> {
    try {
        const docRef = doc(db, 'clients', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting client from Firestore:", error);
        return false;
    }
}
