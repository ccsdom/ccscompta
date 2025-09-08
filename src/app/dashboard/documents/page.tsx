
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { DataValidationForm } from '@/components/data-validation-form';
import { DocumentHistory } from '@/components/document-history';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData, type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { validateExtraction } from '@/ai/flows/validate-extraction';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import { storage } from '@/lib/firebase-client';
import { ref, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { getDocuments, addDocument, updateDocument, deleteDocument, getDocumentById, sendDocumentToCegid } from '@/ai/flows/document-actions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button';
import { Check, Send, Trash2, Download, FileUp, ZoomIn, ZoomOut, RotateCw, RefreshCw, FilterX, Loader2, BookCopy, ArrowDownToLine, ArrowUpFromLine, Receipt, Landmark, Folder, FileSignature } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { IntelligentSearchOutput } from '@/ai/flows/intelligent-search-flow';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Comment, AuditEvent, Notification, Document } from '@/lib/types';
import Papa from 'papaparse';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BilanHistory } from '@/components/bilan-history';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


const getCurrentUser = () => localStorage.getItem('userName') || 'Utilisateur Démo';

const TABS_CONFIG = [
    { value: 'achats', label: "Factures d'achat", icon: ArrowDownToLine, types: ['purchase invoice']},
    { value: 'ventes', label: "Factures de vente", icon: ArrowUpFromLine, types: ['sales invoice']},
    { value: 'recus', label: "Reçus", icon: Receipt, types: ['receipt']},
    { value: 'releves', label: "Relevés bancaires", icon: Landmark, types: ['bank statement']},
    { value: 'autres', label: "Autres", icon: Folder, types: ['other', undefined, '']}
]


