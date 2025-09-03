'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FileUploader } from './file-uploader';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { addDocument, updateDocument } from '@/lib/document-data';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData } from '@/ai/flows/extract-data-from-documents';
import type { Document, Notification, AuditEvent } from '@/lib/types';
import { PlusCircle, CheckCircle } from 'lucide-react';

const getCurrentUser = () => localStorage.getItem('userName') || 'Client Démo';

export function QuickUpload() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processedFiles, setProcessedFiles] = useState<File[]>([]);
    const [filesToProcess, setFilesToProcess] = useState<File[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            // Reset state when dialog is closed
            setIsLoading(false);
            setProcessedFiles([]);
            setFilesToProcess([]);
        }
    }, [isOpen]);
    
    useEffect(() => {
        const loadSettings = () => {
            const clientId = localStorage.getItem('selectedClientId');
            setSelectedClientId(clientId);
        };

        loadSettings();
        window.addEventListener('storage', loadSettings);
        return () => window.removeEventListener('storage', loadSettings);
    }, []);

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

    const processDocumentForClient = useCallback(async (doc: Document) => {
        try {
          doc.auditTrail = addAuditEvent(doc.auditTrail, 'Traitement IA initié par le client');
          const recognition = await recognizeDocumentType({ documentDataUri: doc.dataUrl });
          doc.type = recognition.documentType;
          doc.confidence = recognition.confidence;
          doc.auditTrail = addAuditEvent(doc.auditTrail, `Type reconnu: ${doc.type}`);
    
          const extracted = await extractData({ documentDataUri: doc.dataUrl, documentType: recognition.documentType });
          doc.extractedData = extracted;
          doc.status = 'reviewing'; // Always set to reviewing for the accountant
          doc.auditTrail = addAuditEvent(doc.auditTrail, 'Données extraites par IA, en attente de validation comptable');
          
          await updateDocument(doc.id, {
              status: 'reviewing',
              extractedData: extracted,
              type: recognition.documentType,
              confidence: recognition.confidence,
              auditTrail: doc.auditTrail
          });

          createNotification(doc, 'est prêt pour examen.');
    
        } catch (error) {
          console.error("Error processing document:", error);
          doc.status = 'error';
          doc.auditTrail = addAuditEvent(doc.auditTrail, 'Erreur de traitement IA');
          await updateDocument(doc.id, { status: 'error', auditTrail: doc.auditTrail });
          toast({
            variant: "destructive",
            title: "Le traitement a échoué",
            description: `Impossible de traiter ${doc.name}.`,
          });
        }
        return doc;
    }, [toast]);
    
    const handleFileDrop = async (files: File[]) => {
        if (!selectedClientId) {
            toast({ variant: "destructive", title: "Erreur client", description: "Votre identifiant client n'est pas configuré." });
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setFilesToProcess(files);
        
        try {
            for (const file of files) {
              const dataUrl = await fileToDataUri(file);
              const storagePath = `${selectedClientId}/${file.name}`;
              const storageRef = ref(storage, storagePath);
              await uploadBytes(storageRef, file);

              let newDocData: Omit<Document, 'id'> = {
                name: file.name,
                uploadDate: new Date().toISOString(),
                status: 'processing' as const,
                dataUrl,
                storagePath,
                clientId: selectedClientId,
                comments: [],
                auditTrail: addAuditEvent([], 'Document téléversé (ajout rapide)'),
              };
              
              const addedDoc = await addDocument(newDocData);
              await processDocumentForClient({ ...addedDoc, dataUrl });
            }

            window.dispatchEvent(new Event('storage')); // Notify other components to refetch
            toast({ title: "Téléversement et traitement terminés", description: `${files.length} document(s) ont été envoyés à votre comptable pour examen.` });
            setProcessedFiles(files);
            setFilesToProcess([]);

        } catch (error) {
            console.error("Error during quick upload:", error);
            toast({ variant: "destructive", title: "Erreur de téléversement" });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="md:inline-flex" disabled={!selectedClientId}>
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Ajout Rapide</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Téléversement Rapide</DialogTitle>
                    <DialogDescription>
                        Déposez vos documents ici. Ils seront automatiquement traités et envoyés à votre comptable pour examen.
                    </DialogDescription>
                </DialogHeader>
                
                {processedFiles.length === 0 ? (
                    <div className="py-4">
                        <FileUploader onFileDrop={handleFileDrop} isLoading={isLoading} />
                    </div>
                ) : (
                    <div className="py-4">
                        <h3 className="text-sm font-medium mb-2">Fichiers traités avec succès :</h3>
                        <ul className="space-y-2">
                           {processedFiles.map((file, index) => (
                               <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
                                   <CheckCircle className="h-4 w-4 text-green-500" />
                                   <span className="truncate">{file.name}</span>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}


                {filesToProcess.length > 0 && isLoading && (
                     <div className="text-sm text-muted-foreground mt-2">
                        <p>Traitement en cours :</p>
                        <ul className="list-disc pl-5">
                            {filesToProcess.map(f => <li key={f.name}>{f.name}</li>)}
                        </ul>
                    </div>
                )}
                 
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Fermer</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}