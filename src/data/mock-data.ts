
import type { Document, Bilan, Client } from '@/lib/types';

export const MOCK_CLIENTS: Client[] = [
    {
        id: 'client-01',
        name: 'ACTION AVENTURE',
        siret: '84042838300010',
        address: '15 RUE DE LA REPUBLIQUE 69002 LYON 2EME',
        legalRepresentative: 'JEAN-MICHEL AVENTURIER',
        fiscalYearEndDate: '31/12',
        role: 'client',
        status: 'active',
        newDocuments: 2,
        lastActivity: '2024-07-20',
        email: 'aventure.action@example.com',
        phone: '0478000001',
        assignedAccountantId: 'acc-01'
    },
    {
        id: 'user-comptable',
        name: 'Alain Comptable',
        email: 'comptable@ccs.com',
        role: 'accountant',
        status: 'active',
        lastActivity: new Date().toISOString(),
        newDocuments: 0,
        siret: '00000000000001',
    },
    {
        id: 'user-admin',
        name: 'Super Admin',
        email: 'admin@ccs.com',
        role: 'admin',
        status: 'active',
        lastActivity: new Date().toISOString(),
        newDocuments: 0,
        siret: '00000000000002',
    },
     {
        id: 'user-secretary',
        name: 'Sophie Secrétaire',
        email: 'secretary@ccs.com',
        role: 'secretary',
        status: 'active',
        lastActivity: new Date().toISOString(),
        newDocuments: 0,
        siret: '00000000000003',
    },
];

export const MOCK_DOCUMENTS: Record<string, Omit<Document, 'id'>[]> = {
    'client-01': [
        {
            name: 'Facture-Apple-01.pdf',
            uploadDate: '2024-07-15T10:00:00Z',
            status: 'approved',
            storagePath: 'client-01/Facture-Apple-01.pdf',
            type: 'purchase invoice',
            confidence: 0.98,
            clientId: 'client-01',
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
            storagePath: 'client-01/Note-de-frais-deplacement.jpg',
            type: 'receipt',
            confidence: 0.91,
            clientId: 'client-01',
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
    ],
    'client-02': [
        {
            name: 'facture-fournitures.pdf',
            uploadDate: '2024-07-10T11:30:00Z',
            status: 'approved',
            storagePath: 'client-02/facture-fournitures.pdf',
            type: 'purchase invoice',
            confidence: 0.95,
            clientId: 'client-02',
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

export const MOCK_BILANS: Record<string, Bilan[]> = {
    'client-01': [
        { id: 'b1', clientId: 'client-01', year: 2023, status: 'completed', netIncome: 55000, turnover: 250000, submissionDate: '2024-04-15T00:00:00Z' },
        { id: 'b2', clientId: 'client-01', year: 2022, status: 'completed', netIncome: 48000, turnover: 220000, submissionDate: '2023-04-20T00:00:00Z' },
        { id: 'b3', clientId: 'client-01', year: 2021, status: 'completed', netIncome: 42000, turnover: 190000, submissionDate: '2022-04-18T00:00:00Z' },
    ],
    'client-02': [
        { id: 'b4', clientId: 'client-02', year: 2023, status: 'reviewing', netIncome: 32000, turnover: 180000, submissionDate: undefined },
        { id: 'b5', clientId: 'client-02', year: 2022, status: 'completed', netIncome: 29000, turnover: 175000, submissionDate: '2023-05-10T00:00:00Z' },
    ],
    'client-04': [
        { id: 'b6', clientId: 'client-04', year: 2023, status: 'pending', netIncome: 0, turnover: 0, submissionDate: undefined },
    ],
};
