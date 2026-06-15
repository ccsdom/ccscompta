/**
 * BankingService — Orchestration du flux Open Banking
 *
 * Façade métier entre l'UI et le BankingProvider.
 * L'UI n'appelle jamais le provider directement.
 * Swapper le provider suffit à changer d'agrégateur (Powens, Bridge...).
 */

import type {
  BankingProvider,
  BankConnection,
  BankAccount,
  BankTransaction,
  SyncResult,
} from './types';
import { MockBankingProvider } from './mock-provider';

// ─── Factory du Provider ──────────────────────────────────────────────────────
// En V2 : lire une variable d'env (BANKING_PROVIDER=powens) pour sélectionner le bon provider.

function getProvider(): BankingProvider {
  // Pour l'instant : toujours le Mock
  return new MockBankingProvider();
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class BankingService {
  private provider: BankingProvider;

  constructor(provider?: BankingProvider) {
    this.provider = provider ?? getProvider();
  }

  async initConnection(userId: string): Promise<{ connectionId: string; redirectUrl: string }> {
    const { url, expiresAt } = await this.provider.createConnection(userId);
    // En V2 : stocker la connexion en Firestore ici
    const connectionId = `conn_${Date.now()}`;
    console.info(`[BankingService] Connexion initiée pour ${userId}, expire: ${expiresAt}`);
    return { connectionId, redirectUrl: url };
  }

  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    return this.provider.getAccounts(connectionId);
  }

  async getTransactions(accountId: string, fromDate: Date): Promise<BankTransaction[]> {
    return this.provider.getTransactions(accountId, fromDate);
  }

  async syncConnection(connectionId: string): Promise<SyncResult> {
    return this.provider.refreshConnection(connectionId);
  }

  get activeProvider(): string {
    return this.provider.providerName;
  }
}
