
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, type DocumentData } from 'firebase/firestore';
import { MOCK_CLIENTS } from '@/data/mock-data';
import type { Client } from '@/lib/client-data';


const clientsCollection = collection(db, 'clients');

// Helper to convert Firestore doc to Client type
const fromFirestore = (firestoreDoc: DocumentData): Client => {
    const data = firestoreDoc.data();
    return {
        id: firestoreDoc.id,
        name: data.name,
        siret: data.siret,
        address: data.address,
        legalRepresentative: data.legalRepresentative,
        fiscalYearEndDate: data.fiscalYearEndDate,
        status: data.status,
        newDocuments: data.newDocuments,
        lastActivity: data.lastActivity,
        email: data.email,
        phone: data.phone,
        assignedAccountantId: data.assignedAccountantId,
    };
}

export const getClients = ai.defineFlow(
    { name: 'getClients', outputSchema: z.array(z.any()) },
    async () => {
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
);

export const getClientById = ai.defineFlow(
    { name: 'getClientById', inputSchema: z.string(), outputSchema: z.any().optional() },
    async (id) => {
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
);

const AddClientInputSchema = z.object({
  name: z.string(),
  siret: z.string(),
  email: z.string(),
  phone: z.string(),
  legalRepresentative: z.string(),
  address: z.string(),
  fiscalYearEndDate: z.string(),
  status: z.enum(['active', 'inactive', 'onboarding']),
  assignedAccountantId: z.string().optional(),
});


export const addClient = ai.defineFlow(
    { name: 'addClient', inputSchema: AddClientInputSchema, outputSchema: z.any() },
    async (newClientData) => {
        try {
            const dataToSave = {
                ...newClientData,
                newDocuments: 0,
                lastActivity: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            };
            const docRef = await addDoc(clientsCollection, dataToSave);
            return {
                id: docRef.id,
                ...dataToSave
            };
        } catch (error) {
            console.error("Error adding client to Firestore:", error);
            throw error;
        }
    }
);

const UpdateClientInputSchema = z.object({
    id: z.string(),
    updates: AddClientInputSchema.partial(),
});

export const updateClient = ai.defineFlow(
    { name: 'updateClient', inputSchema: UpdateClientInputSchema, outputSchema: z.any().nullable() },
    async ({ id, updates }) => {
        try {
            const docRef = doc(db, 'clients', id);
            await updateDoc(docRef, updates);
            
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
);

export const deleteClient = ai.defineFlow(
    { name: 'deleteClient', inputSchema: z.string(), outputSchema: z.boolean() },
    async (id) => {
        try {
            const docRef = doc(db, 'clients', id);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error("Error deleting client from Firestore:", error);
            return false;
        }
    }
);
