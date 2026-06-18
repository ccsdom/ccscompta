

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, BellRing, ExternalLink, FileUp, FilterX, MessageSquare, Loader2, CheckCircle, FileWarning, FileClock, Search, ShieldAlert } from 'lucide-react';
import type { Document, AuditEvent, Comment } from '@/lib/types';
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetDescription } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import type { IntelligentSearchOutput } from '@/services/intelligent-search-service';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { collection, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { DocumentHistory } from '@/components/document-history';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { db } from '@/firebase';
import { cn, formatDate, parseDate } from '@/lib/utils';
import { summarizeUploadRejections, uploadClientDocument, type FileUploadRejection } from '@/lib/uploads/client-document-upload';
import { OnboardingProgress } from '@/components/onboarding-progress';
import { GamificationDashboard } from '@/components/gamification-dashboard';


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

type DocumentStatusFilter = 'all' | 'attention' | Document['status'];

const statusFilterOptions: { value: DocumentStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'attention', label: 'À traiter' },
  { value: 'pending', label: 'En attente' },
  { value: 'processing', label: 'Traitement' },
  { value: 'reviewing', label: 'En examen' },
  { value: 'approved', label: 'Validés' },
  { value: 'error', label: 'Erreurs' },
  { value: 'duplicate', label: 'Doublons' },
];

const attentionStatuses: Document['status'][] = ['error', 'reviewing'];

const documentMatchesText = (doc: Document, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const searchableText = [
    doc.name,
    doc.type,
    doc.status,
    doc.extractedData?.category,
    doc.extractedData?.otherInformation,
    ...(doc.extractedData?.vendorNames || []),
    ...(doc.extractedData?.dates || []),
  ].filter(Boolean).join(' ').toLowerCase();

  return searchableText.includes(normalizedQuery);
};


