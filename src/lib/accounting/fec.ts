import { AccountingEntry } from './types';
import { format, parseISO } from 'date-fns';

/**
 * Définit les colonnes standards du fichier FEC (Fichier des Écritures Comptables)
 * Format officiel DGFIP (18 colonnes).
 */
const FEC_COLUMNS = [
  'JournalCode',
  'JournalLib',
  'EcritureNum',
  'EcritureDate',
  'CompteNum',
  'CompteLib',
  'CompAuxNum',
  'CompAuxLib',
  'PieceRef',
  'PieceDate',
  'EcritureLib',
  'Debit',
  'Credit',
  'EcritureLet',
  'DateLet',
  'ValidDate',
  'Montantdevise',
  'Idevise',
];

/**
 * Formate une date au standard FEC : AAAAMMJJ
 */
const formatFECDate = (isoDateString: string): string => {
  try {
    const date = parseISO(isoDateString);
    return format(date, 'yyyyMMdd');
  } catch (error) {
    return '';
  }
};

/**
 * Formate un montant au standard FEC : séparateur décimal = virgule, pas de séparateur de milliers
 */
const formatFECAmount = (amount: number): string => {
  return amount.toFixed(2).replace('.', ',');
};

const mapJournalCodeToLib = (code: string): string => {
  const map: Record<string, string> = {
    OD: 'Opérations Diverses',
    VE: 'Ventes',
    HA: 'Achats',
    BQ: 'Banque',
    CA: 'Caisse',
  };
  return map[code] || code;
};

/**
 * Génère la chaîne de caractères (le contenu) d'un fichier FEC à partir d'une liste d'écritures.
 * Utilise le format de séparation par Pipe (|) pour plus de robustesse.
 * 
 * @param entries Les écritures comptables validées ou exportées
 * @param separator Le caractère de séparation (par défaut Pipe `|`)
 * @returns Le contenu textuel du fichier FEC
 */
export const generateFECString = (
  entries: AccountingEntry[],
  separator: string = '|'
): string => {
  const rows: string[][] = [];

  // En-tête
  rows.push(FEC_COLUMNS);

  // Trier les écritures chronologiquement par sécurité
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  sortedEntries.forEach((entry, entryIndex) => {
    // Dans le cas où il n'y a pas de numéro d'écriture fourni, 
    // on utilise un index ou l'ID généré.
    const ecritureNum = `ECR-${entry.fiscalYear}-${String(entryIndex + 1).padStart(5, '0')}`;
    const ecritureDate = formatFECDate(entry.entryDate);
    const validDate = entry.validatedAt ? formatFECDate(entry.validatedAt) : ecritureDate;
    const pieceRef = entry.sourceId || ecritureNum;
    const journalLib = mapJournalCodeToLib(entry.journalCode);

    entry.lines.forEach((line) => {
      const row = [
        entry.journalCode,                     // 1. JournalCode
        journalLib,                            // 2. JournalLib
        ecritureNum,                           // 3. EcritureNum
        ecritureDate,                          // 4. EcritureDate
        line.accountNumber,                    // 5. CompteNum
        line.accountLabel,                     // 6. CompteLib
        '',                                    // 7. CompAuxNum
        '',                                    // 8. CompAuxLib
        pieceRef,                              // 9. PieceRef
        ecritureDate,                          // 10. PieceDate
        entry.label,                           // 11. EcritureLib
        formatFECAmount(line.debit),           // 12. Debit
        formatFECAmount(line.credit),          // 13. Credit
        '',                                    // 14. EcritureLet
        '',                                    // 15. DateLet
        validDate,                             // 16. ValidDate
        '',                                    // 17. Montantdevise
        '',                                    // 18. Idevise
      ];
      rows.push(row);
    });
  });

  return rows.map((row) => row.join(separator)).join('\n');
};
