'use client';

import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

export type IntelligentSearchInput = {
  query: string;
  currentDate: string;
};

export type IntelligentSearchOutput = {
  documentTypes?: string[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  vendor?: string;
  keywords?: string[];
  originalQuery: string;
};

export async function intelligentSearch(input: IntelligentSearchInput): Promise<IntelligentSearchOutput> {
  const callable = httpsCallable<IntelligentSearchInput, IntelligentSearchOutput>(functions, 'intelligentSearch');
  const result = await callable(input);
  return result.data;
}
