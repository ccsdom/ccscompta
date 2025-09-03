
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUp, Eye, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import type { Document, AuditEvent, Comment, Notification } from '../documents/page';
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetDescription } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData } from '@/ai/flows/extract-data-from-documents';

const getCurrentUser = () => localStorage.getItem('userName') || 'Client Démo';

const getStatusBadge = (status: Document['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">En attente</Badge>;
    case 'processing':
      return (
            <Badge variant="secondary" className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                En traitement...
            </Badge>
        );
    case 'reviewing':
      return <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100/80">En examen</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100/80">Approuvé</Badge>;
    case 'error':
      return <Badge variant="destructive">Erreur</Badge>;
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
};

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

   useEffect(() => {
    const loadState = () => {
        try {
            const storedDocs = localStorage.getItem('documents');
            if (storedDocs) {
                const parsedDocs = JSON.parse(storedDocs).map((d: any) => ({...d, file: new File([], d.name), auditTrail: d.auditTrail || [], comments: d.comments || [] }));
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

  const addAuditEvent = useCallback((docId: string, action: string): AuditEvent[] => {
    const event: AuditEvent = {
        action,
        date: new Date().toISOString(),
        user: getCurrentUser(),
    };
    let currentTrail: AuditEvent[] = [];
    setDocuments(prev => {
        const doc = prev.find(d => d.id === docId);
        if (doc) currentTrail = doc.auditTrail;
        return prev;
    });
    return [...currentTrail, event];
  }, []);

  const updateDocumentState = (id: string, updates: Partial<Document>) => {
    setDocuments(prevDocs => 
      prevDocs.map(d => (d.id === id ? { ...d, ...updates } : d))
    );
  };
  
  const handleProcessDocument = useCallback(async (docToProcess: Document) => {
    let trail = addAuditEvent(docToProcess.id, 'Traitement IA initié par le client');
    updateDocumentState(docToProcess.id, { status: 'processing', auditTrail: trail });
    
    try {
      const recognition = await recognizeDocumentType({ documentDataUri: docToProcess.dataUrl });
      const extracted = await extractData({ documentDataUri: docToProcess.dataUrl, documentType: recognition.documentType });
      trail = addAuditEvent(docToProcess.id, 'Traitement IA terminé');
      
      const finalUpdates: Partial<Document> = {
          status: 'reviewing',
          extractedData: extracted,
          type: recognition.documentType,
          confidence: recognition.confidence,
          auditTrail: trail
      }
      updateDocumentState(docToProcess.id, finalUpdates);

      toast({
        title: `Traitement de ${docToProcess.name} terminé`,
        description: `Le document est prêt pour être examiné par votre comptable.`,
      });
      
      const finalDoc = { ...docToProcess, ...finalUpdates };
      createNotification(finalDoc, 'est prêt pour examen.');

    } catch (error) {
      console.error("Error processing document:", error);
      trail = addAuditEvent(docToProcess.id, 'Erreur de traitement IA');
      updateDocumentState(docToProcess.id, { status: 'error', auditTrail: trail });
      toast({
        variant: "destructive",
        title: "Le traitement a échoué",
        description: `Impossible de traiter ${docToProcess.name}.`,
      });
      const finalDoc = { ...docToProcess, status: 'error' as const };
      createNotification(finalDoc, 'a échoué lors du traitement.');
    }
  }, [toast, addAuditEvent]);

  const handleFileDrop = async (files: File[]) => {
    if (!clientId) {
         toast({ variant: "destructive", title: "Erreur interne", description: `Votre identifiant client n'est pas défini.`});
         return;
    }
    
    const newDocuments: Document[] = [];
    const existingFileNames = new Set(documents.map(d => d.name));
    setIsLoading(true);

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
      toast({
        title: "Fichiers téléversés",
        description: `${newDocuments.length} nouveau(x) document(s) sont en cours de traitement.`,
      });
      // Process all new documents automatically
      newDocuments.forEach(doc => handleProcessDocument(doc));
    }
    setIsLoading(false);
  };

  const handleAddComment = (docId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: crypto.randomUUID(),
      text: commentText,
      user: getCurrentUser(),
      date: new Date().toISOString(),
    };
    
    setDocuments(prev => prev.map(d => {
        if (d.id === docId) {
            const trail = [...(d.auditTrail || []), { action: `Commentaire ajouté: "${commentText.substring(0, 20)}..."`, date: new Date().toISOString(), user: getCurrentUser()}];
            return { ...d, comments: [...(d.comments || []), newComment], auditTrail: trail };
        }
        return d;
    }));
  };

  const handleDelete = (docId: string) => {
     setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
      if (activeDocument?.id === docId) {
        setActiveDocument(null);
        setIsSheetOpen(false);
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
            .sort((a,b) => {
                const dateA = a.uploadDate.split('/').reverse().join('-');
                const dateB = b.uploadDate.split('/').reverse().join('-');
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
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
                        <li key={doc.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/20 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4 flex-1 min-w-0" onClick={() => handleSetActive(doc)}>
                                <div>
                                    <p className="font-medium truncate" title={doc.name}>{doc.name}</p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-muted-foreground">Le {doc.uploadDate}</p>
                                        {getStatusBadge(doc.status)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleSetActive(doc)}><Eye className="h-4 w-4"/></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={doc.status === 'approved'}><Trash2 className="h-4 w-4"/></Button>
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

  const CommentsSectionClient = ({ comments, onAddComment }: { comments: Comment[], onAddComment: (text: string) => void }) => {
    const [newComment, setNewComment] = useState("");

    const handleSubmit = () => {
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment("");
        }
    }
    
    return (
        <div className="flex flex-col h-full">
            <h3 className="font-semibold text-lg px-6 pt-6 pb-2">Commentaires</h3>
            <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 py-4">
                    {comments.length > 0 ? (
                        comments.slice().reverse().map((comment) => (
                            <div key={comment.id} className="flex items-start gap-3 text-sm">
                                <Avatar className="h-8 w-8 border shrink-0">
                                    <AvatarFallback>{comment.user.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted rounded-md p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{comment.user}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(comment.date), "dd/MM/yy 'à' HH:mm", { locale: fr })}</p>
                                    </div>
                                    <p className="mt-1 text-foreground/90">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-center text-sm text-muted-foreground py-10">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                            <p>Aucun commentaire pour l'instant.</p>
                         </div>
                    )}
                </div>
            </ScrollArea>
             <div className="flex items-start gap-3 p-6 border-t">
                <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback>Moi</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Textarea 
                        placeholder="Répondre ou poser une question... Mentionnez quelqu'un avec @"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="bg-transparent border"
                    />
                    <Button size="sm" className="mt-2" onClick={handleSubmit} disabled={!newComment.trim()}>Envoyer</Button>
                </div>
            </div>
        </div>
    )
}

  const DocumentPreviewSheet = () => (
     <SheetContent side="right" className="p-0 w-full sm:max-w-xl flex flex-col">
        {activeDocument ? (
            <>
                <SheetHeader className="p-6 border-b">
                  <SheetTitle>{activeDocument.name}</SheetTitle>
                  <SheetDescription>
                    Téléversé le {activeDocument.uploadDate} - {getStatusBadge(activeDocument.status)}
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                        <div className="flex-1 p-6">
                            <div className="aspect-[3/4] max-h-[400px] w-full bg-muted rounded-md overflow-hidden mx-auto mb-4">
                                <iframe src={activeDocument.dataUrl} className="w-full h-full" title="Aperçu du document" />
                            </div>
                            <h3 className="font-semibold text-lg mb-4">Données validées</h3>
                            {activeDocument.status === 'approved' && activeDocument.extractedData ? (
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span>Fournisseur:</span><span className="font-medium">{activeDocument.extractedData.vendorNames?.join(', ')}</span></div>
                                    <div className="flex justify-between"><span>Date:</span><span className="font-medium">{activeDocument.extractedData.dates?.[0]}</span></div>
                                    <div className="flex justify-between"><span>Montant:</span><span className="font-medium">{activeDocument.extractedData.amounts?.[0].toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span></div>
                                    <div className="flex justify-between"><span>Catégorie:</span><span className="font-medium">{activeDocument.extractedData.category}</span></div>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    <p>Les données du document n'ont pas encore été validées par votre comptable.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-full flex flex-col border-l bg-muted/20">
                         <CommentsSectionClient comments={activeDocument.comments} onAddComment={(text) => handleAddComment(activeDocument.id, text)} />
                    </div>
                </div>
                 <div className="p-6 border-t">
                    <Button onClick={() => setIsSheetOpen(false)} className="w-full">Fermer</Button>
                 </div>
            </>
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
            <FileUploader onFileDrop={handleFileDrop} isLoading={isLoading} />
            <Card>
                <CardHeader>
                    <CardTitle>Comment ça marche ?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Déposez vos fichiers (factures, reçus, etc.) dans la zone ci-dessus.</p>
                    <p>2. Nous notifions votre comptable automatiquement.</p>
                    <p>3. Suivez le statut de vos documents dans la liste à droite.</p>
                    <p>4. Cliquez sur un document pour voir les détails et communiquer avec votre comptable.</p>
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