export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [automationSettings, setAutomationSettings] = useState({ isEnabled: false, confidenceThreshold: 0.95, autoSend: false });
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

   const fetchDocuments = useCallback(async (clientId: string) => {
    setIsLoading(true);
    try {
      const docs = await getDocuments(clientId);
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast({ title: "Erreur de chargement", description: "Impossible de récupérer les documents.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
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
             if (clientId && clientId !== selectedClientId) {
                setSelectedClientId(clientId);
                fetchDocuments(clientId);
                setActiveDocumentId(null);
             } else if (!clientId) {
                setDocuments([]);
                setSelectedClientId(null);
                setActiveDocumentId(null);
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
  }, [selectedClientId, fetchDocuments, searchParams])


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
    const doc = await getDocumentById(docId);
    return [...(doc?.auditTrail || []), event];
  };


  const handleProcessDocument = async (docId: string) => {
    const docToProcess = documents.find(d => d.id === docId) ?? await getDocumentById(docId);
    if (!docToProcess || docToProcess.status === 'processing' || !docToProcess.clientId) return;

    let docWithDataUrl = docToProcess;

    // Ensure dataUrl is present for processing
    if (!docToProcess.dataUrl) {
      try {
        const url = await getDownloadURL(ref(storage, docToProcess.storagePath));
        const response = await fetch(url);
        const blob = await response.blob();
        const dataUrl = await fileToDataUri(new File([blob], docToProcess.name));
        docWithDataUrl = {...docToProcess, dataUrl};
      } catch (e) {
          toast({ variant: "destructive", title: "Erreur de traitement", description: `Impossible de récupérer le contenu de ${docToProcess.name}.` });
          return;
      }
    }
    
    if (!docWithDataUrl.dataUrl) return;

    setIsProcessing(true);
    let trail = await addAuditEvent(docId, 'Traitement IA initié');
    await updateDocument({id: docId, updates: { status: 'processing', auditTrail: trail }});
    setDocuments(docs => docs.map(d => d.id === docId ? {...d, status: 'processing', auditTrail: trail} : d));
    
    try {
      const recognition = await recognizeDocumentType({ documentDataUri: docWithDataUrl.dataUrl });
      trail = await addAuditEvent(docId, `Type reconnu: ${recognition.documentType} (Confiance: ${Math.round(recognition.confidence * 100)}%)`);
      
      const extracted = await extractData({
        documentDataUri: docWithDataUrl.dataUrl,
        documentType: recognition.documentType,
        clientId: docWithDataUrl.clientId
      });

      trail = await addAuditEvent(docId, 'Données extraites par IA');

      let finalUpdates: Partial<Document> = {
          status: 'reviewing',
          extractedData: extracted,
          type: recognition.documentType,
          confidence: recognition.confidence,
          auditTrail: trail
      };

      if (automationSettings.isEnabled && recognition.documentType !== 'bank statement') {
          trail = await addAuditEvent(docId, 'Validation automatique initiée');
          const validation = await validateExtraction({ documentDataUri: docWithDataUrl.dataUrl, extractedData: extracted });
          
          if (validation.isConfident && validation.confidenceScore >= automationSettings.confidenceThreshold) {
              trail = await addAuditEvent(docId, `Validation IA réussie (Confiance: ${Math.round(validation.confidenceScore * 100)}%). Document auto-approuvé.`);
              finalUpdates.status = 'approved';
              toast({ title: "Document auto-approuvé", description: `${docToProcess.name} a été traité et approuvé automatiquement.` });
              createNotification({ ...docToProcess, ...finalUpdates }, 'a été approuvé automatiquement.');

              if (automationSettings.autoSend) {
                // We need to fetch the updated document state before sending
                const updatedDocForSend = await getDocumentById(docId);
                if (updatedDocForSend) await sendDocumentToCegid(docId, 'Système (Auto-envoi)');
              }

          } else {
              trail = await addAuditEvent(docId, `Validation IA requiert une revue (Confiance: ${Math.round(validation.confidenceScore * 100)}%). Raison: ${validation.mismatchReason || 'N/A'}`);
              toast({ title: "Traitement terminé", description: `Données extraites de ${docToProcess.name}. Prêt pour examen.` });
              createNotification({ ...docToProcess, ...finalUpdates }, 'est prêt pour examen.');
          }
      } else {
         toast({ title: "Traitement terminé", description: `Données extraites de ${docToProcess.name}. Prêt pour examen.` });
         createNotification({ ...docToProcess, ...finalUpdates }, 'est prêt pour examen.');
      }

      await updateDocument({ id: docId, updates: finalUpdates });
      const finalDoc = {
        ...docWithDataUrl,
        ...finalUpdates,
        id: docId // ensure id is not lost
      };
      setDocuments(docs => docs.map(d => d.id === docId ? finalDoc : d));
      if(activeDocumentId === docId) {
        handleSetActiveDocument(finalDoc);
      }


    } catch (error) {
      console.error("Error processing document:", error);
      trail = await addAuditEvent(docId, 'Erreur de traitement IA');
      await updateDocument({ id: docId, updates: { status: 'error', auditTrail: trail } });
      setDocuments(docs => docs.map(d => d.id === docId ? {...d, status: 'error', auditTrail: trail} : d));
      toast({ variant: "destructive", title: "Le traitement a échoué", description: `Impossible de traiter ${docToProcess.name}.` });
      createNotification({ ...docToProcess, status: 'error' }, 'a échoué lors du traitement.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUpdateDocumentData = async (docId: string, updatedData: ExtractDataOutput) => {
    const trail = await addAuditEvent(docId, 'Document approuvé manuellement', getCurrentUser());
    const updates = { status: 'approved' as const, extractedData: updatedData, auditTrail: trail };
    await updateDocument({ id: docId, updates });
    const doc = documents.find(d => d.id === docId);
    if(doc) {
        const updatedDoc = {...doc, ...updates};
        setDocuments(docs => docs.map(d => d.id === docId ? updatedDoc : d));
        if (activeDocumentId === docId) {
            handleSetActiveDocument(updatedDoc);
        }
        createNotification(doc, 'a été approuvé.');
        toast({ title: "Document approuvé", description: "Les données ont été validées et enregistrées." });
    }
  };

   const handleAddComment = async (docId: string, commentText: string) => {
    if (!commentText.trim() || !activeDocument) return;
    const newComment: Comment = {
      id: crypto.randomUUID(),
      text: commentText,
      user: getCurrentUser(),
      date: new Date().toISOString(),
    };
    const trail = await addAuditEvent(docId, `Commentaire ajouté: "${commentText.substring(0, 20)}..."`, getCurrentUser());
    const doc = documents.find(d => d.id === docId);
    const updatedComments = [...(doc?.comments || []), newComment];
    await updateDocument({ id: docId, updates: { comments: updatedComments, auditTrail: trail } });
    const updatedDoc = {...doc!, comments: updatedComments, auditTrail: trail};
    setDocuments(docs => docs.map(d => d.id === docId ? updatedDoc : d));
    if (activeDocumentId === docId) {
        handleSetActiveDocument(updatedDoc);
    }
  };
  
  const handleSetActiveDocument = async (doc: Document | null) => {
    if (doc) {
        setZoom(1);
        setRotation(0);
        
        let docWithDataUrl = doc;

        if (!doc.dataUrl && doc.storagePath) {
             try {
                const url = await getDownloadURL(ref(storage, doc.storagePath));
                const response = await fetch(url);
                const blob = await response.blob();
                const dataUrl = await fileToDataUri(new File([blob], doc.name));
                docWithDataUrl = {...doc, dataUrl };
                setDocuments(docs => docs.map(d => d.id === doc.id ? docWithDataUrl : d));
             } catch (error) {
                console.error("Failed to get download URL", error);
                toast({ title: "Erreur de chargement", description: "Impossible de récupérer l'aperçu du document.", variant: "destructive" });
             }
        }
        
        setActiveDocumentId(docWithDataUrl.id);
        if (window.innerWidth < 1024) setIsSheetOpen(true);

    } else {
        setActiveDocumentId(null);
    }
  }

  const handleBulkApprove = async () => {
    let approvedCount = 0;
    const promises = selectedDocumentIds.map(async (docId) => {
      const doc = documents.find(d => d.id === docId);
      if (doc && doc.status === 'reviewing') {
        const trail = await addAuditEvent(docId, 'Document approuvé (en masse)', getCurrentUser());
        await updateDocument({ id: docId, updates: { status: 'approved', auditTrail: trail } });
        createNotification(doc, 'a été approuvé.');
        approvedCount++;
      }
    });
    await Promise.all(promises);
    if(selectedClientId) fetchDocuments(selectedClientId);
    toast({ title: "Documents approuvés", description: `${approvedCount} documents ont été approuvés.` });
    setSelectedDocumentIds([]);
  }

  const handleBulkSend = async () => {
    let sentCount = 0;
    const docsToSend = documents.filter(doc => selectedDocumentIds.includes(doc.id) && doc.status === 'approved');

    for (const doc of docsToSend) {
        const result = await sendDocumentToCegid(doc.id, getCurrentUser());
        if (result.success) {
            sentCount++;
        } else {
             toast({ title: "Erreur d'envoi", description: `Échec de l'envoi de ${doc.name}: ${result.error}`, variant: "destructive" });
        }
    }
    
    if (sentCount > 0) {
        toast({ title: "Données envoyées", description: `${sentCount} documents ont été envoyés à CEGID.` });
    }
    if(selectedClientId) fetchDocuments(selectedClientId);
    setSelectedDocumentIds([]);
  }

  const handleDeleteSingle = async (docId: string) => {
     await deleteDocument(docId);
     const doc = documents.find(d => d.id === docId);
     if(doc?.storagePath) await deleteObject(ref(storage, doc.storagePath));
     setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
     if (activeDocumentId === docId) setActiveDocumentId(null);
     toast({ variant: 'destructive', title: "Document supprimé" });
  }

  const handleBulkDelete = async () => {
    const promises = selectedDocumentIds.map(async (docId) => {
        await deleteDocument(docId);
        const doc = documents.find(d => d.id === docId);
        if(doc?.storagePath) await deleteObject(ref(storage, doc.storagePath));
    });
    await Promise.all(promises);
    setDocuments(prevDocs => prevDocs.filter(doc => !selectedDocumentIds.includes(doc.id)));
    if (activeDocumentId && selectedDocumentIds.includes(activeDocumentId)) setActiveDocumentId(null);
    toast({ variant: 'destructive', title: "Documents supprimés", description: `${selectedDocumentIds.length} documents ont été supprimés.` });
    setSelectedDocumentIds([]);
  }

  const handleBulkExport = () => {
    const docsToExport = documents.filter(doc => selectedDocumentIds.includes(doc.id) && doc.status === 'approved' && doc.extractedData);
    if (docsToExport.length === 0) {
      toast({ title: "Aucun document à exporter", description: "Veuillez sélectionner des documents approuvés.", variant: "destructive" });
      return;
    }
    const dataToUnparse = docsToExport.map(doc => ({
      'ID Document': doc.id,
      'Nom Fichier': doc.name,
      'Date Document': doc.extractedData?.dates?.[0],
      'Fournisseur': doc.extractedData?.vendorNames?.[0],
      'Montant TTC': doc.extractedData?.amounts?.[0],
      'Montant TVA': doc.extractedData?.vatAmount,
      'Taux TVA': doc.extractedData?.vatRate,
      'Categorie': doc.extractedData?.category,
     }));
    const csvContent = "data:text/csv;charset=utf-8," + Papa.unparse(dataToUnparse);
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `export-comptable-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exportation réussie", description: `${docsToExport.length} documents ont été exportés.` });
  }
  
  const filteredDocuments = useMemo(() => {
        let docs = [...documents];
        
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
                 docs = [...documents].filter(doc => 
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

  const activeDocument = useMemo(() => documents.find(d => d.id === activeDocumentId) ?? null, [documents, activeDocumentId]);

  useEffect(() => {
    if (activeDocumentId && window.innerWidth < 1024) setIsSheetOpen(true);
  }, [activeDocumentId]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setIsSheetOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clearFilters = () => {
    // Clear dashboard filter
    if (dashboardFilter) {
        router.replace('/dashboard/documents');
        setDashboardFilter(null);
    }
    // Clear intelligent search filter
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
        <div className="flex items-center space-x-2 bg-muted p-2 rounded-md border mb-4 text-sm">
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
    <div className="flex items-center space-x-2 bg-muted p-2 rounded-md border mb-4">
        <span className="text-sm font-medium text-muted-foreground pl-2">{selectedDocumentIds.length} sélectionné(s)</span>
        <div className="flex-grow" />
        <Button variant="outline" size="sm" onClick={handleBulkApprove}><Check className="h-4 w-4 mr-2" />Approuver</Button>
        <Button variant="outline" size="sm" onClick={handleBulkSend}><Send className="h-4 w-4 mr-2" />Envoyer à Cegid</Button>
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
            {activeDocumentId && <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleProcessDocument(activeDocumentId)} disabled={isProcessing}><RefreshCw className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Relancer le traitement</p></TooltipContent></Tooltip>}
        </TooltipProvider>
    </div>
  );

  const MainContent = () => (
    <div className="flex flex-col gap-6 h-full">
        {selectedDocumentIds.length > 0 && <BulkActionsToolbar />}
        <FilterDisplay />
        <Tabs defaultValue="documents" className="w-full flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 w-full max-w-sm">
                <TabsTrigger value="documents">Pièces Comptables</TabsTrigger>
                <TabsTrigger value="bilans">Bilans</TabsTrigger>
            </TabsList>
            <TabsContent value="documents" className="flex-1 mt-4">
                 <Tabs defaultValue="achats" className="w-full">
                     <TabsList className="grid w-full grid-cols-5">
                        {TABS_CONFIG.map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                        ))}
                     </TabsList>
                     {TABS_CONFIG.map(tab => {
                        const docsForTab = filteredDocuments.filter(doc => tab.types.includes(doc.type) || (tab.value === 'autres' && !TABS_CONFIG.flatMap(t=>t.types).includes(doc.type)));
                         return (
                             <TabsContent key={tab.value} value={tab.value} className="mt-4">
                                <DocumentHistory
                                    documents={docsForTab}
                                    onProcess={(doc) => handleProcessDocument(doc.id)}
                                    onDelete={handleDeleteSingle}
                                    activeDocumentId={activeDocumentId}
                                    setActiveDocument={handleSetActiveDocument}
                                    selectedDocumentIds={selectedDocumentIds}
                                    setSelectedDocumentIds={setSelectedDocumentIds}
                                    isLoading={isLoading}
                                />
                             </TabsContent>
                         )
                     })}
                 </Tabs>
            </TabsContent>
            <TabsContent value="bilans" className="flex-1 mt-4">
                {selectedClientId ? <BilanHistory clientId={selectedClientId} /> : (
                    <Card className="h-full flex items-center justify-center">
                        <CardContent className="text-center p-6">
                            <BookCopy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">Aucun client sélectionné</h3>
                            <p className="text-sm text-muted-foreground mt-1">Veuillez sélectionner un client pour voir l'historique des bilans.</p>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
        </Tabs>
    </div>
  );

  const DetailView = () => {
    if (activeDocument) {
      return (
        <div className="flex flex-col h-full gap-6">
          <Card className="flex-1 aspect-square w-full bg-muted overflow-hidden relative">
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
          </Card>
          <DataValidationForm
            key={activeDocument.id}
            document={activeDocument}
            onUpdate={(data) => handleUpdateDocumentData(activeDocument.id, data)}
            isLoading={isProcessing}
            onAddComment={(commentText) => handleAddComment(activeDocument.id, commentText)}
          />
        </div>
      );
    }
    return (
        <div className="hidden lg:flex items-center justify-center h-full sticky top-[80px]">
            <Card className="h-full w-full">
                <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
                    <FileSignature className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Commencez la validation</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                        Sélectionnez un document dans la liste pour commencer le processus de validation. Vous pourrez examiner les données extraites par l'IA, les corriger si nécessaire, et approuver la pièce.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] items-start">
        <div className={cn("h-full overflow-y-auto", activeDocument ? "lg:col-span-1" : "lg:col-span-3")}>
             <MainContent />
        </div>
        {activeDocument && (
            <div className="hidden lg:block lg:col-span-2 h-full sticky top-[80px]">
                <DetailView />
            </div>
        )}

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side="right" className="p-0 w-full sm:max-w-lg overflow-y-auto">
            {activeDocument ? (
                <>
                <SheetHeader className="p-6">
                <SheetTitle>
                    <span className="sr-only">{activeDocument.name}</span>
                </SheetTitle>
                </SheetHeader>
                <DataValidationForm
                key={activeDocument.id}
                document={activeDocument}
                onUpdate={(data) => handleUpdateDocumentData(activeDocument.id, data)}
                isLoading={isProcessing}
                onAddComment={(commentText) => handleAddComment(activeDocument.id, commentText)}
                isSheet
                />
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <p>Aucun document sélectionné.</p>
                </div>
            )}
            </SheetContent>
        </Sheet>
    </div>
  );
}
