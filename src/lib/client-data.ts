
'use server';

import { db } from './firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, type DocumentData } from 'firebase/firestore';

// Central definition for the Client type
export interface Client {
    id: string;
    name: string;
    siret: string;
    address: string;
    legalRepresentative: string;
    fiscalYearEndDate: string;
    status: 'active' | 'inactive' | 'onboarding';
    newDocuments: number;
    lastActivity: string;
    email: string;
    phone: string;
    assignedAccountantId?: string;
}

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


export async function getClients(): Promise<Client[]> {
    try {
        const snapshot = await getDocs(clientsCollection);
        if (snapshot.empty) {
            console.log("No clients found in Firestore. Seeding with mock data...");
            const { MOCK_CLIENTS } = await import('@/data/mock-data');
            for (const client of MOCK_CLIENTS) {
                // Ensure no conflicting fields like 'id' are spread
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

export async function addClient(newClientData: Omit<Client, 'id' | 'newDocuments' | 'lastActivity'> & { assignedAccountantId?: string }): Promise<Client> {
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
        throw error; // Re-throw the error to be handled by the caller
    }
}

export async function updateClient(id: string, updatedData: Partial<Omit<Client, 'id'>>): Promise<Client | null> {
    try {
        const docRef = doc(db, 'clients', id);
        await updateDoc(docRef, updatedData);
        
        // Return the updated client data
        const updatedDoc = await getDoc(docRef);
        if (updatedDoc.exists()) {
            return fromFirestore(updatedDoc)
        }
        return null

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
