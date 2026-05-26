
'use client';

import { useId, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { validateAccountingFiles, type FileUploadRejection } from '@/lib/uploads/client-document-upload';

interface FileUploaderProps {
  onFileDrop: (files: File[]) => Promise<void>;
  isLoading: boolean;
  onFileReject?: (rejections: FileUploadRejection[]) => void;
}

export function FileUploader({ onFileDrop, isLoading: parentIsLoading, onFileReject }: FileUploaderProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const startUploadProcess = async (files: File[]) => {
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
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    void startUploadProcess(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      void startUploadProcess(files);
      e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };
  
  const isLoading = parentIsLoading || isUploading;

  return (
        <div className="relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 ${isDragging ? 'opacity-100 blur-md' : ''}`}></div>
            <label
            htmlFor={inputId}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full min-h-[200px] p-8 border hover:border-primary/50 rounded-xl cursor-pointer transition-all duration-300
                ${isDragging && !isLoading ? 'border-primary bg-primary/5 scale-[1.02] shadow-xl' : 'border-border bg-background/50 backdrop-blur-sm'}`}
            >
            <input
                id={inputId}
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                disabled={isLoading}
            />
            <div className="flex flex-col items-center justify-center text-center transform transition-transform duration-300 group-hover:-translate-y-1">
                {isLoading ? (
                    <>
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                            <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                        </div>
                        <h3 className="mt-6 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Traitement IA en cours...</h3>
                        <p className="mt-2 text-sm font-medium text-muted-foreground w-3/4 mx-auto">Veuillez patienter pendant que notre intelligence artificielle analyse vos documents.</p>
                    </>
                ) : (
                    <>
                        <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                            <UploadCloud className="h-12 w-12 text-primary drop-shadow-sm" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mb-2">Dépôt Magique</h3>
                        <p className="mt-1 text-base font-medium text-muted-foreground">
                        Glissez-déposez vos reçus, factures ou relevés ici,<br/> ou <span className="font-bold text-primary underline decoration-primary/30 underline-offset-4">parcourez vos fichiers</span>.
                        </p>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full border">
                        PDF • PNG • JPG (20 Mo max, jusqu'à 50 fichiers)
                        </p>
                    </>
                )}
            </div>
            </label>
        </div>
  );
}
