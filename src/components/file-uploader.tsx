'use client';

import { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FileUploaderProps {
  onFileDrop: (files: File[]) => void;
  isLoading: boolean;
}

export function FileUploader({ onFileDrop, isLoading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileDrop(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        onFileDrop(files);
        e.target.value = ''; // Reset input to allow re-uploading the same file
      }
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>Drag and drop files or click to browse.</CardDescription>
      </CardHeader>
      <CardContent>
        <label
          htmlFor="file-upload"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
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
                    <p className="mt-4 text-sm font-medium text-muted-foreground">Processing Document...</p>
                </>
            ) : (
                <>
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 text-sm font-medium">
                      Drag & drop files, or <span className="font-semibold text-primary">click to browse</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Supports: PDF, PNG, JPG
                    </p>
                </>
            )}
          </div>
        </label>
      </CardContent>
    </Card>
  );
}
