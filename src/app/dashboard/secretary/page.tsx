
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, FileUp, FileClock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Document, Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { db } from '@/firebase';

export default function SecretaryDashboard() {
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
    }, []);

    const isStaff = useMemo(() => userRole === 'secretary' || userRole === 'admin', [userRole]);

    const clientsQuery = useMemoFirebase(() => {
        if (!isStaff) return null;
        return query(collection(db, 'clients'));
    }, [isStaff]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

    const documentsQuery = useMemoFirebase(() => {
        if (!isStaff) return null;
        return query(collection(db, 'documents'));
    }, [isStaff]);
    const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

    const loading = isLoadingClients || isLoadingDocuments;

    const dashboardData = useMemo(() => {
        if (!documents || !clients) return null;

        const today = new Date();
        const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const docsUploadedToday = documents.filter(d => {
            const uploadEvent = d.auditTrail.find(e => e.action.includes('téléversé'));
            return uploadEvent && new Date(uploadEvent.date) >= twentyFourHoursAgo;
        }).length;
        
        const docsPendingReview = documents.filter(d => ['pending', 'reviewing', 'error'].includes(d.status)).length;
        
        const recentActivities = documents
            .flatMap(doc => {
                const client = clients.find(c => c.id === doc.clientId);
                return (doc.auditTrail || []).map(event => ({
                    ...event,
                    clientName: client?.name || 'Inconnu',
                    documentName: doc.name,
                }));
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        return {
            totalClients: clients.filter(c => c.status === 'active').length,
            docsUploadedToday,
            docsPendingReview,
            recentActivities
        };
    }, [documents, clients]);

    if (!isStaff) {
         return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
                <Card className="w-full max-w-md text-center">
                     <CardHeader>
                        <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                        <CardTitle className="mt-4">Accès non autorisé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à ce tableau de bord.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading || !dashboardData) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="lg:col-span-1 h-80" />
                    <Skeleton className="h-80" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Tableau de bord Secrétariat</h1>
               <p className="text-muted-foreground mt-1">Vue d'ensemble de l'activité administrative des clients.</p>
           </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.totalClients}</div>
                        <p className="text-xs text-muted-foreground">Total des dossiers gérés</p>
                    </CardContent>
                </Card>
                <Link href="/dashboard/documents?filter=today">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nouveaux documents</CardTitle>
                            <FileUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{dashboardData.docsUploadedToday}</div>
                            <p className="text-xs text-muted-foreground">Téléversés dans les dernières 24h</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/documents?filter=pending_review">
                     <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Documents à traiter</CardTitle>
                            <FileClock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData.docsPendingReview}</div>
                            <p className="text-xs text-muted-foreground">En attente de validation comptable</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Activités récentes des clients</CardTitle>
                        <CardDescription>Derniers événements sur les dossiers clients.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dashboardData.recentActivities.length > 0 ? dashboardData.recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mt-1 shrink-0">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{activity.clientName}</p>
                                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleString('fr-FR')}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-sm text-muted-foreground py-10">
                                    Aucune activité récente.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                     <CardHeader>
                        <CardTitle>Accès rapide</CardTitle>
                        <CardDescription>Actions courantes pour la gestion des dossiers.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button asChild>
                            <Link href="/dashboard/clients">Gérer les clients</Link>
                        </Button>
                        <Button variant="outline" asChild>
                             <Link href="/dashboard/documents">Traiter les documents</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/clients/new">Créer un nouveau client</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    