
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, FileUp, FileCheck, Building, Network } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Document, Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { db } from '@/firebase';


export default function AdminDashboardPage() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
        setIsMounted(true);
    }, []);
    
    const isAuthorized = useMemo(() => isMounted && userRole === 'admin', [isMounted, userRole]);

    const documentsQuery = useMemoFirebase(() => {
        if (!isAuthorized) return null;
        return query(collection(db, 'documents'));
    }, [isAuthorized]);
    const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

    const clientsQuery = useMemoFirebase(() => {
        if (!isAuthorized) return null;
        return query(collection(db, 'clients'));
    }, [isAuthorized]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    
    const loading = !isMounted || (isAuthorized && (isLoadingDocuments || isLoadingClients));


    const dashboardData = useMemo(() => {
        if (loading || !isAuthorized || !documents || !clients) return null;

        const totalDocs = documents.length;
        const totalApprovedDocs = documents.filter(d => d.status === 'approved').length;
        
        const activityByClient = clients.map(client => {
            const clientDocsCount = documents.filter(d => d.clientId === client.id).length;
            return { name: client.name, docs: clientDocsCount };
        }).filter(c => c.docs > 0).sort((a,b) => b.docs - a.docs).slice(0, 5);

        return {
            totalFirms: 1, // Mock data for multi-firm view
            totalClients: clients.length,
            totalDocs,
            totalApprovedDocs,
            activityByClient,
        };
    }, [isAuthorized, documents, clients, loading]);

    if (!isMounted) {
         return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32" />
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

    if (!isAuthorized) {
        return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
                <Card className="w-full max-w-md text-center">
                     <CardHeader>
                        <Network className="h-12 w-12 mx-auto text-muted-foreground" />
                        <CardTitle className="mt-4">Accès non autorisé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Seuls les administrateurs peuvent accéder à cette page.</p>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32" />
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
                <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Administrateur</h1>
                <p className="text-muted-foreground mt-1">Vue globale de l'ensemble de l'activité sur la plateforme.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cabinets Gérés</CardTitle>
                        <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.totalFirms}</div>
                        <p className="text-xs text-muted-foreground">Nombre de cabinets sur la plateforme</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.totalClients}</div>
                        <p className="text-xs text-muted-foreground">Tous cabinets confondus</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                        <FileUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.totalDocs}</div>
                        <p className="text-xs text-muted-foreground">Nombre total de documents téléversés</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents Approuvés</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.totalApprovedDocs}</div>
                        <p className="text-xs text-muted-foreground">Documents traités et validés</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Clients les Plus Actifs (Global)</CardTitle>
                        <CardDescription>Clients avec le plus grand nombre de documents sur la plateforme.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dashboardData.activityByClient.length > 0 ? (
                            <ChartContainer config={{ docs: { label: "Documents", color: "hsl(var(--primary))" }}} className="h-[250px] w-full">
                                <BarChart data={dashboardData.activityByClient} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <XAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} angle={-45} textAnchor="end" height={60} />
                                    <YAxis dataKey="docs" type="number" />
                                     <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent 
                                            formatter={(value) => `${value} documents`}
                                            indicator="dot" 
                                        />}
                                    />
                                    <Bar dataKey="docs" fill="var(--color-docs)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                             <div className="h-[250px] w-full flex flex-col items-center justify-center text-center p-4">
                                <Building className="h-10 w-10 text-muted-foreground mb-3" />
                                <h3 className="font-semibold text-foreground">Aucune activité client</h3>
                                <p className="text-sm text-muted-foreground mt-1">Aucun document n'a encore été ajouté par un client.</p>
                             </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>Actions Administrateur</CardTitle>
                        <CardDescription>Gérez la plateforme, les cabinets et les paramètres globaux.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button asChild>
                            <Link href="/dashboard/cabinets">Gérer les cabinets</Link>
                        </Button>
                         <Button variant="outline" asChild>
                            <Link href="/dashboard/settings">Accéder aux paramètres globaux</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
    

    
