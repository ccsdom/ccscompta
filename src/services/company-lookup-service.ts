'use client';

import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

export type CompanySearchInput = {
  query: string;
};

export type CompanySearchResult = {
  name: string;
  siret: string;
  address: string;
  legalRepresentative: string;
};

export type CompanySearchOutput = {
  results: CompanySearchResult[];
};

export type ExtractClientDataInput = {
  searchTerm: string;
};

export type ExtractClientDataOutput = {
  name?: string | null;
  siret?: string | null;
  email?: string | null;
  phone?: string | null;
  legalRepresentative?: string | null;
  address?: string | null;
  fiscalYearEndDate?: string | null;
};

export async function searchCompany(input: CompanySearchInput): Promise<CompanySearchOutput> {
  const callable = httpsCallable<CompanySearchInput, CompanySearchOutput>(functions, 'searchCompany');
  const result = await callable(input);
  return result.data;
}

export async function extractClientData(input: ExtractClientDataInput): Promise<ExtractClientDataOutput> {
  const callable = httpsCallable<ExtractClientDataInput, ExtractClientDataOutput>(functions, 'extractClientData');
  const result = await callable(input);
  return result.data;
}
