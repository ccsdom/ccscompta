

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUp, Eye, Trash2, MessageSquare, Loader2, CheckCircle, FileWarning, FileClock, ShieldAlert, UploadCloud } from 'lucide-react';
import type { Document, AuditEvent, Comment, Notification } from '@/lib/types';
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetDescription } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import type { IntelligentSearchOutput } from '@/ai/flows/intelligent-search-flow';
import { useFirebase, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, doc, updateDoc, deleteDoc, increment, getDoc, query, where, writeBatch } from 'firebase/firestore';
import { DocumentHistory } from '@/components/document-history';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { db } from '@/firebase';


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


export default function MyDocumentsPage() {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const { toast } = useToast();
  const { storage } = useFirebase();
  
  const documentsQuery = useMemoFirebase(() => {
    if (!clientId) return null;
    return query(collection(db, 'documents'), where('clientId', '==', clientId));
  }, [clientId]);
  
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

  const isLoading = isLoadingDocuments;

   useEffect(() => {
    const loadState = () => {
        try {
            const storedClientId = localStorage.getItem('selectedClientId');
            if (storedClientId) {
                if (storedClientId !== clientId) {
                    setClientId(storedClientId);
                }
            } else {
                setClientId(null);
            }
            const storedQuery = localStorage.getItem('searchQuery');
            if (storedQuery) setSearchQuery(storedQuery);
            const storedCriteria = localStorage.getItem('searchCriteria');
            if (storedCriteria) setSearchCriteria(JSON.parse(storedCriteria));
            
            const dismissed = localStorage.getItem(`password_alert_dismissed_${storedClientId}`);
            setShowPasswordAlert(!dismissed);

        } catch (error) {
            console.error("Failed to load documents from localStorage", error)
        }
    };
    loadState();
    window.addEventListener('storage', loadState);
    return () => window.removeEventListener('storage', loadState);
  }, [clientId])

  const handleDismissPasswordAlert = () => {
      if (clientId) {
          localStorage.setItem(`password_alert_dismissed_${clientId}`, 'true');
      }
      setShowPasswordAlert(false);
  }

  const addAuditEvent = (trail: AuditEvent[], action: string): AuditEvent[] => {
    const event: AuditEvent = {
        action,
        date: new Date().toISOString(),
        user: getCurrentUser(),
    };
    return [...trail, event];
  };

  const processSingleFile = useCallback(async (file: File, clientId: string) => {
    const storagePath = `${clientId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);

    try {
        await uploadBytes(storageRef, file);

        const newDocData: Omit<Document, 'id' | 'dataUrl'> = {
            name: file.name,
            uploadDate: new Date().toISOString(),
            status: 'pending' as const,
            storagePath,
            clientId: clientId,
            comments: [],
            auditTrail: addAuditEvent([], 'Document téléversé'),
        };
        
        const documentsCollection = collection(db, 'documents');

        addDoc(documentsCollection, newDocData)
          .then(() => {
              const clientDocRef = doc(db, "clients", clientId);
              const updatePayload = { newDocuments: increment(1) };
              // Non-blocking update with contextual error handling
              updateDoc(clientDocRef, updatePayload)
                .catch((error) => {
                    const permissionError = new FirestorePermissionError({
                        path: clientDocRef.path,
                        operation: 'update',
                        requestResourceData: updatePayload,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
          })
          .catch((error) => {
              // This is the contextual error handler for the addDoc operation
              const permissionError = new FirestorePermissionError({
                  path: documentsCollection.path,
                  operation: 'create',
                  requestResourceData: newDocData,
              });
              errorEmitter.emit('permission-error', permissionError);
              // We re-throw it so the outer catch block can inform the user.
              throw error; 
          });

        return { success: true };

    } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // This catch block will now mostly handle non-permission errors, 
        // or signal that a permission error was emitted.
         if (!(error instanceof FirestorePermissionError)) {
             toast({
                variant: 'destructive',
                title: `Échec du téléversement pour ${file.name}`,
                description: "Une erreur est survenue lors de l'envoi ou de la sauvegarde. Veuillez réessayer."
            });
        }
        return { success: false };
    }
}, [storage, toast]);


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
    
    if (successCount > 0) {
      toast({ title: "Téléversement terminé", description: `${successCount} document(s) ont été envoyés avec succès.` });
    } else if (files.length > 0) {
       toast({ variant: "destructive", title: "Échec du téléversement", description: `Aucun document n'a pu être envoyé. Veuillez réessayer.` });
    }

    setIsUploading(false);
  };

  const handleAddComment = async (docId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const docToUpdate = documents?.find(d => d.id === docId);
    if (!docToUpdate) return;
    
    const newComment: Comment = { id: crypto.randomUUID(), text: commentText, user: getCurrentUser(), date: new Date().toISOString() };
    const trail = addAuditEvent(docToUpdate.auditTrail, `Commentaire ajouté: "${commentText.substring(0, 20)}..."`);
    const updatedComments = [...(docToUpdate.comments || []), newComment];

    await updateDoc(doc(db, 'documents', docId), { comments: updatedComments, auditTrail: trail });
  };

  const handleDelete = async (docId: string) => {
     await deleteDoc(doc(db, 'documents', docId));
     if (activeDocument?.id === docId) { setActiveDocument(null); setIsSheetOpen(false); }
     toast({ variant: 'destructive', title: "Document supprimé" });
  }

  const handleSetActive = async (doc: Document) => {
    let docWithDataUrl = {...doc};
    if (!doc.dataUrl) {
       try {
        const storageRef = ref(storage, doc.storagePath);
        const downloadUrl = await getDownloadURL(storageRef);
        docWithDataUrl.dataUrl = downloadUrl;
      } catch (error) {
        console.error("Could not get document URL for preview:", error);
        toast({ variant: "destructive", title: "Erreur de prévisualisation", description: "Impossible de charger l'aperçu du document."});
      }
    }
    setActiveDocument(docWithDataUrl);
    setIsSheetOpen(true);
  }
  
  const filteredDocuments = useMemo(() => {
        let docs = [...(documents || [])];
        if (searchCriteria) { 
            const { documentTypes, minAmount, maxAmount, startDate, endDate, vendor, keywords, originalQuery } = searchCriteria;

            if (documentTypes && documentTypes.length > 0) {
                docs = docs.filter(d => d.type && documentTypes.some(type => d.type!.toLowerCase().includes(type.toLowerCase())));
            }
            if (minAmount) {
                docs = docs.filter(d => d.extractedData?.amounts?.some(a => a != null && a >= minAmount));
 }
            if (maxAmount) {
                docs = docs.filter(d => d.extractedData?.amounts?.some(a => a != null && a <= maxAmount));
 }
            if (startDate) {
                docs = docs.filter(d => d.extractedData?.dates?.some(date => date != null && new Date(date) >= new Date(startDate)));
            }
            if (endDate) {
                docs = docs.filter(d => d.extractedData?.dates?.some(date => date != null && new Date(date) <= new Date(endDate)));
            }
            if (vendor) {
                const lowerVendor = vendor.toLowerCase();
                docs = docs.filter(d => d.extractedData?.vendorNames?.some(v => v != null && v.toLowerCase().includes(lowerVendor)));
            }
            if (keywords && keywords.length > 0) {
                docs = docs.filter(d => {
 const searchableText = [d.name, d.extractedData?.otherInformation || '', ...(d.extractedData?.vendorNames || []), d.type || ''].join(' ').toLowerCase();
                    return keywords.every(kw => searchableText.includes(kw.toLowerCase()));
                });
            }
             if (!docs.length && originalQuery) {
                 const lowercasedQuery = originalQuery.toLowerCase();
                 docs = [...(documents || [])].filter(doc => 
                    doc.name.toLowerCase().includes(lowercasedQuery) ||
                    (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(v => v && v.toLowerCase().includes(lowercasedQuery)))
                );
            }
        }
        else if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            docs = docs.filter(doc => 
 doc.name.toLowerCase().includes(lowercasedQuery) || (doc.type && doc.type.toLowerCase().includes(lowercasedQuery)) ||
                (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(vendor => vendor && vendor.toLowerCase().includes(lowercasedQuery)))
            );
        }
        
        return docs.sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

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
                         <CommentsSectionClient comments={activeDocument.comments || []} onAddComment={(text) => handleAddComment(activeDocument.id, text)} />
                    </div>
                </div>
                 <div className="p-6 border-t"><Button onClick={() => setIsSheetOpen(false)} className="w-full">Fermer</Button></div>
            </>
        ) : ( <div className="h-full flex items-center justify-center"><p>Sélectionnez un document.</p></div> )}
      </SheetContent>
  )


  const anomalies = useMemo(() => {
    const list: { docId: string, docName: string, date: string, description: string, amount: number, transactionIndex: number }[] = [];
    if (!documents) return list;
    
    documents.forEach(doc => {
        if (doc.extractedData?.transactions) {
            doc.extractedData.transactions.forEach((t: any, i) => {
                if (t.isAnomaly && !t.matchingDocumentId) {
                    list.push({ 
                        docId: doc.id, 
                        docName: doc.name,
                        date: t.date || '',
                        description: t.description || t.vendor || '',
                        amount: t.amount || 0,
                        transactionIndex: i
                    });
                }
            });
        }
    });
    return list;
  }, [documents]);

  return (
    <div className="space-y-6">
       {showPasswordAlert && (
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300">
          <ShieldAlert className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
          <AlertTitle className="font-bold text-yellow-900 dark:text-yellow-200">Action requise : Sécurisez votre compte !</AlertTitle>
          <AlertDescription className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-2">
            <div>
              Votre compte utilise un mot de passe temporaire. Pour protéger vos données, veuillez le modifier dès que possible.
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
                <Button variant="outline" size="sm" onClick={handleDismissPasswordAlert} className="bg-transparent border-current text-current hover:bg-yellow-100 dark:hover:bg-yellow-900/50">Plus tard</Button>
                <Button asChild size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950">
                    <Link href="/dashboard/settings">Changer le mot de passe</Link>
                </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Mon Dépôt Magique</h1>
        <p className="text-muted-foreground mt-2 text-lg">Dépôt simplifié, suivi et actions requises en un clin d'œil.</p>
      </div>

      {anomalies.length > 0 && (
          <div className="glass-panel border-l-4 border-l-destructive bg-destructive/5 dark:bg-destructive/10 p-5 sm:p-7 rounded-r-2xl mb-8 animate-in slide-in-from-top-4 fade-in duration-700 ease-out premium-shadow">
             <div className="flex items-center gap-3 mb-5">
                 <ShieldAlert className="h-7 w-7 text-destructive animate-pulse" />
                 <h2 className="text-2xl font-bold text-destructive font-display tracking-tight">Actions Requises ({anomalies.length})</h2>
             </div>
             <p className="text-base text-destructive/80 dark:text-destructive/70 mb-5 font-medium leading-relaxed">
                 Votre expert-comptable a identifié des <strong>anomalies bancaires</strong>. Des justificatifs sont manquants pour valider votre TVA. 
             </p>
             <div className="space-y-4">
                 {anomalies.slice(0, 3).map((anomaly, idx) => (
                     <div key={`${anomaly.docId}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/50 dark:bg-black/20 p-4 rounded-xl shadow-sm border border-destructive/10 backdrop-blur-md gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                         <div>
                             <p className="font-semibold text-sm">{anomaly.description} <span className="font-bold text-red-600 block sm:inline mt-1 sm:mt-0 sm:ml-2">{anomaly.amount.toFixed(2)} €</span></p>
                             <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><FileClock className="h-3 w-3" /> Extrait le {anomaly.date} depuis {anomaly.docName}</p>
                         </div>
                         <Button size="sm" variant="outline" className="shrink-0 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors" onClick={() => {
                             toast({title: "Dépôt contextuel", description: "Glissez le reçu relatif à cette dépense dans le Dépôt Magique ci-dessous."});
                         }}>
                             <UploadCloud className="h-4 w-4 mr-2" />
                             Fournir le reçu
                         </Button>
                     </div>
                 ))}
                 {anomalies.length > 3 && (
                     <div className="text-center pt-2">
                         <span className="text-xs font-semibold text-red-600 hover:underline cursor-pointer">Voir les {anomalies.length - 3} autres relances...</span>
                     </div>
                 )}
             </div>
          </div>
      )}

      <Card className="glass-panel overflow-hidden border-primary/20 bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 premium-shadow">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-8">
            <CardTitle className="text-3xl font-display text-primary">Nouveau document</CardTitle>
            <CardDescription className="text-base text-foreground/70">Déposez vos fichiers ici. Ils seront automatiquement envoyés à votre comptable pour traitement.</CardDescription>
        </CardHeader>
        <CardContent>
             <FileUploader onFileDrop={handleFileDrop} isLoading={isUploading} />
        </CardContent>
      </Card>
      
      <div className="pt-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 fill-mode-both">
          <h2 className="text-3xl font-bold tracking-tight mb-6 font-display">Historique des documents</h2>
           {isLoading ? (
               <div className="space-y-4 glass-panel p-6 rounded-2xl">
                  <Skeleton className="h-20 w-full opacity-50" />
                  <Skeleton className="h-20 w-full opacity-50" />
               </div>
           ) : filteredDocuments.length > 0 ? (
                <div className="glass-panel rounded-2xl p-1 sm:p-6 premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 overflow-hidden">
                    <DocumentHistory 
                        documents={filteredDocuments}
                        onProcess={() => {}}
                        onDelete={handleDelete}
                        activeDocumentId={activeDocument?.id}
                        setActiveDocument={handleSetActive}
                        selectedDocumentIds={[]}
                        setSelectedDocumentIds={() => {}}
                        isLoading={false}
                    />
                </div>
            ) : (
                <Card className="glass-panel border-dashed border-2 border-border/50 bg-background/50 premium-shadow-sm hover:border-primary/50 transition-colors duration-500">
                  <CardContent className="h-64 flex flex-col items-center justify-center text-center">
                      <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-primary/20 premium-shadow">
                        <FileUp className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold font-display tracking-tight">Aucun document historique</h3>
                      <p className="text-base text-muted-foreground mt-2 max-w-md">Déposez votre premier justificatif dans la zone ci-dessus pour qu'il soit analysé par votre comptable.</p>
                  </CardContent>
              </Card>
            )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><DocumentPreviewSheet /></Sheet>
    </div>
  );
}
