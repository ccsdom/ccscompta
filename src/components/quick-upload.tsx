
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FileUploader } from './file-uploader';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, db } from '@/firebase';
import { PlusCircle, CheckCircle, Loader2 } from 'lucide-react';
import { summarizeUploadRejections, uploadClientDocument, type FileUploadRejection } from '@/lib/uploads/client-document-upload';

const getCurrentUser = () => localStorage.getItem('userName') || 'Client Démo';

export function QuickUpload() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processedFiles, setProcessedFiles] = useState<File[]>([]);
    const [filesToProcessCount, setFilesToProcessCount] = useState(0);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const { toast } = useToast();
    const { storage } = useFirebase();

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

    const processSingleFile = useCallback(async (file: File, clientId: string) => {
        try {
            await uploadClientDocument({
                db,
                storage,
                file,
                clientId,
                currentUser: getCurrentUser(),
                auditAction: 'Document televerse (ajout rapide)',
            });
            return true;
        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            toast({
                variant: "destructive",
                title: "Le traitement a échoué",
                description: `Impossible de traiter ${file.name}.`,
            });
            return false;
        }
    }, [storage, toast]);

    const handleRejectedFiles = (rejections: FileUploadRejection[]) => {
        toast({
            variant: "destructive",
            title: "Certains fichiers ont ete ignores",
            description: summarizeUploadRejections(rejections),
        });
    };
    
    const handleFileDrop = async (files: File[]) => {
        if (!selectedClientId) {
            toast({ variant: "destructive", title: "Erreur client", description: "Votre identifiant client n'est pas configuré." });
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setFilesToProcessCount(files.length);
        
        let successCount = 0;
        const processingPromises = files.map(file => 
            processSingleFile(file, selectedClientId).then((success) => {
                if (success) {
                    successCount++;
                    setProcessedFiles(prev => [...prev, file]);
                }
            })
        );

        await Promise.all(processingPromises);
        
        setIsLoading(false);
        window.dispatchEvent(new Event('storage')); // Notify other components to refetch
        if (successCount > 0) {
            toast({ title: "Televersement termine", description: `${successCount} document(s) ont ete envoyes. Ils seront traites sous peu.` });
        } else if (files.length > 0) {
            toast({ variant: "destructive", title: "Echec du televersement", description: "Aucun document n'a pu etre envoye." });
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
                        Déposez vos documents ici. Ils seront automatiquement envoyés à votre comptable pour traitement.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    <FileUploader onFileDrop={handleFileDrop} isLoading={isLoading} onFileReject={handleRejectedFiles} />
                </div>

                {isLoading && filesToProcessCount > 0 && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Téléversement de {processedFiles.length + 1} / {filesToProcessCount}...</span>
                    </div>
                )}
                
                {processedFiles.length > 0 && !isLoading && (
                    <div className="py-4">
                        <h3 className="text-sm font-medium mb-2">Fichiers envoyés avec succès :</h3>
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
