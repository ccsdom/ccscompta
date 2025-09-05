
'use server';

// This is a mock/simulation of a Cegid API client service.
// In a real-world scenario, this would make actual fetch calls to the Cegid API.

interface Supplier {
    id: string;
    name: string;
    email?: string;
}

// Mock database of suppliers in Cegid
const MOCK_CEGID_SUPPLIERS: Supplier[] = [
    { id: 'cegid_1', name: 'Apple Store' },
    { id: 'cegid_2', name: 'Office Depot' },
    { id: 'cegid_3', name: 'SNCF' },
];

/**
 * Finds a supplier in the mock Cegid database.
 * @param name The name of the supplier to find.
 * @returns The supplier object if found, otherwise null.
 */
export async function findSupplier(name: string): Promise<Supplier | null> {
    console.log(`[Cegid Service] Searching for supplier: "${name}"`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const found = MOCK_CEGID_SUPPLIERS.find(s => s.name.toLowerCase() === name.toLowerCase());

    if (found) {
        console.log(`[Cegid Service] Found supplier:`, found);
        return found;
    }
    
    console.log(`[Cegid Service] Supplier not found.`);
    return null;
}

/**
 * Creates a new supplier in the mock Cegid database.
 * @param data The data for the new supplier.
 * @returns The newly created supplier.
 */
export async function createSupplier(data: { name: string, email: string }): Promise<Supplier> {
    console.log(`[Cegid Service] Creating new supplier:`, data);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newSupplier: Supplier = {
        id: `cegid_${Date.now()}`,
        ...data
    };
    
    MOCK_CEGID_SUPPLIERS.push(newSupplier);
    console.log(`[Cegid Service] Supplier created successfully:`, newSupplier);

    return newSupplier;
}

/**
 * Simulates creating an accounting entry in Cegid.
 * In a real implementation, this would call the appropriate Cegid API endpoint.
 * @param entryData The data for the accounting entry.
 */
export async function createAccountingEntry(entryData: any): Promise<{ success: true }> {
    console.log("[Cegid Service] Creating accounting entry with data:", entryData);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log("[Cegid Service] Accounting entry created successfully.");
    return { success: true };
}
