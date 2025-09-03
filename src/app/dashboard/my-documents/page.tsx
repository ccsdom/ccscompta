
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { DocumentHistory } from '@/components/document-history';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUp, Eye, Trash2 } from 'lucide-react';
import type { Document, AuditEvent, Comment, Notification } from '../documents/page';
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


const getCurrentUser = () => localStorage.getItem('userName') || 'Client Démo';

// This is a simplified version of the documents page for the client view.
// It reuses some logic but has a much simpler interface.
export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const { toast } = useToast();

   useEffect(() => {
    const loadState = () => {
        try {
            const storedDocs = localStorage.getItem('documents');
            if (storedDocs) {
                const parsedDocs = JSON.parse(storedDocs).map((d: any) => ({...d, file: new File([], d.name), auditTrail: d.auditTrail || [] }));
                setDocuments(parsedDocs);
            }
            const storedClientId = localStorage.getItem('selectedClientId');
            if (storedClientId) {
                setClientId(storedClientId);
            }
        } catch (error) {
            console.error("Failed to load documents from localStorage", error)
        }
    };
    loadState();
    window.addEventListener('storage', loadState);
    return () => window.removeEventListener('storage', loadState);
  }, [])
  
  useEffect(() => {
    try {
        localStorage.setItem('documents', JSON.stringify(documents.map(d => ({...d, file: undefined}))));
    } catch (error) {
        console.error("Failed to save documents to localStorage", error)
    }
  }, [documents])

  const handleFileDrop = async (files: File[]) => {
    if (!clientId) {
         toast({
          variant: "destructive",
          title: "Erreur interne",
          description: `Votre identifiant client n'est pas défini.`,
        });
        return;
    }
    const newDocuments: Document[] = [];
    const existingFileNames = new Set(documents.map(d => d.name));

    for (const file of files) {
        if (existingFileNames.has(file.name)) {
            toast({ variant: "destructive", title: "Fichier en double", description: `Le fichier "${file.name}" existe déjà.`});
            continue;
        }
        try {
            const dataUrl = await fileToDataUri(file);
            const newDoc: Document = {
                id: crypto.randomUUID(),
                name: file.name,
                uploadDate: new Date().toLocaleDateString('fr-FR'),
                status: 'pending',
                file,
                dataUrl,
                clientId: clientId,
                auditTrail: [{
                    action: 'Document téléversé par le client',
                    date: new Date().toISOString(),
                    user: getCurrentUser(),
                }],
                comments: []
            };
            newDocuments.push(newDoc);
            existingFileNames.add(file.name);
        } catch (error) {
             toast({ variant: "destructive", title: "Erreur de lecture", description: `Impossible de lire le fichier ${file.name}.`});
        }
    }
    
    if (newDocuments.length > 0) {
      setDocuments(prev => [...newDocuments, ...prev]);
      setActiveDocument(newDocuments[0]);
      setIsSheetOpen(true);
      toast({
        title: "Fichiers téléversés",
        description: `${newDocuments.length} nouveau(x) document(s) ajoutés. Votre comptable sera notifié.`,
      });
    }
  };

  const handleDelete = (docId: string) => {
     setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
      if (activeDocument?.id === docId) {
        setActiveDocument(null);
      }
     toast({
        variant: 'destructive',
        title: "Document supprimé",
     });
  }

  const handleSetActive = (doc: Document) => {
    setActiveDocument(doc);
    setIsSheetOpen(true);
  }
  
  const clientDocuments = useMemo(() => {
        return documents
            .filter(d => d.clientId === clientId)
            .sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [documents, clientId]);

  const SimpleDocumentHistory = () => (
     <Card className="flex-1">
        <CardHeader>
            <CardTitle>Mes documents</CardTitle>
            <CardDescription>Consultez l'historique et le statut de vos documents téléversés.</CardDescription>
        </CardHeader>
        <CardContent>
            {clientDocuments.length > 0 ? (
                <ul className="space-y-3">
                    {clientDocuments.map(doc => (
                        <li key={doc.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="font-medium">{doc.name}</p>
                                    <p className="text-sm text-muted-foreground">Téléversé le {doc.uploadDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleSetActive(doc)}><Eye className="h-4 w-4"/></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous certain ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action est irréversible. Le document "{doc.name}" sera supprimé.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-16">
                    <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Aucun document pour l'instant</h3>
                    <p className="text-sm text-muted-foreground mt-1">Téléversez votre premier document pour commencer.</p>
                </div>
            )}
        </CardContent>
    </Card>
  )

  const DocumentPreviewSheet = () => (
     <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {activeDocument ? (
            <div className="h-full flex flex-col gap-4 py-6">
                <h2 className="text-lg font-semibold truncate">{activeDocument.name}</h2>
                 <div className="flex-1 aspect-w-1 aspect-h-1 bg-muted rounded-md">
                     <iframe src={activeDocument.dataUrl} className="w-full h-full" title="Aperçu du document" />
                 </div>
                 <div>
                    <h3 className="font-semibold mb-2">Statut</h3>
                     <p className="text-sm text-muted-foreground">Le document est en cours de traitement par votre comptable.</p>
                 </div>
                 <Button onClick={() => setIsSheetOpen(false)}>Fermer</Button>
            </div>
        ) : (
            <div className="h-full flex items-center justify-center">
                <p>Sélectionnez un document.</p>
            </div>
        )}
      </SheetContent>
  )


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mes Documents</h1>
        <p className="text-muted-foreground mt-1">Téléversez et suivez le statut de vos pièces comptables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
            <FileUploader onFileDrop={handleFileDrop} isLoading={false} />
            <Card>
                <CardHeader>
                    <CardTitle>Comment ça marche ?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Déposez vos fichiers (factures, reçus, etc.) dans la zone ci-dessus.</p>
                    <p>2. Nous notifions votre comptable automatiquement.</p>
                    <p>3. Suivez le statut de vos documents dans la liste à droite.</p>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <SimpleDocumentHistory />
        </div>
      </div>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <DocumentPreviewSheet />
      </Sheet>
    </div>
  );
}
