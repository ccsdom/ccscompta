
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FileUploader } from './file-uploader';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase-client';
import { addDocument, updateDocument } from '@/ai/flows/document-actions';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData } from '@/ai/flows/extract-data-from-documents';
import type { Document, Notification, AuditEvent } from '@/lib/types';
import { PlusCircle, CheckCircle, Loader2 } from 'lucide-react';

const getCurrentUser = () => localStorage.getItem('userName') || 'Client Démo';

export function QuickUpload() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processedFiles, setProcessedFiles] = useState<File[]>([]);
    const [filesToProcessCount, setFilesToProcessCount] = useState(0);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            setIsLoading(false);
            setProcessedFiles([]);
            setFilesToProcessCount(0);
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
        window.dispatchEvent(new Event('storage'));
    };

    const processSingleFile = useCallback(async (file: File, clientId: string) => {
        let docForProcessing: Document | null = null;
        try {
            const dataUrl = await fileToDataUri(file);
            const storagePath = `${clientId}/${file.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, file);

            const newDocData: Omit<Document, 'id'> = {
                name: file.name,
                uploadDate: new Date().toISOString(),
                status: 'processing' as const,
                dataUrl,
                storagePath,
                clientId: clientId,
                comments: [],
                auditTrail: addAuditEvent([], 'Document téléversé (ajout rapide)'),
            };

            const addedDoc = await addDocument(newDocData);
            if (!addedDoc) throw new Error("Failed to save document metadata.");
            
            docForProcessing = { ...addedDoc, dataUrl };
            
            const recognition = await recognizeDocumentType({ documentDataUri: dataUrl });
            const extracted = await extractData({ documentDataUri: dataUrl, documentType: recognition.documentType, clientId: clientId });

            const finalUpdates: Partial<Document> = {
                status: 'reviewing',
                extractedData: extracted,
                type: recognition.documentType,
                confidence: recognition.confidence,
                auditTrail: addAuditEvent(docForProcessing.auditTrail, 'Traitement IA terminé, en attente de validation comptable')
            };

            await updateDocument({ id: docForProcessing.id, updates: finalUpdates });
            createNotification({ ...docForProcessing, ...finalUpdates }, 'est prêt pour examen.');

        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            if (docForProcessing) {
                const trail = addAuditEvent(docForProcessing.auditTrail, 'Erreur de traitement IA');
                await updateDocument({ id: docForProcessing.id, updates: { status: 'error', auditTrail: trail } });
            }
            toast({
                variant: "destructive",
                title: "Le traitement a échoué",
                description: `Impossible de traiter ${file.name}.`,
            });
        }
    }, [toast]);
    
    const handleFileDrop = async (files: File[]) => {
        if (!selectedClientId) {
            toast({ variant: "destructive", title: "Erreur client", description: "Votre identifiant client n'est pas configuré." });
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setFilesToProcessCount(files.length);
        
        const processingPromises = files.map(file => 
            processSingleFile(file, selectedClientId).then(() => {
                setProcessedFiles(prev => [...prev, file]);
            })
        );

        await Promise.all(processingPromises);
        
        setIsLoading(false);
        window.dispatchEvent(new Event('storage')); // Notify other components to refetch
        toast({ title: "Téléversement et traitement terminés", description: `${files.length} document(s) ont été envoyés à votre comptable pour examen.` });
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
                
                <div className="py-4">
                    <FileUploader onFileDrop={handleFileDrop} isLoading={isLoading} />
                </div>

                {isLoading && filesToProcessCount > 0 && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Traitement de {processedFiles.length + 1} / {filesToProcessCount} document(s)...</span>
                    </div>
                )}
                
                {processedFiles.length > 0 && !isLoading && (
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
                 
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isLoading}>Fermer</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
