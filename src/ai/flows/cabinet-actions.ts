
'use server';

import { db } from '@/lib/firebase-server';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import type { Cabinet } from '@/lib/types';
import { z } from 'zod';

type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const AddCabinetInputSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide.").optional(),
});

export async function addCabinet(
  cabinetData: z.infer<typeof AddCabinetInputSchema>
): Promise<ServerActionResponse<Cabinet>> {
  console.log("[Cabinet Action] Adding new cabinet:", cabinetData.name);
  try {
    const validatedData = AddCabinetInputSchema.parse(cabinetData);
    
    // Check for duplicates
    const q = query(collection(db, 'cabinets'), where('name', '==', validatedData.name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, error: 'Un cabinet avec ce nom existe déjà.' };
    }

    const docRef = await addDoc(collection(db, 'cabinets'), validatedData);
    
    const newCabinet: Cabinet = {
        id: docRef.id,
        ...validatedData,
    };
    
    console.log("[Cabinet Action] Cabinet created with ID:", docRef.id);
    return { success: true, data: newCabinet };
  } catch (error) {
    console.error('[Cabinet Action] Error adding cabinet:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: `Données invalides: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}` };
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'ajout du cabinet.';
    return { success: false, error: errorMessage };
  }
}

export async function getCabinets(): Promise<Cabinet[]> {
    console.log("[Firestore] Fetching all cabinets.");
    try {
        const snapshot = await getDocs(collection(db, 'cabinets'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cabinet));
    } catch (error) {
        console.error("Error fetching cabinets:", error);
        return [];
    }
}

export async function getCabinetById(id: string): Promise<Cabinet | null> {
    console.log(`[Firestore] Fetching cabinet by ID: ${id}`);
    try {
        const docRef = doc(db, 'cabinets', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as Cabinet;
    } catch(error) {
        console.error(`Error fetching cabinet ${id}:`, error);
        return null;
    }
}
