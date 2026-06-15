/**
 * MockBankingProvider — Implémentation de test de BankingProvider
 *
 * Simule le flux complet de connexion bancaire Open Banking / DSP2.
 * Données fictives réalistes (compte professionnel, transactions).
 * Aucune dépendance externe. Swappable par PowensProvider ou BridgeProvider.
 */

import type {
  BankingProvider,
  ConnectionUrl,
  BankAccount,
  BankTransaction,
  SyncResult,
} from './types';

export class MockBankingProvider implements BankingProvider {
  readonly providerName = 'mock';

  async createConnection(userId: string): Promise<ConnectionUrl> {
    // Simule un délai réseau réel
    await new Promise(r => setTimeout(r, 600));
    return {
      url: `https://mock.bankaggregator.com/connect?token=mock_${userId}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
    };
  }

  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    await new Promise(r => setTimeout(r, 400));
    return [
      {
        id: `${connectionId}_acc_pro`,
        connectionId,
        name: 'Compte Courant Professionnel',
        iban: 'FR76 3000 4028 3700 0000 0000 123',
        balance: 23_750.40,
        currency: 'EUR',
        type: 'checking',
      },
      {
        id: `${connectionId}_acc_epargne`,
        connectionId,
        name: 'Livret Épargne Entreprise',
        iban: 'FR76 3000 4028 3700 0000 0000 456',
        balance: 80_000.00,
        currency: 'EUR',
        type: 'savings',
      },
    ];
  }

  async getTransactions(accountId: string, fromDate: Date): Promise<BankTransaction[]> {
    await new Promise(r => setTimeout(r, 500));

    const today = new Date();
    const d = (offsetDays: number) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - offsetDays);
      return dt;
    };

    const mock = [
      {
        id: `${accountId}_tx_001`,
        accountId,
        date: d(0),
        amount: 4_800.00,
        direction: 'credit' as const,
        description: 'VIR RECU - CLIENT DUPONT SAS',
        rawLabel: 'VIREMENT DE M DUPONT 19/05',
        category: 'Recette client',
        isMatched: false,
      },
      {
        id: `${accountId}_tx_002`,
        accountId,
        date: d(1),
        amount: -1_200.00,
        direction: 'debit' as const,
        description: 'PRELEVEMENT LEASING VEHICULE',
        rawLabel: 'PRELEVEMENT BNP LEASING 01',
        category: 'Charges financières',
        isMatched: true,
        matchedDocumentId: 'doc_leasing_2024',
      },
      {
        id: `${accountId}_tx_003`,
        accountId,
        date: d(3),
        amount: -450.00,
        direction: 'debit' as const,
        description: 'FRNS OFFICE DEPOT',
        rawLabel: 'CB OFFICE DEPOT 16/05',
        category: 'Fournitures bureau',
        isMatched: false,
      },
      {
        id: `${accountId}_tx_004`,
        accountId,
        date: d(5),
        amount: 12_500.00,
        direction: 'credit' as const,
        description: 'VIR RECU - SOCIETE MARTIN FRERES',
        rawLabel: 'VIRT MARTIN FRERES REF INV-2024-042',
        category: 'Recette client',
        isMatched: true,
        matchedDocumentId: 'doc_inv_042',
      },
      {
        id: `${accountId}_tx_005`,
        accountId,
        date: d(7),
        amount: -2_300.00,
        direction: 'debit' as const,
        description: 'URSSAF COTISATIONS SOCIALES',
        rawLabel: 'PRLV URSSAF N°12345678',
        category: 'Charges sociales',
        isMatched: false,
      },
      {
        id: `${accountId}_tx_006`,
        accountId,
        date: d(10),
        amount: -89.99,
        direction: 'debit' as const,
        description: 'ABONNEMENT LOGICIEL COMPTA',
        rawLabel: 'CB ABONNEMENT CCS COMPTA',
        category: 'Logiciel SaaS',
        isMatched: false,
      },
      {
        id: `${accountId}_tx_007`,
        accountId,
        date: d(12),
        amount: 3_200.00,
        direction: 'credit' as const,
        description: 'VIR RECU - CABINET LECONTE',
        rawLabel: 'VIREMENT CABINET LECONTE',
        category: 'Recette client',
        isMatched: false,
      },
    ].filter(tx => tx.date >= fromDate) satisfies BankTransaction[];

    return mock;
  }

  async refreshConnection(connectionId: string): Promise<SyncResult> {
    await new Promise(r => setTimeout(r, 700));
    return {
      success: true,
      transactionsAdded: 7,
      accountsUpdated: 2,
      syncedAt: new Date(),
    };
  }
}
