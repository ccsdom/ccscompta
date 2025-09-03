

import type { Document } from '@/lib/types';

export const MOCK_CLIENTS = [
    { name: 'Entreprise Alpha', siret: '12345678901234', address: '123 Rue de la Paix, 75001 Paris', legalRepresentative: 'Jean Dupont', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 3, lastActivity: '2024-07-16', email: 'contact@alpha.com', phone: '0123456789', assignedAccountantId: 'acc_1', id: 'alpha' },
    { name: 'Bêta SARL', siret: '23456789012345', address: '45 Avenue des Champs-Élysées, 75008 Paris', legalRepresentative: 'Marie Curie', fiscalYearEndDate: '30/06', status: 'active', newDocuments: 0, lastActivity: '2024-07-15', email: 'compta@beta.eu', phone: '0987654321', assignedAccountantId: 'acc_2', id: 'beta' },
    { name: 'Gamma Inc.', siret: '34567890123456', address: '67 Boulevard Saint-Germain, 75005 Paris', legalRepresentative: 'Louis Pasteur', fiscalYearEndDate: '31/03', status: 'onboarding', newDocuments: 1, lastActivity: '2024-07-17', email: 'factures@gamma.io', phone: '0112233445', assignedAccountantId: 'acc_3', id: 'gamma' },
    { name: 'Delta Industries', siret: '45678901234567', address: '89 Rue de Rivoli, 75004 Paris', legalRepresentative: 'Simone Veil', fiscalYearEndDate: '30/09', status: 'active', newDocuments: 5, lastActivity: '2024-07-16', email: 'admin@delta-industries.fr', phone: '0655443322', assignedAccountantId: 'acc_1', id: 'delta' },
    { name: 'Epsilon Global', siret: '56789012345678', address: '101 Avenue Victor Hugo, 75116 Paris', legalRepresentative: 'Charles de Gaulle', fiscalYearEndDate: '31/12', status: 'inactive', newDocuments: 0, lastActivity: '2024-05-20', email: 'support@epsilon.com', phone: '0788990011', assignedAccountantId: 'acc_4', id: 'epsilon' },
];

export const MOCK_DOCUMENTS: Record<string, Omit<Document, 'id'>[]> = {
    'alpha': [
        {
            name: 'Facture-Apple-01.pdf',
            uploadDate: '2024-07-15T10:00:00Z',
            status: 'approved',
            storagePath: 'alpha/Facture-Apple-01.pdf',
            type: 'invoice',
            confidence: 0.98,
            clientId: 'alpha',
            extractedData: {
                vendorNames: ['Apple Store'],
                dates: ['2024-07-14'],
                amounts: [1299.99],
                vatAmount: 216.67,
                vatRate: 20,
                category: 'Services informatiques',
            },
            auditTrail: [
                { action: 'Document téléversé', date: '2024-07-15T10:00:00Z', user: 'Client Démo' },
                { action: 'Traitement IA terminé', date: '2024-07-15T10:01:00Z', user: 'Système' },
                { action: 'Document approuvé', date: '2024-07-16T11:00:00Z', user: 'Comptable Démo' },
            ],
            comments: []
        },
        {
            name: 'Note-de-frais-deplacement.jpg',
            uploadDate: '2024-07-16T14:20:00Z',
            status: 'reviewing',
            storagePath: 'alpha/Note-de-frais-deplacement.jpg',
            type: 'receipt',
            confidence: 0.91,
            clientId: 'alpha',
            extractedData: {
                vendorNames: ['SNCF'],
                dates: ['2024-07-12'],
                amounts: [89.50],
                category: 'Transport',
            },
             auditTrail: [
                { action: 'Document téléversé', date: '2024-07-16T14:20:00Z', user: 'Client Démo' },
                { action: 'Traitement IA terminé', date: '2024-07-16T14:21:00Z', user: 'Système' },
            ],
            comments: [{ id: 'c1', text: 'Est-ce que ce déplacement est bien professionnel ?', user: 'Comptable Démo', date: '2024-07-16T15:00:00Z' }]
        },
        {
            name: 'Releve-bancaire-juillet.pdf',
            uploadDate: '2024-07-17T09:00:00Z',
            status: 'reviewing',
            storagePath: 'alpha/Releve-bancaire-juillet.pdf',
            type: 'bank statement',
            confidence: 0.99,
            clientId: 'alpha',
            extractedData: {
                transactions: [
                    { date: '2024-07-05', description: 'PRLV FREE MOBILE', amount: -29.99, vendor: 'Free Mobile', category: 'Télécommunications' },
                    { date: '2024-07-10', description: 'VIR RECU Rbt Amazon', amount: 50.00, vendor: 'Amazon', category: 'Remboursement' },
                    { date: '2024-07-14', description: 'PAIEMENT CB APPLE STORE', amount: -1299.99, vendor: 'Apple Store', category: 'Services informatiques', matchingDocumentId: 'alpha/Facture-Apple-01.pdf' },
                ]
            },
            auditTrail: [
                { action: 'Document téléversé', date: '2024-07-17T09:00:00Z', user: 'Client Démo' },
                { action: 'Traitement IA terminé', date: '2024-07-17T09:01:30Z', user: 'Système' },
            ],
            comments: []
        }
    ],
    'beta': [
        {
            name: 'facture-fournitures.pdf',
            uploadDate: '2024-07-10T11:30:00Z',
            status: 'approved',
            storagePath: 'beta/facture-fournitures.pdf',
            type: 'invoice',
            confidence: 0.95,
            clientId: 'beta',
            extractedData: {
                vendorNames: ['Office Depot'],
                dates: ['2024-07-08'],
                amounts: [145.20],
                vatAmount: 24.20,
                vatRate: 20,
                category: 'Fournitures de bureau',
            },
            auditTrail: [
                { action: 'Document téléversé', date: '2024-07-10T11:30:00Z', user: 'Client Démo' },
                { action: 'Traitement IA terminé', date: '2024-07-10T11:31:00Z', user: 'Système' },
                { action: 'Document approuvé (auto)', date: '2024-07-10T11:31:05Z', user: 'Système' },
            ],
            comments: []
        }
    ]
};
