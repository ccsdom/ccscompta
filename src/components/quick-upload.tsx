
'use client';

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { FileUploader } from './file-uploader';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData } from '@/ai/flows/extract-data-from-documents';
import type { Document } from '@/app/dashboard/documents/page';
import { PlusCircle, CheckCircle } from 'lucide-react';

export function QuickUpload() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const { toast } = useToast();

    const processDocument = useCallback(async (doc: Omit<Document, 'file'> & {file?: File}) => {
        try {
          const recognition = await recognizeDocumentType({ documentDataUri: doc.dataUrl });
          doc.type = recognition.documentType;
          doc.confidence = recognition.confidence;
    
          const extracted = await extractData({ documentDataUri: doc.dataUrl, documentType: recognition.documentType });
          doc.extractedData = extracted;
          doc.status = 'reviewing';
    
        } catch (error) {
          console.error("Error processing document:", error);
          doc.status = 'error';
          toast({
            variant: "destructive",
            title: "Le traitement a échoué",
            description: `Impossible de traiter ${doc.name}.`,
          });
        }
        return doc;
    }, [toast]);
    
    const handleFileDrop = async (files: File[]) => {
        setIsLoading(true);
        setUploadedFiles(files);
        
        try {
            const storedDocsRaw = localStorage.getItem('documents');
            const storedDocs: Document[] = storedDocsRaw ? JSON.parse(storedDocsRaw) : [];
            const newDocuments: Document[] = [];
    
            for (const file of files) {
              const dataUrl = await fileToDataUri(file);
              let newDoc: Document = {
                id: crypto.randomUUID(),
                name: file.name,
                uploadDate: new Date().toLocaleDateString('fr-FR'),
                status: 'processing' as const,
                file,
                dataUrl,
              };
              
              const processedDoc = await processDocument(newDoc);
              newDocuments.push(processedDoc as Document);
            }

            const allDocs = [...newDocuments.map(d => ({...d, file: undefined})), ...storedDocs];
            localStorage.setItem('documents', JSON.stringify(allDocs));
            // Dispatch a storage event to notify other components (like the main documents page)
            window.dispatchEvent(new Event('storage'));

            toast({
                title: "Téléversement et traitement terminés",
                description: `${files.length} document(s) ont été traités et ajoutés à votre historique.`,
            });

        } catch (error) {
            console.error("Error during quick upload:", error);
            toast({
                variant: "destructive",
                title: "Erreur de téléversement",
                description: "Une erreur est survenue lors du téléversement rapide.",
            });
        } finally {
            setIsLoading(false);
            setUploadedFiles([]);
            setTimeout(() => setIsOpen(false), 1000); // Close dialog after a short delay
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Ajout Rapide</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Téléversement Rapide</DialogTitle>
                    <DialogDescription>
                        Déposez vos documents ici. Ils seront automatiquement traités et ajoutés à votre historique.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <FileUploader onFileDrop={handleFileDrop} isLoading={isLoading} />
                </div>
                {uploadedFiles.length > 0 && isLoading && (
                     <div className="text-sm text-muted-foreground mt-2">
                        <p>Traitement en cours :</p>
                        <ul className="list-disc pl-5">
                            {uploadedFiles.map(f => <li key={f.name}>{f.name}</li>)}
                        </ul>
                    </div>
                )}
                 {!isLoading && uploadedFiles.length > 0 && (
                     <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <CheckCircle className="h-4 w-4" />
                        <p>Traitement terminé !</p>
                    </div>
                 )}
            </DialogContent>
        </Dialog>
    );
}

