/**
 * Service : Génération des Écritures OD d'Amortissements
 *
 * Règles métier :
 * - Méthode linéaire uniquement (V1)
 * - Génération en brouillon (status: "draft")
 * - Vérification anti-doublon : un seul OD par (assetId, fiscalYear)
 * - Comptes PCG proposés adaptés au type d'actif (extensible)
 *
 * Séparation des responsabilités :
 * - Ce service ne touche pas à Firestore directement (logique pure)
 * - La persistance est gérée par la Cloud Function
 */

import type { Asset, DepreciationSchedule } from '@/lib/types';
import type { AccountingEntry, AccountingEntryLine, GeneratedODResult } from './types';

// ─── Mapping PCG par catégorie d'actif ───────────────────────────────────────
// Extensible : ajouter des catégories pour couvrir les immob. incorp., terrains, etc.

interface AssetAccountMapping {
  debitAccount: string;  // Classe 68 - Dotations
  debitLabel: string;
  creditAccount: string; // Classe 28 - Amortissements
  creditLabel: string;
}

/**
 * Retourne les comptes PCG adaptés selon le nom de l'actif (V1 simplifié).
 * En V2, ce sera piloté par une catégorie explicite sur l'Asset.
 */
function resolveAssetAccounts(assetName: string): AssetAccountMapping {
  const name = assetName.toLowerCase();

  if (name.includes('véhicule') || name.includes('voiture') || name.includes('camion')) {
    return {
      debitAccount: '68112',
      debitLabel: 'Dotations aux amortissements immobilisations corporelles',
      creditAccount: '2815',
      creditLabel: 'Amortissements du matériel de transport',
    };
  }

  if (name.includes('logiciel') || name.includes('software') || name.includes('licence')) {
    return {
      debitAccount: '68811',
      debitLabel: 'Dotations aux amortissements immobilisations incorporelles',
      creditAccount: '2805',
      creditLabel: 'Amortissements des logiciels et droits incorporels',
    };
  }

  // Par défaut : matériel de bureau et informatique (68112 / 28183)
  return {
    debitAccount: '68112',
    debitLabel: 'Dotations aux amortissements immobilisations corporelles',
    creditAccount: '28183',
    creditLabel: 'Amortissements matériel de bureau et informatique',
  };
}

// ─── Générateur d'OD ─────────────────────────────────────────────────────────

/**
 * Génère l'écriture OD de dotation pour une immobilisation et un exercice.
 * Retourne null si aucune dotation n'est prévue pour cet exercice.
 */
export function generateDepreciationOD(
  asset: Asset,
  fiscalYear: number,
  entryId: string
): GeneratedODResult | null {
  // Trouver la ligne du plan pour cet exercice
  const scheduleLine: DepreciationSchedule | undefined = asset.schedule.find(
    (s) => s.year === fiscalYear
  );

  if (!scheduleLine || scheduleLine.depreciationAmount <= 0) {
    return null; // Pas de dotation pour cet exercice
  }

  const accounts = resolveAssetAccounts(asset.name);
  const dotationAmount = scheduleLine.depreciationAmount;
  const entryDate = `${fiscalYear}-12-31`; // Écriture de clôture conventionnelle

  const lines: AccountingEntryLine[] = [
    {
      accountNumber: accounts.debitAccount,
      accountLabel: accounts.debitLabel,
      debit: dotationAmount,
      credit: 0,
    },
    {
      accountNumber: accounts.creditAccount,
      accountLabel: accounts.creditLabel,
      debit: 0,
      credit: dotationAmount,
    },
  ];

  const entry: AccountingEntry = {
    id: entryId,
    clientId: asset.clientId,
    cabinetId: asset.cabinetId,
    journalCode: 'OD',
    entryDate,
    label: `Dotation amortissement - ${asset.name} - ${fiscalYear}`,
    lines,
    sourceType: 'asset_depreciation',
    sourceId: asset.id,
    fiscalYear,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { assetId: asset.id, fiscalYear, entry };
}

/**
 * Vérifie si une écriture OD existe déjà pour (assetId, fiscalYear).
 * À utiliser côté backend avant de créer une nouvelle écriture.
 */
export function buildODDuplicateKey(assetId: string, fiscalYear: number): string {
  return `od_${assetId}_${fiscalYear}`;
}
