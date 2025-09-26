
'use server';

import { auth } from '@/lib/firebase-admin';
import { getClientById, updateClient } from './client-actions';

/**
 * Sets the 'admin' role on a user account via custom claims.
 * This is a critical administrative action.
 * @param uid The user ID to grant admin role to.
 */
export async function setAdminClaim(uid: string): Promise<{success: boolean, error?: string}> {
    try {
        const user = await auth.getUser(uid);
        const currentClaims = user.customClaims || {};
        
        // Avoid setting if already admin
        if (currentClaims.role === 'admin') {
            console.log(`User ${uid} is already an admin.`);
            return { success: true };
        }

        await auth.setCustomUserClaims(uid, { ...currentClaims, role: 'admin' });
        
        // Also update the role in the Firestore document if it exists
        const clientProfile = await getClientById(uid);
        if (clientProfile) {
            await updateClient({ id: uid, updates: { role: 'admin' } });
        }

        console.log(`Successfully set admin role for user ${uid}`);
        return { success: true };
    } catch (error: any) {
        console.error(`Error setting admin claim for ${uid}:`, error);
        return { success: false, error: error.message };
    }
}
