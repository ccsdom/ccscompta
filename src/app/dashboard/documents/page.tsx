

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { DataValidationForm } from '@/components/data-validation-form';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData, type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { validateExtraction } from '@/ai/flows/validate-extraction';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import { getDocuments, addDocument, updateDocument, deleteDocument, getDocumentById, sendDocumentToCegid } from '@/ai/flows/document-actions';
import { getClients, updateClient } from '@/ai/flows/client-actions';
import { createInvoiceForDocument } from '@/ai/flows/invoice-actions';
import { Button } from '@/components/ui/button';
import { Check, Send, Trash2, Download, FileUp, ZoomIn, ZoomOut, RotateCw, RefreshCw, FilterX, Loader2, Play, Eye, FileClock, CheckCircle, FileWarning } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IntelligentSearchOutput } from '@/ai/flows/intelligent-search-flow';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Comment, AuditEvent, Notification, Document, Client } from '@/lib/types';
import Papa from 'papaparse';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { storage } from '@/lib/firebase-client';
import { ref, getDownloadURL } from 'firebase/storage';
import { increment } from 'firebase/firestore';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientSwitcher } from '@/components/client-switcher';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';


const getCurrentUser = () => localStorage.getItem('userName') || 'Utilisateur Démo';

const getStatusInfo = (status: Document['status']): { icon: React.ElementType, label: string, color: string } => {
  switch (status) {
    case 'pending': return { icon: FileClock, label: "En attente", color: "text-gray-500" };
    case 'processing': return { icon: Loader2, label: "En traitement...", color: "text-blue-500 animate-spin" };
    case 'reviewing': return { icon: FileWarning, label: "Prêt pour examen", color: "text-yellow-500" };
    case 'approved': return { icon: CheckCircle, label: "Approuvé", color: "text-green-500" };
    case 'error': return { icon: FileWarning, label: "Erreur", color: "text-red-500" };
    default: return { icon: FileClock, label: "Inconnu", color: "text-gray-500" };
  }
};


