

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useBranding } from '@/components/branding-provider';
import { DataValidationForm } from '@/components/data-validation-form';
import { type ExtractDataOutput } from '@/services/document-ai-service';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Check, Send, Trash2, Download, FileUp, ZoomIn, ZoomOut, RotateCw, RefreshCw, FilterX, Loader2, Play, Eye, FileClock, CheckCircle, FileWarning, ShieldCheck, Search, X, Folder, FolderOpen, ChevronRight, Calendar, ArrowLeft, FileText } from 'lucide-react';
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
import { collection, doc, query, where, writeBatch, increment, updateDoc, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
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
import { pafLogger } from '@/services/paf-logger';



const getCurrentUser = () => localStorage.getItem('userName') || 'Utilisateur Démo';

const getDocCategory = (doc: Document): 'achats' | 'ventes' | 'banque' | 'divers' => {
  const type = (doc.type || (doc.extractedData as any)?.documentType || '').toLowerCase();
  if (type.includes('purchase') || type.includes('receipt') || type.includes('achat') || type.includes('ticket') || type.includes('reçu')) {
    return 'achats';
  }
  if (type.includes('sales') || type.includes('vente')) {
    return 'ventes';
  }
  if (type.includes('bank') || type.includes('statement') || type.includes('relevé') || type.includes('banque')) {
    return 'banque';
  }
  return 'divers';
};

const getDocDateInfo = (doc: Document): { year: string; monthIndex: number; monthName: string } => {
  const dateStr = doc.extractedData?.dates?.[0] || doc.uploadDate;
  const date = parseDate(dateStr) || new Date();
  const year = date.getFullYear().toString();
  const monthIndex = date.getMonth();
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return {
    year,
    monthIndex,
    monthName: months[monthIndex],
  };
};

const categoryInfo = {
  achats: { label: "Factures d'Achat", color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/10" },
  ventes: { label: "Factures de Vente", color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/10" },
  banque: { label: "Relevés Bancaires", color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10" },
  divers: { label: "Divers & Secrétariat", color: "from-slate-500/10 to-zinc-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/10" }
};

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

const statusIndicatorColors: Record<string, string> = {
  reviewing: 'bg-amber-500',
  pending: 'bg-slate-400 dark:bg-slate-600',
  processing: 'bg-blue-500',
  approved: 'bg-emerald-500',
  duplicate: 'bg-orange-500',
  error: 'bg-red-500',
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
  const [selectedCategory, setSelectedCategory] = useState<'achats' | 'ventes' | 'banque' | 'divers' | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
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

  useEffect(() => {
    setSelectedCategory(null);
    setSelectedYear(null);
    setSelectedMonth(null);
  }, [selectedClientId]);


  const createNotification = async (docObj: Document, message: string) => {
    const newNotification = {
      clientId: docObj.clientId,
      cabinetId: docObj.cabinetId,
      documentId: docObj.id,
      documentName: docObj.name,
      message,
      date: new Date().toISOString(),
      isRead: false
    };

    try {
      await addDoc(collection(db, 'notifications'), newNotification);
    } catch (error) {
      console.warn("Could not save notification to Firestore", error);
      const localNotification: Notification = {
        ...newNotification,
        id: crypto.randomUUID()
      };
      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]') as Notification[];
      localStorage.setItem('notifications', JSON.stringify([localNotification, ...existingNotifications]));
      window.dispatchEvent(new Event('storage')); // Notify header
    }
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

    const docData = docSnap.data();
    if (docData?.isLocked || docData?.isExported || docData?.status === 'exported') {
        toast({ variant: "destructive", title: "Opération impossible", description: "Ce document est verrouillé car il a déjà été exporté." });
        return;
    }

    const clientId = docSnap.data()!.clientId;
    const actorName = getCurrentUser();
    const actorEmail = userProfile?.email || localStorage.getItem('userEmail') || 'unknown@paf.ai';
    const oldData = docData?.extractedData || {};

    await pafLogger.logFormDifferences(
      docId,
      docData?.name || 'Document',
      { name: actorName, email: actorEmail },
      oldData,
      updatedData
    );

    const trail = await addAuditEvent(docId, 'Document approuvé manuellement', actorName);
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
    
    // Notify the client about the new comment
    createNotification(activeDocument, `a reçu un nouveau commentaire de l'expert-comptable : "${commentText.substring(0, 30)}..."`);
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

  const binderTree = useMemo(() => {
    const tree: {
      [cat: string]: {
        [year: string]: {
          [month: string]: {
            monthIndex: number;
            docs: Document[];
          }
        }
      }
    } = {
      achats: {},
      ventes: {},
      banque: {},
      divers: {}
    };

    filteredDocuments.forEach(doc => {
      const cat = getDocCategory(doc);
      const { year, monthIndex, monthName } = getDocDateInfo(doc);

      if (!tree[cat][year]) {
        tree[cat][year] = {};
      }
      if (!tree[cat][year][monthName]) {
        tree[cat][year][monthName] = { monthIndex, docs: [] };
      }
      tree[cat][year][monthName].docs.push(doc);
    });

    return tree;
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
    return null;
  };

  const Breadcrumbs = () => {
    const isAtRoot = !selectedCategory;
    
    const handleBack = () => {
      if (selectedMonth) {
        setSelectedMonth(null);
      } else if (selectedYear) {
        setSelectedYear(null);
      } else if (selectedCategory) {
        setSelectedCategory(null);
      }
    };

    return (
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80 pl-1 py-1">
        {!isAtRoot && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-7 w-7 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-all duration-200 shrink-0"
            title="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/30 dark:bg-slate-900/30 px-3 py-1.5 rounded-xl border border-border/40 text-xs font-semibold select-none">
          <button 
            onClick={() => { setSelectedCategory(null); setSelectedYear(null); setSelectedMonth(null); }} 
            className="hover:text-foreground transition-colors flex items-center gap-1 text-[11px] font-space uppercase tracking-wider"
          >
            <Folder className="h-3.5 w-3.5 text-muted-foreground/60" />
            Tous
          </button>
          
          {selectedCategory && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <button 
                onClick={() => { setSelectedYear(null); setSelectedMonth(null); }} 
                className="hover:text-foreground transition-colors text-primary flex items-center gap-1 text-[11px] font-space uppercase tracking-wider"
              >
                {categoryInfo[selectedCategory].label}
              </button>
            </>
          )}
          
          {selectedYear && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <button 
                onClick={() => { setSelectedMonth(null); }} 
                className="hover:text-foreground transition-colors text-primary flex items-center gap-1 text-[11px] font-space uppercase tracking-wider"
              >
                {selectedYear}
              </button>
            </>
          )}
          
          {selectedMonth && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <span className="text-foreground flex items-center gap-1 text-[11px] font-space uppercase tracking-wider">{selectedMonth}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  const EmptyFolderState = ({ message }: { message: string }) => (
    <div className="text-center py-16 space-y-4 border border-dashed border-white/5 rounded-3xl bg-white/5 dark:bg-[#0a0f1d]/10 max-w-lg mx-auto w-full">
      <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mx-auto opacity-30">
          <Folder className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1 px-4">
          <h3 className="font-space font-black uppercase text-xs tracking-widest opacity-40">Dossier Vide</h3>
          <p className="text-xs text-muted-foreground">
            {message}
          </p>
      </div>
    </div>
  );

  const FlatDocumentList = ({ docs }: { docs: Document[] }) => {
    return (
      <div className="space-y-2.5 w-full">
        <AnimatePresence mode="popLayout">
          {docs.map((doc, idx) => (
             <motion.div
               key={doc.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.98 }}
               transition={{ delay: idx * 0.02, duration: 0.2 }}
               onClick={() => handleSetActiveDocument(doc)}
               className={cn(
                 'relative overflow-hidden w-full text-left p-4 pl-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 cursor-pointer bg-white/5 dark:bg-[#0f172a]/20 hover:bg-white/10 dark:hover:bg-[#0f172a]/40 hover:scale-[1.01] hover:shadow-md premium-shadow-sm'
               )}
             >
                {/* Visual Status Indicator Strip */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", statusIndicatorColors[doc.status] || "bg-muted")} />

                {/* Column 1: Identity (45%) */}
                <div className="flex items-center gap-4 flex-1 md:flex-[0.45] min-w-0">
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      onCheckedChange={(checked) => {
                        setSelectedDocumentIds(prev => 
                          checked ? [...prev, doc.id] : prev.filter(id => id !== doc.id)
                        );
                      }}
                      checked={selectedDocumentIds.includes(doc.id)}
                      aria-label={`Sélectionner ${doc.name}`}
                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4.5 w-4.5 rounded"
                    />
                  </div>
                  
                  <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                     <p className="font-black text-sm text-foreground truncate" title={doc.extractedData?.vendorNames?.[0] || doc.name}>
                         {doc.extractedData?.vendorNames?.[0] || doc.name}
                     </p>
                     <p className="text-[10px] text-muted-foreground font-medium truncate" title={doc.name}>
                         {doc.name}
                     </p>
                  </div>
                </div>

                {/* Column 2: Metrics (25%) */}
                <div className="flex flex-col items-start md:items-center justify-center w-full md:w-[25%] shrink-0">
                   <div className="text-left md:text-center space-y-0.5">
                     {doc.extractedData?.amounts?.[0] != null ? (
                       <p className="font-space font-black text-xs text-foreground tabular-nums bg-white/5 px-2.5 py-0.5 rounded-lg inline-block">
                           {doc.extractedData.amounts[0].toFixed(2)} €
                       </p>
                     ) : (
                       <p className="text-xs text-muted-foreground">-</p>
                     )}
                     <p className="text-[9px] opacity-40 font-medium block">
                       {formatDistanceToNow(parseDate(doc.uploadDate) || new Date(), { addSuffix: true, locale: fr })}
                     </p>
                   </div>
                </div>

                {/* Column 3: Statuses (25%) */}
                <div className="flex items-center gap-2 w-full md:w-[25%] md:justify-center shrink-0">
                    <Badge variant="outline" className={cn(
                      "h-5 px-2 text-[9px] font-space font-bold uppercase tracking-wider border-none rounded-lg",
                      getStatusInfo(doc.status).color.includes('green') ? "bg-emerald-500/10 text-emerald-500" :
                      getStatusInfo(doc.status).color.includes('yellow') ? "bg-amber-500/10 text-amber-500" :
                      getStatusInfo(doc.status).color.includes('red') ? "bg-red-500/10 text-red-500" :
                      "bg-white/5 text-muted-foreground"
                    )}>
                        {getStatusInfo(doc.status).label}
                    </Badge>
                    {doc.isExported && (
                        <Badge variant="outline" className="h-5 px-2 bg-blue-500/10 text-blue-500 border-none text-[9px] font-space font-bold uppercase tracking-wider rounded-lg">Exporté</Badge>
                    )}
                    {doc.status === 'duplicate' && (
                        <Badge variant="outline" className="h-5 px-2 bg-rose-500/10 text-rose-500 border-none text-[9px] font-space font-bold uppercase tracking-wider rounded-lg">Doublon</Badge>
                    )}
                </div>

                {/* Column 4: Chevron (5%) */}
                <div className="hidden md:block w-[5%] text-right shrink-0" onClick={(e) => e.stopPropagation()}>
                   <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => handleSetActiveDocument(doc)}>
                     <ChevronRight className="h-4 w-4" />
                   </Button>
                </div>
             </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const BinderExplorer = () => {
    if (!selectedClientId) {
      return (
        <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-3xl p-12 bg-white/5 dark:bg-[#0a0f1d]/5 min-h-[300px] w-full">
          <div className="text-center space-y-4 max-w-sm">
            <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mx-auto opacity-40">
                <FileUp className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <h3 className="font-space font-black uppercase text-xs tracking-widest opacity-40">Aucun client sélectionné</h3>
                <p className="text-xs text-muted-foreground">
                  Veuillez sélectionner un client dans le sélecteur pour consulter son classeur de documents.
                </p>
            </div>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      );
    }

    // Flat list view if user is searching/filtering
    const isSearchingOrFiltering = localSearchQuery.trim() !== '' || localStatusFilter !== 'all';
    if (isSearchingOrFiltering) {
      return (
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 pl-1">
              Résultats de recherche ({filteredDocuments.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setLocalSearchQuery(''); setLocalStatusFilter('all'); }} className="h-7 px-2.5 rounded-lg text-[9px] font-space font-black uppercase tracking-wider text-rose-500">
               Effacer
            </Button>
          </div>
          <FlatDocumentList docs={filteredDocuments} />
        </div>
      );
    }

    // Level 1: Categories
    if (!selectedCategory) {
      const getCatPendingCount = (cat: 'achats' | 'ventes' | 'banque' | 'divers') => {
        let count = 0;
        const catTree = binderTree[cat] || {};
        Object.values(catTree).forEach(yearTree => {
          Object.values(yearTree).forEach(monthTree => {
            count += monthTree.docs.filter(d => ['pending', 'reviewing', 'error'].includes(d.status)).length;
          });
        });
        return count;
      };

      const getCatTotalCount = (cat: 'achats' | 'ventes' | 'banque' | 'divers') => {
        let count = 0;
        const catTree = binderTree[cat] || {};
        Object.values(catTree).forEach(yearTree => {
          Object.values(yearTree).forEach(monthTree => {
            count += monthTree.docs.length;
          });
        });
        return count;
      };

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {(Object.keys(categoryInfo) as Array<'achats' | 'ventes' | 'banque' | 'divers'>).map((cat) => {
            const info = categoryInfo[cat];
            const total = getCatTotalCount(cat);
            const pending = getCatPendingCount(cat);
            return (
              <Card 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="relative cursor-pointer overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-white/10 dark:from-[#0f172a]/20 dark:to-[#0f172a]/40 backdrop-blur-md rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 premium-shadow-sm group flex flex-col justify-between h-40"
              >
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-2xl bg-gradient-to-br border", info.color)}>
                     <Folder className="h-6 w-6" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-space font-black uppercase text-xs tracking-wider text-foreground">{info.label}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                    <span>{total} fichiers</span>
                    {pending > 0 && (
                       <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                         {pending} à traiter
                       </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      );
    }

    // Level 2: Years
    if (!selectedYear) {
      const years = Object.keys(binderTree[selectedCategory] || {}).sort((a,b) => b.localeCompare(a));
      
      const getYearTotalCount = (year: string) => {
        let count = 0;
        const yearTree = binderTree[selectedCategory][year] || {};
        Object.values(yearTree).forEach(monthTree => {
          count += monthTree.docs.length;
        });
        return count;
      };

      if (years.length === 0) {
        return <EmptyFolderState message={`Aucun fichier dans la catégorie ${categoryInfo[selectedCategory].label}.`} />;
      }

      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full">
          {years.map(year => {
            const total = getYearTotalCount(year);
            return (
              <Card
                key={year}
                onClick={() => setSelectedYear(year)}
                className="cursor-pointer border border-white/5 bg-white/5 hover:bg-white/10 p-5 rounded-2xl flex flex-col items-center justify-center space-y-3 transition-all text-center hover:scale-[1.02] premium-shadow-sm h-36"
              >
                <Folder className="h-8 w-8 text-primary/70" />
                <div>
                  <h4 className="font-space font-black text-sm text-foreground">{year}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{total} fichiers</p>
                </div>
              </Card>
            );
          })}
        </div>
      );
    }

    // Level 3: Months
    if (!selectedMonth) {
      const months = Object.keys(binderTree[selectedCategory][selectedYear] || {}).sort((a,b) => {
        const mInfo = binderTree[selectedCategory][selectedYear];
        return mInfo[b].monthIndex - mInfo[a].monthIndex;
      });

      if (months.length === 0) {
        return <EmptyFolderState message={`Aucun fichier en ${selectedYear}.`} />;
      }

      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full">
          {months.map(monthName => {
            const total = binderTree[selectedCategory][selectedYear][monthName].docs.length;
            return (
              <Card
                key={monthName}
                onClick={() => setSelectedMonth(monthName)}
                className="cursor-pointer border border-white/5 bg-white/5 hover:bg-white/10 p-5 rounded-2xl flex flex-col items-center justify-center space-y-3 transition-all text-center hover:scale-[1.02] premium-shadow-sm h-36"
              >
                <Folder className="h-8 w-8 text-primary/70" />
                <div>
                  <h4 className="font-space font-black text-sm text-foreground">{monthName}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{total} fichiers</p>
                </div>
              </Card>
            );
          })}
        </div>
      );
    }

    // Level 4: Documents list inside month folder
    const docs = binderTree[selectedCategory][selectedYear]?.[selectedMonth]?.docs || [];
    if (docs.length === 0) {
      return <EmptyFolderState message="Dossier vide." />;
    }

    return (
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between">
           <h3 className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 pl-1">
             Documents ({docs.length})
           </h3>
        </div>
        <FlatDocumentList docs={docs} />
      </div>
    );
  };

  const DocumentPreviewAndForm = () => {
    if (!activeDocument) return null;
    
    return (
      <div className="h-full flex flex-col md:flex-row overflow-hidden bg-background">
        {/* Left Side: Document Preview */}
        <div className="flex-1 flex flex-col border-r border-border relative min-w-0 h-[40%] md:h-full bg-muted/20">
          <PreviewControls />
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
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
        
        {/* Right Side: Metadata Validation Form */}
        <div className="w-full md:w-[480px] shrink-0 h-[60%] md:h-full flex flex-col overflow-hidden border-l border-border bg-card text-card-foreground">
          <DataValidationForm
            key={activeDocument.id}
            document={activeDocument}
            onUpdate={handleUpdateDocumentData}
            isLoading={isProcessing || activeDocument.status === 'processing'}
            onAddComment={handleAddComment}
            onUpdateDocumentInList={updateLocalDocument}
          />
        </div>
      </div>
    );
  };

  const getSheetStatusInfo = () => {
    if (!activeDocument) return null;
    const { icon: Icon, label, color } = getStatusInfo(activeDocument.status);
    return (
        <div className={cn("flex items-center gap-1.5 text-xs font-semibold", color)}>
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
        </div>
    );
  };

  const MobileView = () => (
    <div className="md:hidden h-full flex flex-col">
        <div className="p-4 border-b border-white/5 bg-white/5">
             <ClientSwitcher />
        </div>
        {selectedClientId && (
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/5 dark:bg-[#0f172a]/10">
              <Breadcrumbs />
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          <BinderExplorer />
        </div>
    </div>
  );

  const DesktopView = () => (
     <div className="hidden md:flex flex-col flex-1 w-full rounded-[2rem] border border-white/5 bg-white/5 dark:bg-[#020617]/20 backdrop-blur-md premium-shadow-lg overflow-hidden h-full">
        {/* Top Header Row with Title and ClientSwitcher */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div>
                  <h2 className="text-lg font-space font-black uppercase tracking-wider text-foreground">Classeur Documents</h2>
                  <p className="text-xs text-muted-foreground">Organisation par dossiers de catégories comptables, années et mois.</p>
               </div>
               <div className="h-8 w-px bg-white/10 shrink-0" />
               <ClientSwitcher />
            </div>
        </div>

        {/* Search & Status Filters Bar (Full Width Row) */}
        {selectedClientId && (
          <div className="px-6 py-3 border-b border-white/5 bg-[#fafbfe]/30 dark:bg-[#0b0f19]/30 flex items-center justify-between gap-4">
             {/* Breadcrumbs (Left) */}
             <div className="flex-1 min-w-0">
                <Breadcrumbs />
             </div>

             {/* Unified Search & Filters panel (Right) */}
             <div className="flex items-center gap-3 bg-muted/40 dark:bg-slate-900/40 border border-border/50 rounded-2xl p-1.5 premium-shadow-sm shrink-0">
               {/* Search Input */}
               <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-60" />
                 <Input
                   placeholder="Rechercher..."
                   value={localSearchQuery}
                   onChange={(e) => setLocalSearchQuery(e.target.value)}
                   className="pl-8 pr-8 bg-transparent border-none h-8 text-xs rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/60 w-full"
                 />
                 {localSearchQuery && (
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => setLocalSearchQuery('')}
                     className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                   >
                     <X className="h-3 w-3" />
                   </Button>
                 )}
               </div>

               <div className="h-4 w-px bg-border/50" />

               {/* Status Filters */}
               <div className="flex items-center gap-1">
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
                         "px-2.5 py-1 rounded-xl text-[10px] font-semibold tracking-wide whitespace-nowrap transition-all duration-200 border border-transparent select-none",
                         isActive
                           ? "bg-primary text-primary-foreground shadow-sm"
                           : "bg-transparent hover:bg-white/10 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground"
                       )}
                     >
                       {pill.label}
                     </button>
                   );
                 })}
               </div>
             </div>
          </div>
        )}

        {/* Main Cabinet Folder View */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fafbfe]/10 dark:bg-[#0b0f19]/10">
            <BinderExplorer />
        </div>
     </div>
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
      <Sheet open={!!activeDocument} onOpenChange={(open) => !open && handleSetActiveDocument(null)}>
          <SheetContent className="w-[95vw] md:w-[85vw] sm:max-w-none max-w-[85vw] md:max-w-7xl h-full p-0 flex flex-col border-l border-border bg-background text-foreground" side="right">
              <SheetHeader className="p-4 border-b border-border shrink-0 flex flex-row items-center justify-between bg-card text-card-foreground">
                  <div className="min-w-0 flex-1">
                      <SheetTitle className="truncate text-base">{activeDocument?.name}</SheetTitle>
                      <SheetDescription asChild>
                          <div className="text-xs text-muted-foreground flex items-center gap-x-3 mt-1">
                            {getSheetStatusInfo()}
                            {activeDocument && <span className='text-muted-foreground'>- {formatDistanceToNow(parseDate(activeDocument.uploadDate) || new Date(), { addSuffix: true, locale: fr })}</span>}
                          </div>
                      </SheetDescription>
                  </div>
              </SheetHeader>
              <div className="flex-1 min-h-0">
                  {activeDocument && <DocumentPreviewAndForm />}
              </div>
          </SheetContent>
      </Sheet>
    </div>
  );
}
