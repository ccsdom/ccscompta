
'use client';

import { useState, useEffect, useMemo } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import type { Client, Document } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Building, Mail, Phone, BarChart2, Edit, FileWarning, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { DocumentHistory } from '@/components/document-history';
import { BilanHistory } from '@/components/bilan-history';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

export default function ClientProfilePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const clientRef = useMemoFirebase(() => params.id ? doc(db, 'clients', params.id) : null, [params.id]);
    const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

    const documentsQuery = useMemoFirebase(() => params.id ? query(collection(db, 'documents'), where('clientId', '==', params.id)) : null, [params.id]);
    const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

    const loading = isLoadingClient || isLoadingDocuments;

    const stats = useMemo(() => {
        if (!documents) return { pendingDocs: 0, overdueInvoices: 0, nextDeadline: new Date() };
        return {
            pendingDocs: documents.filter(d => ['pending', 'reviewing', 'error'].includes(d.status)).length,
            overdueInvoices: 0, // Placeholder
            nextDeadline: new Date(2024, 7, 20) // Placeholder
        }
    }, [documents]);

    if (loading) {
        return (
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-10 w-24" />
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                         <Skeleton className="h-64" />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-80" />
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </div>
        )
    }

    if (!client && !loading) {
        notFound();
    }
    
    const latestDocuments = (documents || []).slice(0, 5);


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{client?.name}</h1>
                    <p className="text-muted-foreground mt-1">Dossier client et synthèse d'activité.</p>
                </div>
                {client && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link
                                href={`/dashboard/analytics`}
                                onClick={() => { localStorage.setItem('selectedClientId', client.id); window.dispatchEvent(new Event('storage'));}}>
                                <BarChart2 className="h-4 w-4 mr-2"/>Analyser
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/dashboard/clients/${client.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2"/>Modifier
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Documents en attente</CardTitle>
                       <FileWarning className="h-4 w-4 text-muted-foreground" />
                   </CardHeader>
                   <CardContent>
                       <div className="text-2xl font-bold">{stats.pendingDocs}</div>
                       <p className="text-xs text-muted-foreground">En attente de traitement ou d'examen</p>
                   </CardContent>
               </Card>
               <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Factures en retard</CardTitle>
                       <Clock className="h-4 w-4 text-muted-foreground" />
                   </CardHeader>
                   <CardContent>
                       <div className="text-2xl font-bold">{stats.overdueInvoices}</div>
                       <p className="text-xs text-muted-foreground">Factures d'honoraires non réglées</p>
                   </CardContent>
               </Card>
               <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Prochaine Échéance</CardTitle>
                       <CheckCircle className="h-4 w-4 text-muted-foreground" />
                   </CardHeader>
                   <CardContent>
                       <div className="text-2xl font-bold">{format(stats.nextDeadline, 'dd LLLL yyyy', {locale: fr})}</div>
                       <p className="text-xs text-muted-foreground">Déclaration de TVA</p>
                   </CardContent>
               </Card>
           </div>
            {client && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations Client</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div><p className="font-medium">SIRET</p><p className="text-muted-foreground">{client.siret || 'N/A'}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div><p className="font-medium">Email</p><p className="text-muted-foreground">{client.email}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div><p className="font-medium">Téléphone</p><p className="text-muted-foreground">{client.phone || 'N/A'}</p></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Derniers Documents</CardTitle>
                                <CardDescription>Les derniers fichiers téléversés par ce client.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DocumentHistory 
                                    documents={latestDocuments}
                                    onProcess={() => {}}
                                    onDelete={() => {}}
                                    setActiveDocument={(doc) => { localStorage.setItem('selectedClientId', client.id); window.dispatchEvent(new Event('storage')); router.push(`/dashboard/documents`) }}
                                    selectedDocumentIds={[]}
                                    setSelectedDocumentIds={() => {}}
                                    isLoading={loading}
                                />
                            </CardContent>
                        </Card>
                        <BilanHistory clientId={client.id} />
                    </div>
                </div>
            )}
        </div>
    );
}
