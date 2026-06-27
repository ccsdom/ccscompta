'use client';

import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

export type BankTransaction = {
  date: string;
  description: string;
  amount: number;
};

type BankAuthLinkResult = {
  success: boolean;
  url?: string;
  requisitionId?: string;
  error?: string;
};

type FinalizeBankConnectionResult = {
  success: boolean;
  connectionId?: string;
  error?: string;
};

type SyncBankTransactionsResult = {
  success: boolean;
  transactions?: BankTransaction[];
  error?: string;
};

export async function getBankAuthLink(clientId: string, cabinetId?: string): Promise<BankAuthLinkResult> {
  const callable = httpsCallable<
    { clientId: string; cabinetId?: string },
    BankAuthLinkResult
  >(functions, 'getBankAuthLink');
  const result = await callable({ clientId, cabinetId });
  return result.data;
}

export async function finalizeBankConnection(
  clientId: string,
  cabinetId: string | undefined,
  requisitionId: string
): Promise<FinalizeBankConnectionResult> {
  const callable = httpsCallable<
    { clientId: string; cabinetId?: string; requisitionId: string },
    FinalizeBankConnectionResult
  >(functions, 'finalizeBankConnection');
  const result = await callable({ clientId, cabinetId, requisitionId });
  return result.data;
}

export async function syncBankTransactions(clientId: string): Promise<SyncBankTransactionsResult> {
  const callable = httpsCallable<{ clientId: string }, SyncBankTransactionsResult>(
    functions,
    'syncBankTransactions'
  );
  const result = await callable({ clientId });
  return result.data;
}