export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [automationSettings, setAutomationSettings] = useState({ isEnabled: false, confidenceThreshold: 0.95, autoSend: false });
  const [isSheetOpen, setIsSheetOpen] = useState(false); // For mobile view
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

   const fetchDocumentsAndClients = useCallback(async (clientId: string) => {
    setIsLoading(true);
    try {
      const [docs, allClients] = await Promise.all([
          getDocuments(clientId),
          getClients()
      ]);
      setDocuments(docs);
      setClients(allClients);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Erreur de chargement", description: "Impossible de récupérer les données.", variant: "destructive" });
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
                fetchDocumentsAndClients(clientId);
                setActiveDocument(null);
             } else if (!clientId) {
                setDocuments([]);
                setClients([]);
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
  }, [selectedClientId, fetchDocumentsAndClients, searchParams])


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

  const updateLocalDocument = (updatedDoc: Document) => {
      setDocuments(docs => docs.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      if (activeDocument?.id === updatedDoc.id) {
          handleSetActiveDocument(updatedDoc);
      }
  }


  const handleProcessDocument = async (docId: string) => {
    const docToProcess = documents.find(d => d.id === docId);
    if (!docToProcess || docToProcess.status === 'processing' || !docToProcess.clientId) return;

    setIsProcessing(true);
    let trail = await addAuditEvent(docId, 'Traitement IA initié');
    updateLocalDocument({ ...docToProcess, status: 'processing', auditTrail: trail });
    
    try {
      let docWithDataUrl = { ...docToProcess };
      
      const storageRef = ref(storage, docToProcess.storagePath);
      const downloadUrl = await getDownloadURL(storageRef);
      
      let tempFile;
      let dataUrl: string | undefined;
      try {
          const response = await fetch(downloadUrl);
          const blob = await response.blob();
          tempFile = new File([blob], docToProcess.name, { type: blob.type });
          dataUrl = await fileToDataUri(tempFile);
      } catch(fetchError) {
          console.error("CORS error fetching file for AI processing:", fetchError);
          toast({
            variant: "destructive",
            title: "Erreur de CORS",
            description: "Impossible de lire le fichier pour l'IA. Veuillez suivre les instructions du README pour configurer les permissions CORS de votre bucket Storage."
          });
          throw fetchError;
      }
      docWithDataUrl.dataUrl = dataUrl;

      const recognition = await recognizeDocumentType({ documentDataUri: docWithDataUrl.dataUrl! });
      trail = await addAuditEvent(docId, `Type reconnu: ${recognition.documentType} (Confiance: ${Math.round(recognition.confidence * 100)}%)`);
      
      const extracted = await extractData({
        documentDataUri: docWithDataUrl.dataUrl!,
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
          const validation = await validateExtraction({ documentDataUri: docWithDataUrl.dataUrl!, extractedData: extracted });
          
          if (validation.isConfident && validation.confidenceScore >= automationSettings.confidenceThreshold) {
              trail = await addAuditEvent(docId, `Validation IA réussie (Confiance: ${Math.round(validation.confidenceScore * 100)}%). Document auto-approuvé.`);
              finalUpdates.status = 'approved';
              toast({ title: "Document auto-approuvé", description: `${docToProcess.name} a été traité et approuvé automatiquement.` });
              createNotification({ ...docToProcess, ...finalUpdates }, 'a été approuvé automatiquement.');
              
              const client = clients.find(c => c.id === docToProcess.clientId);
              if (client) {
                  await createInvoiceForDocument(client, docId);
                   await updateClient({id: client.id, updates: { newDocuments: increment(-1) as unknown as number }});
              }

              if (automationSettings.autoSend) {
                const sendResult = await sendDocumentToCegid(docId, 'Système (Auto-envoi)');
                const finalDoc = await getDocumentById(docId);
                if (finalDoc) updateLocalDocument(finalDoc);
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
      const finalDoc = await getDocumentById(docId);
      if (finalDoc) {
        updateLocalDocument({ ...finalDoc, dataUrl: docWithDataUrl.dataUrl });
      }

    } catch (error) {
      console.error("Error processing document:", error);
      trail = await addAuditEvent(docId, 'Erreur de traitement IA');
      await updateDocument({ id: docId, updates: { status: 'error', auditTrail: trail } });
      const finalDoc = await getDocumentById(docId);
      if (finalDoc) updateLocalDocument(finalDoc);
      // The toast for CORS error is already shown inside the try block
      if (!(error as Error).message.includes('CORS')) {
          toast({ variant: "destructive", title: "Le traitement a échoué", description: `Impossible de traiter ${docToProcess.name}.` });
      }
      createNotification({ ...docToProcess, status: 'error' }, 'a échoué lors du traitement.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUpdateDocumentData = async (docId: string, updatedData: ExtractDataOutput) => {
    const doc = await getDocumentById(docId);
    if (!doc || !doc.clientId) return;

    const trail = await addAuditEvent(docId, 'Document approuvé manuellement', getCurrentUser());
    const updates = { status: 'approved' as const, extractedData: updatedData, auditTrail: trail };
    await updateDocument({ id: docId, updates });
    
    const client = clients.find(c => c.id === doc.clientId);
    if (client) {
        await createInvoiceForDocument(client, docId);
         await updateClient({id: client.id, updates: { newDocuments: increment(-1) as unknown as number }});
    }
    
    const updatedDoc = await getDocumentById(docId);
    if(updatedDoc) {
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
    const doc = await getDocumentById(docId);
    const updatedComments = [...(doc?.comments || []), newComment];
    await updateDocument({ id: docId, updates: { comments: updatedComments, auditTrail: trail } });
    const updatedDoc = await getDocumentById(docId);
    if(updatedDoc) updateLocalDocument(updatedDoc);
  };
  
  const handleSetActiveDocument = async (doc: Document | null) => {
    if (doc) {
        if (activeDocument?.id === doc.id) return;
        setZoom(1);
        setRotation(0);
        
        setActiveDocument({ ...doc, dataUrl: undefined }); // Set active doc but clear previous dataUrl

        // For mobile, open the sheet
        if(window.innerWidth < 768) {
            setIsSheetOpen(true);
        }

        try {
            // Fetch the download URL from Firebase Storage
            const storageRef = ref(storage, doc.storagePath);
            const downloadUrl = await getDownloadURL(storageRef);

            // Directly set the URL for the iframe to use, bypassing client-side fetch.
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
      const doc = documents.find(d => d.id === docId);
      return doc && doc.status === 'reviewing';
    });

    for(const docId of docIdsToApprove) {
        const doc = documents.find(d => d.id === docId)!;
        const trail = await addAuditEvent(docId, 'Document approuvé (en masse)', getCurrentUser());
        await updateDocument({ id: docId, updates: { status: 'approved', auditTrail: trail } });
        createNotification(doc, 'a été approuvé.');
        
        const client = clients.find(c => c.id === doc.clientId);
        if (client) {
            await createInvoiceForDocument(client, docId);
            await updateClient({id: client.id, updates: { newDocuments: increment(-1) as unknown as number }});
        }
        approvedCount++;
    }

    if(selectedClientId && approvedCount > 0) {
        fetchDocumentsAndClients(selectedClientId);
        toast({ title: "Documents approuvés", description: `${approvedCount} documents ont été approuvés et les factures correspondantes générées.` });
         window.dispatchEvent(new Event('storage'));
    } else if (approvedCount === 0) {
        toast({ title: "Aucun document à approuver", description: "Seuls les documents 'Prêt pour examen' peuvent être approuvés.", variant: 'destructive' });
    }
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
    if(selectedClientId) fetchDocumentsAndClients(selectedClientId);
    setSelectedDocumentIds([]);
  }

  const handleDeleteSingle = async (docId: string) => {
     await deleteDocument(docId);
     setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
     if (activeDocument?.id === docId) setActiveDocument(null);
     toast({ variant: 'destructive', title: "Document supprimé" });
  }

  const handleBulkDelete = async () => {
    const promises = selectedDocumentIds.map(docId => deleteDocument(docId));
    await Promise.all(promises);
    setDocuments(prevDocs => prevDocs.filter(doc => !selectedDocumentIds.includes(doc.id)));
    if (activeDocument && selectedDocumentIds.includes(activeDocument.id)) setActiveDocument(null);
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

  const groupedDocuments = useMemo(() => {
    const groups: { [key: string]: Document[] } = {
      'reviewing': [],
      'pending': [],
      'approved': [],
      'error': [],
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
            {activeDocument?.id && <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleProcessDocument(activeDocument.id)} disabled={isProcessing}><RefreshCw className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Relancer le traitement</p></TooltipContent></Tooltip>}
        </TooltipProvider>
    </div>
  );

  const DocumentList = () => {
    const documentGroups: { status: Document['status']; label: string }[] = [
      { status: 'reviewing', label: 'Prêt pour examen' },
      { status: 'pending', label: 'En attente de traitement' },
      { status: 'approved', label: 'Approuvé' },
      { status: 'error', label: 'Erreur' },
      { status: 'processing', label: 'En cours de traitement' }
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
        <div className="p-4 border-b shrink-0 md:hidden">
            <p className="text-sm text-muted-foreground">{documents.length} document(s) au total.</p>
        </div>

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
                                      indeterminate={selectedDocumentIds.includes(doc.id) ? false : undefined}
                                      aria-label={`Sélectionner ${doc.name}`}
                                  />
                               </div>

                              <div className="flex-1 overflow-hidden">
                                <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(doc.uploadDate), { addSuffix: true, locale: fr })}</p>
                              </div>

                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {doc.status === 'pending' || doc.status === 'error' ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleProcessDocument(doc.id)}>
                                            <Play className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Lancer le traitement</p></TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
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
                    isLoading={isProcessing}
                    onAddComment={handleAddComment}
                    onUpdateDocumentInList={updateLocalDocument}
                />
            </ContentWrapper>
        </Wrapper>
    );
  }

  const MobileView = () => (
    <div className="md:hidden">
        <DocumentList />
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="w-full h-full p-0 flex flex-col" side="bottom">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="truncate">{activeDocument?.name}</SheetTitle>
                    <SheetDescription>Validez les informations du document</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    {activeDocument && <DocumentPreviewAndForm inSheet={true} />}
                </div>
            </SheetContent>
        </Sheet>
    </div>
  );

  const DesktopView = () => (
     <ResizablePanelGroup direction="horizontal" className="hidden md:flex flex-1 w-full rounded-lg border">
        <ResizablePanel defaultSize={50} minSize={30}>
            <DocumentList />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
            <DocumentPreviewAndForm />
        </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
        <div className="px-4 pt-4">
            <h1 className="text-2xl font-bold tracking-tight">Gestion des documents</h1>
            <div className="mt-2 w-full max-w-sm">
                <ClientSwitcher />
            </div>
        </div>
        <div className="flex-1 mt-4">
            <MobileView />
            <DesktopView />
        </div>
    </div>
  );
}
