

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
  siret: z.string().length(14, "Le SIRET doit contenir 14 chiffres.").optional().or(z.literal('')),
  email: z.string().email("Email invalide."),
  phone: z.string().optional(),
  legalRepresentative: z.string().optional(),
  address: z.string().optional(),
  fiscalYearEndDate: z.string().regex(/^(3[01]|[12][0-9]|0[1-9])\/(1[0-2]|0[1-9])$/, "Format JJ/MM invalide.").optional(),
  role: z.enum(['client', 'admin', 'accountant', 'secretary']),
  assignedAccountantId: z.string().optional(),
  cabinetId: z.string().optional(),
  password: z.string().optional(),
});


export async function addClient(
  clientData: Omit<z.infer<typeof AddClientInputSchema>, 'uid'>
): Promise<ServerActionResponse<Client>> {
  console.log("[Client Action] SERVER-SIDE: Adding user profile:", clientData.name);
  
  try {
    // 1. Validate incoming data
    const validatedData = AddClientInputSchema.omit({uid: true}).parse(clientData);
    const { role, ...profileData } = validatedData;
    
    // 2. Determine password
    let password = validatedData.password;
    if (!password) {
        if (role === 'client' && validatedData.siret) {
            password = validatedData.siret;
        } else {
            password = `password${Math.floor(Math.random() * 1000)}`;
        }
    }

    // 3. Create user in Firebase Auth using Admin SDK
    const userRecord = await adminAuth.createUser({
        email: validatedData.email,
        password: password,
        displayName: validatedData.name,
        emailVerified: true,
        disabled: false
    });
    const uid = userRecord.uid;

    // 4. Set custom claims for the role
    await adminAuth.setCustomUserClaims(uid, { role: role });

    // 5. Create profile in Firestore
    const clientDocRef = doc(db, 'clients', uid);
    const newUser: Omit<Client, 'id'| 'uid'> = {
      ...profileData,
      role, // include role in the document
      newDocuments: 0,
      lastActivity: new Date().toISOString(),
      status: 'onboarding',
    };
    
    // Explicitly remove undefined fields to prevent Firestore errors
    const cleanUser = Object.fromEntries(
        Object.entries(newUser).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    
    await setDoc(clientDocRef, cleanUser);
    
    console.log("[Client Action] SERVER-SIDE: User profile and Auth account created with ID:", uid);
    
    const finalDoc = await getDoc(clientDocRef);

    return { 
        success: true, 
        data: { 
            ...(finalDoc.data() as Client),
            id: uid
        },
        password: password // Return the generated password
    };

  } catch (error: any) {
    console.error('[Client Action] SERVER-SIDE: Error adding user:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    // Handle specific errors that might occur if the Admin SDK is not configured
    if (error.code === 'auth/email-already-exists') {
        return { success: false, error: 'Un compte avec cet email existe déjà.'}
    }
    if (error.code === 'auth/invalid-password') {
        return { success: false, error: `Le mot de passe doit contenir au moins 6 caractères.`}
    }
     if (error.message && error.message.includes('access token')) {
       return { success: false, error: "Erreur de configuration du serveur : Les permissions d'administration Firebase ne sont pas correctement configurées. Veuillez suivre la procédure de configuration de l'administrateur dans les Paramètres."};
    }

    const errorMessage = error.message ? error.message : 'Erreur inconnue lors de l\'ajout de l\'utilisateur.';
    return { success: false, error: errorMessage };
  }
}

export async function getClients(cabinetId?: string): Promise<Client[]> {
    console.log(`[Firestore] Fetching user profiles (clients and staff)${cabinetId ? ` for cabinet ${cabinetId}` : ''}.`);
    try {
        let q = query(collection(db, 'clients'));
        if (cabinetId) {
            q = query(q, where('cabinetId', '==', cabinetId));
        }

        const snapshot = await getDocs(q);
        
        // Seeding logic should probably not be tied to a specific cabinet query
        if (snapshot.empty && MOCK_CLIENTS.length > 0 && !cabinetId) {
            console.log("No users found in Firestore, seeding with mock data...");
            const batch = writeBatch(db);

            for (const client of MOCK_CLIENTS) {
                try {
                    const userRecord = await adminAuth.createUser({
                        email: client.email,
                        password: client.password, // This is crucial for login
                        emailVerified: true,
                        disabled: false,
                        displayName: client.name,
                    });
                    
                    // Set their role via custom claims
                    await adminAuth.setCustomUserClaims(userRecord.uid, { role: client.role });
                    
                    // ALWAYS set Firestore doc to ensure consistency
                    const docRef = doc(db, 'clients', userRecord.uid);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id, password, ...clientData } = client; 
                    batch.set(docRef, clientData);

                } catch (error: any) {
                     if (error.code === 'auth/email-already-exists') {
                         console.log(`Mock user ${client.email} already exists in Auth. Skipping Auth creation, ensuring Firestore doc is set.`);
                         // If user exists, we can't be sure of the password, but we can ensure the Firestore doc is there.
                         // This path is problematic and the "delete then create" is better. Let's try to get UID.
                         try {
                            const existingUser = await adminAuth.getUserByEmail(client.email);
                            await adminAuth.setCustomUserClaims(existingUser.uid, { role: client.role });
                            const docRef = doc(db, 'clients', existingUser.uid);
                             // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { id, password, ...clientData } = client; 
                            batch.set(docRef, clientData, {merge: true}); // Merge to not overwrite all data if it's already there
                         } catch(e) {
                             console.error(`Could not update existing mock user ${client.email}`, e);
                         }

                     } else {
                        console.error(`Error seeding user ${client.email}:`, error.message);
                     }
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

export async function updateClient({id, updates}: {id: string, updates: Partial<Omit<Client, 'id'>>}): Promise<ServerActionResponse<Client>> {
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
        
        if (updates.email && updates.email !== (await adminAuth.getUser(id)).email) {
             await adminAuth.updateUser(id, { email: updates.email });
        }
        
        // If the role is being updated, also update the custom claim
        if (updates.role) {
            await adminAuth.setCustomUserClaims(id, { role: updates.role });
        }

        const docRef = doc(db, 'clients', id);
        await setDoc(docRef, updates, { merge: true });

        const updatedDoc = await getClientById(id);
        if (!updatedDoc) throw new Error("Failed to fetch updated document.");

        console.log(`[Firestore] User profile ${id} updated.`);
        return { success: true, data: updatedDoc };
    } catch(error) {
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
    { id: 'user-comptable-ccs', name: 'Comptable CCS' },
];

export async function getAccountants(): Promise<Accountant[]> {
    console.log("[Firestore] Fetching accountants.");
    try {
        const q = query(collection(db, 'clients'), where('role', '==', 'accountant'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return MOCK_ACCOUNTANTS;
        return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
    } catch (e) {
        console.error("Error fetching accountants, returning mock data", e);
        return MOCK_ACCOUNTANTS;
    }
}
