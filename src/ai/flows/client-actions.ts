
'use server';

// This file is being removed as it encourages an anti-pattern
// of fetching all clients from the server, which can lead to permission errors
// for non-staff users. Client-side fetching should be done with useCollection
// and appropriate Firestore queries and security rules.
