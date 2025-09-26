
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
    
    // Helper function to get the user's role from their profile in the 'clients' collection
    function getUserRole(userId) {
      return get(/databases/$(database)/documents/clients/$(userId)).data.role;
    }
    
    function isStaff() {
      return request.auth != null && getUserRole(request.auth.uid) in ['admin', 'accountant', 'secretary'];
    }
    
    function isOwner(userId) {
        return request.auth != null && request.auth.uid == userId;
    }
    
    function isAdmin() {
        return request.auth != null && getUserRole(request.auth.uid) == 'admin';
    }

    // "clients" collection now contains all users
    // Staff can read all profiles.
    // A user can only read/update their own profile.
    // Only admins can create/delete users or change their roles.
    match /clients/{userId} {
      allow read, list: if isStaff() || isOwner(userId);
      // Anyone can create their own user profile document (e.g., after sign-up)
      allow create: if request.auth.uid == userId;
      // Admins can delete anyone
      allow delete: if isAdmin();
      
      // A user can update their own profile, but cannot change their own role.
      // An admin can update any field on any profile.
      allow update: if (isOwner(userId) && !("role" in request.resource.data)) || isAdmin();
    }

    // DOCUMENTS collection
    // Staff can read all documents.
    // A client can only read their own documents.
    // A client can only create a document for themselves.
    // Staff can update any document. A client can only update their own.
    match /documents/{docId} {
      allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
      
      allow create: if request.auth.uid == request.resource.data.clientId;
      allow update: if isStaff() || (request.auth.uid == resource.data.clientId);
      allow delete: if isStaff() || (request.auth.uid == resource.data.clientId);
    }
    
    // INVOICES, BILANS, and other collections should follow a similar pattern.
    // Staff have full access. Clients have access only to their own documents.
    
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
