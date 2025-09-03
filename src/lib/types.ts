

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

export interface Document {
  id: string;
  name: string;
  uploadDate: string;
  status: 'pending' | 'processing' | 'reviewing' | 'approved' | 'error';
  file: File;
  dataUrl: string;
  type?: string;
  confidence?: number;
  extractedData?: {
    dates?: string[];
    amounts?: number[];
    vendorNames?: string[];
    vatAmount?: number;
    vatRate?: number;
    category?: string;
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
