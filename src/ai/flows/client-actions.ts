
'use server';

import { z } from 'zod';
import { db, auth } from '@/lib/firebase-admin';
import { collection, addDoc, getDocs, query, where, limit, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { MOCK_CLIENTS } from '@/data/mock-data';

type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
  
// Helper to generate a random password
const generatePassword = (length = 12) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

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
): Promise<ServerActionResponse<Omit<Client, 'id'>>> {
  console.log("[Firestore] Adding client:", newClientData.name);
  try {
    const validatedData = AddClientInputSchema.parse(newClientData);
    const tempPassword = generatePassword();
    
    // 1. Check for existing SIRET in Firestore
    const siretQuery = query(collection(db, 'clients'), where('siret', '==', validatedData.siret), limit(1));
    const siretSnapshot = await getDocs(siretQuery);
    if (!siretSnapshot.empty) {
        return { success: false, error: 'Un client avec ce SIRET existe déjà.' };
    }

    // 2. Create user in Firebase Auth
    let firebaseUser;
    try {
        firebaseUser = await auth.createUser({
            email: validatedData.email,
            password: tempPassword,
            displayName: validatedData.legalRepresentative,
        });
        console.log("[Auth] Successfully created new user:", firebaseUser.uid);
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'Un utilisateur avec cet email existe déjà dans le système d\'authentification.' };
        }
        console.error('[Auth] Error creating user:', error);
        throw new Error(`Erreur lors de la création de l'utilisateur d'authentification: ${error.message}`);
    }


    // 3. Add client profile to Firestore
    const newClient: Omit<Client, 'id' | 'password'> = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'clients'), newClient);
    console.log("[Firestore] Client added with ID:", docRef.id);
    
    // Return client data along with the temporary password
    return { 
        success: true, 
        data: { 
            ...newClient, 
            id: docRef.id,
            password: tempPassword // Include password for display to accountant
        } 
    };

  } catch (error) {
    console.error('[Firestore/Auth] Error adding client:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'ajout du client.';
    return { success: false, error: errorMessage };
  }
}

export async function getClients(): Promise<Client[]> {
    console.log("[Firestore] Fetching all clients.");
    try {
        const snapshot = await getDocs(collection(db, 'clients'));
        if (snapshot.empty) {
            console.log("No clients found in Firestore, seeding with mock data...");
            for (const client of MOCK_CLIENTS) {
                const { id, password, ...clientData } = client; // Don't seed with a hardcoded ID
                await addDoc(collection(db, 'clients'), clientData);
            }
            const seededSnapshot = await getDocs(collection(db, 'clients'));
             return seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}

export async function getClientById(id: string): Promise<Client | null> {
    console.log(`[Firestore] Fetching client by ID: ${id}`);
    try {
        const docRef = doc(db, 'clients', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as Client;
    } catch(error) {
        console.error(`Error fetching client ${id}:`, error);
        return null;
    }
}

export async function updateClient({id, updates}: {id: string, updates: Partial<Client>}): Promise<ServerActionResponse<Client>> {
    console.log(`[Firestore] Updating client ID: ${id}`);
    try {
         if (updates.siret) {
            const siretQuery = query(collection(db, 'clients'), where('siret', '==', updates.siret));
            const siretSnapshot = await getDocs(siretQuery);
            const conflictingDoc = siretSnapshot.docs.find(docData => docData.id !== id);
             if (conflictingDoc) {
                return { success: false, error: 'Un autre client utilise déjà ce SIRET.'};
            }
        }
        
        const docRef = doc(db, 'clients', id);
        await updateDoc(docRef, updates);
        const updatedDoc = await getClientById(id);
        if (!updatedDoc) throw new Error("Failed to fetch updated document.");

        console.log(`[Firestore] Client ${id} updated.`);
        return { success: true, data: updatedDoc };
    } catch(error) {
        console.error(`Error updating client ${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue.';
        return { success: false, error: errorMessage};
    }
}


export async function deleteClient(id: string): Promise<{success: boolean}> {
    console.log(`[Firestore] Deleting client ID: ${id}`);
    try {
        const client = await getClientById(id);
        // In a real app, you would also delete subcollections (documents, etc.)
        await deleteDoc(doc(db, 'clients', id));
        if (client && client.email) {
            try {
                const user = await auth.getUserByEmail(client.email);
                await auth.deleteUser(user.uid);
                console.log(`[Auth] Deleted auth user for email: ${client.email}`);
            } catch(authError: any) {
                if (authError.code !== 'auth/user-not-found') {
                    console.error(`[Auth] Failed to delete auth user for ${client.email}:`, authError);
                }
            }
        }
        console.log(`[Firestore] Client ${id} deleted.`);
        return { success: true };
    } catch (error) {
        console.error(`Error deleting client ${id}:`, error);
        return { success: false };
    }
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
