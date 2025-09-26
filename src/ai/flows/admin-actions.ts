
'use server';

import { auth, db } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc } from 'firebase/firestore';


/**
 * Sets the 'admin' custom claim for a given user UID.
 * This function MUST be called from a server environment.
 * @param uid The UID of the user to make an admin.
 * @returns A promise that resolves when the claim is set.
 */
export async function setAdminClaim(uid: string): Promise<{success: boolean, message: string}> {
  try {
    if (!uid) {
        throw new Error("L'UID de l'utilisateur est manquant.");
    }
    // Check if a profile exists, if not we can't do anything server-side without more info.
    // The client-side logic in settings page should create the profile first.
    const userProfileRef = doc(db, 'clients', uid);
    const userProfileSnap = await getDoc(userProfileRef);

    if (!userProfileSnap.exists()) {
        console.warn(`[Admin Action] Attempted to set admin claim for user ${uid} without a profile. The client should create the profile first.`);
        // To be safe, we still proceed to set the claim. The client logic handles profile creation.
    }

    await auth.setCustomUserClaims(uid, { role: 'admin' });
    console.log(`[Admin Action] Successfully set admin claim for user: ${uid}`);
    return { success: true, message: `Le rôle d'administrateur a été attribué à l'utilisateur ${uid}.` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
    console.error(`[Admin Action] Error setting admin claim for user ${uid}:`, errorMessage);
    return { success: false, message: `Échec de l'attribution du rôle d'administrateur : ${errorMessage}` };
  }
}
