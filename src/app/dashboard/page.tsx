'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { FileUploader } from '@/components/file-uploader';
import { DataValidationForm } from '@/components/data-validation-form';
import { DocumentHistory } from '@/components/document-history';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData, type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

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

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        
        // Automatically start processing
        handleProcessDocument(newDoc, [newDoc, ...documents]);

      } catch (error) {
        console.error("Error converting file to data URI:", error);
        toast({
          variant: "destructive",
          title: "Erreur de lecture de fichier",
          description: `Impossible de lire le fichier ${file.name}.`,
        });
      }
    }
    setDocuments(prev => [...newDocuments, ...prev]);
    
    if (newDocuments.length > 0) {
      if(newDocuments.length === 1) {
        setActiveDocumentId(newDocuments[0].id);
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
  
  const handleProcessDocument = async (doc: Document, currentDocsState: Document[]) => {
    if (activeDocumentId !== doc.id) {
        setActiveDocumentId(doc.id);
    }
    setIsLoading(true);
    let currentDocs = updateDocumentInState(doc.id, { status: 'processing' }, currentDocsState);
    setDocuments(currentDocs);

    try {
      const recognition = await recognizeDocumentType({ documentDataUri: doc.dataUrl });
      currentDocs = updateDocumentInState(doc.id, { type: recognition.documentType, confidence: recognition.confidence }, currentDocs);
      setDocuments(currentDocs);
      
      const extracted = await extractData({ documentDataUri: doc.dataUrl, documentType: recognition.documentType });
      currentDocs = updateDocumentInState(doc.id, { status: 'reviewing', extractedData: extracted }, currentDocs);
      setDocuments(currentDocs);
      
      toast({
        title: "Traitement terminé",
        description: `Données extraites de ${doc.name}. Prêt pour examen.`,
      });

    } catch (error) {
      console.error("Error processing document:", error);
      currentDocs = updateDocumentInState(doc.id, { status: 'error' }, currentDocs);
      setDocuments(currentDocs);
      toast({
        variant: "destructive",
        title: "Le traitement a échoué",
        description: `Impossible de traiter ${doc.name}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateDocumentData = (docId: string, updatedData: ExtractDataOutput) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'approved', extractedData: updatedData } : d));
    toast({
      title: "Document approuvé",
      description: "Les données ont été validées et enregistrées.",
    });
  };

  const handleSendToCegid = (doc: Document) => {
    console.log("Sending to Cegid:", doc);
    toast({
      title: "Données envoyées",
      description: `${doc.name} a été envoyé à CEGID avec succès.`,
    });
  };
  
  const handleSetActiveDocument = (doc: Document) => {
    setActiveDocumentId(doc.id);
  }

  const activeDocument = useMemo(() => documents.find(d => d.id === activeDocumentId) ?? null, [documents, activeDocumentId]);
  const isProcessingAny = documents.some(d => d.status === 'processing');

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[450px_1fr] xl:grid-cols-[500px_1fr] overflow-hidden">
        <div className="flex flex-col border-r bg-background p-4 md:p-6 gap-4 md:gap-6">
          <FileUploader onFileDrop={handleFileDrop} isLoading={isProcessingAny} />
          <DocumentHistory 
              documents={documents} 
              onProcess={(doc) => handleProcessDocument(doc, documents)} 
              activeDocumentId={activeDocumentId}
              setActiveDocument={handleSetActiveDocument}
          />
        </div>
        <div className="flex items-center justify-center p-4 md:p-6 bg-muted/30">
             <DataValidationForm
              key={activeDocument?.id}
              document={activeDocument}
              onUpdate={(data) => activeDocument && handleUpdateDocumentData(activeDocument.id, data)}
              onSendToCegid={handleSendToCegid}
              isLoading={isLoading && activeDocument?.status === 'processing'}
            />
        </div>
      </main>
    </div>
  );
}
