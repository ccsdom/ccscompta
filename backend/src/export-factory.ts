
/**
 * Service to generate accounting export files (FEC, CSV).
 */
export class ExportFactory {
  
  /**
   * Generates a French FEC (Fichier des Ecritures Comptables) string.
   * Format: Tab-separated values with specific DGFIP columns.
   */
  /**
   * Generates a French FEC (Fichier des Ecritures Comptables) string.
   * Conforme à l'article A. 47 A-1 du Livre des Procédures Fiscales.
   * Separator: Pipe (|)
   */
  static generateFEC(documents: any[]): string {
    const columns = [
      'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
      'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
      'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
      'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise'
    ];

    const header = columns.join('|');
    const rows: string[] = [header];

    let ecritureNum = 1;

    // Helper to format date as YYYYMMDD
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      return dateStr.split('T')[0].replace(/-/g, '');
    };

    // Helper to format amount as 0,00
    const formatAmount = (num: number) => {
      return (num || 0).toFixed(2).replace('.', ',');
    };

    for (const doc of documents) {
      if (!doc.extractedData) continue;

      const data = doc.extractedData;
      const entry = data.accountingEntry;
      
      const journalCode = doc.type === 'bank_statement' ? 'BQ' : 'HA';
      const journalLib = doc.type === 'bank_statement' ? 'Banque' : 'Achats';
      const pieceDate = formatDate(data.dates?.[0] || doc.uploadDate);
      const pieceRef = doc.name || doc.id.substring(0, 8);
      const ecritureLib = `Facture ${data.vendorNames?.[0] || 'Inconnu'}`;
      const validDate = formatDate(doc.uploadDate);

      const totalTTC = data.amounts?.[0] || 0;
      const vatAmount = data.vatAmount || 0;
      const totalHT = totalTTC - vatAmount;

      const seqNum = String(ecritureNum).padStart(5, '0');

      // --- Line 1: Tiers (Credit TTC) ---
      rows.push([
        journalCode, journalLib, seqNum, pieceDate,
        entry?.creditAccount || '401000', data.vendorNames?.[0] || 'FOURNISSEUR', '', '',
        pieceRef, pieceDate, ecritureLib, formatAmount(0), formatAmount(totalTTC),
        '', '', validDate, '', ''
      ].join('|'));

      // --- Line 2: Charge (Debit HT) ---
      rows.push([
        journalCode, journalLib, seqNum, pieceDate,
        entry?.debitAccount || '606100', 'Charges', '', '',
        pieceRef, pieceDate, ecritureLib, formatAmount(totalHT), formatAmount(0),
        '', '', validDate, '', ''
      ].join('|'));

      // --- Line 3: TVA (Debit TVA) ---
      if (vatAmount > 0) {
        rows.push([
          journalCode, journalLib, seqNum, pieceDate,
          entry?.vatAccount || '445660', 'TVA Déductible', '', '',
          pieceRef, pieceDate, `TVA sur ${ecritureLib}`, formatAmount(vatAmount), formatAmount(0),
          '', '', validDate, '', ''
        ].join('|'));
      }

      ecritureNum++;
    }

    return rows.join('\r\n');
  }

  /**
   * Generates a simple generic CSV for Excel usage.
   */
  static generateCSV(documents: any[]): string {
    const columns = [
      'Date', 'Document', 'Vendeur', 'Montant TTC', 'TVA', 'Compte Debit', 'Compte Credit', 'Status Export'
    ];

    const rows = [columns.join(',')];

    for (const doc of documents) {
      const row = [
        doc.uploadDate || '',
        doc.name || '',
        doc.extractedData?.vendorNames?.[0] || '',
        (doc.extractedData?.amounts?.[0] || 0).toString(),
        (doc.extractedData?.vatAmount || 0).toString(),
        doc.extractedData?.accountingEntry?.debitAccount || '',
        doc.extractedData?.accountingEntry?.creditAccount || '',
        'Exported'
      ];
      rows.push(row.map(v => `"${v.toString().replace(/"/g, '""')}"`).join(','));
    }

    return rows.join('\n');
  }

  /**
   * Generates a French FEC string from standardized AccountingEntry objects.
   * Format: DGFIP compliance with Pipe (|) separator.
   */
  static generateFECFromEntries(entries: any[]): string {
    const columns = [
      'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
      'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
      'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
      'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise'
    ];

    const rows: string[] = [columns.join('|')];

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      return dateStr.split('T')[0].replace(/-/g, '');
    };

    const formatAmount = (num: number) => {
      return (num || 0).toFixed(2).replace('.', ',');
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

    // Sort chronologically
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    sortedEntries.forEach((entry, index) => {
      const ecritureNum = `ECR-${entry.fiscalYear}-${String(index + 1).padStart(5, '0')}`;
      const ecritureDate = formatDate(entry.entryDate);
      const validDate = formatDate(entry.validatedAt) || ecritureDate;
      const pieceRef = entry.sourceId || ecritureNum;
      const journalLib = mapJournalCodeToLib(entry.journalCode);

      entry.lines.forEach((line: any) => {
        rows.push([
          entry.journalCode,
          journalLib,
          ecritureNum,
          ecritureDate,
          line.accountNumber,
          line.accountLabel,
          '', // CompAuxNum
          '', // CompAuxLib
          pieceRef,
          ecritureDate, // PieceDate
          entry.label,
          formatAmount(line.debit),
          formatAmount(line.credit),
          '', // EcritureLet
          '', // DateLet
          validDate,
          '', // Montantdevise
          ''  // Idevise
        ].join('|'));
      });
    });

    return rows.join('\r\n');
  }
}