export default function MyDocumentsPage() {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
  const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>('all');
  const [recentUploadRejections, setRecentUploadRejections] = useState<FileUploadRejection[]>([]);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [cabinetId, setCabinetId] = useState<string | null>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const historySectionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { storage } = useFirebase();
  
  const documentsQuery = useMemoFirebase(() => {
    if (!clientId) return null;
    return query(collection(db, 'documents'), where('clientId', '==', clientId));
  }, [clientId]);
  
  const { data: documents, isLoading: isLoadingDocuments, error: documentsError } = useCollection<Document>(documentsQuery);

  const isLoading = isLoadingDocuments;

  const hasUploadedDocument = documents ? documents.length > 0 : false;
  const [hasConnectedBank, setHasConnectedBank] = useState(false);

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
            setSearchQuery(storedQuery || '');
            const storedCriteria = localStorage.getItem('searchCriteria');
            setSearchCriteria(storedCriteria ? JSON.parse(storedCriteria) : null);
            
            const dismissed = localStorage.getItem(`password_alert_dismissed_${storedClientId}`);
            setShowPasswordAlert(!dismissed);

            if (storedClientId) {
                getDoc(doc(db, 'clients', storedClientId))
                    .then(snap => { if (snap.exists()) setCabinetId(snap.data().cabinetId); })
                    .catch(err => console.warn('Could not load cabinet ID:', err));
            }

            // Gamification state
            setHasConnectedBank(localStorage.getItem(`bank_linked_${storedClientId}`) === 'true');

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

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToHistory = () => {
    historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLocalSearchChange = (value: string) => {
    setSearchQuery(value);
    setSearchCriteria(null);

    if (value.trim()) {
      localStorage.setItem('searchQuery', value);
    } else {
      localStorage.removeItem('searchQuery');
    }

    localStorage.removeItem('searchCriteria');
    window.dispatchEvent(new Event('storage'));
  };

  const clearDocumentFilters = () => {
    setSearchQuery('');
    setSearchCriteria(null);
    setStatusFilter('all');
    localStorage.removeItem('searchQuery');
    localStorage.removeItem('searchCriteria');
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

  const processSingleFile = useCallback(async (file: File, clientId: string) => {
    try {
        const result = await uploadClientDocument({
            db,
            storage,
            file,
            clientId,
            currentUser: getCurrentUser(),
            cabinetId,
            auditAction: 'Document televerse',
        });

        if (!cabinetId) {
            setCabinetId(result.cabinetId);
        }

        return { success: true };

    } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        toast({
            variant: 'destructive',
            title: `Echec du televersement pour ${file.name}`,
            description: "Une erreur est survenue lors de l'envoi ou de la sauvegarde. Veuillez reessayer."
        });
        return { success: false };
    }
}, [cabinetId, storage, toast]);

  const handleRejectedFiles = (rejections: FileUploadRejection[]) => {
    setRecentUploadRejections(rejections.slice(0, 4));
    toast({
      variant: 'destructive',
      title: 'Certains fichiers ont ete ignores',
      description: summarizeUploadRejections(rejections),
    });
  };


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
      setRecentUploadRejections([]);
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
                docs = docs.filter(d => d.extractedData?.dates?.some(date => date != null && (parseDate(date)?.getTime() || 0) >= (parseDate(startDate)?.getTime() || 0)));
            }
            if (endDate) {
                docs = docs.filter(d => d.extractedData?.dates?.some(date => date != null && (parseDate(date)?.getTime() || 0) <= (parseDate(endDate)?.getTime() || 0)));
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

        if (searchQuery.trim()) {
            docs = docs.filter(doc => documentMatchesText(doc, searchQuery));
        }

        if (statusFilter === 'attention') {
            docs = docs.filter(doc => attentionStatuses.includes(doc.status) || (doc.extractedData?.anomalies?.length || 0) > 0);
        } else if (statusFilter !== 'all') {
            docs = docs.filter(doc => doc.status === statusFilter);
        }
        
        return docs.sort((a,b) => {
            const dateB = parseDate(b.uploadDate);
            const dateA = parseDate(a.uploadDate);
            return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        });

  }, [documents, searchQuery, searchCriteria, statusFilter]);


  const CommentsSectionClient = ({ comments, onAddComment }: { comments: Comment[], onAddComment: (text: string) => void }) => {
    const [newComment, setNewComment] = useState("");
    const handleSubmit = () => { if (newComment.trim()) { onAddComment(newComment.trim()); setNewComment(""); } }
    
    return (
        <div className="flex h-full min-h-0 flex-col">
            <h3 className="px-4 pb-2 pt-4 text-base font-semibold sm:px-6 sm:pt-6">Commentaires</h3>
            <ScrollArea className="min-h-0 flex-1 px-4 sm:px-6">
                <div className="space-y-4 py-4">
                    {comments.length > 0 ? (
                        comments.slice().reverse().map((comment) => (
                            <div key={comment.id} className="flex items-start gap-3 text-sm">
                                <Avatar className="h-8 w-8 border shrink-0"><AvatarFallback>{comment.user.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                <div className="min-w-0 flex-1 rounded-md bg-muted p-3">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold">{comment.user}</p><p className="text-xs text-muted-foreground">{format(parseDate(comment.date) || new Date(), "dd/MM/yy 'à' HH:mm", { locale: fr })}</p></div>
                                    <p className="mt-1 break-words text-foreground/90">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-center text-sm text-muted-foreground py-10"><MessageSquare className="h-8 w-8 mx-auto mb-2" /><p>Aucun commentaire pour l'instant.</p></div>
                    )}
                </div>
            </ScrollArea>
             <div className="flex items-start gap-3 border-t p-4 sm:p-6">
                <Avatar className="h-8 w-8 border shrink-0"><AvatarFallback>Moi</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                    <Textarea placeholder="Répondre ou poser une question..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} className="bg-transparent border"/>
                    <Button size="sm" className="mt-2 w-full sm:w-auto" onClick={handleSubmit} disabled={!newComment.trim()}>Envoyer</Button>
                </div>
            </div>
        </div>
    )
}

  const PreviewFrame = ({ docItem }: { docItem: Document }) => (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Aperçu</h3>
        {docItem.dataUrl && (
          <Button asChild size="sm" variant="outline" className="h-8 shrink-0">
            <a href={docItem.dataUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Ouvrir
            </a>
          </Button>
        )}
      </div>
      <div className="min-h-[360px] flex-1 overflow-hidden rounded-lg border bg-muted/40">
        {docItem.dataUrl ? (
          <iframe src={docItem.dataUrl} className="h-full min-h-[360px] w-full" title="Aperçu du document" />
        ) : (
          <div className="flex h-full min-h-[360px] items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin"/>
          </div>
        )}
      </div>
    </div>
  );

  const DataRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-background/70 p-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 max-w-[65%] truncate text-right font-medium" title={value || '-'}>{value || '-'}</span>
    </div>
  );

  const ValidatedDataPanel = ({ docItem }: { docItem: Document }) => {
    const data = docItem.extractedData;
    const vendor = data?.vendorNames?.filter(Boolean).join(', ');
    const date = data?.dates?.[0] ? formatDate(data.dates[0]) : null;
    const amount = data?.amounts?.[0]?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const vat = typeof data?.vatAmount === 'number' ? data.vatAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : null;
    const hasValidatedData = docItem.status === 'approved' && Boolean(data);

    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div>
          <h3 className="text-base font-semibold">Données validées</h3>
          <p className="mt-1 text-sm text-muted-foreground">Synthèse retenue par le cabinet.</p>
        </div>

        {hasValidatedData ? (
          <div className="space-y-2">
            <DataRow label="Fournisseur" value={vendor} />
            <DataRow label="Date pièce" value={date} />
            <DataRow label="Montant TTC" value={amount} />
            <DataRow label="TVA" value={vat} />
            <DataRow label="Catégorie" value={data?.category} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            Les données du document seront affichées après validation par votre comptable.
          </div>
        )}
      </div>
    );
  };

  const DocumentPreviewSheet = () => (
     <SheetContent side="right" className="flex !w-full !max-w-none flex-col p-0 sm:!max-w-3xl lg:!max-w-5xl">
        {activeDocument ? (
            <>
                <SheetHeader className="border-b px-4 py-4 pr-12 text-left sm:px-6">
                  <SheetTitle className="truncate text-base sm:text-lg" title={activeDocument.name}>{activeDocument.name}</SheetTitle>
                   <div className="flex flex-wrap items-center gap-2">
                    <SheetDescription>Téléversé le {formatDate(activeDocument.uploadDate)}</SheetDescription>
                    {getStatusBadge(activeDocument.status)}
                   </div>
                </SheetHeader>

                <Tabs defaultValue="preview" className="flex min-h-0 flex-1 flex-col md:hidden">
                  <div className="border-b px-4 py-3">
                    <TabsList className="grid h-10 w-full grid-cols-3">
                      <TabsTrigger value="preview">Aperçu</TabsTrigger>
                      <TabsTrigger value="data">Données</TabsTrigger>
                      <TabsTrigger value="comments">Notes</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="preview" className="m-0 min-h-0 flex-1 overflow-hidden">
                    <PreviewFrame docItem={activeDocument} />
                  </TabsContent>
                  <TabsContent value="data" className="m-0 min-h-0 flex-1 overflow-auto">
                    <ValidatedDataPanel docItem={activeDocument} />
                  </TabsContent>
                  <TabsContent value="comments" className="m-0 min-h-0 flex-1 overflow-hidden">
                    <CommentsSectionClient comments={activeDocument.comments || []} onAddComment={(text) => handleAddComment(activeDocument.id, text)} />
                  </TabsContent>
                </Tabs>

                <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                    <div className="min-h-0 border-r">
                        <PreviewFrame docItem={activeDocument} />
                    </div>
                    <Tabs defaultValue="data" className="flex min-h-0 flex-col bg-muted/10">
                      <div className="border-b p-4">
                        <TabsList className="grid h-10 w-full grid-cols-2">
                          <TabsTrigger value="data">Données</TabsTrigger>
                          <TabsTrigger value="comments">Commentaires</TabsTrigger>
                        </TabsList>
                      </div>
                      <TabsContent value="data" className="m-0 min-h-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                          <ValidatedDataPanel docItem={activeDocument} />
                        </ScrollArea>
                      </TabsContent>
                      <TabsContent value="comments" className="m-0 min-h-0 flex-1 overflow-hidden">
                        <CommentsSectionClient comments={activeDocument.comments || []} onAddComment={(text) => handleAddComment(activeDocument.id, text)} />
                      </TabsContent>
                    </Tabs>
                </div>

                 <div className="border-t p-4 sm:p-6"><Button onClick={() => setIsSheetOpen(false)} className="w-full">Fermer</Button></div>
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

  const documentStats = useMemo(() => {
    const source = documents || [];
    return {
      total: source.length,
      pending: source.filter(doc => doc.status === 'pending').length,
      processing: source.filter(doc => doc.status === 'processing').length,
      reviewing: source.filter(doc => doc.status === 'reviewing').length,
      approved: source.filter(doc => doc.status === 'approved').length,
      error: source.filter(doc => doc.status === 'error').length,
      duplicate: source.filter(doc => doc.status === 'duplicate').length,
      attention: source.filter(doc => attentionStatuses.includes(doc.status) || (doc.extractedData?.anomalies?.length || 0) > 0).length,
    };
  }, [documents]);

  const documentsInError = useMemo(() => (documents || []).filter(doc => doc.status === 'error'), [documents]);
  const documentsToReview = useMemo(() => (documents || []).filter(doc => doc.status === 'reviewing'), [documents]);
  const pendingDocuments = useMemo(() => (documents || []).filter(doc => doc.status === 'pending' || doc.status === 'processing'), [documents]);
  const hasActiveDocumentFilters = Boolean(searchQuery.trim() || searchCriteria || statusFilter !== 'all');

  const getFilterCount = (filter: DocumentStatusFilter) => {
    if (filter === 'all') return documentStats.total;
    if (filter === 'attention') return documentStats.attention;
    return documentStats[filter] || 0;
  };

  const AttentionCenter = () => {
    const hasItems = anomalies.length > 0 || documentsInError.length > 0 || documentsToReview.length > 0 || pendingDocuments.length > 0 || recentUploadRejections.length > 0;
    if (!hasItems) return null;

    return (
      <section className="rounded-lg border bg-background/70 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Suivi des pièces</h2>
              <p className="text-sm text-muted-foreground">{documentStats.total} document{documentStats.total > 1 ? 's' : ''} dans votre espace</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:w-auto">
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="text-lg font-bold">{pendingDocuments.length}</div>
              <div className="text-[11px] text-muted-foreground">En attente</div>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="text-lg font-bold">{documentsToReview.length}</div>
              <div className="text-[11px] text-muted-foreground">À vérifier</div>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className={cn("text-lg font-bold", documentsInError.length > 0 && "text-destructive")}>{documentsInError.length}</div>
              <div className="text-[11px] text-muted-foreground">Erreurs</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {recentUploadRejections.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-destructive">Fichier rejeté</p>
                  <p className="mt-1 text-xs text-muted-foreground">{summarizeUploadRejections(recentUploadRejections)}</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={scrollToUpload}>Corriger</Button>
              </div>
            </div>
          )}

          {anomalies.length > 0 && (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{anomalies.length} justificatif{anomalies.length > 1 ? 's' : ''} manquant{anomalies.length > 1 ? 's' : ''}</p>
                  <p className="mt-1 truncate text-xs opacity-80">{anomalies[0].description || anomalies[0].docName}</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0 bg-transparent" onClick={scrollToUpload}>Fournir</Button>
              </div>
            </div>
          )}

          {documentsInError.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-start gap-3">
                <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-destructive">{documentsInError.length} document{documentsInError.length > 1 ? 's' : ''} en erreur</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{documentsInError[0].name}</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => { setStatusFilter('error'); scrollToHistory(); }}>Voir</Button>
              </div>
            </div>
          )}

          {documentsToReview.length > 0 && (
            <div className="rounded-lg border border-yellow-300/70 bg-yellow-50 p-3 text-yellow-950 dark:border-yellow-900/60 dark:bg-yellow-950/20 dark:text-yellow-200">
              <div className="flex items-start gap-3">
                <FileClock className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{documentsToReview.length} document{documentsToReview.length > 1 ? 's' : ''} en examen</p>
                  <p className="mt-1 truncate text-xs opacity-80">{documentsToReview[0].name}</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0 bg-transparent" onClick={() => { setStatusFilter('reviewing'); scrollToHistory(); }}>Suivre</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

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
        <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Mes pieces comptables</h1>
        <p className="text-muted-foreground mt-2 text-lg">Depot securise, suivi clair et actions requises en un coup d'oeil.</p>
      </div>

      <OnboardingProgress 
        hasCompletedProfile={true} 
        hasConnectedBank={hasConnectedBank} 
        hasUploadedDocument={hasUploadedDocument} 
      />

      <GamificationDashboard 
        documentsCount={filteredDocuments.length} 
        anomaliesCount={anomalies.length} 
      />

      <AttentionCenter />

      <Card ref={uploadSectionRef} className="glass-panel overflow-hidden border-primary/20 bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 premium-shadow">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-8">
            <CardTitle className="text-3xl font-display text-primary">Nouveau document</CardTitle>
            <CardDescription className="text-base text-foreground/70">Ajoutez vos fichiers ici. Ils seront automatiquement transmis a votre comptable pour traitement.</CardDescription>
        </CardHeader>
        <CardContent>
             <FileUploader onFileDrop={handleFileDrop} isLoading={isUploading} onFileReject={handleRejectedFiles} />
        </CardContent>
      </Card>
      
      <div ref={historySectionRef} className="pt-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 fill-mode-both">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-display sm:text-3xl">Historique des documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">{filteredDocuments.length} résultat{filteredDocuments.length > 1 ? 's' : ''} affiché{filteredDocuments.length > 1 ? 's' : ''}</p>
            </div>
            {hasActiveDocumentFilters && (
              <Button variant="ghost" size="sm" onClick={clearDocumentFilters} className="w-full justify-center sm:w-auto">
                <FilterX className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="mb-4 rounded-lg border bg-background/70 p-3 shadow-sm sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => handleLocalSearchChange(event.target.value)}
                placeholder="Rechercher un document, fournisseur, montant..."
                className="h-11 pl-9"
              />
            </div>

            {searchCriteria && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">Recherche intelligente : {searchCriteria.originalQuery}</span>
                <Button variant="ghost" size="sm" onClick={clearDocumentFilters} className="h-8 shrink-0">Effacer</Button>
              </div>
            )}

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {statusFilterOptions.map((option) => {
                const isActive = statusFilter === option.value;
                const count = getFilterCount(option.value);
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                    <span className={cn("ml-2 rounded-full px-1.5 text-[11px]", isActive ? "bg-primary-foreground/20" : "bg-muted")}>{count}</span>
                  </Button>
                );
              })}
            </div>
          </div>

           {documentsError ? (
              <Alert variant="destructive" className="bg-destructive/5">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Acces aux documents indisponible</AlertTitle>
                <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Votre session ne permet pas de charger cet historique pour le moment. Reconnectez-vous ou contactez votre cabinet si le probleme persiste.
                  </span>
                  <Button type="button" variant="outline" size="sm" className="shrink-0 bg-transparent" onClick={() => window.location.reload()}>
                    Recharger
                  </Button>
                </AlertDescription>
              </Alert>
           ) : isLoading ? (
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
                      <h3 className="text-xl font-bold font-display tracking-tight">{hasActiveDocumentFilters ? 'Aucun résultat' : 'Aucun document historique'}</h3>
                      <p className="text-base text-muted-foreground mt-2 max-w-md">
                        {hasActiveDocumentFilters
                          ? "Aucun document ne correspond aux filtres actifs."
                          : "Déposez votre premier justificatif dans la zone ci-dessus pour qu'il soit analysé par votre comptable."}
                      </p>
                  </CardContent>
              </Card>
            )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><DocumentPreviewSheet /></Sheet>
    </div>
  );
}
