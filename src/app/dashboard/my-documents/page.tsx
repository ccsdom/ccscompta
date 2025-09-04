
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import { storage } from '@/lib/firebase-client';
import { ref, getDownloadURL, deleteObject } from "firebase/storage";
import { getDocuments, addDocument, updateDocument, deleteDocument } from '@/ai/flows/document-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUp, Eye, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import type { Document, AuditEvent, Comment, Notification } from '@/lib/types';
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
import type { IntelligentSearchOutput } from '@/ai/flows/intelligent-search-flow';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
  const { toast } = useToast();
  
  const fetchDocuments = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
        const docs = await getDocuments(id);
        setDocuments(docs);
    } catch (error) {
        console.error("Error fetching documents", error);
        toast({title: "Erreur", description: "Impossible de charger les documents.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

   useEffect(() => {
    const loadState = () => {
        try {
            const storedClientId = localStorage.getItem('selectedClientId');
            if (storedClientId) {
                if (storedClientId !== clientId) {
                    setClientId(storedClientId);
                    fetchDocuments(storedClientId);
                }
            } else {
                setIsLoading(false);
            }
            const storedQuery = localStorage.getItem('searchQuery');
            if (storedQuery) setSearchQuery(storedQuery);
            const storedCriteria = localStorage.getItem('searchCriteria');
            if (storedCriteria) setSearchCriteria(JSON.parse(storedCriteria));
        } catch (error) {
            console.error("Failed to load documents from localStorage", error)
        }
    };
    loadState();
    window.addEventListener('storage', loadState);
    return () => window.removeEventListener('storage', loadState);
  }, [clientId, fetchDocuments])

  const createNotification = (doc: Document, message: string) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      documentId: doc.id,
      documentName: doc.name,
      message,
      date: new Date().toISOString(),
      isRead: false
    };
    // This is a mock implementation for notifications
    const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]') as Notification[];
    localStorage.setItem('notifications', JSON.stringify([newNotification, ...existingNotifications]));
    window.dispatchEvent(new Event('storage')); // Notify header
  };

  const addAuditEvent = (trail: AuditEvent[], action: string): AuditEvent[] => {
    const event: AuditEvent = {
        action,
        date: new Date().toISOString(),
        user: getCurrentUser(),
    };
    return [...trail, event];
  };

  const handleProcessDocument = useCallback(async (doc: Document) => {
    let currentDoc = doc;
    currentDoc.auditTrail = addAuditEvent(currentDoc.auditTrail, 'Traitement IA initié par le client');
    await updateDocument({id: currentDoc.id, updates: { status: 'processing', auditTrail: currentDoc.auditTrail }});
    setDocuments(docs => docs.map(d => d.id === currentDoc.id ? {...d, status: 'processing', auditTrail: currentDoc.auditTrail} : d));
    
    try {
      const recognition = await recognizeDocumentType({ documentDataUri: currentDoc.dataUrl! });
      const extracted = await extractData({ documentDataUri: currentDoc.dataUrl!, documentType: recognition.documentType, clientId: currentDoc.clientId });
      
      const trail = addAuditEvent(currentDoc.auditTrail, 'Traitement IA terminé');
      
      const finalUpdates: Partial<Document> = {
          status: 'reviewing',
          extractedData: extracted,
          type: recognition.documentType,
          confidence: recognition.confidence,
          auditTrail: trail
      }
      await updateDocument({ id: currentDoc.id, updates: finalUpdates });
      setDocuments(docs => docs.map(d => d.id === currentDoc.id ? {...d, ...finalUpdates} : d));

      toast({ title: `Traitement de ${currentDoc.name} terminé`, description: `Le document est prêt pour être examiné par votre comptable.` });
      createNotification({ ...currentDoc, ...finalUpdates }, 'est prêt pour examen.');

    } catch (error) {
      console.error("Error processing document:", error);
      const trail = addAuditEvent(currentDoc.auditTrail, 'Erreur de traitement IA');
      await updateDocument({ id: currentDoc.id, updates: { status: 'error', auditTrail: trail } });
      setDocuments(docs => docs.map(d => d.id === currentDoc.id ? {...d, status: 'error', auditTrail: trail} : d));
      toast({ variant: "destructive", title: "Le traitement a échoué", description: `Impossible de traiter ${currentDoc.name}.` });
      createNotification({ ...currentDoc, status: 'error' }, 'a échoué lors du traitement.');
    }
  }, [toast]);

  const handleFileDrop = async (files: File[]) => {
    if (!clientId) {
         toast({ variant: "destructive", title: "Erreur interne", description: `Votre identifiant client n'est pas défini.`});
         return;
    }
    
    setIsProcessing(true);
    // In a real app, you might want to check against a server-side list of filenames.
    const existingFileNames = new Set(documents.map(d => d.name));

    for (const file of files) {
        if (existingFileNames.has(file.name)) {
            toast({ variant: "destructive", title: "Fichier en double", description: `Le fichier "${file.name}" existe déjà.`});
            continue;
        }
        try {
            const dataUrl = await fileToDataUri(file);
            // Don't upload to storage here, just add to DB with dataUrl for processing.
            // A server-side function would later handle the upload to a permanent bucket.
            const newDocData: Omit<Document, 'id'> = {
                name: file.name,
                uploadDate: new Date().toISOString(),
                status: 'pending',
                dataUrl, // For immediate processing
                storagePath: `${clientId}/${file.name}`, // Future storage path
                clientId: clientId,
                auditTrail: addAuditEvent([], 'Document téléversé par le client'),
                comments: []
            };
            const newDoc = await addDocument(newDocData);
            setDocuments(prev => [{...newDoc, dataUrl}, ...prev]);
            await handleProcessDocument({...newDoc, dataUrl});

        } catch (error) {
             toast({ variant: "destructive", title: "Erreur de lecture", description: `Impossible de lire le fichier ${file.name}.`});
        }
    }
    setIsProcessing(false);
  };

  const handleAddComment = async (docId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const newComment: Comment = { id: crypto.randomUUID(), text: commentText, user: getCurrentUser(), date: new Date().toISOString() };
    const doc = documents.find(d => d.id === docId);
    if(doc){
        const trail = addAuditEvent(doc.auditTrail, `Commentaire ajouté: "${commentText.substring(0, 20)}..."`);
        const updatedComments = [...(doc.comments || []), newComment];
        await updateDocument({ id: docId, updates: { comments: updatedComments, auditTrail: trail } });
        setDocuments(docs => docs.map(d => d.id === docId ? {...d, comments: updatedComments, auditTrail: trail} : d));
        setActiveDocument(doc => doc ? {...doc, comments: updatedComments, auditTrail: trail} : null);
    }
  };

  const handleDelete = async (docId: string) => {
     await deleteDocument(docId);
     const doc = documents.find(d => d.id === docId);
     if(doc?.storagePath) await deleteObject(ref(storage, doc.storagePath));
     setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
     if (activeDocument?.id === docId) { setActiveDocument(null); setIsSheetOpen(false); }
     toast({ variant: 'destructive', title: "Document supprimé" });
  }

  const handleSetActive = async (doc: Document) => {
    setActiveDocument(doc);
    if (!doc.dataUrl && doc.storagePath) {
        try {
            const url = await getDownloadURL(ref(storage, doc.storagePath));
            setDocuments(docs => docs.map(d => d.id === doc.id ? {...d, dataUrl: url} : d));
            setActiveDocument({ ...doc, dataUrl: url });
        } catch (error) {
            console.error("Failed to get download URL", error);
            toast({ title: "Erreur de chargement", description: "Impossible de récupérer l'aperçu du document.", variant: "destructive" });
        }
    }
    setIsSheetOpen(true);
  }
  
  const clientDocuments = useMemo(() => {
        let docs = [...documents];
        if (searchCriteria) { /* ... filtering logic ... */ }
        else if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            docs = docs.filter(doc => 
                doc.name.toLowerCase().includes(lowercasedQuery) ||
                (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(vendor => vendor.toLowerCase().includes(lowercasedQuery)))
            );
        }
        return docs.sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [documents, searchQuery, searchCriteria]);

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
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-sm text-muted-foreground">Le {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</p>
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
                                        <AlertDialogHeader><AlertDialogTitle>Êtes-vous certain ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le document "{doc.name}" sera supprimé.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
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
    const handleSubmit = () => { if (newComment.trim()) { onAddComment(newComment.trim()); setNewComment(""); } }
    
    return (
        <div className="flex flex-col h-full">
            <h3 className="font-semibold text-lg px-6 pt-6 pb-2">Commentaires</h3>
            <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 py-4">
                    {comments.length > 0 ? (
                        comments.slice().reverse().map((comment) => (
                            <div key={comment.id} className="flex items-start gap-3 text-sm">
                                <Avatar className="h-8 w-8 border shrink-0"><AvatarFallback>{comment.user.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                <div className="flex-1 bg-muted rounded-md p-3">
                                    <div className="flex items-center justify-between"><p className="font-semibold">{comment.user}</p><p className="text-xs text-muted-foreground">{format(new Date(comment.date), "dd/MM/yy 'à' HH:mm", { locale: fr })}</p></div>
                                    <p className="mt-1 text-foreground/90">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-center text-sm text-muted-foreground py-10"><MessageSquare className="h-8 w-8 mx-auto mb-2" /><p>Aucun commentaire pour l'instant.</p></div>
                    )}
                </div>
            </ScrollArea>
             <div className="flex items-start gap-3 p-6 border-t">
                <Avatar className="h-8 w-8 border shrink-0"><AvatarFallback>Moi</AvatarFallback></Avatar>
                <div className="flex-1">
                    <Textarea placeholder="Répondre ou poser une question..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} className="bg-transparent border"/>
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
                   <div className="flex items-center gap-x-3">
                    <SheetDescription>Téléversé le {new Date(activeDocument.uploadDate).toLocaleDateString('fr-FR')}</SheetDescription>-{getStatusBadge(activeDocument.status)}
                   </div>
                </SheetHeader>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
                    <div className="h-full flex flex-col"><div className="flex-1 p-6">
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
                            ) : ( <div className="text-center text-sm text-muted-foreground py-8"><p>Les données du document n'ont pas encore été validées par votre comptable.</p></div> )}
                        </div></div>
                    <div className="h-full flex flex-col border-l bg-muted/20">
                         <CommentsSectionClient comments={activeDocument.comments} onAddComment={(text) => handleAddComment(activeDocument.id, text)} />
                    </div>
                </div>
                 <div className="p-6 border-t"><Button onClick={() => setIsSheetOpen(false)} className="w-full">Fermer</Button></div>
            </>
        ) : ( <div className="h-full flex items-center justify-center"><p>Sélectionnez un document.</p></div> )}
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
            <FileUploader onFileDrop={handleFileDrop} isLoading={isProcessing} />
            <Card><CardHeader><CardTitle>Comment ça marche ?</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground space-y-2"><p>1. Déposez vos fichiers (factures, reçus, etc.) dans la zone ci-dessus.</p><p>2. Nous notifions votre comptable automatiquement.</p><p>3. Suivez le statut de vos documents dans la liste à droite.</p><p>4. Cliquez sur un document pour voir les détails et communiquer avec votre comptable.</p></CardContent></Card>
        </div>
        <div className="lg:col-span-2">
            <SimpleDocumentHistory />
        </div>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><DocumentPreviewSheet /></Sheet>
    </div>
  );
}
