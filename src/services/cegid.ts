import { Document } from '@/lib/types';
import Papa from 'papaparse';

/**
 * Format d'une ligne du journal d'achats Cegid (format TRA/CSV).
 */
export interface CegidEntryLine {
    Journal: string;
    Date: string; // Format DDMMYYYY
    Piece: string; // Nom ou ID facture
    Compte: string;
    Libelle: string;
    Debit: string; // "0,00"
    Credit: string; // "0,00"
}

/**
 * Convertit un montant format texte / nombre en string formatté FR ("15,50")
 */
function formatAmount(amount?: number | string | null): string {
    if (amount === undefined || amount === null) return "0,00";
    const num = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
    if (isNaN(num)) return "0,00";
    return num.toFixed(2).replace('.', ',');
}

/**
 * Convertit une date ISO ("2023-12-01") en DDMMYYYY
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
 * Transforme une liste de Documents approuvés en lignes comptables formatées Cegid.
 * Génère 3 lignes par facture (Fournisseur, Charge, TVA).
 * @param documents Liste des documents ayant le format "approved" et des analyses IA.
 * @param journalCode Le code journal des achats, par défaut "HA".
 */
export function generateCegidEntries(documents: Document[], journalCode: string = "HA"): CegidEntryLine[] {
    const entries: CegidEntryLine[] = [];

    for (const doc of documents) {
        if (!doc.extractedData) continue;
        
        const data = doc.extractedData;
        const aiEntry = data.accountingEntry;
        
        // Sécurités basiques
        const vendorName = data.vendorNames?.[0] || 'FOURNISSEUR INCONNU';
        const docName = doc.name || 'PIECE_SANS_NOM';
        const dateComptable = formatDate(data.dates?.[0] || doc.uploadDate);
        
        const totalTTC = data.amounts?.[0] || 0;
        const vatAmount = data.vatAmount || 0;
        const totalHT = totalTTC - vatAmount;

        const creditAccount = aiEntry?.creditAccount || "401000";
        const debitAccount = aiEntry?.debitAccount || "606400"; // Defaut charge
        const vatAccount = aiEntry?.vatAccount || "445660"; // Defaut TVA
        
        // 1. Ligne Fournisseur (Crédit du TTC)
        entries.push({
            Journal: journalCode,
            Date: dateComptable,
            Piece: docName,
            Compte: creditAccount,
            Libelle: `FACT ${vendorName}`,
            Debit: formatAmount(0),
            Credit: formatAmount(totalTTC)
        });

        // 2. Ligne Charge (Débit du HT)
        entries.push({
            Journal: journalCode,
            Date: dateComptable,
            Piece: docName,
            Compte: debitAccount,
            Libelle: `FACT ${vendorName}`,
            Debit: formatAmount(totalHT),
            Credit: formatAmount(0)
        });

        // 3. Ligne TVA (Débit de la TVA) (Si TVA existante)
        if (vatAmount > 0) {
            entries.push({
                Journal: journalCode,
                Date: dateComptable,
                Piece: docName,
                Compte: vatAccount,
                Libelle: `TVA FACT ${vendorName}`,
                Debit: formatAmount(vatAmount),
                Credit: formatAmount(0)
            });
        }
    }

    return entries;
}

/**
 * Génère le fichier CSV formaté et lance son téléchargement dans le navigateur.
 */
export function downloadCegidCSV(documents: Document[], filename: string = "export_cegid.csv") {
    const entries = generateCegidEntries(documents);
    
    // We use PapaParse to generate correctly formatted CSV with semi-colons
    const csvContent = Papa.unparse(entries, {
        delimiter: ";", // Séparateur français standard
        header: true,
        quotes: false // Evite les guillemets superflus si possible sauf si nécessaire
    });

    // BOM pour forcer Excel à lire l'UTF-8
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Auto-téléchargement
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

