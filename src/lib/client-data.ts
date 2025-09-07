

// This file only defines the types and mock data.
// All server-side logic has been moved to src/ai/flows/client-actions.ts

// Central definition for the Client type
export interface Client {
    id: string;
    name: string;
    siret: string;
    address: string;
    legalRepresentative: string;
    fiscalYearEndDate: string;
    status: 'active' | 'inactive' | 'onboarding';
    newDocuments: number;
    lastActivity: string;
    email: string;
    phone: string;
    assignedAccountantId?: string;
}
