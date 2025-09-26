
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
      // N'importe quel utilisateur authentifié (comptable, admin, client) peut lire les fichiers.
      // C'est nécessaire pour que le comptable puisse accéder aux documents de ses clients.
      allow read: if request.auth != null;

      // ÉCRITURE (create, update, delete):
      // Un utilisateur ne peut écrire, modifier ou supprimer des fichiers
      // que dans son propre dossier.
      // On vérifie que l'UID de l'utilisateur connecté (request.auth.uid)
      // correspond à l'ID du dossier (clientId).
      allow write: if request.auth != null && request.auth.uid == clientId;
    }
  }
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
 *
 * @returns {Promise<{success: boolean, rules: string}>} An object containing the success status and the recommended Firestore rules.
 */
export async function configureFirestoreSecurityRules(): Promise<{success: boolean, rules: string}> {
  const rules = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Règle pour la collection 'clients'
    match /clients/{clientId} {
      // Les comptables/admins (ceux qui n'existent PAS dans la collection 'clients') peuvent lire TOUS les profils.
      // Un client ne peut lire que SON PROPRE profil.
      allow read: if request.auth != null && (!exists(/databases/$(database)/documents/clients/$(request.auth.uid)) || request.auth.uid == clientId);
      
      // Un client peut mettre à jour son propre profil.
      // Les comptables/admins peuvent mettre à jour tous les profils.
      allow update: if request.auth != null && (!exists(/databases/$(database)/documents/clients/$(request.auth.uid)) || request.auth.uid == clientId);
      
      // La création/suppression est réservée aux comptables/admins.
      allow create, delete: if request.auth != null && !exists(/databases/$(database)/documents/clients/$(request.auth.uid));
    }
    
    // Règle pour les collections liées à un client (documents, factures, bilans)
    function isOwner(clientId) {
      return request.auth.uid == clientId;
    }

    function isAccountant() {
      return request.auth != null && !exists(/databases/$(database)/documents/clients/$(request.auth.uid));
    }

    match /documents/{docId} {
      // Le propriétaire du document (vérifié via le champ 'clientId' du document) OU un comptable/admin peut lire/écrire.
      allow read, write: if isAccountant() || (resource.data.clientId != null && isOwner(resource.data.clientId));
    }

    match /invoices/{invoiceId} {
       // Le propriétaire de la facture OU un comptable/admin peut lire/écrire.
       allow read, write: if isAccountant() || (resource.data.clientId != null && isOwner(resource.data.clientId));
    }
    
    match /bilans/{bilanId} {
       // Le propriétaire du bilan OU un comptable/admin peut lire/écrire.
       allow read, write: if isAccountant() || (resource.data.clientId != null && isOwner(resource.data.clientId));
    }
  }
}
  `.trim();

  return {
    success: true,
    rules: rules,
  };
}
    


    