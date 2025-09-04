
import { config } from 'dotenv';
// Doit être la toute première chose à s'exécuter pour charger les variables d'environnement
config({ path: '.env' });

'use server';

import '@/ai/flows/extract-data-from-documents.ts';
import '@/ai/flows/recognize-document-type.ts';
import '@/ai/flows/intelligent-search-flow.ts';
import '@/ai/flows/validate-extraction.ts';
import '@/ai/tools/find-matching-document.ts';
import '@/ai/flows/support-chat-flow.ts';
import '@/ai/flows/client-actions.ts';
import '@/ai/flows/document-actions.ts';
