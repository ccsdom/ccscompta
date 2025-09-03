
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FileUploader } from './file-uploader';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData } from '@/ai/flows/extract-data-from-documents';
import { validateExtraction } from '@/ai/flows/validate-extraction';
import type { Document, Notification, AuditEvent } from '@/app/dashboard/documents/page';
import { PlusCircle, CheckCircle, File as FileIcon } from 'lucide-react';

const getCurrentUser = () => localStorage.getItem('userName') || 'Utilisateur Démo';

export function QuickUpload() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processedFiles, setProcessedFiles] = useState<File[]>([]);
    const [filesToProcess, setFilesToProcess] = useState<File[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [automationSettings, setAutomationSettings] = useState({ isEnabled: false, confidenceThreshold: 0.95, autoSend: false });
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
            const automation = localStorage.getItem('automationSettings');
            if (automation) {
                setAutomationSettings(JSON.parse(automation));
            }
        };

        loadSettings();
        window.addEventListener('storage', loadSettings);
        return () => window.removeEventListener('storage', loadSettings);
    }, []);

    const addAuditEvent = (trail: AuditEvent[], action: string, user?: string): AuditEvent[] => {
        const event: AuditEvent = {
            action,
            date: new Date().toISOString(),
            user: user || 'Système',
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

    const handleSendToCegid = (doc: Document, trail: AuditEvent[]): AuditEvent[] => {
        console.log("Auto-sending to Cegid:", doc);
        toast({
          title: "Envoi automatique",
          description: `${doc.name} a été envoyé à CEGID.`,
        });
        createNotification(doc, 'a été envoyé automatiquement à Cegid.');
        return addAuditEvent(trail, 'Document envoyé à Cegid (Auto-envoi)');
    };

    const processDocument = useCallback(async (doc: Document) => {
        try {
          doc.auditTrail = addAuditEvent(doc.auditTrail, 'Traitement IA initié');
          const recognition = await recognizeDocumentType({ documentDataUri: doc.dataUrl });
          doc.type = recognition.documentType;
          doc.confidence = recognition.confidence;
          doc.auditTrail = addAuditEvent(doc.auditTrail, `Type reconnu: ${doc.type} (Confiance: ${Math.round(doc.confidence * 100)}%)`);
    
          const extracted = await extractData({ documentDataUri: doc.dataUrl, documentType: recognition.documentType });
          doc.extractedData = extracted;
          doc.auditTrail = addAuditEvent(doc.auditTrail, 'Données extraites par IA');

          if (automationSettings.isEnabled) {
              doc.auditTrail = addAuditEvent(doc.auditTrail, 'Validation automatique initiée');
              const validation = await validateExtraction({ documentDataUri: doc.dataUrl, extractedData: extracted });
              
              if (validation.isConfident && validation.confidenceScore >= automationSettings.confidenceThreshold) {
                  doc.status = 'approved';
                  doc.auditTrail = addAuditEvent(doc.auditTrail, `Validation IA réussie (Confiance: ${Math.round(validation.confidenceScore * 100)}%). Document auto-approuvé.`);
                  createNotification(doc, 'a été approuvé automatiquement.');

                  if (automationSettings.autoSend) {
                     doc.auditTrail = handleSendToCegid(doc, doc.auditTrail);
                  }
              } else {
                  doc.status = 'reviewing';
                   doc.auditTrail = addAuditEvent(doc.auditTrail, `Validation IA requiert une revue (Confiance: ${Math.round(validation.confidenceScore * 100)}%). Raison: ${validation.mismatchReason || 'N/A'}`);
                  createNotification(doc, 'est prêt pour examen.');
              }
          } else {
             doc.status = 'reviewing';
             createNotification(doc, 'est prêt pour examen.');
          }
    
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
    }, [toast, automationSettings]);
    
    const handleFileDrop = async (files: File[]) => {
        if (!selectedClientId) {
            toast({
                variant: "destructive",
                title: "Aucun client sélectionné",
                description: "Veuillez sélectionner un client avant d'utiliser l'ajout rapide.",
            });
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setFilesToProcess(files);
        
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
                clientId: selectedClientId,
                comments: [],
                auditTrail: addAuditEvent([], 'Document téléversé (ajout rapide)', getCurrentUser()),
              };
              
              const processedDoc = await processDocument(newDoc) as Document;
              newDocuments.push(processedDoc);
            }

            const allDocs = [...newDocuments.map(d => ({...d, file: undefined})), ...storedDocs];
            localStorage.setItem('documents', JSON.stringify(allDocs));
            window.dispatchEvent(new Event('storage'));

            toast({
                title: "Téléversement et traitement terminés",
                description: `${files.length} document(s) ont été traités et ajoutés à votre historique.`,
            });
            
            setProcessedFiles(files);
            setFilesToProcess([]);

        } catch (error) {
            console.error("Error during quick upload:", error);
            toast({
                variant: "destructive",
                title: "Erreur de téléversement",
                description: "Une erreur est survenue lors du téléversement rapide.",
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="hidden md:inline-flex" disabled={!selectedClientId}>
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Ajout Rapide</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Téléversement Rapide</DialogTitle>
                    <DialogDescription>
                        Déposez vos documents ici. Ils seront automatiquement traités et ajoutés au dossier du client sélectionné.
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
