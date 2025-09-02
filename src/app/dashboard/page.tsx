'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DocumentHistory } from "@/components/document-history";
import { FileUp, FileCheck, FileClock, CircleDollarSign } from "lucide-react";
import { useState, useMemo } from 'react';
import type { Document } from "./documents/page"; // Re-using type from documents page

// Dummy data for charts
const expenseData = [
    { month: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
    { month: 'Fev', total: Math.floor(Math.random() * 5000) + 1000 },
    { month: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
    { month: 'Avr', total: Math.floor(Math.random() * 5000) + 1000 },
    { month: 'Mai', total: Math.floor(Math.random() * 5000) + 1000 },
    { month: 'Juin', total: Math.floor(Math.random() * 5000) + 1000 },
];

export default function Dashboard() {
    // This state would ideally be shared via a global state manager (e.g., Context, Redux)
    const [documents, setDocuments] = useState<Document[]>([]);
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

    const stats = useMemo(() => {
        const approved = documents.filter(d => d.status === 'approved').length;
        const pending = documents.filter(d => d.status === 'reviewing' || d.status === 'pending').length;
        const totalAmount = documents
            .filter(d => d.status === 'approved' && d.extractedData)
            .flatMap(d => d.extractedData!.amounts)
            .reduce((sum, amount) => sum + amount, 0);

        return {
            total: documents.length,
            approved,
            pending,
            totalAmount: totalAmount.toFixed(2),
        }
    }, [documents]);

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
                        <CardTitle className="text-sm font-medium">Documents téléversés</CardTitle>
                        <FileUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total des fichiers</p>
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
                    documents={documents}
                    onProcess={handleProcessDocument}
                    activeDocumentId={activeDocumentId}
                    setActiveDocument={handleSetActiveDocument}
                />
            </div>
        </div>
    );
}
