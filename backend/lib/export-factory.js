"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportFactory = void 0;
/**
 * Service to generate accounting export files (FEC, CSV).
 */
class ExportFactory {
    /**
     * Generates a French FEC (Fichier des Ecritures Comptables) string.
     * Format: Tab-separated values with specific DGFIP columns.
     */
    /**
     * Generates a French FEC (Fichier des Ecritures Comptables) string.
     * Conforme à l'article A. 47 A-1 du Livre des Procédures Fiscales.
     * Separator: Pipe (|)
     */
    static generateFEC(documents) {
        var _a, _b, _c, _d;
        const columns = [
            'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
            'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
            'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
            'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise'
        ];
        const header = columns.join('|');
        const rows = [header];
        let ecritureNum = 1;
        // Helper to format date as YYYYMMDD
        const formatDate = (dateStr) => {
            if (!dateStr)
                return '';
            return dateStr.split('T')[0].replace(/-/g, '');
        };
        // Helper to format amount as 0,00
        const formatAmount = (num) => {
            return (num || 0).toFixed(2).replace('.', ',');
        };
        for (const doc of documents) {
            if (!doc.extractedData)
                continue;
            const data = doc.extractedData;
            const entry = data.accountingEntry;
            const journalCode = doc.type === 'bank_statement' ? 'BQ' : 'HA';
            const journalLib = doc.type === 'bank_statement' ? 'Banque' : 'Achats';
            const pieceDate = formatDate(((_a = data.dates) === null || _a === void 0 ? void 0 : _a[0]) || doc.uploadDate);
            const pieceRef = doc.name || doc.id.substring(0, 8);
            const ecritureLib = `Facture ${((_b = data.vendorNames) === null || _b === void 0 ? void 0 : _b[0]) || 'Inconnu'}`;
            const validDate = formatDate(doc.uploadDate);
            const totalTTC = ((_c = data.amounts) === null || _c === void 0 ? void 0 : _c[0]) || 0;
            const vatAmount = data.vatAmount || 0;
            const totalHT = totalTTC - vatAmount;
            const seqNum = String(ecritureNum).padStart(5, '0');
            // --- Line 1: Tiers (Credit TTC) ---
            rows.push([
                journalCode, journalLib, seqNum, pieceDate,
                (entry === null || entry === void 0 ? void 0 : entry.creditAccount) || '401000', ((_d = data.vendorNames) === null || _d === void 0 ? void 0 : _d[0]) || 'FOURNISSEUR', '', '',
                pieceRef, pieceDate, ecritureLib, formatAmount(0), formatAmount(totalTTC),
                '', '', validDate, '', ''
            ].join('|'));
            // --- Line 2: Charge (Debit HT) ---
            rows.push([
                journalCode, journalLib, seqNum, pieceDate,
                (entry === null || entry === void 0 ? void 0 : entry.debitAccount) || '606100', 'Charges', '', '',
                pieceRef, pieceDate, ecritureLib, formatAmount(totalHT), formatAmount(0),
                '', '', validDate, '', ''
            ].join('|'));
            // --- Line 3: TVA (Debit TVA) ---
            if (vatAmount > 0) {
                rows.push([
                    journalCode, journalLib, seqNum, pieceDate,
                    (entry === null || entry === void 0 ? void 0 : entry.vatAccount) || '445660', 'TVA Déductible', '', '',
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
    static generateCSV(documents) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const columns = [
            'Date', 'Document', 'Vendeur', 'Montant TTC', 'TVA', 'Compte Debit', 'Compte Credit', 'Status Export'
        ];
        const rows = [columns.join(',')];
        for (const doc of documents) {
            const row = [
                doc.uploadDate || '',
                doc.name || '',
                ((_b = (_a = doc.extractedData) === null || _a === void 0 ? void 0 : _a.vendorNames) === null || _b === void 0 ? void 0 : _b[0]) || '',
                (((_d = (_c = doc.extractedData) === null || _c === void 0 ? void 0 : _c.amounts) === null || _d === void 0 ? void 0 : _d[0]) || 0).toString(),
                (((_e = doc.extractedData) === null || _e === void 0 ? void 0 : _e.vatAmount) || 0).toString(),
                ((_g = (_f = doc.extractedData) === null || _f === void 0 ? void 0 : _f.accountingEntry) === null || _g === void 0 ? void 0 : _g.debitAccount) || '',
                ((_j = (_h = doc.extractedData) === null || _h === void 0 ? void 0 : _h.accountingEntry) === null || _j === void 0 ? void 0 : _j.creditAccount) || '',
                'Exported'
            ];
            rows.push(row.map(v => `"${v.toString().replace(/"/g, '""')}"`).join(','));
        }
        return rows.join('\n');
    }
}
exports.ExportFactory = ExportFactory;
//# sourceMappingURL=export-factory.js.map