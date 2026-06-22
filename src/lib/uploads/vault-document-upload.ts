import type { FirebaseStorage } from 'firebase/storage';
import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import type { Firestore } from 'firebase/firestore';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import type { VaultDocument, VaultCategory } from '@/lib/types';

interface UploadVaultDocumentInput {
  db: Firestore;
  storage: FirebaseStorage;
  file: File;
  clientId: string;
  cabinetId?: string | null;
  uploadedBy: 'client' | 'accountant';
  uploaderName: string;
  category: VaultCategory;
}

export interface UploadVaultDocumentResult {
  documentId: string;
  storagePath: string;
  cabinetId: string;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'document';
}

export async function uploadVaultDocument({
  db,
  storage,
  file,
  clientId,
  cabinetId,
  uploadedBy,
  uploaderName,
  category,
}: UploadVaultDocumentInput): Promise<UploadVaultDocumentResult> {
  let resolvedCabinetId = cabinetId || '';

  if (!resolvedCabinetId) {
    const clientSnap = await getDoc(doc(db, 'clients', clientId));
    if (!clientSnap.exists()) {
      throw new Error('Client introuvable.');
    }
    resolvedCabinetId = clientSnap.data().cabinetId || '';
  }

  if (!resolvedCabinetId) {
    throw new Error('Cabinet introuvable pour ce client.');
  }

  const storagePath = `vault/${clientId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

  const documentRef = doc(collection(db, 'vault_documents'));
  
  const documentData: Omit<VaultDocument, 'id'> = {
    name: file.name,
    uploadDate: new Date().toISOString(),
    storagePath,
    clientId,
    cabinetId: resolvedCabinetId,
    uploadedBy,
    uploaderName,
    category,
  };

  const batch = writeBatch(db);
  batch.set(documentRef, documentData);

  try {
    await batch.commit();
  } catch (error) {
    await deleteObject(storageRef).catch((cleanupError) => {
      console.warn('Could not cleanup uploaded vault file after Firestore failure.', cleanupError);
    });
    throw error;
  }

  return {
    documentId: documentRef.id,
    storagePath,
    cabinetId: resolvedCabinetId,
  };
}
