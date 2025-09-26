
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase-client';
import { collection, getDocs, query, where, limit, doc, getDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { MOCK_CLIENTS } from '@/data/mock-data';
import { auth as adminAuth } from '@/lib/firebase-admin';


type ServerActionResponse<T> =
  | { success: true; data: T, password?: string }
  | { success: false; error: string };

const AddClientInputSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  siret: z.string().length(14, "Le SIRET doit contenir 14 chiffres.").optional(),
  email: z.string().email("Email invalide."),
  phone: z.string().optional(),
  legalRepresentative: z.string().optional(),
  address: z.string().optional(),
  fiscalYearEndDate: z.string().regex(/^(3[01]|[12][0-9]|0[1-9])\/(1[0-2]|0[1-9])$/, "Format JJ/MM invalide.").optional(),
  role: z.enum(['client', 'admin', 'accountant', 'secretary']),
  assignedAccountantId: z.string().optional(),
});


export async function addClient(
  clientData: z.infer<typeof AddClientInputSchema>
): Promise<ServerActionResponse<Client>> {
  console.log("[Client Action] Adding user profile:", clientData.name);
  
  try {
    const validatedData = AddClientInputSchema.parse(clientData);

    const { email, role, siret, ...profileData } = validatedData;
    
    let password = 'password'; // Default for staff
    if (role === 'client') {
        if (siret && siret.length === 14) {
            password = siret;
        } else {
             return { success: false, error: "Le SIRET est requis et doit comporter 14 chiffres pour créer un compte client." };
        }
    }

    // 1. Create user in Firebase Auth using Admin SDK
    let userRecord;
    try {
         userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            emailVerified: true,
            disabled: false,
            displayName: profileData.name,
        });
    } catch(authError: any) {
        if (authError.code === 'auth/email-already-exists') {
            return { success: false, error: 'Un compte utilisateur avec cet email existe déjà.' };
        }
        throw authError; // Rethrow other auth errors
    }

    // 2. Set custom claim for role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: role });

    // 3. Create profile in Firestore
    const clientDocRef = doc(db, 'clients', userRecord.uid);
    const newUser: Omit<Client, 'id' | 'status'> = {
      ...validatedData,
      newDocuments: 0,
      lastActivity: new Date().toISOString(),
    };

    await setDoc(clientDocRef, newUser);
    console.log("[Client Action] User profile added with ID:", userRecord.uid);
    
    return { 
        success: true, 
        data: { 
            ...newUser, 
            id: userRecord.uid,
            status: 'onboarding', // default status
        },
        password: password 
    };

  } catch (error) {
    console.error('[Client Action] Error adding user profile:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'ajout du profil utilisateur.';
    return { success: false, error: errorMessage };
  }
}

export async function getClients(): Promise<Client[]> {
    console.log("[Firestore] Fetching all user profiles (clients and staff).");
    try {
        const snapshot = await getDocs(collection(db, 'clients'));
        
        if (snapshot.empty && MOCK_CLIENTS.length > 0) {
            console.log("No users found in Firestore, seeding with mock data...");
            const batch = writeBatch(db);

            for (const client of MOCK_CLIENTS) {
                try {
                    let userRecord;
                    // Try to get user first, create if not exists
                    try {
                        userRecord = await adminAuth.getUserByEmail(client.email);
                        console.log(`Mock user ${client.email} already exists in Auth. Setting role and overwriting Firestore doc.`);
                         await adminAuth.setCustomUserClaims(userRecord.uid, { role: client.role });
                    } catch (error: any) {
                        if (error.code === 'auth/user-not-found') {
                            console.log(`Creating mock user ${client.email} in Auth.`);
                            userRecord = await adminAuth.createUser({
                                email: client.email,
                                password: client.password, // This is crucial for login
                                emailVerified: true,
                                disabled: false,
                                displayName: client.name,
                            });
                            await adminAuth.setCustomUserClaims(userRecord.uid, { role: client.role });
                        } else {
                            throw error; // Rethrow other auth errors
                        }
                    }
                    
                    // ALWAYS set Firestore doc to ensure consistency
                    const docRef = doc(db, 'clients', userRecord.uid);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id, password, ...clientData } = client; 
                    batch.set(docRef, clientData);

                } catch (error: any) {
                     console.error(`Error seeding user ${client.email}:`, error);
                }
            }
            await batch.commit();
            console.log("Seeding complete. Refetching users...");
            const seededSnapshot = await getDocs(collection(db, 'clients'));
             return seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function getClientById(id: string): Promise<Client | null> {
    console.log(`[Firestore] Fetching user profile by ID: ${id}`);
    try {
        const docRef = doc(db, 'clients', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as Client;
    } catch(error) {
        console.error(`Error fetching user ${id}:`, error);
        return null;
    }
}

export async function updateClient({id, updates}: {id: string, updates: Partial<Omit<Client, 'id' | 'email'>>}): Promise<ServerActionResponse<Client>> {
    console.log(`[Firestore] Updating user profile ID: ${id}`);
    try {
         if (updates.siret) {
            const siretQuery = query(collection(db, 'clients'), where('siret', '==', updates.siret));
            const siretSnapshot = await getDocs(siretQuery);
            const conflictingDoc = siretSnapshot.docs.find(docData => docData.id !== id);
             if (conflictingDoc) {
                return { success: false, error: 'Un autre utilisateur utilise déjà ce SIRET.'};
            }
        }
        
        const docRef = doc(db, 'clients', id);
        await setDoc(docRef, updates, { merge: true });

        const updatedDoc = await getClientById(id);
        if (!updatedDoc) throw new Error("Failed to fetch updated document.");

        console.log(`[Firestore] User profile ${id} updated.`);
        return { success: true, data: updatedDoc };
    } catch(error) {
        console.error(`Error updating user ${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue.';
        return { success: false, error: errorMessage};
    }
}


export async function deleteClient(id: string): Promise<{success: boolean}> {
    console.log(`[Firestore] Deleting user profile ID: ${id}`);
    try {
        // Use Admin SDK to delete the user from Auth
        await adminAuth.deleteUser(id);
        console.log(`[Admin SDK] Auth user ${id} deleted.`);
        
        // Delete Firestore document
        await deleteDoc(doc(db, 'clients', id));
        console.log(`[Firestore] User profile ${id} deleted.`);
        
        return { success: true };
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
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
