

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useBranding } from '@/components/branding-provider';
import { DataValidationForm } from '@/components/data-validation-form';
import { type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Check, Send, Trash2, Download, FileUp, ZoomIn, ZoomOut, RotateCw, RefreshCw, FilterX, Loader2, Play, Eye, FileClock, CheckCircle, FileWarning } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IntelligentSearchOutput } from '@/ai/flows/intelligent-search-flow';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Comment, AuditEvent, Notification, Document, Client, UserProfile } from '@/lib/types';
import Papa from 'papaparse';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCollection, useMemoFirebase, useUser, useDoc, db, useFirebase } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { collection, doc, query, where, writeBatch, increment, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientSwitcher } from '@/components/client-switcher';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { createInvoiceForDocument } from '@/ai/flows/invoice-actions';
import { ExportModal } from '@/components/export-modal';



const getCurrentUser = () => localStorage.getItem('userName') || 'Utilisateur Démo';

const getStatusInfo = (status: Document['status']): { icon: React.ElementType, label: string, color: string } => {
  switch (status) {
    case 'pending': return { icon: FileClock, label: "En attente", color: "text-gray-500" };
    case 'processing': return { icon: Loader2, label: "En traitement...", color: "text-blue-500 animate-spin" };
    case 'reviewing': return { icon: FileWarning, label: "Prêt pour examen", color: "text-yellow-500" };
    case 'approved': return { icon: CheckCircle, label: "Approuvé", color: "text-green-500" };
    case 'error': return { icon: FileWarning, label: "Erreur", color: "text-red-500" };
    case 'duplicate': return { icon: FileWarning, label: "Doublon", color: "text-amber-500" };
    default: return { icon: FileClock, label: "Inconnu", color: "text-gray-500" };
  }
};


