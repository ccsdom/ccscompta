export type DocumentAiTransaction = {
  date: string;
  description: string;
  amount: number;
  vendor?: string;
  category?: string;
  matchingDocumentId?: string;
};

export type DocumentVatDetail = {
  rate: number;
  amount: number;
  baseHT: number;
};

export type DocumentAccountingEntry = {
  debitAccount?: string;
  creditAccount?: string;
  vatAccount?: string;
  confidenceScore?: number;
  rationale?: string;
};

export type DocumentInsight = {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
};

export type ExtractDataOutput = {
  documentType?: string;
  dates?: string[];
  amounts?: number[];
  vendorNames?: string[];
  vatAmount?: number | null;
  vatRate?: number | null;
  vatDetails?: DocumentVatDetail[];
  siret?: string;
  supplierName?: string;
  transactions?: DocumentAiTransaction[];
  category?: string | null;
  otherInformation?: string;
  anomalies?: string[];
  accountingEntry?: DocumentAccountingEntry;
  summary?: string;
  insight?: DocumentInsight;
};

export type ExtractDataInput = {
  documentDataUri: string;
  documentType: string;
  clientId: string;
};

export type RecognizeDocumentTypeInput = {
  documentDataUri: string;
};

export type RecognizeDocumentTypeOutput = {
  documentType: string;
  confidence: number;
};

export type ValidateExtractionInput = {
  documentDataUri: string;
  extractedData: ExtractDataOutput;
};

export type ValidateExtractionOutput = {
  isConfident: boolean;
  confidenceScore: number;
  mismatchReason?: string;
};
