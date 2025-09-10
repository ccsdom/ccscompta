
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, FileUp, FileCheck, Building, Network } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Document } from '@/lib/types';
import type { Client } from '@/lib/client-data';
import { getClients } from '@/ai/flows/client-actions';
import { getDocuments } from '@/ai/flows/document-actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGlobalState = async () => {
            setLoading(true);
            try {
                const clientsData = await getClients();
                setClients(clientsData);
                const allDocsPromises = clientsData.map(c => getDocuments(c.id));
                const allDocsArrays = await Promise.all(allDocsPromises);
                const allDocs = allDocsArrays.flat();
                setDocuments(allDocs);
            } catch (error) {
                console.error("Failed to load global data", error);
            } finally {
                setLoading(false);
            }
        };
        loadGlobalState();
    }, []);

    const dashboardData = useMemo(() => {
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
    }, [documents, clients]);

    if (loading) {
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
                        <CardTitle>Top 5 Clients les Plus Actifs</CardTitle>
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
                        <CardDescription>Gérez la plateforme et ses utilisateurs.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            Les fonctionnalités de gestion des cabinets, des utilisateurs administrateurs et des paramètres globaux de la plateforme seront bientôt disponibles ici.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/clients">Gérer tous les clients</Link>
                        </Button>
                         <Button variant="outline" asChild>
                            <Link href="/dashboard/settings">Accéder aux paramètres</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
