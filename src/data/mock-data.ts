
import type { Document, Bilan, Client } from '@/lib/types';

export const MOCK_CLIENTS: Client[] = [
    // Données de démonstration retirées pour une initialisation propre.
];

export const MOCK_DOCUMENTS: Record<string, Omit<Document, 'id'>[]> = {
    // Données de démonstration retirées.
};

export const MOCK_BILANS: Record<string, Bilan[]> = {
   // Données de démonstration retirées.
};
