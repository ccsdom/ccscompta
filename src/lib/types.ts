
export interface AuditEvent {
    action: string;
    date: string;
    user: string;
}

export interface Comment {
    id: string;
    text: string;
    user: string;
    date: string;
}

export interface Notification {
  id: string;
  documentId: string;
  documentName: string;
  message: string;
  date: string;
  isRead: boolean;
}

export interface Bilan {
    id: string;
    clientId: string;
    year: number;
    status: 'pending' | 'completed' | 'reviewing';
    netIncome: number;
    turnover: number;
    submissionDate?: string; // ISO 8601 string date
}

export interface AgendaEvent {
    id: string;
    title: string;
    date: Date;
    type: 'tva' | 'bilan' | 'task';
    clientId: string;
    clientName: string;
}

export interface Client {
    id: string;
    name: string;
    siret: string;
    address: string;
    legalRepresentative: string;
    fiscalYearEndDate: string;
    status: 'active' | 'inactive' | 'onboarding';
    newDocuments: number;
    lastActivity: string;
    email: string;
    phone: string;
    assignedAccountantId?: string;
    password?: string;
}

export interface Invoice {
    id: string;
    clientId: string;
    clientName: string;
    documentId?: string;
    number: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
}


export interface Document {
  id: string;
  name: string;
  uploadDate: string; // ISO 8601 string date
  status: 'pending' | 'processing' | 'reviewing' | 'approved' | 'error';
  dataUrl?: string; // Stored in memory for preview, not in DB
  storagePath: string; // Can be a real path or a simulated one
  type?: string;
  confidence?: number;
  extractedData?: {
    dates?: (string | null)[];
    amounts?: (number | null)[];
    vendorNames?: (string | null)[];
    vatAmount?: number | null;
    vatRate?: number | null;
    category?: string | null;
    otherInformation?: string;
    anomalies?: string[];
    transactions?: {
      date: string;
      description: string;
      amount: number;
      vendor?: string;
      category?: string;
      matchingDocumentId?: string;
    }[];
  };
  auditTrail: AuditEvent[];
  comments: Comment[];
  clientId: string;
}
