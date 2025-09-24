
import type { Document, Bilan, Client } from '@/lib/types';

export const MOCK_CLIENTS: Client[] = [
    {
        id: 'client-01',
        name: 'ACTION AVENTURE',
        siret: '84042838300010',
        address: '15 RUE DE LA REPUBLIQUE 69002 LYON 2EME',
        legalRepresentative: 'JEAN-MICHEL AVENTURIER',
        fiscalYearEndDate: '31/12',
        status: 'active',
        newDocuments: 2,
        lastActivity: '2024-07-20',
        email: 'aventure.action@example.com',
        phone: '0478000001',
        assignedAccountantId: 'acc-01'
    },
    {
        id: 'client-02',
        name: 'AUTO ECOLE DE LA MAIRIE',
        siret: '83972846400018',
        address: '2 PLACE DE LA MAIRIE 94450 LIMEIL-BREVANNES',
        legalRepresentative: 'MARIE CONDUITE',
        fiscalYearEndDate: '31/12',
        status: 'active',
        newDocuments: 1,
        lastActivity: '2024-07-19',
        email: 'contact.autoecole@example.com',
        phone: '0145000002',
        assignedAccountantId: 'acc-01'
    },
    {
        id: 'client-03',
        name: 'BODY MINUTE',
        siret: '53293123800019',
        address: '6 RUE DE LA PAIX 75002 PARIS',
        legalRepresentative: 'SOPHIE BIENETRE',
        fiscalYearEndDate: '31/03',
        status: 'inactive',
        newDocuments: 0,
        lastActivity: '2024-05-10',
        email: 'contact.bodyminute@example.com',
        phone: '0142000003',
    },
    {
        id: 'client-04',
        name: 'CABINET FLORET',
        siret: '81234567800010',
        address: '12 AVENUE DES FLEURS 06000 NICE',
        legalRepresentative: 'PIERRE FLORET',
        fiscalYearEndDate: '30/09',
        status: 'onboarding',
        newDocuments: 0,
        lastActivity: '2024-07-21',
        email: 'cabinet.floret@example.com',
        phone: '0493000004',
        assignedAccountantId: 'acc-02'
    },
    {
        id: 'vsw-sas',
        name: 'VSW SAS',
        siret: '98487625800011',
        address: '10 RUE DE LA PAIX 75002 PARIS',
        legalRepresentative: 'Victor Hugo',
        fiscalYearEndDate: '31/12',
        status: 'active',
        newDocuments: 5,
        lastActivity: '2024-07-22',
        email: 'vsw.contact@gmail.com',
        phone: '0142000005',
        assignedAccountantId: 'acc-01'
    }
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
