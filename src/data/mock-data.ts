

import type { Document } from '@/lib/types';

export const MOCK_CLIENTS = [
    { name: 'ACTION AVENTURE', siret: '10000000000001', address: '1 Rue de l\'Aventure, 75001 Paris', legalRepresentative: 'Représentant A', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 2, lastActivity: '2024-07-18', email: 'contact@actionaventure.com', phone: '0100000001', assignedAccountantId: 'acc_1', id: 'client_01' },
    { name: 'AUTO ECOLE DE LA MAIRIE', siret: '10000000000002', address: '2 Rue de la Mairie, 75002 Paris', legalRepresentative: 'Représentant B', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 1, lastActivity: '2024-07-17', email: 'contact@autoecolemairie.com', phone: '0100000002', assignedAccountantId: 'acc_2', id: 'client_02' },
    { name: 'BODY MINUTE', siret: '10000000000003', address: '3 Avenue du Corps, 75003 Paris', legalRepresentative: 'Représentant C', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 0, lastActivity: '2024-07-16', email: 'contact@bodyminute.com', phone: '0100000003', assignedAccountantId: 'acc_3', id: 'client_03' },
    { name: 'CABINET FLORET', siret: '10000000000004', address: '4 Place du Cabinet, 75004 Paris', legalRepresentative: 'Représentant D', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 5, lastActivity: '2024-07-18', email: 'contact@cabinetfloret.com', phone: '0100000004', assignedAccountantId: 'acc_1', id: 'client_04' },
    { name: 'CABINET MEDICAL GALEA', siret: '10000000000005', address: '5 Rue du Docteur, 75005 Paris', legalRepresentative: 'Représentant E', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 3, lastActivity: '2024-07-18', email: 'contact@galea.com', phone: '0100000005', assignedAccountantId: 'acc_2', id: 'client_05' },
    { name: 'CHICKEN SPOT', siret: '10000000000006', address: '6 Boulevard du Poulet, 75006 Paris', legalRepresentative: 'Représentant F', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 1, lastActivity: '2024-07-17', email: 'contact@chickenspot.com', phone: '0100000006', assignedAccountantId: 'acc_3', id: 'client_06' },
    { name: 'CLIM ASSISTANCE', siret: '10000000000007', address: '7 Rue de la Clim, 75007 Paris', legalRepresentative: 'Représentant G', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 0, lastActivity: '2024-07-15', email: 'contact@climassistance.com', phone: '0100000007', assignedAccountantId: 'acc_1', id: 'client_07' },
    { name: 'EASY CE', siret: '10000000000008', address: '8 Avenue Facile, 75008 Paris', legalRepresentative: 'Représentant H', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 4, lastActivity: '2024-07-18', email: 'contact@easyce.com', phone: '0100000008', assignedAccountantId: 'acc_2', id: 'client_08' },
    { name: 'EASYLIAGE', siret: '10000000000009', address: '9 Rue du Liège, 75009 Paris', legalRepresentative: 'Représentant I', fiscalYearEndDate: '31/12', status: 'onboarding', newDocuments: 10, lastActivity: '2024-07-18', email: 'contact@easyliage.com', phone: '0100000009', assignedAccountantId: 'acc_3', id: 'client_09' },
    { name: 'G.B.P.', siret: '10000000000010', address: '10 Rue GBP, 75010 Paris', legalRepresentative: 'Représentant J', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 2, lastActivity: '2024-07-17', email: 'contact@gbp.com', phone: '0100000010', assignedAccountantId: 'acc_1', id: 'client_10' },
    { name: 'K.D.I. FRANCE', siret: '10000000000011', address: '11 Avenue de France, 75011 Paris', legalRepresentative: 'Représentant K', fiscalYearEndDate: '31/12', status: 'inactive', newDocuments: 0, lastActivity: '2024-06-01', email: 'contact@kdi.com', phone: '0100000011', assignedAccountantId: 'acc_2', id: 'client_11' },
    { name: 'L B R', siret: '10000000000012', address: '12 Rue LBR, 75012 Paris', legalRepresentative: 'Représentant L', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 1, lastActivity: '2024-07-16', email: 'contact@lbr.com', phone: '0100000012', assignedAccountantId: 'acc_3', id: 'client_12' },
    { name: 'L D', siret: '10000000000013', address: '13 Boulevard LD, 75013 Paris', legalRepresentative: 'Représentant M', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 0, lastActivity: '2024-07-14', email: 'contact@ld.com', phone: '0100000013', assignedAccountantId: 'acc_1', id: 'client_13' },
    { name: 'LE FOURNIL DE FRED', siret: '10000000000014', address: '14 Rue du Fournil, 75014 Paris', legalRepresentative: 'Représentant N', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 8, lastActivity: '2024-07-18', email: 'contact@fournilfred.com', phone: '0100000014', assignedAccountantId: 'acc_2', id: 'client_14' },
    { name: 'SARL H C M P', siret: '10000000000015', address: '15 Rue HCMP, 75015 Paris', legalRepresentative: 'Représentant O', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 3, lastActivity: '2024-07-18', email: 'contact@hcmp.com', phone: '0100000015', assignedAccountantId: 'acc_3', id: 'client_15' },
    { name: 'SARL PHARMACIE DE LA MAIRIE', siret: '10000000000016', address: '16 Place de la Mairie, 75016 Paris', legalRepresentative: 'Représentant P', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 1, lastActivity: '2024-07-17', email: 'contact@pharmamairie.com', phone: '0100000016', assignedAccountantId: 'acc_1', id: 'client_16' },
];

export const MOCK_DOCUMENTS: Record<string, Omit<Document, 'id'>[]> = {
    'alpha': [
        {
            id: 'doc_alpha_1',
            name: 'Facture-Apple-01.pdf',
            uploadDate: '2024-07-15T10:00:00Z',
            status: 'approved',
            storagePath: 'alpha/Facture-Apple-01.pdf',
            type: 'purchase invoice',
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
            id: 'doc_alpha_2',
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
            id: 'doc_alpha_3',
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
                    { date: '2024-07-14', description: 'PAIEMENT CB APPLE STORE', amount: -1299.99, vendor: 'Apple Store', category: 'Services informatiques', matchingDocumentId: 'doc_alpha_1' },
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
            id: 'doc_beta_1',
            name: 'facture-fournitures.pdf',
            uploadDate: '2024-07-10T11:30:00Z',
            status: 'approved',
            storagePath: 'beta/facture-fournitures.pdf',
            type: 'purchase invoice',
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
