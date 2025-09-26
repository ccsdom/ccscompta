
'use server';

/**
 * @fileOverview Actions related to Firebase security rules configuration.
 */

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
    function isStaff() {
      return request.auth.token.role in ['admin', 'accountant', 'secretary'];
    }
    
    function isOwner(userId) {
        return request.auth.uid == userId;
    }

    // "clients" collection now contains all users
    // Staff can read all profiles.
    // A user can only read/update their own profile.
    // Only admins can create/delete users or change their roles.
    match /clients/{userId} {
      allow read, list: if isStaff() || isOwner(userId);
      allow create, delete: if request.auth.token.role == 'admin';
      
      // Allow user to update their own profile, but not change their role
      allow update: if isOwner(userId) && !("role" in request.resource.data);
      // Admin can update anything, including role.
      allow update: if request.auth.token.role == 'admin';
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
