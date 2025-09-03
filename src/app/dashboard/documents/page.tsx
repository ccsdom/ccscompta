
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { DataValidationForm } from '@/components/data-validation-form';
import { DocumentHistory } from '@/components/document-history';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData, type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { validateExtraction } from '@/ai/flows/validate-extraction';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button';
import { Check, Send, Trash2, Download, FileUp, ZoomIn, ZoomOut, RotateCw, RefreshCw, FilterX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from '@/components/ui/card';
import type { IntelligentSearchOutput } from '@/ai/flows/intelligent-search-flow';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Comment, AuditEvent, Notification, Document } from '@/lib/types';


const getCurrentUser = () => localStorage.getItem('userName') || 'Utilisateur Démo';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [automationSettings, setAutomationSettings] = useState({ isEnabled: false, confidenceThreshold: 0.95, autoSend: false });
  const { toast } = useToast();


   useEffect(() => {
    const loadState = () => {
        try {
            const storedDocs = localStorage.getItem('documents');
            if (storedDocs) {
                // We need to reconstruct File objects as they are not serializable
                const parsedDocs = JSON.parse(storedDocs).map((d: any) => ({...d, file: new File([], d.name), auditTrail: d.auditTrail || [], comments: d.comments || [] }));
                setDocuments(parsedDocs);
            }
             const storedQuery = localStorage.getItem('searchQuery');
             if (storedQuery) {
                setSearchQuery(storedQuery);
             }
             const storedCriteria = localStorage.getItem('searchCriteria');
             if (storedCriteria) {
                 setSearchCriteria(JSON.parse(storedCriteria));
             }
             const storedClientId = localStorage.getItem('selectedClientId');
             if (storedClientId) {
                setSelectedClientId(storedClientId);
             }
             const storedAutomation = localStorage.getItem('automationSettings');
             if (storedAutomation) {
                setAutomationSettings(JSON.parse(storedAutomation));
             }
        } catch (error) {
            console.error("Failed to load documents from localStorage", error)
        }
    };
    loadState();
    // Listen for storage changes to update the document list from other components
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
        user: 'Système',
    };
    let currentTrail: AuditEvent[] = [];
    setDocuments(prev => {
        const doc = prev.find(d => d.id === docId);
        if (doc) currentTrail = doc.auditTrail;
        return prev;
    });
    return [...currentTrail, event];
  }, []);


  const handleFileDrop = async (files: File[]) => {
    if (!selectedClientId) {
         toast({
          variant: "destructive",
          title: "Aucun client sélectionné",
          description: `Veuillez sélectionner un client avant de téléverser.`,
        });
        return;
    }
    const newDocuments: Document[] = [];
    const existingFileNames = new Set(documents.map(d => d.name));

    for (const file of files) {
      if (existingFileNames.has(file.name)) {
        toast({
          variant: "destructive",
          title: "Fichier en double",
          description: `Le fichier "${file.name}" a déjà été téléversé.`,
        });
        continue;
      }
      try {
        const dataUrl = await fileToDataUri(file);
        const newDoc: Document = {
          id: crypto.randomUUID(),
          name: file.name,
          uploadDate: new Date().toLocaleDateString('fr-FR'),
          status: 'pending' as const,
          file,
          dataUrl,
          clientId: selectedClientId,
          auditTrail: [{
            action: 'Document téléversé',
            date: new Date().toISOString(),
            user: getCurrentUser(),
          }],
          comments: []
        };
        newDocuments.push(newDoc);
        existingFileNames.add(file.name); // Add to set to prevent duplicate uploads in the same batch
      } catch (error) {
        console.error("Error converting file to data URI:", error);
        toast({
          variant: "destructive",
          title: "Erreur de lecture de fichier",
          description: `Impossible de lire le fichier ${file.name}.`,
        });
      }
    }
    
    if (newDocuments.length > 0) {
      setDocuments(prev => [...newDocuments, ...prev]);
      handleSetActiveDocument(newDocuments[0]);
      toast({
        title: "Fichiers téléversés",
        description: `${newDocuments.length} nouveau(x) document(s) sont en cours de traitement.`,
      });
      newDocuments.forEach(doc => handleProcessDocument(doc.id));
    }
  };

  const updateDocumentState = (id: string, updates: Partial<Document>) => {
    setDocuments(prevDocs => 
      prevDocs.map(d => (d.id === id ? { ...d, ...updates } : d))
    );
  };
  
  const handleProcessDocument = useCallback(async (docId: string) => {
    const docToProcess = documents.find(d => d.id === docId);

    if (!docToProcess || docToProcess.status === 'processing') return;

    if (docId === activeDocumentId) setIsLoading(true);
    let trail = addAuditEvent(docId, 'Traitement IA initié');
    updateDocumentState(docId, { status: 'processing', auditTrail: trail });
    
    try {
      const recognition = await recognizeDocumentType({ documentDataUri: docToProcess.dataUrl });
      trail = addAuditEvent(docId, `Type reconnu: ${recognition.documentType} (Confiance: ${Math.round(recognition.confidence * 100)}%)`);
      
      // Get all other client documents for reconciliation context
      const allClientDocuments = documents
        .filter(d => d.clientId === docToProcess.clientId && d.id !== docToProcess.id)
        .map(({ file, ...rest }) => rest); // Remove the File object before passing to the AI flow
      
      const extracted = await extractData({ 
          documentDataUri: docToProcess.dataUrl, 
          documentType: recognition.documentType,
          allClientDocuments: allClientDocuments
      });
      trail = addAuditEvent(docId, 'Données extraites par IA');

      let finalUpdates: Partial<Document> = {
          status: 'reviewing',
          extractedData: extracted,
          type: recognition.documentType,
          confidence: recognition.confidence,
          auditTrail: trail
      };

      // Auto-approval logic
      if (automationSettings.isEnabled && recognition.documentType !== 'bank statement') { // Don't auto-approve bank statements for now
          trail = addAuditEvent(docId, 'Validation automatique initiée');
          const validation = await validateExtraction({ documentDataUri: docToProcess.dataUrl, extractedData: extracted });
          
          if (validation.isConfident && validation.confidenceScore >= automationSettings.confidenceThreshold) {
              trail = addAuditEvent(docId, `Validation IA réussie (Confiance: ${Math.round(validation.confidenceScore * 100)}%). Document auto-approuvé.`);
              finalUpdates.status = 'approved';
              toast({ title: "Document auto-approuvé", description: `${docToProcess.name} a été traité et approuvé automatiquement.` });
              
              const finalDoc = { ...docToProcess, ...finalUpdates };
              createNotification(finalDoc, 'a été approuvé automatiquement.');

              if (automationSettings.autoSend) {
                  handleSendToCegid(finalDoc, true);
              }
          } else {
              trail = addAuditEvent(docId, `Validation IA requiert une revue (Confiance: ${Math.round(validation.confidenceScore * 100)}%). Raison: ${validation.mismatchReason || 'N/A'}`);
              toast({ title: "Traitement terminé", description: `Données extraites de ${docToProcess.name}. Prêt pour examen.` });
              const finalDoc = { ...docToProcess, ...finalUpdates };
              createNotification(finalDoc, 'est prêt pour examen.');
          }
      } else {
         toast({ title: "Traitement terminé", description: `Données extraites de ${docToProcess.name}. Prêt pour examen.` });
         const finalDoc = { ...docToProcess, ...finalUpdates };
         createNotification(finalDoc, 'est prêt pour examen.');
      }

      updateDocumentState(docId, finalUpdates);

    } catch (error) {
      console.error("Error processing document:", error);
      trail = addAuditEvent(docId, 'Erreur de traitement IA');
      updateDocumentState(docId, { status: 'error', auditTrail: trail });
      toast({
        variant: "destructive",
        title: "Le traitement a échoué",
        description: `Impossible de traiter ${(docToProcess as Document).name}.`,
      });
      const finalDoc = { ...(docToProcess as Document), status: 'error' as const };
      createNotification(finalDoc, 'a échoué lors du traitement.');
    } finally {
      if (docId === activeDocumentId) setIsLoading(false);
    }
  }, [documents, activeDocumentId, toast, addAuditEvent, automationSettings]);
  
  const handleUpdateDocumentData = (docId: string, updatedData: ExtractDataOutput) => {
    let updatedDoc : Document | undefined;
    const trail = addAuditEvent(docId, 'Document approuvé manuellement');
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        updatedDoc = { ...d, status: 'approved', extractedData: updatedData, auditTrail: trail };
        return updatedDoc;
      }
      return d;
    }));
    toast({
      title: "Document approuvé",
      description: "Les données ont été validées et enregistrées.",
    });
    if (updatedDoc) {
      createNotification(updatedDoc, 'a été approuvé.');
    }
  };

   const handleAddComment = (docId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: crypto.randomUUID(),
      text: commentText,
      user: getCurrentUser(),
      date: new Date().toISOString(),
    };
    const trail = addAuditEvent(docId, `Commentaire ajouté: "${commentText.substring(0, 20)}..."`);
    setDocuments(prev => prev.map(d => {
        if (d.id === docId) {
            return { ...d, comments: [...(d.comments || []), newComment], auditTrail: trail };
        }
        return d;
    }));
  };

  const handleSendToCegid = (doc: Document, isAuto: boolean = false) => {
    const user = isAuto ? 'Système (Auto-envoi)' : getCurrentUser();
    const trail = [...doc.auditTrail, { action: 'Document envoyé à Cegid', date: new Date().toISOString(), user }];
    updateDocumentState(doc.id, { auditTrail: trail });
    console.log("Sending to Cegid:", doc);
    toast({
      title: "Données envoyées",
      description: `${doc.name} a été envoyé à CEGID avec succès.`,
    });
     createNotification(doc, 'a été envoyé à Cegid.');
  };
  
  const handleSetActiveDocument = (doc: Document | null) => {
    if (doc) {
        setZoom(1);
        setRotation(0);
        setActiveDocumentId(doc.id);
        if (window.innerWidth < 1024) {
            setIsSheetOpen(true);
        }
    } else {
        setActiveDocumentId(null);
    }
  }

  const handleBulkApprove = () => {
    let approvedCount = 0;
    setDocuments(prevDocs => 
        prevDocs.map(doc => {
            if (selectedDocumentIds.includes(doc.id) && doc.status === 'reviewing') {
              approvedCount++;
              createNotification(doc, 'a été approuvé.');
              const trail = addAuditEvent(doc.id, 'Document approuvé (en masse)');
              return { ...doc, status: 'approved', auditTrail: trail };
            }
            return doc;
        })
    );
    toast({
      title: "Documents approuvés",
      description: `${approvedCount} documents ont été approuvés.`,
    });
    setSelectedDocumentIds([]);
  }

  const handleBulkSend = () => {
    setDocuments(prevDocs =>
        prevDocs.map(doc => {
            if (selectedDocumentIds.includes(doc.id) && doc.status === 'approved') {
                console.log("Sending to Cegid:", doc);
                createNotification(doc, 'a été envoyé à Cegid.');
                const trail = addAuditEvent(doc.id, 'Document envoyé à Cegid (en masse)');
                return { ...doc, auditTrail: trail };
            }
            return doc;
        })
    )
     toast({
      title: "Données envoyées",
      description: `${selectedDocumentIds.length} documents ont été envoyés à CEGID.`,
    });
    setSelectedDocumentIds([]);
  }

  const handleDeleteSingle = (docId: string) => {
     setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
      if (activeDocumentId === docId) {
        setActiveDocumentId(null);
      }
     toast({
        variant: 'destructive',
        title: "Document supprimé",
        description: `Le document a été supprimé.`,
     });
  }

  const handleBulkDelete = () => {
    setDocuments(prevDocs => {
      const newDocs = prevDocs.filter(doc => !selectedDocumentIds.includes(doc.id))
      if (activeDocumentId && selectedDocumentIds.includes(activeDocumentId)) {
        setActiveDocumentId(null)
      }
      return newDocs
    });

    toast({
      variant: 'destructive',
      title: "Documents supprimés",
      description: `${selectedDocumentIds.length} documents ont été supprimés.`,
    });
    setSelectedDocumentIds([]);
  }

  const handleBulkExport = () => {
    const docsToExport = documents.filter(doc => 
      selectedDocumentIds.includes(doc.id) && 
      doc.status === 'approved' && 
      doc.extractedData
    );
    
    if (docsToExport.length === 0) {
      toast({
        title: "Aucun document à exporter",
        description: "Veuillez sélectionner des documents approuvés avec des données extraites.",
        variant: "destructive"
      });
      return;
    }

    const headers = ['ID du document', 'Nom du fichier', 'Date de téléversement', 'Statut', 'Type de document', 'Fournisseur(s)', 'Date(s) de la pièce', 'Montant(s)', 'Catégorie', 'Autres informations'];
    const rows = docsToExport.map(doc => {
      const data = doc.extractedData!;
      const row = [
        doc.id,
        doc.name.replace(/,/g, ''), // Escape commas in file name
        doc.uploadDate,
        doc.status,
        doc.type || '',
        data.vendorNames?.join('; '),
        data.dates?.join('; '),
        data.amounts?.join('; '),
        data.category || '',
        `"${(data.otherInformation || '').replace(/"/g, '""')}"` // Escape quotes
      ];
      return row.join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const date = new Date().toISOString().slice(0,10);
    link.setAttribute("download", `export-comptable-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportation réussie",
      description: `${docsToExport.length} documents ont été exportés.`,
    });
  }
  
  const filteredDocuments = useMemo(() => {
        let docs = [...documents].filter(d => d.clientId === selectedClientId);
        
        if (searchCriteria) {
            // AI Search Logic
            let filteredByAI = false;
            const { documentTypes, minAmount, maxAmount, startDate, endDate, vendor, keywords, originalQuery } = searchCriteria;

            if (documentTypes && documentTypes.length > 0) {
                docs = docs.filter(d => d.type && documentTypes.some(type => d.type!.toLowerCase().includes(type.toLowerCase())));
                filteredByAI = true;
            }
            if (minAmount) {
                docs = docs.filter(d => d.extractedData && d.extractedData.amounts && d.extractedData.amounts.some(a => a >= minAmount));
                filteredByAI = true;
            }
            if (maxAmount) {
                docs = docs.filter(d => d.extractedData && d.extractedData.amounts && d.extractedData.amounts.some(a => a <= maxAmount));
                filteredByAI = true;
            }
            if (startDate) {
                docs = docs.filter(d => d.extractedData && d.extractedData.dates && d.extractedData.dates.some(date => new Date(date) >= new Date(startDate)));
                filteredByAI = true;
            }
            if (endDate) {
                docs = docs.filter(d => d.extractedData && d.extractedData.dates && d.extractedData.dates.some(date => new Date(date) <= new Date(endDate)));
                filteredByAI = true;
            }
            if (vendor) {
                const lowerVendor = vendor.toLowerCase();
                docs = docs.filter(d => d.extractedData && d.extractedData.vendorNames && d.extractedData.vendorNames.some(v => v.toLowerCase().includes(lowerVendor)));
                filteredByAI = true;
            }
            if (keywords && keywords.length > 0) {
                docs = docs.filter(d => {
                    const searchableText = [d.name, d.extractedData?.otherInformation || '', ...(d.extractedData?.vendorNames || [])].join(' ').toLowerCase();
                    return keywords.every(kw => searchableText.includes(kw.toLowerCase()));
                });
                filteredByAI = true;
            }
            
            // If AI search didn't use specific criteria, fall back to simple text search with the original query
            if (!filteredByAI && originalQuery) {
                 const lowercasedQuery = originalQuery.toLowerCase();
                 docs = docs.filter(doc => 
                    doc.name.toLowerCase().includes(lowercasedQuery) ||
                    (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(v => v.toLowerCase().includes(lowercasedQuery)))
                );
            }

        } else if (searchQuery) {
             // Fallback to simple search
            const lowercasedQuery = searchQuery.toLowerCase();
            docs = docs.filter(doc => 
                doc.name.toLowerCase().includes(lowercasedQuery) ||
                (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(vendor => vendor.toLowerCase().includes(lowercasedQuery)))
            );
        }
        // Ensure auditTrail exists and is an array before sorting by upload date
        return docs.sort((a,b) => {
            const dateA = a.uploadDate.split('/').reverse().join('-');
            const dateB = b.uploadDate.split('/').reverse().join('-');
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
  }, [documents, searchQuery, searchCriteria, selectedClientId]);

  const activeDocument = useMemo(() => documents.find(d => d.id === activeDocumentId) ?? null, [documents, activeDocumentId]);

  useEffect(() => {
    if (activeDocumentId && window.innerWidth < 1024) {
      setIsSheetOpen(true)
    }
  }, [activeDocumentId])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSheetOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SearchCriteriaDisplay = () => {
    if (!searchCriteria) return null;

    const criteria = Object.entries(searchCriteria)
        .filter(([key, value]) => key !== 'originalQuery' && value && (!Array.isArray(value) || value.length > 0))
        .map(([key, value]) => {
            let label = key;
            let val = value;
            if (key === 'documentTypes') label = 'Type';
            if (key === 'startDate') {
                label = 'Après le';
                val = new Date(value).toLocaleDateString('fr-FR');
            }
            if (key === 'endDate') {
                label = 'Avant le';
                 val = new Date(value).toLocaleDateString('fr-FR');
            }
            if (key === 'minAmount') label = 'Montant min';
            if (key === 'maxAmount') label = 'Montant max';
            if (key === 'vendor') label = 'Fournisseur';
            if (key === 'keywords') label = 'Mots-clés';
            return <Badge key={key} variant="secondary" className="gap-1">{label}: <span className="font-semibold">{Array.isArray(val) ? val.join(', ') : val}</span></Badge>
        });
    
    const handleClearSearch = () => {
        setSearchCriteria(null);
        setSearchQuery("");
        localStorage.removeItem('searchCriteria');
        localStorage.removeItem('searchQuery');
        window.dispatchEvent(new Event('storage'));
    }

    if (criteria.length === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-md border">
        <span className="text-sm font-medium text-muted-foreground pl-2">Filtres actifs :</span>
        <div className="flex flex-wrap gap-1">
            {criteria}
        </div>
        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={handleClearSearch}>
            <FilterX className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const BulkActionsToolbar = () => (
    <div className="flex items-center space-x-2 bg-muted p-2 rounded-md border mb-4">
        <span className="text-sm font-medium text-muted-foreground pl-2">{selectedDocumentIds.length} sélectionné(s)</span>
        <div className="flex-grow" />
        <Button variant="outline" size="sm" onClick={handleBulkApprove}><Check className="h-4 w-4 mr-2" />Approuver</Button>
        <Button variant="outline" size="sm" onClick={handleBulkSend}><Send className="h-4 w-4 mr-2" />Envoyer</Button>
        <Button variant="outline" size="sm" onClick={handleBulkExport}><Download className="h-4 w-4 mr-2" />Export Comptable</Button>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" />Supprimer</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Les documents sélectionnés seront définitivement supprimés.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
  
  const PreviewControls = () => (
     <div className="absolute top-2 right-2 z-10 bg-background/50 backdrop-blur-sm rounded-md p-1 flex items-center gap-1">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setZoom(z => z * 1.2)}><ZoomIn className="h-4 w-4"/></Button></TooltipTrigger>
                <TooltipContent><p>Zoom avant</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setZoom(z => z / 1.2)}><ZoomOut className="h-4 w-4"/></Button></TooltipTrigger>
                <TooltipContent><p>Zoom arrière</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4"/></Button></TooltipTrigger>
                <TooltipContent><p>Pivoter</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => {setZoom(1); setRotation(0);}}><RefreshCw className="h-4 w-4"/></Button></TooltipTrigger>
                <TooltipContent><p>Réinitialiser</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
  )

  const renderContent = () => {
    if (activeDocument) {
      return (
        <div className="flex flex-col h-full gap-6">
          <Card className="flex-1 aspect-square w-full bg-muted overflow-hidden relative">
            <PreviewControls />
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <iframe 
                    src={activeDocument.dataUrl} 
                    className="w-full h-full border-0 transition-transform duration-300"
                    style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`}}
                    title="Aperçu du document" 
                />
            </div>
          </Card>
          <DataValidationForm
            key={activeDocument.id}
            document={activeDocument}
            onUpdate={(data) => handleUpdateDocumentData(activeDocument.id, data)}
            onSendToCegid={() => handleSendToCegid(activeDocument)}
            isLoading={isLoading && activeDocument.id === activeDocumentId}
            onAddComment={(commentText) => handleAddComment(activeDocument.id, commentText)}
          />
        </div>
      );
    }
    return (
      <Card className="h-full">
        <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
            <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucun document sélectionné</h3>
            <p className="text-sm text-muted-foreground mt-1">Sélectionnez un document dans la liste pour voir l'aperçu et valider les données.</p>
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] items-start">
      <div className="lg:col-span-2 flex flex-col gap-6 h-full">
        {selectedDocumentIds.length > 0 && <BulkActionsToolbar />}
        <SearchCriteriaDisplay />
        <DocumentHistory
          documents={filteredDocuments}
          onProcess={(doc) => handleProcessDocument(doc.id)}
          onDelete={handleDeleteSingle}
          activeDocumentId={activeDocumentId}
          setActiveDocument={handleSetActiveDocument}
          selectedDocumentIds={selectedDocumentIds}
          setSelectedDocumentIds={setSelectedDocumentIds}
        />
      </div>
      <div className="hidden lg:block h-full sticky top-[80px]">
        {renderContent()}
      </div>

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
              onSendToCegid={() => handleSendToCegid(activeDocument)}
              isLoading={isLoading && activeDocument.id === activeDocumentId}
              onAddComment={(commentText) => handleAddComment(activeDocument.id, commentText)}
              isSheet
            />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucun document sélectionné</h3>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

    