export default function DocumentsPage() {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [automationSettings, setAutomationSettings] = useState({ isEnabled: false, confidenceThreshold: 0.95, autoSend: false });
  const [isSheetOpen, setIsSheetOpen] = useState(false); // For mobile view
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { storage } = useFirebase();

  const { profile: userProfile, role: userRole } = useBranding();

  // Explicit block for Super Admin to force impersonation
  if (userRole === 'admin') {
      return (
           <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
              <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
                  <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="h-10 w-10 text-red-500" />
                  </div>
                  <h2 className="text-3xl font-black font-space tracking-tight mb-4 text-foreground">Zone Interdite</h2>
                  <p className="text-muted-foreground mb-8 text-lg font-medium">L'accès direct aux documents est restreint pour le Super Admin. Veuillez impersonner un cabinet pour accéder à ses documents.</p>
                  <Button onClick={() => router.push('/dashboard/cabinets')} className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                      Aller à la Gestion Cabinets
                  </Button>
              </Card>
          </div>
      )
  }

  // Firestore hooks for real-time data
  const documentsQuery = useMemoFirebase(() => {
    if (!selectedClientId || !userProfile) return null;
    
    // For staff (including impersonating admins), we MUST filter by cabinetId
    if (userProfile.cabinetId) {
      return query(
        collection(db, 'documents'), 
        where('clientId', '==', selectedClientId),
        where('cabinetId', '==', userProfile.cabinetId)
      );
    }

    return null;
  }, [selectedClientId, userProfile]);
  const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!userProfile) return null;
    
    if (userProfile.cabinetId) {
       return query(
         collection(db, 'clients'), 
         where('role', '==', 'client'),
         where('cabinetId', '==', userProfile.cabinetId)
       );
    }
    return null;
  }, [userProfile]);

  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const isLoading = isLoadingDocuments || isLoadingClients;
  
   useEffect(() => {
    const loadState = () => {
        try {
             const storedQuery = localStorage.getItem('searchQuery');
             if (storedQuery) setSearchQuery(storedQuery);
             const storedCriteria = localStorage.getItem('searchCriteria');
             if (storedCriteria) setSearchCriteria(JSON.parse(storedCriteria));
             const storedAutomation = localStorage.getItem('automationSettings');
             if (storedAutomation) setAutomationSettings(JSON.parse(storedAutomation));
             
             const clientId = localStorage.getItem('selectedClientId');
             if (clientId !== selectedClientId) {
                setSelectedClientId(clientId);
                setActiveDocument(null);
             } else if (!clientId) {
                setSelectedClientId(null);
                setActiveDocument(null);
             }

             const filter = searchParams.get('filter');
             setDashboardFilter(filter);

        } catch (error) {
            console.error("Failed to load state from localStorage", error)
        }
    };
    loadState();
    window.addEventListener('storage', loadState);
    return () => window.removeEventListener('storage', loadState);
  }, [selectedClientId, searchParams])


  const createNotification = (doc: Document, message: string) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      documentId: doc.id,
      documentName: doc.name,
      message,
      date: new Date().toISOString(),
      isRead: false
    };
    // This part would ideally be a server-side operation
    const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]') as Notification[];
    localStorage.setItem('notifications', JSON.stringify([newNotification, ...existingNotifications]));
    window.dispatchEvent(new Event('storage')); // Notify header
  };

  const addAuditEvent = async (docId: string, action: string, user: string = 'Système'): Promise<AuditEvent[]> => {
    const event: AuditEvent = {
        action,
        date: new Date().toISOString(),
        user,
    };
    const docSnap = await getDoc(doc(db, 'documents', docId));
    const currentTrail = docSnap.data()?.auditTrail || [];
    return [...currentTrail, event];
  };

  const updateLocalDocument = (updatedDoc: Document) => {
      // The hook will update the list automatically. We just need to update the active doc.
      if (activeDocument?.id === updatedDoc.id) {
          handleSetActiveDocument(updatedDoc);
      }
  }

  const handleReprocessDocument = async (docId: string) => {
    toast({
        title: "Retraitement demandé",
        description: "Une demande de retraitement a été envoyée au serveur."
    });
    // This triggers the `onDocumentCreated` function in the backend again by changing the status to 'pending'.
    // A more robust solution might be a specific 'reprocess' field and a dedicated `onDocumentUpdated` function.
    await updateDoc(doc(db, 'documents', docId), { status: 'pending' });
  };
  
  const handleUpdateDocumentData = async (docId: string, updatedData: ExtractDataOutput) => {
    const docRef = doc(db, 'documents', docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || !docSnap.data()?.clientId) return;
    const clientId = docSnap.data()!.clientId;

    const trail = await addAuditEvent(docId, 'Document approuvé manuellement', getCurrentUser());
    const updates = { status: 'approved' as const, extractedData: updatedData, auditTrail: trail };
    await updateDoc(docRef, updates);
    
    const client = clients?.find(c => c.id === clientId);
    if (client) {
        await createInvoiceForDocument(client, docId);
        await updateDoc(doc(db, 'clients', client.id), { newDocuments: increment(-1) });
    }
    
    const updatedDocSnap = await getDoc(docRef);
    if(updatedDocSnap.exists()) {
        const updatedDoc = { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Document;
        updateLocalDocument(updatedDoc);
        createNotification(updatedDoc, 'a été approuvé.');
        toast({ title: "Document approuvé", description: "Les données ont été validées et une facture de traitement a été générée." });
        window.dispatchEvent(new Event('storage'));
    }
  };

   const handleAddComment = async (commentText: string) => {
    if (!commentText.trim() || !activeDocument) return;
    const docId = activeDocument.id;
    const newComment: Comment = {
      id: crypto.randomUUID(),
      text: commentText,
      user: getCurrentUser(),
      date: new Date().toISOString(),
    };
    const trail = await addAuditEvent(docId, `Commentaire ajouté: "${commentText.substring(0, 20)}..."`, getCurrentUser());
    const docRef = doc(db, 'documents', docId);
    const docSnap = await getDoc(docRef);
    const currentComments = docSnap.data()?.comments || [];
    const updatedComments = [...currentComments, newComment];
    await updateDoc(docRef, { comments: updatedComments, auditTrail: trail });
  };
  
  const handleSetActiveDocument = async (doc: Document | null) => {
    if (doc) {
        if (activeDocument?.id === doc.id) {
           if(window.innerWidth < 768 && !isSheetOpen) setIsSheetOpen(true);
           return;
        }
        setZoom(1);
        setRotation(0);
        
        setActiveDocument({ ...doc, dataUrl: undefined });

        if(window.innerWidth < 768) {
            setIsSheetOpen(true);
        }

        try {
            const storageRef = ref(storage, doc.storagePath);
            const downloadUrl = await getDownloadURL(storageRef);

            setActiveDocument({ ...doc, dataUrl: downloadUrl });

        } catch (error) {
            console.error("Error getting document preview URL:", error);
            toast({ variant: "destructive", title: "Erreur d'aperçu", description: "Impossible de charger l'URL de l'aperçu du document." });
            setActiveDocument(doc);
        }
    } else {
        setActiveDocument(null);
        setIsSheetOpen(false);
    }
  }

  const handleBulkApprove = async () => {
    let approvedCount = 0;
    const docIdsToApprove = selectedDocumentIds.filter(docId => {
      const doc = documents?.find(d => d.id === docId);
      return doc && doc.status === 'reviewing';
    });

    const batch = writeBatch(db);

    for(const docId of docIdsToApprove) {
        const docToApprove = documents!.find(d => d.id === docId)!;
        const trail = await addAuditEvent(docId, 'Document approuvé (en masse)', getCurrentUser());
        batch.update(doc(db, 'documents', docId), { status: 'approved', auditTrail: trail });
        createNotification(docToApprove, 'a été approuvé.');
        
        const client = clients?.find(c => c.id === docToApprove.clientId);
        if (client) {
            await createInvoiceForDocument(client, docId); // Cannot be in batch
            batch.update(doc(db, 'clients', client.id), { newDocuments: increment(-1) });
        }
        approvedCount++;
    }
    
    if (approvedCount > 0) {
        await batch.commit();
        toast({ title: "Documents approuvés", description: `${approvedCount} documents ont été approuvés.` });
        window.dispatchEvent(new Event('storage'));
    } else {
        toast({ title: "Aucun document à approuver", description: "Seuls les documents 'Prêt pour examen' peuvent être approuvés.", variant: 'destructive' });
    }
    setSelectedDocumentIds([]);
  }


  const handleDeleteSingle = async (docId: string) => {
     await deleteDoc(doc(db, 'documents', docId));
     if (activeDocument?.id === docId) setActiveDocument(null);
     toast({ variant: 'destructive', title: "Document supprimé" });
  }

  const handleBulkDelete = async () => {
    const batch = writeBatch(db);
    selectedDocumentIds.forEach(docId => batch.delete(doc(db, 'documents', docId)));
    await batch.commit();

    if (activeDocument && selectedDocumentIds.includes(activeDocument.id)) setActiveDocument(null);
    toast({ variant: 'destructive', title: "Documents supprimés", description: `${selectedDocumentIds.length} documents ont été supprimés.` });
    setSelectedDocumentIds([]);
  }

  const handleBulkExport = () => {
    const docsToExport = documents?.filter(doc => selectedDocumentIds.includes(doc.id) && doc.status === 'approved' && doc.extractedData) || [];
    if (docsToExport.length === 0) {
      toast({ title: "Aucun document à exporter", description: "Veuillez sélectionner des documents approuvés.", variant: "destructive" });
      return;
    }
    setIsExportModalOpen(true);
  }
  
  const filteredDocuments = useMemo(() => {
        let docs = [...(documents || [])];
        
        if (dashboardFilter) {
            const today = new Date();
            const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            
            switch (dashboardFilter) {
                case 'today':
                    docs = docs.filter(d => new Date(d.uploadDate) >= twentyFourHoursAgo);
                    break;
                case 'pending_review':
                    docs = docs.filter(d => ['pending', 'reviewing', 'error'].includes(d.status));
                    break;
                case 'approved_today':
                    docs = docs.filter(doc => {
                        const approvalEvent = doc.auditTrail.find(e => e.action.includes('approuvé'));
                        return approvalEvent && new Date(approvalEvent.date) >= twentyFourHoursAgo;
                    });
                    break;
            }
        }
        else if (searchCriteria) {
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
                    const searchableText = [d.name, d.extractedData?.otherInformation || '', ...(d.extractedData?.vendorNames || [])].join(' ').toLowerCase();
                    return keywords.every(kw => searchableText.includes(kw.toLowerCase()));
                });
            }
             if (!docs.length && originalQuery) {
                 const lowercasedQuery = originalQuery.toLowerCase();
                 docs = [...(documents || [])].filter(doc => 
                    doc.name.toLowerCase().includes(lowercasedQuery) ||
                    (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(v => v != null && v.toLowerCase().includes(lowercasedQuery)))
                );
            }
        } 
        else if (searchQuery) {
             const lowercasedQuery = searchQuery.toLowerCase();
             docs = docs.filter(doc => 
                doc.name.toLowerCase().includes(lowercasedQuery) ||
                (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(vendor => vendor != null && vendor.toLowerCase().includes(lowercasedQuery)))
            );
        }
        
        return docs.sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [documents, searchQuery, searchCriteria, dashboardFilter]);

  const groupedDocuments = useMemo(() => {
    const groups: { [key: string]: Document[] } = {
      'reviewing': [],
      'pending': [],
      'approved': [],
      'error': [],
      'duplicate': [],
      'processing': [],
    };
    filteredDocuments.forEach(doc => {
      if (groups[doc.status]) {
        groups[doc.status].push(doc);
      }
    });
    return groups;
  }, [filteredDocuments]);

  const clearFilters = () => {
    if (dashboardFilter) {
        router.replace('/dashboard/documents');
        setDashboardFilter(null);
    }
    if (searchCriteria) {
        setSearchCriteria(null);
        setSearchQuery('');
        localStorage.removeItem('searchCriteria');
        localStorage.removeItem('searchQuery');
        window.dispatchEvent(new Event('storage'));
    }
  }

  const FilterDisplay = () => {
    if (!dashboardFilter && !searchCriteria) return null;

    let filterText = "Filtre actif";
    if (dashboardFilter) {
        switch (dashboardFilter) {
            case 'today': filterText = "Filtre : Documents du jour"; break;
            case 'pending_review': filterText = "Filtre : En attente d'examen"; break;
            case 'approved_today': filterText = "Filtre : Validations du jour"; break;
        }
    } else if (searchCriteria) {
         const criteriaCount = Object.values(searchCriteria).filter(v => v !== null && v !== undefined && (!Array.isArray(v) || v.length > 0) && (typeof v !== 'string' || v.trim() !== '')).length -1;
         filterText = `Filtre intelligent (${criteriaCount} critères) : "${searchCriteria.originalQuery}"`;
    }

    return (
        <div className="flex items-center space-x-2 bg-muted p-2 rounded-md border text-sm mx-4">
            <span className="font-medium text-muted-foreground pl-2">{filterText}</span>
            <div className="flex-grow" />
             <Button variant="ghost" size="sm" onClick={clearFilters}>
                <FilterX className="mr-2 h-4 w-4" />
                Effacer le filtre
             </Button>
        </div>
    )
 };

  const BulkActionsToolbar = () => (
    <div className="flex items-center space-x-2 bg-muted p-2 rounded-md border mx-4">
        <span className="text-sm font-medium text-muted-foreground pl-2">{selectedDocumentIds.length} sélectionné(s)</span>
        <div className="flex-grow" />
        <Button variant="outline" size="sm" onClick={handleBulkApprove}><Check className="h-4 w-4 mr-2" />Approuver</Button>
        <Button variant="outline" size="sm" onClick={handleBulkExport}><Download className="h-4 w-4 mr-2" />Export Comptable</Button>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" />Supprimer</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Les documents sélectionnés seront supprimés.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
  
  const PreviewControls = () => (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <TooltipProvider>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => z * 1.2)}><ZoomIn className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Zoom avant</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => z / 1.2)}><ZoomOut className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Zoom arrière</p></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Pivoter</p></TooltipContent></Tooltip>
            {activeDocument?.id && (activeDocument.status === 'pending' || activeDocument.status === 'error') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleReprocessDocument(activeDocument.id)} disabled={isProcessing}>
                    <RefreshCw className="h-4 w-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Relancer le traitement</p></TooltipContent>
              </Tooltip>
            )}
        </TooltipProvider>
    </div>
  );

  const DocumentList = () => {
    const documentGroups: { status: Document['status']; label: string }[] = [
      { status: 'reviewing', label: 'Prêt pour examen' },
      { status: 'pending', label: 'En attente de traitement' },
      { status: 'processing', label: 'En cours de traitement' },
      { status: 'approved', label: 'Approuvé' },
      { status: 'duplicate', label: 'Doublons Potentiels' },
      { status: 'error', label: 'Erreur' },
    ];

    if (!selectedClientId) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucun client sélectionné</h3>
            <p className="text-sm text-muted-foreground mt-1">Veuillez sélectionner un client pour voir ses documents.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 pt-4">
          <FilterDisplay />
          {selectedDocumentIds.length > 0 && <div className="mt-4"><BulkActionsToolbar /></div>}
        </div>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : (
                documentGroups.map(group => {
                  const docsInGroup = groupedDocuments[group.status];
                  if (docsInGroup.length === 0) return null;
                  
                  const { icon: Icon, color } = getStatusInfo(group.status);

                  return (
                    <div key={group.status}>
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 px-1 text-muted-foreground">
                        <Icon className={cn("h-4 w-4", color)} />
                        {group.label}
                        <span className="text-xs">({docsInGroup.length})</span>
                      </h3>
                      <div className="space-y-2">
                          {docsInGroup.map(doc => (
                             <div
                              key={doc.id}
                              onClick={() => handleSetActiveDocument(doc)}
                              className={cn(
                                'w-full text-left p-2 rounded-lg border flex items-start gap-3 transition-colors cursor-pointer',
                                activeDocument?.id === doc.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                              )}
                            >
                               <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                 <Checkbox
                                      onCheckedChange={(checked) => {
                                        setSelectedDocumentIds(prev => 
                                          checked ? [...prev, doc.id] : prev.filter(id => id !== doc.id)
                                        );
                                      }}
                                      checked={selectedDocumentIds.includes(doc.id)}
                                      aria-label={`Sélectionner ${doc.name}`}
                                  />
                               </div>

                              <div className="flex-1 overflow-hidden">
                                <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                                <div className="flex items-center gap-2">
                                    <p className={cn("text-xs font-medium truncate", getStatusInfo(doc.status).color)}>{getStatusInfo(doc.status).label}</p>
                                    {doc.isExported && (
                                        <Badge variant="outline" className="h-4 px-1 bg-blue-500/10 text-blue-500 border-none text-[8px] font-black uppercase">Exporté</Badge>
                                    )}
                                    {doc.status === 'duplicate' && (
                                        <Badge variant="outline" className="h-4 px-1 bg-amber-500/10 text-amber-500 border-none text-[8px] font-black uppercase">Doublon</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(doc.uploadDate), { addSuffix: true, locale: fr })}</p>
                              </div>

                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetActiveDocument(doc)}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Voir le détail</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          ))}
                        </div>
                    </div>
                  )
                })
            )}
            {filteredDocuments.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <FileClock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Aucun document trouvé</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aucun document ne correspond à vos critères de recherche actuels.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  const DocumentPreviewAndForm = ({ inSheet = false }: { inSheet?: boolean }) => {
    const Wrapper = inSheet ? 'div' : Tabs;
    const wrapperProps = inSheet ? {} : { defaultValue: "preview", className: "w-full h-full flex flex-col" };
    const ContentWrapper = inSheet ? 'div' : TabsContent;

    if (!selectedClientId) return null;

    if (!activeDocument) {
        return (
            <div className="h-full flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center">
                    <FileClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Sélectionnez un document</h3>
                    <p className="text-sm text-muted-foreground mt-1">Cliquez sur un document dans la liste pour le visualiser et le traiter.</p>
                </div>
            </div>
        )
    }

    return (
        <Wrapper {...wrapperProps}>
            <div className={cn("px-4 pt-4", inSheet && "px-0 pt-0")}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preview">Aperçu</TabsTrigger>
                    <TabsTrigger value="validation">Validation & Données</TabsTrigger>
                </TabsList>
            </div>
            <ContentWrapper value="preview" className="flex-1 mt-0 relative">
                 <div className="relative bg-muted/30 h-full overflow-hidden rounded-b-lg border m-4 mt-0">
                    <PreviewControls />
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                        {activeDocument.dataUrl ? (
                            <iframe 
                                src={activeDocument.dataUrl} 
                                className="w-full h-full border-0 transition-transform duration-300"
                                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`}}
                                title="Aperçu du document" 
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4"/>
                                <p>Chargement de l'aperçu...</p>
                            </div>
                        )}
                    </div>
                </div>
            </ContentWrapper>
            <ContentWrapper value="validation" className="flex-1 mt-0 overflow-y-auto">
                 <DataValidationForm
                    key={activeDocument.id}
                    document={activeDocument}
                    onUpdate={handleUpdateDocumentData}
                    isLoading={isProcessing || activeDocument.status === 'processing'}
                    onAddComment={handleAddComment}
                    onUpdateDocumentInList={updateLocalDocument}
                />
            </ContentWrapper>
        </Wrapper>
    );
  }
  
  const getSheetStatusInfo = () => {
    if (!activeDocument) return null;
    const { icon: Icon, label, color } = getStatusInfo(activeDocument.status);
    return (
        <div className={cn("flex items-center gap-1.5 text-xs", color)}>
            <Icon className="h-3 w-3" />
            <span>{label}</span>
        </div>
    );
  };


  const MobileView = () => (
    <div className="md:hidden h-full flex flex-col">
        <div className="p-4 border-b">
             <ClientSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto">
          <DocumentList />
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="w-full h-[90%] p-0 flex flex-col" side="bottom">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="truncate">{activeDocument?.name}</SheetTitle>
                    <SheetDescription asChild>
                        <div className="text-sm text-muted-foreground flex items-center gap-x-3">
                          {getSheetStatusInfo()}
                          {activeDocument && <span className='text-muted-foreground'>- {formatDistanceToNow(new Date(activeDocument.uploadDate), { addSuffix: true, locale: fr })}</span>}
                        </div>
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    {activeDocument && <DocumentPreviewAndForm inSheet={true} />}
                </div>
            </SheetContent>
        </Sheet>
    </div>
  );

  const DesktopView = () => (
     <ResizablePanelGroup direction="horizontal" className="hidden md:flex flex-1 w-full rounded-lg">
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <ClientSwitcher />
            </div>
            <div className="flex-1 min-h-0">
               <DocumentList />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={40}>
            <DocumentPreviewAndForm />
        </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex-1 min-h-0">
            <MobileView />
            <DesktopView />
        </div>
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        selectedDocIds={selectedDocumentIds}
        onSuccess={() => {
            setSelectedDocumentIds([]);
            setIsExportModalOpen(false);
        }}
      />
    </div>
  );
}
