'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { FileUploader } from '@/components/file-uploader';
import { DataValidationForm } from '@/components/data-validation-form';
import { DocumentHistory } from '@/components/document-history';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData, type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from "@/hooks/use-toast";
import { fileToDataUri } from '@/lib/utils';

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

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileDrop = async (files: File[]) => {
    const newDocuments: Document[] = [];
    for (const file of files) {
      try {
        const dataUrl = await fileToDataUri(file);
        newDocuments.push({
          id: crypto.randomUUID(),
          name: file.name,
          uploadDate: new Date().toLocaleDateString(),
          status: 'pending',
          file,
          dataUrl,
        });
      } catch (error) {
        console.error("Error converting file to data URI:", error);
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: `Could not read the file ${file.name}.`,
        });
      }
    }
    setDocuments(prev => [...newDocuments, ...prev]);
    if (newDocuments.length > 0) {
      toast({
        title: "Files Uploaded",
        description: `${newDocuments.length} document(s) added to the queue.`,
      });
    }
  };

  const updateDocument = (id: string, data: Partial<Document>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  };
  
  const handleProcessDocument = async (doc: Document) => {
    setActiveDocumentId(doc.id);
    setIsLoading(true);
    updateDocument(doc.id, { status: 'processing' });

    try {
      const recognition = await recognizeDocumentType({ documentDataUri: doc.dataUrl });
      updateDocument(doc.id, { type: recognition.documentType, confidence: recognition.confidence });

      const extracted = await extractData({ documentDataUri: doc.dataUrl, documentType: recognition.documentType });
      updateDocument(doc.id, { status: 'reviewing', extractedData: extracted });
      
      toast({
        title: "Processing Complete",
        description: `Data extracted from ${doc.name}. Please review.`,
      });

    } catch (error) {
      console.error("Error processing document:", error);
      updateDocument(doc.id, { status: 'error' });
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: `Could not process ${doc.name}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateDocumentData = (docId: string, updatedData: ExtractDataOutput) => {
    updateDocument(docId, { status: 'approved', extractedData: updatedData });
    toast({
      title: "Document Approved",
      description: "The data has been validated and saved.",
    });
  };

  const handleSendToCegid = (doc: Document) => {
    console.log("Sending to Cegid:", doc);
    toast({
      title: "Data Sent",
      description: `${doc.name} has been sent to CEGID successfully.`,
    });
  };

  const activeDocument = documents.find(d => d.id === activeDocumentId) ?? null;
  const isProcessing = isLoading && activeDocument?.status === 'processing';

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-7">
          <div className="lg:col-span-3">
            <FileUploader onFileDrop={handleFileDrop} isLoading={isProcessing} />
          </div>
          <div className="lg:col-span-4">
            <DataValidationForm
              key={activeDocument?.id}
              document={activeDocument}
              onUpdate={(data) => activeDocument && handleUpdateDocumentData(activeDocument.id, data)}
              onSendToCegid={handleSendToCegid}
              isLoading={isProcessing}
            />
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl">
            <DocumentHistory 
                documents={documents} 
                onProcess={handleProcessDocument} 
                activeDocumentId={activeDocumentId}
                setActiveDocument={(doc) => setActiveDocumentId(doc.id)}
            />
        </div>
      </main>
    </div>
  );
}
