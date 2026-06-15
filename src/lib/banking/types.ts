/**
 * Domaine : Open Banking / DSP2
 *
 * Architecture d'abstraction — V1 (Mock uniquement)
 * Aucune dépendance externe. Prêt pour Powens / Bridge en V2.
 */

// ─── Types primitifs ──────────────────────────────────────────────────────────

export interface ConnectionUrl {
  url: string;
  expiresAt: Date;
}

export type BankConnectionStatus = 'connected' | 'expired' | 'error' | 'pending';

export interface BankConnection {
  id: string;
  userId: string;
  providerName: string; // ex: "mock", "powens", "bridge"
  status: BankConnectionStatus;
  consentExpiresAt: Date;
  createdAt: Date;
  lastSyncAt?: Date;
}

export interface BankAccount {
  id: string;
  connectionId: string;
  name: string;
  iban?: string;
  balance: number;
  currency: string;
  type: 'checking' | 'savings' | 'business';
}

export type TransactionDirection = 'debit' | 'credit';

export interface BankTransaction {
  id: string;
  accountId: string;
  date: Date;
  valueDate?: Date;
  amount: number; // Positif = crédit, Négatif = débit
  direction: TransactionDirection;
  description: string;
  rawLabel?: string;
  category?: string; // Catégorie provisoire
  isMatched?: boolean;
  matchedDocumentId?: string;
}

export interface SyncResult {
  success: boolean;
  transactionsAdded: number;
  accountsUpdated: number;
  syncedAt: Date;
}

// ─── Interface du Provider ────────────────────────────────────────────────────

/**
 * Interface d'abstraction Open Banking.
 * Tous les connecteurs (Powens, Bridge, Mock) doivent implémenter cette interface.
 */
export interface BankingProvider {
  readonly providerName: string;
  createConnection(userId: string): Promise<ConnectionUrl>;
  getAccounts(connectionId: string): Promise<BankAccount[]>;
  getTransactions(accountId: string, fromDate: Date): Promise<BankTransaction[]>;
  refreshConnection(connectionId: string): Promise<SyncResult>;
}
