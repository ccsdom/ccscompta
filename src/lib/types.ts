
export type Role = 'admin' | 'accountant' | 'secretary' | 'client';

export interface UserProfile extends Client {}

export interface AuditEvent {
    action: string;
    date: string;
    user: string;
}

export interface SystemAuditLog {
    id: string;
    date: string;
    userEmail: string;
    userName: string;
    action: string;
    type: 'info' | 'warning' | 'error' | 'security';
    category: 'auth' | 'billing' | 'system' | 'cabinet' | 'document';
    metadata?: Record<string, any>;
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
    email: string;
    role: 'admin' | 'accountant' | 'secretary' | 'client';
    siret?: string;
    address?: string;
    legalRepresentative?: string;
    fiscalYearEndDate?: string;
    status: 'active' | 'inactive' | 'onboarding';
    newDocuments: number;
    lastActivity: string;
    phone?: string;
    assignedAccountantId?: string;
    cabinetId?: string;
    // Monetization fields
    monthlyQuota?: number; // Max billable lines per month
    pricingPlan?: 'basic' | 'pro' | 'enterprise';
    currentPeriodLines?: number; // Total lines processed in the current billing period
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeSubscriptionItemId?: string; // The specific item for metered billing
    hasBankConnected?: boolean;
    lastBankConnectionId?: string;
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

export interface SalesInvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
}

export interface SalesInvoice {
    id: string;
    clientId: string; // The entrepreneur's ID
    cabinetId: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    customerName: string;
    customerEmail?: string;
    customerAddress?: string;
    items: SalesInvoiceItem[];
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CabinetQuotas {
    maxClients: number;
    maxDocumentsPerMonth: number;
    maxCollaborators: number;
    storageLimitGb: number;
    usedDocumentsMonth: number;
    usedClients: number;
}

export interface Cabinet {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    slogan?: string;
    primaryColor?: string; // Hex color for cabinet branding
    status: 'active' | 'suspended' | 'trial' | 'inactive';
    plan: 'starter' | 'professional' | 'enterprise' | 'elite';
    quotas: CabinetQuotas;
    invitationSentAt?: string;
    invitationStatus?: 'pending' | 'accepted' | 'expired';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeSubscriptionItemId?: string;
    createdAt: string;
    nextBillingDate?: string;
}

export interface Document {
  id: string;
  name: string;
  uploadDate: string; // ISO 8601 string date
  status: 'pending' | 'processing' | 'reviewing' | 'approved' | 'error' | 'duplicate';
  dataUrl?: string; // Stored in memory for preview, not in DB
  storagePath: string; // Can be a real path or a simulated one
  type?: string;
  confidence?: number;
  extractedData?: {
    dates?: string[];
    amounts?: number[];
    vendorNames?: string[];
    vatAmount?: number | null;
    vatRate?: number | null;
    category?: string | null;
    otherInformation?: string;
    anomalies?: string[];
    accountingEntry?: {
      debitAccount?: string;
      creditAccount?: string;
      vatAccount?: string;
      confidenceScore?: number;
    };
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
  isExported?: boolean;
  exportDate?: string;
  exportId?: string;
  billableLines?: number; // Number of accounting lines generated for this doc
  billingPeriod?: string; // YYYY-MM format for easy grouping
}
