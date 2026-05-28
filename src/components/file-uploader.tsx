'use client';

import { useId, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import {
  MAX_ACCOUNTING_UPLOAD_FILES,
  MAX_ACCOUNTING_UPLOAD_SIZE_BYTES,
  validateAccountingFiles,
  type FileUploadRejection,
} from '@/lib/uploads/client-document-upload';

interface FileUploaderProps {
  onFileDrop: (files: File[]) => Promise<void>;
  isLoading: boolean;
  onFileReject?: (rejections: FileUploadRejection[]) => void;
}

export function FileUploader({ onFileDrop, isLoading: parentIsLoading, onFileReject }: FileUploaderProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isLoading = parentIsLoading || isUploading;
  const maxUploadSizeMb = Math.round(MAX_ACCOUNTING_UPLOAD_SIZE_BYTES / 1024 / 1024);

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isLoading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const startUploadProcess = async (files: File[]) => {
    if (isLoading) return;

    const { acceptedFiles, rejectedFiles } = validateAccountingFiles(files);

    if (rejectedFiles.length > 0) {
      onFileReject?.(rejectedFiles);
    }

    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    try {
      await onFileDrop(acceptedFiles);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;

    void startUploadProcess(Array.from(event.dataTransfer.files));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    void startUploadProcess(Array.from(event.target.files));
    event.target.value = '';
  };

  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/30 to-blue-500/30 opacity-30 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200 ${isDragging ? 'opacity-100 blur-md' : ''}`} />
      <label
        htmlFor={inputId}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        aria-busy={isLoading}
        aria-disabled={isLoading}
        className={`relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border p-6 transition-all duration-300 hover:border-primary/50 sm:p-8 ${
          isDragging && !isLoading
            ? 'scale-[1.02] border-primary bg-primary/5 shadow-xl'
            : 'border-border bg-background/50 backdrop-blur-sm'
        }`}
      >
        <input
          id={inputId}
          type="file"
          multiple
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={handleFileChange}
          accept="image/*,.pdf"
          disabled={isLoading}
        />

        <div className="flex transform flex-col items-center justify-center text-center transition-transform duration-300 group-hover:-translate-y-1">
          {isLoading ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
                <Loader2 className="relative z-10 h-16 w-16 animate-spin text-primary" />
              </div>
              <h3 className="mt-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-xl font-bold text-transparent">Envoi securise en cours...</h3>
              <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">
                Vos pieces sont transmises au cabinet. Vous pourrez suivre leur statut dans l'historique.
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-full bg-primary/10 p-4 shadow-inner transition-transform duration-500 group-hover:scale-110">
                <UploadCloud className="h-12 w-12 text-primary drop-shadow-sm" />
              </div>
              <h3 className="mb-2 text-2xl font-bold tracking-tight">Deposer des pieces</h3>
              <p className="mt-1 max-w-lg text-base font-medium text-muted-foreground">
                Prenez une photo ou ajoutez vos factures, recus et releves.
                <br className="hidden sm:block" />{' '}
                <span className="font-bold text-primary underline underline-offset-4 decoration-primary/30">Choisir des fichiers</span>
              </p>
              <p className="mt-4 rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                PDF, PNG, JPG - {maxUploadSizeMb} Mo max, {MAX_ACCOUNTING_UPLOAD_FILES} fichiers
              </p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
