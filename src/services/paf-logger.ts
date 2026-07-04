import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auditService } from "./audit-service";

export class PafLogger {
    private static instance: PafLogger;

    private constructor() {}

    public static getInstance(): PafLogger {
        if (!PafLogger.instance) {
            PafLogger.instance = new PafLogger();
        }
        return PafLogger.instance;
    }

    /**
     * Logs a change to a document field for the Piste d'Audit Fiable.
     */
    public async logChange(
        documentId: string,
        documentName: string,
        actor: { name: string; email: string },
        field: string,
        oldValue: any,
        newValue: any
    ) {
        try {
            const pafRef = collection(db, "documents", documentId, "paf_logs");
            
            const logEntry = {
                field,
                oldValue: oldValue ?? null,
                newValue: newValue ?? null,
                userName: actor.name || 'Unknown',
                userEmail: actor.email || 'unknown@paf.ai',
                date: new Date().toISOString(),
                createdAt: serverTimestamp()
            };

            await addDoc(pafRef, logEntry);

            // Log a general document action for visibility in the admin/audit feed
            await auditService.logDocumentAction(
                `Correction PAF (${field})`,
                actor,
                documentId,
                documentName,
                { field, oldValue, newValue }
            );
        } catch (error) {
            console.error("Failed to log PAF event:", error);
        }
    }

    /**
     * Helper to compare and log changes between old and new document data.
     */
    public async logFormDifferences(
        documentId: string,
        documentName: string,
        actor: { name: string; email: string },
        oldData: any,
        newData: any
    ) {
        const fieldsToCompare = [
            { key: 'supplierName', label: 'Nom du Fournisseur' },
            { key: 'siret', label: 'SIRET' },
            { key: 'date', label: 'Date' },
            { key: 'amountTTC', label: 'Montant TTC' },
            { key: 'amountHT', label: 'Montant HT' },
            { key: 'amountTVA', label: 'Montant TVA' },
            { key: 'debitAccount', label: 'Compte de Charge (Débit)' },
            { key: 'creditAccount', label: 'Compte Tiers (Crédit)' },
            { key: 'vatAccount', label: 'Compte TVA' }
        ];

        // Flat comparison helper
        const getFlatValue = (obj: any, path: string) => {
            if (!obj) return undefined;
            if (path === 'date') return obj.dates?.[0] || obj.date || '';
            if (path === 'supplierName') return obj.supplierName || obj.vendorNames?.[0] || '';
            if (path === 'amountTTC') return obj.amounts?.[0] || obj.amount || 0;
            if (path === 'amountHT') return obj.baseHT || obj.amountHT || 0;
            if (path === 'amountTVA') {
                if (Array.isArray(obj.vatDetails)) {
                    return obj.vatDetails.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
                }
                return obj.vatDetails?.amount || obj.amountTVA || 0;
            }
            if (path === 'debitAccount') return obj.accountingEntry?.debitAccount || '';
            if (path === 'creditAccount') return obj.accountingEntry?.creditAccount || '';
            if (path === 'vatAccount') return obj.accountingEntry?.vatAccount || '';
            return obj[path];
        };

        for (const field of fieldsToCompare) {
            const oldVal = getFlatValue(oldData, field.key);
            const newVal = getFlatValue(newData, field.key);

            // Normalize values for comparison
            const normOld = typeof oldVal === 'number' ? Number(oldVal.toFixed(2)) : String(oldVal || '').trim();
            const normNew = typeof newVal === 'number' ? Number(newVal.toFixed(2)) : String(newVal || '').trim();

            if (normOld !== normNew) {
                await this.logChange(documentId, documentName, actor, field.label, oldVal, newVal);
            }
        }
    }
}

export const pafLogger = PafLogger.getInstance();
