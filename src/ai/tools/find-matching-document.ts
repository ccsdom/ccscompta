
'use server';
/**
 * @fileOverview A tool for finding matching documents in the system.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// This is a mock of the document structure stored in localStorage
const DocumentSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string().optional(),
    extractedData: z.object({
        amounts: z.array(z.number()).optional(),
        vendorNames: z.array(z.string()).optional(),
        dates: z.array(z.string()).optional(),
    }).optional(),
});

// This is a mock implementation that would fetch from a database in a real app.
// For the demo, we are passing the documents from the client-side.
const findDocumentInStorage = (
    allDocs: z.infer<typeof DocumentSchema>[],
    amount: number, 
    vendor: string, 
    date: string
): string | null => {
    
    const transactionDate = new Date(date);
    const searchAmount = Math.abs(amount); // Search for positive amount

    let bestMatch: { docId: string; score: number } | null = null;

    for (const doc of allDocs) {
        // We only search in invoices and receipts
        if (doc.type !== 'purchase invoice' && doc.type !== 'receipt') {
            continue;
        }

        if (doc.extractedData && doc.extractedData.amounts && doc.extractedData.amounts.length > 0) {
            const docAmount = doc.extractedData.amounts[0];
            const docVendor = (doc.extractedData.vendorNames?.[0] || '').toLowerCase();
            const docDate = doc.extractedData.dates?.[0] ? new Date(doc.extractedData.dates[0]) : null;

            let score = 0;
            
            // Amount match (required)
            if (Math.abs(docAmount - searchAmount) < 0.01) { // Check for floating point equality
                score += 10;
            } else {
                continue; // If amount doesn't match, it's not the right document
            }

            // Vendor match (strong signal)
            if (vendor && docVendor && docVendor.includes(vendor.toLowerCase())) {
                score += 5;
            }

            // Date match (good signal, allow some flexibility)
            if (docDate) {
                const timeDiff = Math.abs(transactionDate.getTime() - docDate.getTime());
                const daysDiff = timeDiff / (1000 * 3600 * 24);
                if (daysDiff < 15) { // Allow up to a 15-day difference
                    score += 3;
                }
            }
            
            if (bestMatch === null || score > bestMatch.score) {
                bestMatch = { docId: doc.id, score };
            }
        }
    }
    
    // Require a minimum score to be considered a match
    if (bestMatch && bestMatch.score >= 13) {
        return bestMatch.docId;
    }

    return null;
}


export const findMatchingDocumentTool = ai.defineTool(
    {
        name: 'findMatchingDocument',
        description: 'Finds a matching invoice or receipt for a given bank transaction based on amount, vendor, and date. Returns the ID of the matching document if found.',
        inputSchema: z.object({
            amount: z.number().describe('The transaction amount (can be negative for debits).'),
            vendor: z.string().describe('The cleaned vendor name from the transaction.'),
            date: z.string().describe('The date of the transaction (ISO format).'),
            allClientDocuments: z.array(DocumentSchema).describe('The full list of documents (invoices and receipts) for the client.'),
        }),
        outputSchema: z.string().optional(),
    },
    async (input) => {
       const matchId = findDocumentInStorage(input.allClientDocuments, input.amount, input.vendor, input.date);
       return matchId || undefined;
    }
);

    
