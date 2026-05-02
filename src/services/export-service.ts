import { Document } from '@/lib/types';
import Papa from 'papaparse';
import { downloadFEC } from './fec-service';

export type ExportFormat = 'cegid' | 'sage' | 'quadra' | 'acd' | 'fec';

export interface ExportEntryLine {
    journal: string;
    date: string;
    piece: string;
    account: string;
    label: string;
    debit: string;
    credit: string;
    [key: string]: string; // Support for format-specific fields
}

/**
 * Format helper for amounts (French style: 15,50)
 */
function formatAmount(amount?: number | string | null): string {
    if (amount === undefined || amount === null) return "0,00";
    const num = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
    if (isNaN(num)) return "0,00";
    return num.toFixed(2).replace('.', ',');
}

/**
 * Format helper for dates (DDMMYYYY for Cegid/Sage)
 */
function formatDate(isoString?: string): string {
    if (!isoString) return new Date().toLocaleDateString('fr-FR').replace(/\//g, '');
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return new Date().toLocaleDateString('fr-FR').replace(/\//g, '');
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}${m}${y}`;
    } catch {
        return new Date().toLocaleDateString('fr-FR').replace(/\//g, '');
    }
}

/**
 * Generates technical lines for a list of documents in a specific format.
 */
export function generateExportLines(documents: Document[], format: ExportFormat): any[] {
    const lines: any[] = [];

    for (const doc of documents) {
        if (!doc.extractedData) continue;
        
        const data = doc.extractedData;
        const aiEntry = data.accountingEntry;
        
        const entityName = data.vendorNames?.[0] || 'INCONNU';
        const docName = doc.name || 'PIECE';
        const dateComptable = formatDate(data.dates?.[0] || doc.uploadDate);
        
        const totalTTC = data.amounts?.[0] || 0;
        const vatAmount = data.vatAmount || 0;
        const totalHT = totalTTC - vatAmount;

        if (doc.type === 'sales_invoice') {
            const journalCode = "VE";
            const debitAccount = aiEntry?.debitAccount || "411000";
            const creditAccount = aiEntry?.creditAccount || "706000";
            const vatAccount = aiEntry?.vatAccount || "445710";
            
            if (format === 'cegid') {
                lines.push({ Journal: journalCode, Date: dateComptable, Piece: docName, Compte: debitAccount, Libelle: `FACT ${entityName}`, Debit: formatAmount(totalTTC), Credit: formatAmount(0) });
                lines.push({ Journal: journalCode, Date: dateComptable, Piece: docName, Compte: creditAccount, Libelle: `FACT ${entityName}`, Debit: formatAmount(0), Credit: formatAmount(totalHT) });
                if (vatAmount > 0) {
                    lines.push({ Journal: journalCode, Date: dateComptable, Piece: docName, Compte: vatAccount, Libelle: `TVA FACT ${entityName}`, Debit: formatAmount(0), Credit: formatAmount(vatAmount) });
                }
            } else if (format === 'sage') {
                lines.push({ Journal: journalCode, Date: dateComptable, Compte: '411000', Tiers: entityName.substring(0, 10), Piece: docName, Libelle: `FACT ${entityName}`, Debit: formatAmount(totalTTC), Credit: formatAmount(0) });
                lines.push({ Journal: journalCode, Date: dateComptable, Compte: creditAccount, Tiers: '', Piece: docName, Libelle: `FACT ${entityName}`, Debit: formatAmount(0), Credit: formatAmount(totalHT) });
                if (vatAmount > 0) {
                    lines.push({ Journal: journalCode, Date: dateComptable, Compte: vatAccount, Tiers: '', Piece: docName, Libelle: `TVA FACT ${entityName}`, Debit: formatAmount(0), Credit: formatAmount(vatAmount) });
                }
            }
        } else if (doc.type === 'bank_statement') {
            const journalCode = "BQ";
            const bankAccount = "512000";
            const attenteAccount = "471000";
            
            if (format === 'cegid') {
                lines.push({ Journal: journalCode, Date: dateComptable, Piece: docName, Compte: bankAccount, Libelle: `REL ${entityName}`, Debit: formatAmount(totalTTC), Credit: formatAmount(0) });
                lines.push({ Journal: journalCode, Date: dateComptable, Piece: docName, Compte: attenteAccount, Libelle: `REL ${entityName}`, Debit: formatAmount(0), Credit: formatAmount(totalTTC) });
            } else if (format === 'sage') {
                lines.push({ Journal: journalCode, Date: dateComptable, Compte: bankAccount, Tiers: '', Piece: docName, Libelle: `REL ${entityName}`, Debit: formatAmount(totalTTC), Credit: formatAmount(0) });
                lines.push({ Journal: journalCode, Date: dateComptable, Compte: attenteAccount, Tiers: '', Piece: docName, Libelle: `REL ${entityName}`, Debit: formatAmount(0), Credit: formatAmount(totalTTC) });
            }
        } else {
            const journalCode = "HA";
            const creditAccount = aiEntry?.creditAccount || "401000";
            const debitAccount = aiEntry?.debitAccount || "606400";
            const vatAccount = aiEntry?.vatAccount || "445660";
            
            if (format === 'cegid') {
                lines.push({ Journal: journalCode, Date: dateComptable, Piece: docName, Compte: creditAccount, Libelle: `FACT ${entityName}`, Debit: formatAmount(0), Credit: formatAmount(totalTTC) });
                lines.push({ Journal: journalCode, Date: dateComptable, Piece: docName, Compte: debitAccount, Libelle: `FACT ${entityName}`, Debit: formatAmount(totalHT), Credit: formatAmount(0) });
                if (vatAmount > 0) {
                    lines.push({ Journal: journalCode, Date: dateComptable, Piece: docName, Compte: vatAccount, Libelle: `TVA FACT ${entityName}`, Debit: formatAmount(vatAmount), Credit: formatAmount(0) });
                }
            } else if (format === 'sage') {
                lines.push({ Journal: journalCode, Date: dateComptable, Compte: '401000', Tiers: entityName.substring(0, 10), Piece: docName, Libelle: `FACT ${entityName}`, Debit: formatAmount(0), Credit: formatAmount(totalTTC) });
                lines.push({ Journal: journalCode, Date: dateComptable, Compte: debitAccount, Tiers: '', Piece: docName, Libelle: `FACT ${entityName}`, Debit: formatAmount(totalHT), Credit: formatAmount(0) });
                if (vatAmount > 0) {
                    lines.push({ Journal: journalCode, Date: dateComptable, Compte: vatAccount, Tiers: '', Piece: docName, Libelle: `TVA FACT ${entityName}`, Debit: formatAmount(vatAmount), Credit: formatAmount(0) });
                }
            }
        }
    }

    return lines;
}

/**
 * Downloads the exported file
 */
export function downloadExport(documents: Document[], format: ExportFormat, filename?: string) {
    if (format === 'fec') {
        return downloadFEC(documents, filename || `FEC_${Date.now()}.txt`);
    }

    const lines = generateExportLines(documents, format);
    const defaultFilename = filename || `export_${format}_${Date.now()}.csv`;
    
    const csvContent = Papa.unparse(lines, {
        delimiter: ";",
        header: true,
        quotes: false
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", defaultFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
