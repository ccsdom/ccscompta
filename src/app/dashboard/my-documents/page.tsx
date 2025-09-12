
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import { getDocuments, addDocument, updateDocument, deleteDocument } from '@/ai/flows/document-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUp, Eye, Trash2, MessageSquare, Loader2, CheckCircle, FileWarning, FileClock, Folder, FileText, Receipt, Landmark, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
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
import { storage } from '@/lib/firebase-client';
import { ref, uploadBytes } from 'firebase/storage';
import { auth } from '@/lib/firebase-client';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const getCurrentUser = () => localStorage.getItem('userName') || 'Client Démo';

const getStatusBadge = (status: Document['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="flex items-center gap-1.5"><FileClock className="h-3 w-3"/>En attente</Badge>;
    case 'processing':
      return (
            <Badge variant="secondary" className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                En traitement...
            </Badge>
        );
    case 'reviewing':
      return <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100/80 flex items-center gap-1.5"><FileWarning className="h-3 w-3"/>En examen</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100/80 flex items-center gap-1.5"><CheckCircle className="h-3 w-3"/>Approuvé</Badge>;
    case 'error':
      return <Badge variant="destructive">Erreur</Badge>;
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
};

const typeToGroupMap: Record<string, string> = {
    'purchase invoice': "Factures d'achat",
    'sales invoice': "Factures de vente",
    'receipt': "Reçus",
    'bank statement': "Relevés bancaires",
};

const getGroupIcon = (groupName: string) => {
    switch (groupName) {
        case "Factures d'achat": return ArrowDownToLine;
        case "Factures de vente": return ArrowUpFromLine;
        case "Reçus": return Receipt;
        case "Relevés bancaires": return Landmark;
        default: return Folder;
    }
}


export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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
    const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]') as Notification[];
    localStorage.setItem('notifications', JSON.stringify([newNotification, ...existingNotifications]));
    window.dispatchEvent(new Event('storage'));
  };

  const addAuditEvent = (trail: AuditEvent[], action: string): AuditEvent[] => {
    const event: AuditEvent = {
        action,
        date: new Date().toISOString(),
        user: getCurrentUser(),
    };
    return [...trail, event];
  };

  const processSingleFile = async (file: File, clientId: string) => {
    let docToUpdateId: string | null = null;
    try {
        const dataUrl = await fileToDataUri(file);

        const storagePath = `${clientId}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);

        const newDocData: Omit<Document, 'id'> = {
            name: file.name,
            uploadDate: new Date().toISOString(),
            status: 'processing',
            storagePath: storagePath,
            clientId: clientId,
            auditTrail: addAuditEvent([], 'Document téléversé par le client'),
            comments: [],
        };
        
        // Add doc to local state immediately with processing status
        const tempId = `temp-${Math.random()}`;
        setDocuments(prev => [{...newDocData, id: tempId } as Document, ...prev]);

        const newDoc = await addDocument(newDocData);
        if (!newDoc) throw new Error("Failed to create document in the database.");
        
        docToUpdateId = newDoc.id;
        
        // Replace temp doc with real doc from DB
        setDocuments(prev => prev.map(d => d.id === tempId ? newDoc : d));

        const recognition = await recognizeDocumentType({ documentDataUri: dataUrl });
        const extracted = await extractData({ documentDataUri: dataUrl, documentType: recognition.documentType, clientId: clientId });
        const trailWithAI = addAuditEvent(newDoc.auditTrail, 'Traitement IA terminé');
        
        const finalUpdates: Partial<Document> = {
            status: 'reviewing',
            extractedData: extracted,
            type: recognition.documentType,
            confidence: recognition.confidence,
            auditTrail: trailWithAI,
        };

        await updateDocument({ id: docToUpdateId, updates: finalUpdates });
        createNotification({ ...newDoc, ...finalUpdates }, 'est prêt pour examen.');
        
        return { success: true };

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        if (docToUpdateId) {
            try {
                const doc = await getDocuments(clientId).then(docs => docs.find(d => d.id === docToUpdateId));
                if (doc) {
                    const trail = addAuditEvent(doc.auditTrail, 'Erreur de traitement IA');
                    await updateDocument({ id: docToUpdateId, updates: { status: 'error', auditTrail: trail } });
                    createNotification({ ...doc, status: 'error' }, 'a échoué lors du traitement.');
                }
            } catch (updateError) {
                console.error('Failed to update document to error state:', updateError);
            }
        }
        return { success: false };
      }
  }


  const handleFileDrop = async (files: File[]) => {
    if (!clientId) {
      toast({ variant: "destructive", title: "Aucun client sélectionné", description: `Votre identifiant client n'est pas défini. Impossible d'envoyer des documents.` });
      return;
    }
    setIsUploading(true);
    
    let successCount = 0;
    
    const processingPromises = files.map(file => 
        processSingleFile(file, clientId).then(result => {
            if (result.success) successCount++;
        })
    );

    await Promise.all(processingPromises);
    
    setIsUploading(false);

    if (successCount > 0) {
      toast({ title: "Téléversement terminé", description: `${successCount} document(s) ont été traités et envoyés.` });
    } else if (files.length > 0) {
       toast({ variant: "destructive", title: "Échec du téléversement", description: `Aucun document n'a pu être traité. Veuillez réessayer.` });
    }

    // Always refetch documents to get the final state of all uploads
    if (clientId) {
      fetchDocuments(clientId);
    }
  };


  const handleAddComment = async (docId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const newComment: Comment = { id: crypto.randomUUID(), text: commentText, user: getCurrentUser(), date: new Date().toISOString() };
    const doc = documents.find(d => d.id === docId);
    if(doc){
        const trail = addAuditEvent(doc.auditTrail, `Commentaire ajouté: "${commentText.substring(0, 20)}..."`);
        const updatedComments = [...(doc.comments || []), newComment];
        await updateDocument({ id: docId, updates: { comments: updatedComments, auditTrail: trail } });
        const updatedDoc = {...doc, comments: updatedComments, auditTrail: trail};
        setDocuments(docs => docs.map(d => d.id === docId ? updatedDoc : d));
        setActiveDocument(updatedDoc);
    }
  };

  const handleDelete = async (docId: string) => {
     await deleteDocument(docId);
     setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
     if (activeDocument?.id === docId) { setActiveDocument(null); setIsSheetOpen(false); }
     toast({ variant: 'destructive', title: "Document supprimé" });
  }

  const handleSetActive = async (doc: Document) => {
    let docWithDataUrl = {...doc};
    if (!doc.dataUrl) {
       // In a real app, you would get a download URL from Firebase Storage here.
       // For simplicity, we'll use a placeholder.
       docWithDataUrl.dataUrl = `https://picsum.photos/seed/${doc.id}/800/1100`;
    }
    setActiveDocument(docWithDataUrl);
    setIsSheetOpen(true);
  }
  
  const groupedDocuments = useMemo(() => {
        let filteredDocs = [...documents];
        if (searchCriteria) { 
            const { documentTypes, minAmount, maxAmount, startDate, endDate, vendor, keywords, originalQuery } = searchCriteria;

            if (documentTypes && documentTypes.length > 0) {
                filteredDocs = filteredDocs.filter(d => d.type && documentTypes.some(type => d.type!.toLowerCase().includes(type.toLowerCase())));
            }
            if (minAmount) {
                filteredDocs = filteredDocs.filter(d => d.extractedData?.amounts?.some(a => a != null && a >= minAmount));
            }
            if (maxAmount) {
                filteredDocs = filteredDocs.filter(d => d.extractedData?.amounts?.some(a => a != null && a <= maxAmount));
            }
            if (startDate) {
                filteredDocs = filteredDocs.filter(d => d.extractedData?.dates?.some(date => date != null && new Date(date) >= new Date(startDate)));
            }
            if (endDate) {
                filteredDocs = filteredDocs.filter(d => d.extractedData?.dates?.some(date => date != null && new Date(date) <= new Date(endDate)));
            }
            if (vendor) {
                const lowerVendor = vendor.toLowerCase();
                filteredDocs = filteredDocs.filter(d => d.extractedData?.vendorNames?.some(v => v != null && v.toLowerCase().includes(lowerVendor)));
            }
            if (keywords && keywords.length > 0) {
                filteredDocs = filteredDocs.filter(d => {
                    const searchableText = [d.name, d.extractedData?.otherInformation || '', ...(d.extractedData?.vendorNames || [])].join(' ').toLowerCase();
                    return keywords.every(kw => searchableText.includes(kw.toLowerCase()));
                });
            }
             if (!filteredDocs.length && originalQuery) {
                 const lowercasedQuery = originalQuery.toLowerCase();
                 filteredDocs = [...documents].filter(doc => 
                    doc.name.toLowerCase().includes(lowercasedQuery) ||
                    (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(v => v && v.toLowerCase().includes(lowercasedQuery)))
                );
            }
        }
        else if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredDocs = filteredDocs.filter(doc => 
                doc.name.toLowerCase().includes(lowercasedQuery) ||
                (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(vendor => vendor && vendor.toLowerCase().includes(lowercasedQuery)))
            );
        }
        
        const sortedDocs = filteredDocs.sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

        const typeGroups: { [key: string]: Document[] } = {};
        sortedDocs.forEach(doc => {
            const groupName = typeToGroupMap[doc.type || ''] || 'Autres documents';
            if (!typeGroups[groupName]) {
                typeGroups[groupName] = [];
            }
            typeGroups[groupName].push(doc);
        });

        const groupOrder = ["Factures de vente", "Factures d'achat", "Reçus", "Relevés bancaires", "Autres documents"];

        return groupOrder
            .map(title => {
                const docsInGroup = typeGroups[title] || [];
                if (docsInGroup.length === 0) return null;

                const monthGroups: { [key: string]: Document[] } = {};
                docsInGroup.forEach(doc => {
                    const monthKey = format(new Date(doc.uploadDate), 'LLLL yyyy', { locale: fr });
                    if(!monthGroups[monthKey]) {
                        monthGroups[monthKey] = [];
                    }
                    monthGroups[monthKey].push(doc);
                });

                return {
                    title,
                    icon: getGroupIcon(title),
                    monthlyGroups: Object.entries(monthGroups).map(([month, documents]) => ({ month, documents })).sort((a, b) => new Date(b.documents[0].uploadDate).getTime() - new Date(a.documents[0].uploadDate).getTime()),
                };
            })
            .filter(Boolean);

  }, [documents, searchQuery, searchCriteria]);


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
                                {activeDocument.dataUrl ? (
                                    <iframe src={activeDocument.dataUrl} className="w-full h-full" title="Aperçu du document" />
                                ): (
                                    <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin"/></div>
                                )}
                            </div>
                            <h3 className="font-semibold text-lg mb-4">Données validées</h3>
                            {activeDocument.status === 'approved' && activeDocument.extractedData ? (
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span>Fournisseur:</span><span className="font-medium">{activeDocument.extractedData.vendorNames?.join(', ')}</span></div>
                                    <div className="flex justify-between"><span>Date:</span><span className="font-medium">{activeDocument.extractedData.dates?.[0]}</span></div>
                                    <div className="flex justify-between"><span>Montant:</span><span className="font-medium">{activeDocument.extractedData.amounts?.[0]?.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span></div>
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
        <p className="text-muted-foreground mt-1">Téléversez et suivez le statut de vos pièces comptables classées par catégorie.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Nouveau document</CardTitle>
            <CardDescription>Déposez vos fichiers ici. Ils seront automatiquement traités et envoyés à votre comptable pour examen.</CardDescription>
        </CardHeader>
        <CardContent>
             <FileUploader onFileDrop={handleFileDrop} isLoading={isUploading} />
        </CardContent>
      </Card>
      
        {isLoading ? (
            <div className="space-y-4">
                <div className="h-10 w-1/3 bg-muted rounded-md animate-pulse"></div>
                <div className="border rounded-lg">
                    <div className="h-14 bg-muted/50 rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                        <div className="h-12 bg-muted rounded-md animate-pulse"></div>
                        <div className="h-12 bg-muted rounded-md animate-pulse"></div>
                    </div>
                </div>
            </div>
        ) : groupedDocuments.length > 0 ? (
             (groupedDocuments as { title: string; icon: React.ElementType; monthlyGroups: { month: string; documents: Document[] } }[]).map((group) => (
                group && (
                    <Card key={group.title}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <group.icon className="h-6 w-6" /> {group.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                           {group.monthlyGroups.map(monthGroup => (
                               <div key={monthGroup.month} className="border-t">
                                  <h4 className="text-sm font-semibold p-3 bg-muted/50 capitalize">{monthGroup.month}</h4>
                                  <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Document</TableHead>
                                            <TableHead>Date de téléversement</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {monthGroup.documents.map(doc => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-muted p-2 rounded-md">
                                                            <FileText className="h-5 w-5 text-muted-foreground"/>
                                                        </div>
                                                        <span className="truncate max-w-xs" title={doc.name}>{doc.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</TableCell>
                                                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="outline" size="icon" onClick={() => handleSetActive(doc)}><Eye className="h-4 w-4"/></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="icon" disabled={doc.status === 'approved'}><Trash2 className="h-4 w-4"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Êtes-vous certain ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le document "{doc.name}" sera supprimé.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                )
            ))
        ) : (
             <Card>
                <CardContent className="h-48 flex flex-col items-center justify-center text-center">
                    <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Aucun document pour l'instant</h3>
                    <p className="text-sm text-muted-foreground mt-1">Téléversez votre premier document pour commencer.</p>
                </CardContent>
            </Card>
        )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><DocumentPreviewSheet /></Sheet>
    </div>
  );
}
