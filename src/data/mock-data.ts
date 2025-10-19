
import type { Document, Bilan, Client } from '@/lib/types';

export const MOCK_CLIENTS: Client[] = [
    // Les données de démonstration sont retirées car l'application
    // utilise désormais une connexion directe à la base de données Firestore.
];

export const MOCK_DOCUMENTS: Record<string, Omit<Document, 'id'>[]> = {
    // Les données de démonstration sont retirées.
};

export const MOCK_BILANS: Record<string, Bilan[]> = {
   // Les données de démonstration sont retirées.
};
