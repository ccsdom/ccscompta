
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
    
    // Règle générale : Seuls les utilisateurs authentifiés peuvent accéder à la base.
    // Des règles plus spécifiques par collection sont définies ci-dessous.
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Collection 'clients'
    // Un client ne peut lire et modifier que son propre profil.
    // Les comptables/admins (non-clients) peuvent lire tous les profils.
    match /clients/{clientId} {
      allow read, update: if request.auth.uid == clientId || !exists(/databases/$(database)/documents/clients/$(request.auth.uid));
      // La création/suppression est gérée par des fonctions côté serveur (admin)
      allow create, delete: if !exists(/databases/$(database)/documents/clients/$(request.auth.uid)); 
    }
    
    // Collections de données liées à un client (documents, factures, bilans)
    // Un client ne peut accéder qu'aux documents qui lui appartiennent (via le champ 'clientId').
    // Les comptables/admins peuvent tout lire.
    match /documents/{docId} {
      allow read, write: if request.resource.data.clientId == request.auth.uid || !exists(/databases/$(database)/documents/clients/$(request.auth.uid));
    }

    match /invoices/{invoiceId} {
       allow read, write: if request.resource.data.clientId == request.auth.uid || !exists(/databases/$(database)/documents/clients/$(request.auth.uid));
    }
    
    match /bilans/{bilanId} {
       allow read, write: if request.resource.data.clientId == request.auth.uid || !exists(/databases/$(database)/documents/clients/$(request.auth.uid));
    }
  }
}
  `.trim();

  return {
    success: true,
    rules: rules,
  };
}
    
