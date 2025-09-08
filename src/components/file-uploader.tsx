
'use client';

import { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onFileDrop: (files: File[]) => Promise<void>; // Make it a promise to await completion
  isLoading: boolean; // Keep this prop for initial state if needed, but manage internal loading state
}

export function FileUploader({ onFileDrop, isLoading: parentIsLoading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const startUploadProcess = async (files: File[]) => {
      if (files.length === 0) return;
      setIsUploading(true);
      await onFileDrop(files);
      setIsUploading(false);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    startUploadProcess(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      startUploadProcess(files);
      e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };
  
  const isLoading = parentIsLoading || isUploading;

  return (
        <label
          htmlFor="file-upload"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragging && !isLoading ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            disabled={isLoading}
          />
          <div className="flex flex-col items-center justify-center text-center">
            {isLoading ? (
                <>
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-sm font-medium text-muted-foreground">Traitement en cours...</p>
                </>
            ) : (
                <>
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 text-sm font-medium">
                      Glissez-déposez ou <span className="font-semibold text-primary">parcourir</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, PNG, JPG
                    </p>
                </>
            )}
          </div>
        </label>
  );
}
