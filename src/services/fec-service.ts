import { Document } from '@/lib/types';

/**
 * Service pour la génération du Fichier des Écritures Comptables (FEC)
 * Conforme à l'article A. 47 A-1 du Livre des Procédures Fiscales.
 */

export interface FECLine {
  JournalCode: string; // 1
  JournalLib: string; // 2
  EcritureNum: string; // 3
  EcritureDate: string; // 4 (AAAAMMJJ)
  CompteNum: string; // 5
  CompteLib: string; // 6
  CompAuxNum: string; // 7
  CompAuxLib: string; // 8
  PieceRef: string; // 9
  PieceDate: string; // 10 (AAAAMMJJ)
  EcritureLib: string; // 11
  Debit: string; // 12
  Credit: string; // 13
  EcritureLet: string; // 14
  DateLet: string; // 15
  ValidDate: string; // 16
  Montantdevise: string; // 17
  Idevise: string; // 18
}

/**
 * Formate un montant pour le FEC (Ex: 1234,56)
 */
function formatAmount(amount?: number | null): string {
  if (amount === undefined || amount === null) return "0,00";
  return amount.toFixed(2).replace('.', ',');
}

/**
 * Formate une date au format AAAAMMJJ
 */
function formatDate(isoString?: string): string {
  if (!isoString) return new Date().toISOString().split('T')[0].replace(/-/g, '');
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0].replace(/-/g, '');
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  } catch {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }
}

/**
 * Génère les lignes FEC à partir d'une liste de documents.
 */
export function generateFECLines(documents: Document[], journalCode: string = "HA", journalLib: string = "Achats"): FECLine[] {
  const lines: FECLine[] = [];
  let ecritureCounter = 1;

  for (const doc of documents) {
    if (!doc.extractedData) continue;

    const data = doc.extractedData;
    const aiEntry = data.accountingEntry;
    
    const vendorName = data.vendorNames?.[0] || 'FOURNISSEUR INCONNU';
    const pieceRef = doc.name || doc.id;
    const pieceDate = formatDate(data.dates?.[0] || doc.uploadDate);
    const validDate = formatDate(doc.uploadDate);
    
    const totalTTC = data.amounts?.[0] || 0;
    const vatAmount = data.vatAmount || 0;
    const totalHT = totalTTC - vatAmount;

    const creditAccount = aiEntry?.creditAccount || "401000";
    const debitAccount = aiEntry?.debitAccount || "606400";
    const vatAccount = aiEntry?.vatAccount || "445660";
    
    const ecritureNum = String(ecritureCounter).padStart(5, '0');
    const ecritureLib = `Facture ${vendorName}`;

    // 1. Ligne Tiers (Crédit TTC)
    lines.push({
      JournalCode: journalCode,
      JournalLib: journalLib,
      EcritureNum: ecritureNum,
      EcritureDate: pieceDate,
      CompteNum: creditAccount,
      CompteLib: vendorName,
      CompAuxNum: "", 
      CompAuxLib: "",
      PieceRef: pieceRef,
      PieceDate: pieceDate,
      EcritureLib: ecritureLib,
      Debit: formatAmount(0),
      Credit: formatAmount(totalTTC),
      EcritureLet: "",
      DateLet: "",
      ValidDate: validDate,
      Montantdevise: "",
      Idevise: ""
    });

    // 2. Ligne Charge (Débit HT)
    lines.push({
      JournalCode: journalCode,
      JournalLib: journalLib,
      EcritureNum: ecritureNum,
      EcritureDate: pieceDate,
      CompteNum: debitAccount,
      CompteLib: "Charge achat",
      CompAuxNum: "",
      CompAuxLib: "",
      PieceRef: pieceRef,
      PieceDate: pieceDate,
      EcritureLib: ecritureLib,
      Debit: formatAmount(totalHT),
      Credit: formatAmount(0),
      EcritureLet: "",
      DateLet: "",
      ValidDate: validDate,
      Montantdevise: "",
      Idevise: ""
    });

    // 3. Ligne TVA (Débit TVA)
    if (vatAmount > 0) {
      lines.push({
        JournalCode: journalCode,
        JournalLib: journalLib,
        EcritureNum: ecritureNum,
        EcritureDate: pieceDate,
        CompteNum: vatAccount,
        CompteLib: "TVA déductible",
        CompAuxNum: "",
        CompAuxLib: "",
        PieceRef: pieceRef,
        PieceDate: pieceDate,
        EcritureLib: `TVA sur ${ecritureLib}`,
        Debit: formatAmount(vatAmount),
        Credit: formatAmount(0),
        EcritureLet: "",
        DateLet: "",
        ValidDate: validDate,
        Montantdevise: "",
        Idevise: ""
      });
    }

    ecritureCounter++;
  }

  return lines;
}

/**
 * Construit le contenu texte du fichier FEC avec le séparateur |
 */
export function buildFECCSV(lines: FECLine[]): string {
  if (lines.length === 0) return "";

  const headers = Object.keys(lines[0]).join("|");
  const content = lines.map(line => Object.values(line).join("|")).join("\r\n");
  
  return `${headers}\r\n${content}\r\n`;
}

/**
 * Déclenche le téléchargement du fichier FEC
 */
export function downloadFEC(documents: Document[], filename: string = "FEC.txt") {
  const lines = generateFECLines(documents);
  const content = buildFECCSV(lines);
  
  // Encoding: UTF-8 with BOM
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, content], { type: 'text/plain;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
