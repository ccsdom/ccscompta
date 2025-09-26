
'use server';

/**
 * @fileOverview Actions related to Firebase security rules configuration.
 */

/**
 * In a real scenario, this function would use the Firebase Admin SDK to
 * deploy new security rules programmatically. However, for this environment,
 * this function serves as a placeholder to provide the user with the correct
 * security rules to apply manually in their Firebase Console.
 *
 * @returns {Promise<{success: boolean, rules: string}>} An object containing the success status and the recommended rules.
 */
export async function configureStorageSecurityRules(): Promise<{success: boolean, rules: string}> {
  
  const rules = `
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // Les fichiers sont stockés par client, dans un dossier qui porte leur ID utilisateur (uid).
    // ex: /client-id-123/facture.pdf
    match /{clientId}/{allPaths=**} {
    
      // LECTURE (get, list):
      // Un comptable/admin peut lire tous les fichiers.
      // Un client ne peut lire que ses propres fichiers.
      allow read: if request.auth != null && (isAccountant() || request.auth.uid == clientId);

      // ÉCRITURE (create, update, delete):
      // Un client ne peut écrire, modifier ou supprimer des fichiers
      // que dans son propre dossier.
      // On vérifie que l'UID de l'utilisateur connecté (request.auth.uid)
      // correspond à l'ID du dossier (clientId).
      allow write: if request.auth != null && request.auth.uid == clientId;
    }
  }
}

// Helper function to check for admin/accountant/secretary roles
function isAccountant() {
  return request.auth.token.role == 'admin' || request.auth.token.role == 'accountant' || request.auth.token.role == 'secretary';
}
  `.trim();

  // This function doesn't actually deploy anything.
  // It just returns the rules for the user to apply.
  return {
    success: true,
    rules: rules,
  };
}


/**
 * Provides the recommended Firestore security rules to allow authenticated access.
 * This version uses Custom Claims for role-based access control.
 *
 * @returns {Promise<{success: boolean, rules: string}>} An object containing the success status and the recommended Firestore rules.
 */
export async function configureFirestoreSecurityRules(): Promise<{success: boolean, rules: string}> {
  const rules = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check for admin/accountant/secretary roles via Custom Claims
    function isAccountant() {
      return request.auth.token.role == 'admin' || request.auth.token.role == 'accountant' || request.auth.token.role == 'secretary';
    }

    // CLIENTS collection
    // Accountants can list and read all clients.
    // A client can only read their own profile.
    // Accountants can create/update clients.
    match /clients/{clientId} {
      allow list, read: if isAccountant();
      allow get: if isAccountant() || request.auth.uid == clientId;
      allow create, update: if isAccountant();
      allow delete: if isAccountant(); // Deletion is a sensitive operation
    }

    // DOCUMENTS collection
    // Accountants can list/read all documents.
    // A client can only list/read their own documents.
    // Anyone authenticated can create a document (client upload), but only for themselves.
    // Accountants can update documents (e.g., status). A client can update their own (e.g., add comment).
    match /documents/{docId} {
      allow list, read: if isAccountant() || request.auth.uid == resource.data.clientId;
      
      allow create: if request.auth.uid == request.resource.data.clientId;
      allow update: if isAccountant() || request.auth.uid == resource.data.clientId;
      allow delete: if request.auth.uid == resource.data.clientId || isAccountant();
    }
    
    // INVOICES, BILANS, and other collections should follow a similar pattern.
    // Accountants have full access. Clients have access only to their own documents.
    
    match /invoices/{invoiceId} {
        allow read, list: if isAccountant() || request.auth.uid == resource.data.clientId;
        allow create, update: if isAccountant();
    }
    
     match /bilans/{bilanId} {
        allow read, list: if isAccountant() || request.auth.uid == resource.data.clientId;
        allow create, update: if isAccountant();
    }
  }
}
  `.trim();

  return {
    success: true,
    rules: rules,
  };
}
    


    




