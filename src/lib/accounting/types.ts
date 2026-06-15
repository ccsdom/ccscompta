/**
 * Domaine : Écritures Comptables (OD - Opérations Diverses)
 *
 * Architecture V1 :
 * - Génération en brouillon uniquement (status: "draft")
 * - Validation humaine obligatoire avant export
 * - Extensible pour : dégressif, dérogatoire, cession, rebut
 *
 * Séparation stricte : ce module ne contient aucune logique UI.
 */

// ─── Exercice Comptable ──────────────────────────────────────────────────────

export interface FiscalYear {
  id: string;
  label: string; // ex: "2024"
  startDate: string; // ISO
  endDate: string; // ISO
  isClosed: boolean;
  clientId: string;
  cabinetId: string;
}

// ─── Journal Comptable ────────────────────────────────────────────────────────

export type JournalCode = 'OD' | 'VE' | 'HA' | 'BQ' | 'CA';

// ─── Ligne d'Écriture ─────────────────────────────────────────────────────────

export interface AccountingEntryLine {
  accountNumber: string; // PCG : ex "68112", "28183"
  accountLabel: string; // ex "Dotations aux amortissements immob. corp."
  debit: number; // 0 si crédit
  credit: number; // 0 si débit
  analyticsCode?: string; // V2: code analytique
}

// ─── Source de l'Écriture ────────────────────────────────────────────────────

export type AccountingEntrySourceType =
  | 'asset_depreciation' // Dotation aux amortissements (V1)
  | 'asset_declining_depreciation' // Dégressif (V2)
  | 'exceptional_depreciation' // Amortissement dérogatoire (V2)
  | 'asset_disposal' // Sortie d'immobilisation (V2)
  | 'asset_scrapping' // Mise au rebut (V2)
  | 'asset_sale' // Cession (V2)
  | 'reversal' // Reprise / Correction (V2)
  | 'manual'; // Saisie manuelle

// ─── Écriture Comptable ───────────────────────────────────────────────────────

export interface AccountingEntry {
  id: string;
  clientId: string;
  cabinetId: string;
  journalCode: JournalCode;
  entryDate: string; // ISO
  label: string;
  lines: AccountingEntryLine[];

  // Traçabilité / Source
  sourceType: AccountingEntrySourceType;
  sourceId: string; // ex: assetId ou documentId
  fiscalYear: number; // ex: 2024

  // Cycle de vie
  status: 'draft' | 'validated' | 'exported' | 'cancelled';
  validatedAt?: string; // ISO
  exportedAt?: string; // ISO

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// ─── Résultat de Génération ───────────────────────────────────────────────────

export interface GeneratedODResult {
  assetId: string;
  fiscalYear: number;
  entry: AccountingEntry;
}
