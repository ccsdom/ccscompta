

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useBranding } from '@/components/branding-provider';
import { DataValidationForm } from '@/components/data-validation-form';
import { type ExtractDataOutput } from '@/services/document-ai-service';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Check, Send, Trash2, Download, FileUp, ZoomIn, ZoomOut, RotateCw, RefreshCw, FilterX, Loader2, Play, Eye, FileClock, CheckCircle, FileWarning, ShieldCheck, Search, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IntelligentSearchOutput } from '@/services/intelligent-search-service';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Comment, AuditEvent, Notification, Document, Client, UserProfile } from '@/lib/types';
import Papa from 'papaparse';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn, parseDate } from '@/lib/utils';
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
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { createInvoiceForDocument } from '@/services/invoice-service';
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

const statusBorderColors: Record<string, string> = {
  reviewing: 'border-l-[3px] border-l-amber-500',
  pending: 'border-l-[3px] border-l-slate-400 dark:border-l-slate-600',
  processing: 'border-l-[3px] border-l-blue-500',
  approved: 'border-l-[3px] border-l-emerald-500',
  duplicate: 'border-l-[3px] border-l-orange-500',
  error: 'border-l-[3px] border-l-red-500',
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
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState<'all' | 'reviewing' | 'pending' | 'approved' | 'error'>('all');
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { storage } = useFirebase();

  const { profile: userProfile, role: userRole } = useBranding();

  // Explicit block for Super Admin to force impersonation
  if (false && userRole === 'admin') {
      /*
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
      */
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
    
    // Security: Ensure cabinetId matches
    if (userProfile?.cabinetId && docSnap.data()?.cabinetId !== userProfile.cabinetId) {
        toast({ variant: "destructive", title: "Accès refusé", description: "Vous n'avez pas les droits pour modifier ce document." });
        return;
    }
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
    if (!commentText.trim() || !activeDocument || !userProfile?.cabinetId) return;
    const docId = activeDocument.id;
    
    // Security: Ensure cabinetId matches
    if (activeDocument.cabinetId !== userProfile.cabinetId) {
        toast({ variant: "destructive", title: "Accès refusé" });
        return;
    }
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
        
        if (localStatusFilter !== 'all') {
            if (localStatusFilter === 'pending') {
                docs = docs.filter(d => ['pending', 'processing'].includes(d.status));
            } else {
                docs = docs.filter(d => d.status === localStatusFilter);
            }
        }

        if (localSearchQuery.trim()) {
            const queryVal = localSearchQuery.toLowerCase().trim();
            docs = docs.filter(doc => 
                doc.name.toLowerCase().includes(queryVal) ||
                (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(vendor => vendor != null && vendor.toLowerCase().includes(queryVal))) ||
                (doc.extractedData?.amounts && doc.extractedData.amounts.some(amount => amount != null && amount.toString().includes(queryVal)))
            );
        }
        
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
  }, [documents, searchQuery, searchCriteria, dashboardFilter, localSearchQuery, localStatusFilter]);

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

  // Explicit block for Super Admin to force impersonation
  if (userRole === 'admin') {
      return (
           <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
              <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
                  <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="h-10 w-10 text-red-500" />
                  </div>
                  <h2 className="text-3xl font-black font-space tracking-tight mb-4 text-foreground">Zone Interdite</h2>
                  <p className="text-muted-foreground mb-8 text-lg font-medium">L'acces direct aux documents est restreint pour le Super Admin. Veuillez impersonner un cabinet pour acceder a ses documents.</p>
                  <Button onClick={() => router.push('/dashboard/cabinets')} className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                      Aller a la Gestion Cabinets
                  </Button>
              </Card>
          </div>
      )
  }

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
        <div className="flex items-center space-x-2 bg-primary/5 border border-primary/10 p-3 rounded-2xl text-xs mx-4 premium-shadow-sm">
            <span className="font-space font-black uppercase text-[10px] tracking-widest text-primary pl-1">{filterText}</span>
            <div className="flex-grow" />
             <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 rounded-xl font-space font-black uppercase text-[9px] tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                <FilterX className="mr-2 h-3.5 w-3.5" />
                Effacer
             </Button>
        </div>
    )
 };

  const BulkActionsToolbar = () => (
    <div className="flex items-center space-x-3 bg-primary/5 border border-primary/10 p-3 rounded-2xl mx-4 premium-shadow-sm">
        <Badge className="bg-primary text-primary-foreground border-none font-space font-black text-[10px] px-2.5 py-1 rounded-lg">
            {selectedDocumentIds.length} sélectionné(s)
        </Badge>
        <div className="flex-grow" />
        <Button variant="outline" size="sm" onClick={handleBulkApprove} className="h-8 px-3 rounded-xl bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/20 hover:text-primary font-space font-black uppercase text-[9px] tracking-widest transition-all">
            <Check className="h-3.5 w-3.5 mr-1" />
            Approuver
        </Button>
        <Button variant="outline" size="sm" onClick={handleBulkExport} className="h-8 px-3 rounded-xl bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/20 hover:text-primary font-space font-black uppercase text-[9px] tracking-widest transition-all">
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
        </Button>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-space font-black uppercase text-[9px] tracking-widest transition-all">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Supprimer
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-panel border-white/10 shadow-2xl rounded-[2rem] p-8">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black font-space">Confirmation Requise</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium">
                        Cette action est irréversible. Les documents sélectionnés seront définitivement supprimés.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 gap-2">
                    <AlertDialogCancel className="h-11 px-6 rounded-xl border-white/10 font-space font-black uppercase text-[10px] tracking-widest">Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="h-11 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 font-space font-black uppercase text-[10px] tracking-widest border-none">Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
  
  const PreviewControls = () => (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-background/60 backdrop-blur-md p-1.5 rounded-xl border border-white/5 premium-shadow-sm">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10 text-foreground" onClick={() => setZoom(z => z * 1.2)}>
                        <ZoomIn className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Zoom avant</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10 text-foreground" onClick={() => setZoom(z => z / 1.2)}>
                        <ZoomOut className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Zoom arrière</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10 text-foreground" onClick={() => setRotation(r => r + 90)}>
                        <RotateCw className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Pivoter</p></TooltipContent>
            </Tooltip>
            {activeDocument?.id && (activeDocument.status === 'pending' || activeDocument.status === 'error') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10 text-primary" onClick={() => handleReprocessDocument(activeDocument.id)} disabled={isProcessing}>
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
        <div className="h-full flex items-center justify-center bg-white/5 dark:bg-[#0a0f1d]/20 rounded-3xl m-4 border border-dashed border-white/10">
          <div className="text-center space-y-4 max-w-sm p-8">
            <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mx-auto opacity-40">
                <FileUp className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <h3 className="font-space font-black uppercase text-xs tracking-widest opacity-40">Aucun client sélectionné</h3>
                <p className="text-xs text-muted-foreground">
                  Veuillez sélectionner un client dans le sélecteur ci-dessus pour consulter son flux de documents.
                </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full bg-[#fafbfe]/30 dark:bg-[#0b0f19]/30">
        <div className="shrink-0 p-4 pb-3 border-b border-white/5 space-y-3 bg-white/5 dark:bg-[#0f172a]/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-60" />
            <Input
              placeholder="Rechercher dans ce client..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-9 pr-8 bg-white/5 border-none h-9 text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50 text-foreground placeholder:text-muted-foreground/60"
            />
            {localSearchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocalSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'reviewing', label: 'À examiner' },
              { id: 'pending', label: 'En cours' },
              { id: 'approved', label: 'Approuvés' },
              { id: 'error', label: 'Erreurs' },
            ].map((pill) => {
              const isActive = localStatusFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setLocalStatusFilter(pill.id as any)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-space font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 border border-transparent select-none",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 pt-2">
          <FilterDisplay />
          {selectedDocumentIds.length > 0 && <div className="mt-2"><BulkActionsToolbar /></div>}
        </div>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
            ) : (
                documentGroups.map(group => {
                  const docsInGroup = groupedDocuments[group.status];
                  if (docsInGroup.length === 0) return null;
                  
                  const { icon: Icon, color } = getStatusInfo(group.status);

                  return (
                    <div key={group.status} className="space-y-2">
                      <h3 className="text-[9px] font-space font-black uppercase tracking-widest flex items-center gap-2 mb-1.5 px-1 text-muted-foreground/60">
                        <Icon className={cn("h-3.5 w-3.5", color)} />
                        {group.label}
                        <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded-md font-mono">({docsInGroup.length})</span>
                      </h3>
                      <div className="space-y-2">
                          <AnimatePresence mode="popLayout">
                          {docsInGroup.map((doc, idx) => (
                             <motion.div
                               key={doc.id}
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               exit={{ opacity: 0, scale: 0.95 }}
                               transition={{ delay: idx * 0.03, duration: 0.2 }}
                               onClick={() => handleSetActiveDocument(doc)}
                               className={cn(
                                 'w-full text-left p-3 rounded-xl border flex items-start gap-3.5 transition-all duration-300 cursor-pointer premium-shadow-sm',
                                 statusBorderColors[doc.status] || 'border-l-transparent',
                                 activeDocument?.id === doc.id 
                                   ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 text-foreground ring-1 ring-primary/10' 
                                   : 'bg-white/5 dark:bg-[#0f172a]/20 border-white/5 hover:bg-white/10 dark:hover:bg-[#0f172a]/40 text-muted-foreground hover:text-foreground'
                               )}
                            >
                               <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                                 <Checkbox
                                      onCheckedChange={(checked) => {
                                        setSelectedDocumentIds(prev => 
                                          checked ? [...prev, doc.id] : prev.filter(id => id !== doc.id)
                                        );
                                      }}
                                      checked={selectedDocumentIds.includes(doc.id)}
                                      aria-label={`Sélectionner ${doc.name}`}
                                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 rounded"
                                  />
                               </div>

                              <div className="flex-1 overflow-hidden space-y-1">
                                 <div className="flex items-start justify-between gap-2">
                                     <p className={cn(
                                       "font-black text-sm truncate flex-1",
                                       activeDocument?.id === doc.id ? "text-primary" : "text-foreground"
                                     )} title={doc.extractedData?.vendorNames?.[0] || doc.name}>
                                         {doc.extractedData?.vendorNames?.[0] || doc.name}
                                     </p>
                                     {doc.extractedData?.amounts?.[0] != null && (
                                         <p className="font-space font-black text-[10px] text-foreground tabular-nums shrink-0 bg-white/5 px-2 py-0.5 rounded-md">
                                             {doc.extractedData.amounts[0].toFixed(2)} €
                                         </p>
                                     )}
                                 </div>
                                 
                                 {doc.extractedData?.vendorNames?.[0] && (
                                     <p className="text-[10px] text-muted-foreground font-medium truncate" title={doc.name}>
                                         Fichier : {doc.name}
                                     </p>
                                 )}

                                 <div className="flex items-center flex-wrap gap-2 pt-0.5">
                                     <Badge variant="outline" className={cn(
                                       "h-5 px-2 text-[9px] font-space font-bold uppercase tracking-wider border-none",
                                       getStatusInfo(doc.status).color.includes('green') ? "bg-emerald-500/10 text-emerald-500" :
                                       getStatusInfo(doc.status).color.includes('yellow') ? "bg-amber-500/10 text-amber-500" :
                                       getStatusInfo(doc.status).color.includes('red') ? "bg-red-500/10 text-red-500" :
                                       "bg-white/5 text-muted-foreground"
                                     )}>
                                         {getStatusInfo(doc.status).label}
                                     </Badge>
                                     
                                     {doc.isExported && (
                                         <Badge variant="outline" className="h-5 px-2 bg-blue-500/10 text-blue-500 border-none text-[9px] font-space font-bold uppercase tracking-wider">Exporté</Badge>
                                     )}
                                     {doc.status === 'duplicate' && (
                                         <Badge variant="outline" className="h-5 px-2 bg-rose-500/10 text-rose-500 border-none text-[9px] font-space font-bold uppercase tracking-wider">Doublon</Badge>
                                     )}
                                 </div>
                                 <p className="text-[9px] opacity-40 font-medium">
                                     {formatDistanceToNow(parseDate(doc.uploadDate) || new Date(), { addSuffix: true, locale: fr })}
                                 </p>
                              </div>

                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10 rounded-lg" onClick={() => handleSetActiveDocument(doc)}>
                                        <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Voir le détail</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </motion.div>
                          ))}
                          </AnimatePresence>
                        </div>
                    </div>
                  )
                })
            )}
            {filteredDocuments.length === 0 && !isLoading && (
              <div className="text-center py-20 space-y-4">
                <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mx-auto opacity-30">
                    <FileClock className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-space font-black uppercase text-xs tracking-widest opacity-40">Horizon Vide</h3>
                    <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                      Aucun document ne correspond à vos critères de recherche actuels.
                    </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  const DocumentPreviewAndForm = ({ inSheet = false }: { inSheet?: boolean }) => {
    const Wrapper = Tabs;
    const wrapperProps = { defaultValue: "preview", className: "w-full h-full flex flex-col" };
    const ContentWrapper = TabsContent;

    if (!selectedClientId) return null;

    if (!activeDocument) {
        return (
            <div className="h-full flex items-center justify-center bg-white/5 dark:bg-[#0a0f1d]/20 rounded-3xl m-4 border border-dashed border-white/10">
                <div className="text-center space-y-4 max-w-sm p-8">
                    <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mx-auto opacity-40">
                        <FileClock className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-space font-black uppercase text-xs tracking-widest opacity-40">Sélectionnez un document</h3>
                        <p className="text-xs text-muted-foreground">
                            Cliquez sur un document dans la liste de gauche pour le visualiser et procéder au lettrage ou à la validation.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Wrapper {...wrapperProps}>
            <div className={cn("px-4 pt-4", inSheet && "px-0 pt-0")}>
                <TabsList className="bg-white/5 border-none p-1.5 h-12 rounded-2xl grid grid-cols-2 premium-shadow-sm">
                    <TabsTrigger value="preview" className="rounded-xl font-space font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Aperçu</TabsTrigger>
                    <TabsTrigger value="validation" className="rounded-xl font-space font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Validation & Données</TabsTrigger>
                </TabsList>
            </div>
            <ContentWrapper value="preview" className="flex-1 mt-0 relative h-[calc(100%-4rem)]">
                 <div className="relative bg-white/5 dark:bg-[#0a0f1d]/20 h-full overflow-hidden rounded-3xl border border-white/5 m-4 mt-0 premium-shadow-sm animate-in fade-in duration-300">
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
                          {activeDocument && <span className='text-muted-foreground'>- {formatDistanceToNow(parseDate(activeDocument.uploadDate) || new Date(), { addSuffix: true, locale: fr })}</span>}
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
     <ResizablePanelGroup direction="horizontal" className="hidden md:flex flex-1 w-full rounded-[2rem] border border-white/5 bg-white/5 dark:bg-[#020617]/20 backdrop-blur-md premium-shadow-lg overflow-hidden">
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="flex flex-col h-full bg-[#fafbfe]/30 dark:bg-[#0b0f19]/30 border-r border-white/5">
            <div className="p-4 border-b border-white/5 bg-white/5">
              <ClientSwitcher />
            </div>
            <div className="flex-1 min-h-0">
               <DocumentList />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-white/5 w-1" />
        <ResizablePanel defaultSize={65} minSize={40} className="bg-[#fafbfe]/10 dark:bg-[#0b0f19]/10">
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
