
'use client';

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { FileUploader } from './file-uploader';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData } from '@/ai/flows/extract-data-from-documents';
import type { Document, Notification, AuditEvent } from '@/app/dashboard/documents/page';
import { PlusCircle, CheckCircle } from 'lucide-react';

const getCurrentUser = () => localStorage.getItem('userName') || 'Utilisateur Démo';

export function QuickUpload() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const { toast } = useToast();

    const addAuditEvent = (trail: AuditEvent[], action: string): AuditEvent[] => {
        const event: AuditEvent = {
            action,
            date: new Date().toISOString(),
            user: getCurrentUser(),
        };
        return [...trail, event];
    }

    const createNotification = (doc: Document, message: string) => {
        const newNotification: Notification = {
          id: crypto.randomUUID(),
          documentId: doc.id,
          documentName: doc.name,
          message,
          date: new Date().toISOString(),
          isRead: false
        };
        const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]') as Notification[];
        localStorage.setItem('notifications', JSON.stringify([newNotification, ...existingNotifications]));
        window.dispatchEvent(new Event('storage')); // Notify header
    };

    const processDocument = useCallback(async (doc: Document) => {
        try {
          doc.auditTrail = addAuditEvent(doc.auditTrail, 'Traitement IA initié');
          const recognition = await recognizeDocumentType({ documentDataUri: doc.dataUrl });
          doc.type = recognition.documentType;
          doc.confidence = recognition.confidence;
    
          const extracted = await extractData({ documentDataUri: doc.dataUrl, documentType: recognition.documentType });
          doc.extractedData = extracted;
          doc.status = 'reviewing';
          doc.auditTrail = addAuditEvent(doc.auditTrail, 'Traitement IA terminé');
    
        } catch (error) {
          console.error("Error processing document:", error);
          doc.status = 'error';
          doc.auditTrail = addAuditEvent(doc.auditTrail, 'Erreur de traitement IA');
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
                auditTrail: [{
                    action: 'Document téléversé (ajout rapide)',
                    date: new Date().toISOString(),
                    user: getCurrentUser(),
                }]
              };
              
              const processedDoc = await processDocument(newDoc) as Document;
              newDocuments.push(processedDoc);

              if (processedDoc.status === 'reviewing') {
                createNotification(processedDoc, 'est prêt pour examen.');
              } else if (processedDoc.status === 'error') {
                createNotification(processedDoc, 'a échoué lors du traitement.');
              }
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
