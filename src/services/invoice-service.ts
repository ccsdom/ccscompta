'use client';

import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

type CreateInvoiceForDocumentInput = {
  clientId: string;
  documentId: string;
};

type CreateInvoiceForDocumentOutput = {
  success: true;
  id: string;
};

export async function createInvoiceForDocument(
  client: { id: string },
  documentId: string
): Promise<string> {
  const callable = httpsCallable<CreateInvoiceForDocumentInput, CreateInvoiceForDocumentOutput>(
    functions,
    'createInvoiceForDocument'
  );
  const result = await callable({ clientId: client.id, documentId });
  return result.data.id;
}
