'use server';

// Note: We are now relying on Next.js's native .env.local loading.
// The `dotenv` package has been removed.

import '@/ai/flows/extract-data-from-documents.ts';
import '@/ai/flows/recognize-document-type.ts';
import '@/ai/flows/intelligent-search-flow.ts';
import '@/ai/flows/validate-extraction.ts';
import '@/ai/tools/find-matching-document.ts';
import '@/ai/flows/support-chat-flow.ts';
import '@/ai/flows/client-actions.ts';
import '@/ai/flows/document-actions.ts';