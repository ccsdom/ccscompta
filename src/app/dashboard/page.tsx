'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DocumentHistory } from "@/components/document-history";
import { FileUp, FileCheck, FileClock, CircleDollarSign } from "lucide-react";
import { useState, useMemo, useEffect } from 'react';
import type { Document } from "./documents/page"; // Re-using type from documents page

export default function Dashboard() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadState = () => {
            try {
                const storedDocs = localStorage.getItem('documents');
                if (storedDocs) {
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
        window.addEventListener('storage', loadState);
        return () => window.removeEventListener('storage', loadState);
    }, []);

    const filteredDocuments = useMemo(() => {
        if (!searchQuery) return documents;
        const lowercasedQuery = searchQuery.toLowerCase();
        return documents.filter(doc => 
            doc.name.toLowerCase().includes(lowercasedQuery) ||
            doc.extractedData?.vendorNames.some(vendor => vendor.toLowerCase().includes(lowercasedQuery))
        );
    }, [documents, searchQuery]);

    const stats = useMemo(() => {
        const approved = filteredDocuments.filter(d => d.status === 'approved').length;
        const pending = filteredDocuments.filter(d => d.status === 'reviewing' || d.status === 'pending').length;
        const totalAmount = filteredDocuments
            .filter(d => d.status === 'approved' && d.extractedData)
            .flatMap(d => d.extractedData!.amounts)
            .reduce((sum, amount) => sum + amount, 0);

        return {
            total: filteredDocuments.length,
            approved,
            pending,
            totalAmount: totalAmount.toFixed(2),
        }
    }, [filteredDocuments]);

    // These handlers are placeholders. They would be implemented with global state management.
    const handleProcessDocument = (doc: Document) => {
        console.log("Processing document from dashboard:", doc.name);
    };
    const handleSetActiveDocument = (doc: Document) => {
        setActiveDocumentId(doc.id);
        console.log("Setting active document from dashboard:", doc.name);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents affichés</CardTitle>
                        <FileUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total des fichiers correspondants</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents approuvés</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.approved}</div>
                        <p className="text-xs text-muted-foreground">Validés et prêts à être envoyés</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En attente d'examen</CardTitle>
                        <FileClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">À traiter ou à valider</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Montant Total Approuvé</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAmount} €</div>
                        <p className="text-xs text-muted-foreground">Somme des documents validés</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                <DocumentHistory
                    documents={filteredDocuments}
                    onProcess={handleProcessDocument}
                    activeDocumentId={activeDocumentId}
                    setActiveDocument={handleSetActiveDocument}
                />
            </div>
        </div>
    );
}
