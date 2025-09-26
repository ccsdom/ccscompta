
'use server';

/**
 * @fileOverview Actions related to Firebase security rules configuration.
 */

/**
 * Provides the recommended Firestore security rules to allow authenticated access.
 * This version uses a role field within each user's document for role-based access control.
 *
 * @returns {Promise<{success: boolean, rules: string}>} An object containing the success status and the recommended Firestore rules.
 */
export async function configureFirestoreSecurityRules(): Promise<{success: boolean, rules: string}> {
  const rules = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- FONCTIONS D'AIDE BASÉES SUR LE JETON D'AUTH (CUSTOM CLAIMS) ---
    function getCallerRole() {
      // Lit le rôle directement à partir du jeton d'authentification (rapide et gratuit)
      return request.auth.token.role; 
    }
    
    function isStaff() {
      return request.auth != null && getCallerRole() in ['admin', 'accountant', 'secretary'];
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return request.auth != null && getCallerRole() == 'admin';
    }

    // --- COLLECTION D'UTILISATEURS ('clients') ---
    match /clients/{userId} {
      allow read, list: if isStaff() || isOwner(userId);
      // Règle cruciale : Autorise un nouvel utilisateur à créer son propre profil.
      allow create: if request.auth.uid == userId;
      // Seul un admin peut supprimer un utilisateur.
      allow delete: if isAdmin();
      // Un utilisateur ne peut pas changer son propre rôle, sauf s'il est admin.
      allow update: if (isOwner(userId) && !("role" in request.resource.data)) || isAdmin();
    }

    // --- AUTRES COLLECTIONS ---

    match /documents/{docId} {
      allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
      allow create: if request.auth.uid == request.resource.data.clientId;
      allow update: if isStaff() || (request.auth.uid == resource.data.clientId);
      allow delete: if isStaff() || (request.auth.uid == resource.data.clientId);
    }
    
    match /invoices/{invoiceId} {
        allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
        allow create, update, delete: if isStaff();
    }
    
     match /bilans/{bilanId} {
        allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
        allow create, update, delete: if isStaff();
    }
  }
}
  `.trim();

  return {
    success: true,
    rules: rules,
  };
}
