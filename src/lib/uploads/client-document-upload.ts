import type { FirebaseStorage } from 'firebase/storage';
import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import type { Firestore } from 'firebase/firestore';
import { collection, doc, getDoc, increment, writeBatch } from 'firebase/firestore';
import type { AuditEvent, Document } from '@/lib/types';

export const MAX_ACCOUNTING_UPLOAD_FILES = 50;
export const MAX_ACCOUNTING_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

export interface FileUploadRejection {
  fileName: string;
  reason: string;
}

export interface ValidatedAccountingFiles {
  acceptedFiles: File[];
  rejectedFiles: FileUploadRejection[];
}

interface UploadClientDocumentInput {
  db: Firestore;
  storage: FirebaseStorage;
  file: File;
  clientId: string;
  currentUser: string;
  cabinetId?: string | null;
  auditAction?: string;
}

export interface UploadClientDocumentResult {
  documentId: string;
  storagePath: string;
  cabinetId: string;
}

function isAcceptedAccountingFile(file: File) {
  return file.type === 'application/pdf' || file.type.startsWith('image/');
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'document';
}

function createAuditEvent(user: string, action: string): AuditEvent {
  return {
    action,
    date: new Date().toISOString(),
    user,
  };
}

export function validateAccountingFiles(files: File[]): ValidatedAccountingFiles {
  const acceptedFiles: File[] = [];
  const rejectedFiles: FileUploadRejection[] = [];

  files.forEach((file, index) => {
    if (index >= MAX_ACCOUNTING_UPLOAD_FILES) {
      rejectedFiles.push({
        fileName: file.name,
        reason: `Limite de ${MAX_ACCOUNTING_UPLOAD_FILES} fichiers par envoi depassee.`,
      });
      return;
    }

    if (!isAcceptedAccountingFile(file)) {
      rejectedFiles.push({
        fileName: file.name,
        reason: 'Format non accepte. Utilisez PDF, PNG ou JPG.',
      });
      return;
    }

    if (file.size > MAX_ACCOUNTING_UPLOAD_SIZE_BYTES) {
      rejectedFiles.push({
        fileName: file.name,
        reason: 'Fichier superieur a 20 Mo.',
      });
      return;
    }

    acceptedFiles.push(file);
  });

  return { acceptedFiles, rejectedFiles };
}

export function summarizeUploadRejections(rejections: FileUploadRejection[]) {
  const visible = rejections.slice(0, 3).map((rejection) => `${rejection.fileName}: ${rejection.reason}`);
  const remaining = rejections.length - visible.length;

  return remaining > 0
    ? `${visible.join(' ')} +${remaining} autre(s) fichier(s) ignore(s).`
    : visible.join(' ');
}

export async function uploadClientDocument({
  db,
  storage,
  file,
  clientId,
  currentUser,
  cabinetId,
  auditAction = 'Document televerse',
}: UploadClientDocumentInput): Promise<UploadClientDocumentResult> {
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

  const storagePath = `${clientId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

  const documentRef = doc(collection(db, 'documents'));
  const clientRef = doc(db, 'clients', clientId);
  const documentData: Omit<Document, 'id' | 'dataUrl'> = {
    name: file.name,
    uploadDate: new Date().toISOString(),
    status: 'pending',
    storagePath,
    clientId,
    cabinetId: resolvedCabinetId,
    comments: [],
    auditTrail: [createAuditEvent(currentUser, auditAction)],
  };

  const batch = writeBatch(db);
  batch.set(documentRef, documentData);
  batch.update(clientRef, { newDocuments: increment(1) });

  try {
    await batch.commit();
  } catch (error) {
    await deleteObject(storageRef).catch((cleanupError) => {
      console.warn('Could not cleanup uploaded file after Firestore failure.', cleanupError);
    });
    throw error;
  }

  return {
    documentId: documentRef.id,
    storagePath,
    cabinetId: resolvedCabinetId,
  };
}
