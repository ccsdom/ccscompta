'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/extract-data-from-documents.ts';
import '@/ai/flows/recognize-document-type.ts';
import '@/ai/flows/intelligent-search-flow.ts';
import '@/ai/flows/validate-extraction.ts';
import '@/ai/tools/find-matching-document.ts';
import '@/ai/flows/support-chat-flow.ts';
