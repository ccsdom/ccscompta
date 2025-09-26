
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
    
    function isAccountant() {
      // Un comptable/admin est un utilisateur authentifié qui N'EXISTE PAS dans la collection 'clients'.
      return request.auth != null && !exists(/databases/$(database)/documents/clients/$(request.auth.uid));
    }
    
    // Règle pour la collection 'clients'
    match /clients/{clientId} {
      // LIST (pour les requêtes de collection, ex: getDocs(collection(...)) )
      // Seuls les comptables/admins peuvent lister l'ensemble des clients.
      allow list: if isAccountant();

      // GET (pour les requêtes sur un seul document, ex: getDoc(doc(...)) )
      // Un client peut lire son propre profil, un comptable peut lire n'importe quel profil.
      allow get: if isAccountant() || request.auth.uid == clientId;

      // UPDATE
      // Un client peut mettre à jour son propre profil, un comptable peut tout mettre à jour.
      allow update: if isAccountant() || request.auth.uid == clientId;

      // CREATE, DELETE
      // Seuls les comptables/admins peuvent créer ou supprimer des clients.
      allow create, delete: if isAccountant();
    }
    
    // Règle pour les collections liées à un client (documents, factures, bilans)
    function isOwner(docData) {
      return request.auth.uid == docData.clientId;
    }

    match /documents/{docId} {
      // Le propriétaire du document (vérifié via le champ 'clientId' du document) OU un comptable/admin peut tout faire.
      allow read, write: if isAccountant() || isOwner(resource.data);
    }

    match /invoices/{invoiceId} {
       // Le propriétaire de la facture OU un comptable/admin peut tout faire.
       allow read, write: if isAccountant() || isOwner(resource.data);
    }
    
    match /bilans/{bilanId} {
       // Le propriétaire du bilan OU un comptable/admin peut tout faire.
       allow read, write: if isAccountant() || isOwner(resource.data);
    }
  }
}
  `.trim();

  return {
    success: true,
    rules: rules,
  };
}
    


    
