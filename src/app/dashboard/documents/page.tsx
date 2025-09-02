'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { DataValidationForm } from '@/components/data-validation-form';
import { DocumentHistory } from '@/components/document-history';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData, type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

export interface Document {
  id: string;
  name: string;
  uploadDate: string;
  status: 'pending' | 'processing' | 'reviewing' | 'approved' | 'error';
  file: File;
  dataUrl: string;
  type?: string;
  confidence?: number;
  extractedData?: ExtractDataOutput;
}

export type Notification = {
  id: string;
  documentId: string;
  documentName: string;
  message: string;
  date: string;
  isRead: boolean;
};


export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

   useEffect(() => {
    const loadState = () => {
        try {
            const storedDocs = localStorage.getItem('documents');
            if (storedDocs) {
                // We need to reconstruct File objects as they are not serializable
                const parsedDocs = JSON.parse(storedDocs).map((d: any) => ({...d, file: new File([], d.name)}));
                setDocuments(parsedDocs);
            }
             const storedQuery = localStorage.getItem('searchQuery');
             if (storedQuery) {
                setSearchQuery(storedQuery);
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

  const handleFileDrop = async (files: File[]) => {
    const newDocuments: Document[] = [];
    for (const file of files) {
      try {
        const dataUrl = await fileToDataUri(file);
        const newDoc = {
          id: crypto.randomUUID(),
          name: file.name,
          uploadDate: new Date().toLocaleDateString('fr-FR'),
          status: 'pending' as const,
          file,
          dataUrl,
        };
        newDocuments.push(newDoc);
        
        // Use a function to get the latest state
        setDocuments(prev => {
          const updatedDocs = [newDoc, ...prev];
          handleProcessDocument(newDoc, updatedDocs);
          return updatedDocs;
        });

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
      if(newDocuments.length === 1) {
        handleSetActiveDocument(newDocuments[0]);
      }
      toast({
        title: "Fichiers téléversés",
        description: `${newDocuments.length} document(s) sont en cours de traitement.`,
      });
    }
  };

 const updateDocumentInState = (id: string, data: Partial<Document>, currentDocs: Document[]): Document[] => {
    return currentDocs.map(d => d.id === id ? { ...d, ...data } : d);
  };
  
  const handleProcessDocument = useCallback(async (doc: Document, currentDocsState: Document[]) => {
    handleSetActiveDocument(doc);
    setIsLoading(true);
    let currentDocs = updateDocumentInState(doc.id, { status: 'processing' }, currentDocsState);
    setDocuments(currentDocs);

    try {
      const recognition = await recognizeDocumentType({ documentDataUri: doc.dataUrl });
      currentDocs = updateDocumentInState(doc.id, { type: recognition.documentType, confidence: recognition.confidence }, currentDocs);
      setDocuments(currentDocs);
      
      const extracted = await extractData({ documentDataUri: doc.dataUrl, documentType: recognition.documentType });
      const finalDoc = { ...doc, status: 'reviewing' as const, extractedData: extracted, type: recognition.documentType, confidence: recognition.confidence };
      currentDocs = updateDocumentInState(doc.id, finalDoc, currentDocs);
      setDocuments(currentDocs);
      
      toast({
        title: "Traitement terminé",
        description: `Données extraites de ${doc.name}. Prêt pour examen.`,
      });
      createNotification(finalDoc, 'est prêt pour examen.');

    } catch (error) {
      console.error("Error processing document:", error);
      const errorDoc = { ...doc, status: 'error' as const };
      currentDocs = updateDocumentInState(doc.id, errorDoc, currentDocs);
      setDocuments(currentDocs);
      toast({
        variant: "destructive",
        title: "Le traitement a échoué",
        description: `Impossible de traiter ${doc.name}.`,
      });
      createNotification(errorDoc, 'a échoué lors du traitement.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const handleUpdateDocumentData = (docId: string, updatedData: ExtractDataOutput) => {
    let updatedDoc : Document | undefined;
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        updatedDoc = { ...d, status: 'approved', extractedData: updatedData };
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

  const handleSendToCegid = (doc: Document) => {
    console.log("Sending to Cegid:", doc);
    toast({
      title: "Données envoyées",
      description: `${doc.name} a été envoyé à CEGID avec succès.`,
    });
     createNotification(doc, 'a été envoyé à Cegid.');
  };
  
  const handleSetActiveDocument = (doc: Document | null) => {
    if (doc) {
        setActiveDocumentId(doc.id);
        if (window.innerWidth < 1024) {
            setIsSheetOpen(true);
        }
    } else {
        setActiveDocumentId(null);
    }
  }
  
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    const lowercasedQuery = searchQuery.toLowerCase();
    return documents.filter(doc => 
        doc.name.toLowerCase().includes(lowercasedQuery) ||
        doc.extractedData?.vendorNames.some(vendor => vendor.toLowerCase().includes(lowercasedQuery))
    );
  }, [documents, searchQuery]);

  const activeDocument = useMemo(() => documents.find(d => d.id === activeDocumentId) ?? null, [documents, activeDocumentId]);
  const isProcessingAny = documents.some(d => d.status === 'processing');

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


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <FileUploader onFileDrop={handleFileDrop} isLoading={isProcessingAny} />
        <DocumentHistory
          documents={filteredDocuments}
          onProcess={(doc) => handleProcessDocument(doc, documents)}
          activeDocumentId={activeDocumentId}
          setActiveDocument={handleSetActiveDocument}
        />
      </div>
      <div className="hidden lg:block lg:col-span-1 h-full sticky top-0">
        <DataValidationForm
          key={activeDocument?.id}
          document={activeDocument}
          onUpdate={(data) => activeDocument && handleUpdateDocumentData(activeDocument.id, data)}
          onSendToCegid={handleSendToCegid}
          isLoading={isLoading && activeDocument?.id === activeDocumentId}
        />
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="p-0 w-full sm:max-w-lg overflow-y-auto">
           <DataValidationForm
              key={activeDocument?.id}
              document={activeDocument}
              onUpdate={(data) => activeDocument && handleUpdateDocumentData(activeDocument.id, data)}
              onSendToCegid={handleSendToCegid}
              isLoading={isLoading && activeDocument?.id === activeDocumentId}
            />
        </SheetContent>
      </Sheet>
    </div>
  );
}
