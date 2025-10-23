
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
  const rules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- Helper functions based on auth token (custom claims) ---
    function getCallerRole() {
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

    // --- User collection ('clients') ---
    match /clients/{userId} {
      // Staff can list the entire collection.
      allow list: if isStaff();
      // Staff OR the specific user can read a single document.
      allow read: if isStaff() || isOwner(userId);
      // Staff can create any user. A new user can create their own profile during signup.
      allow create: if isStaff() || request.auth.uid == userId;
      // Only an admin can delete a user.
      allow delete: if isAdmin();
      // A user cannot change their own role, unless they are an admin.
      allow update: if (isOwner(userId) && !("role" in request.resource.data)) || isAdmin();
    }

    // --- Other collections ---

    match /documents/{docId} {
        // A user can read/list their own documents, staff can read/list any.
        allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
        // A user can create a document for themselves.
        allow create: if request.auth.uid == request.resource.data.clientId;
        // A user can update their own documents (e.g. add comments), staff can update any.
        allow update: if isStaff() || (request.auth.uid == resource.data.clientId);
        // A user can delete their own documents, staff can delete any.
        allow delete: if isStaff() || (request.auth.uid == resource.data.clientId);
    }
    
    match /invoices/{invoiceId} {
        // A user can read their own invoices, staff can read any.
        allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
        // Only staff can create, update, or delete invoices.
        allow create, update, delete: if isStaff();
    }
    
     match /bilans/{bilanId} {
        // A user can read their own bilans, staff can read any.
        allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
        // Only staff can create, update, or delete bilans.
        allow create, update, delete: if isStaff();
    }

    match /cabinets/{cabinetId} {
        // Only staff can interact with cabinets.
        allow read, list, create, update, delete: if isStaff();
    }
  }
}`;

  return {
    success: true,
    rules: rules,
  };
}

/**
 * Provides the recommended Firebase Storage security rules.
 * This version allows users to read and write to their own designated folder.
 *
 * @returns {Promise<{success: boolean, rules: string}>} An object containing the success status and the recommended Storage rules.
 */
export async function configureStorageSecurityRules(): Promise<{success: boolean, rules: string}> {
  const rules = `rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Files are stored in folders named after the client's UID.
    // e.g., gs://<your-bucket>/<clientId>/document.pdf

    // Allow a user to read, write, and delete files only in their own folder.
    match /{clientId}/{allPaths=**} {
      allow read, write, delete: if request.auth != null && request.auth.uid == clientId;
    }
  }
}`;

  return {
    success: true,
    rules: rules,
  };
}
