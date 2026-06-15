'use client';

import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

export type BankReconciliationTransaction = {
  date: string;
  description: string;
  amount: number;
};

export type BankReconciliationMatch = {
  transactionIndex: number;
  documentId: string;
  confidenceScore: number;
};

export type BankReconciliationAnomaly = {
  transactionIndex: number;
  reason: string;
};

export type RunBankReconciliationResult = {
  success: true;
  matches: BankReconciliationMatch[];
  anomalies: BankReconciliationAnomaly[];
} | {
  success: false;
  error: string;
};

export type SaveBankReconciliationInput = {
  clientId: string;
  clientName: string;
  summary: {
    totalTransactions: number;
    matchedTransactions: number;
    totalAmount: number;
    matchedAmount: number;
    anomalyCount: number;
  };
  matches: unknown[];
  anomalies: unknown[];
};

export type SaveBankReconciliationResult = {
  success: true;
  id: string;
} | {
  success: false;
  error: string;
};

export async function runBankReconciliation(
  transactions: BankReconciliationTransaction[],
  clientId: string
): Promise<RunBankReconciliationResult> {
  const callable = httpsCallable<
    { transactions: BankReconciliationTransaction[]; clientId: string },
    RunBankReconciliationResult
  >(functions, 'runBankReconciliation');
  const result = await callable({ transactions, clientId });
  return result.data;
}

export async function saveBankReconciliation(
  input: SaveBankReconciliationInput
): Promise<SaveBankReconciliationResult> {
  const callable = httpsCallable<SaveBankReconciliationInput, SaveBankReconciliationResult>(
    functions,
    'saveBankReconciliation'
  );
  const result = await callable(input);
  return result.data;
}
