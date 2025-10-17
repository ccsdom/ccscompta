
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, FileUp, FileCheck, FileClock, Building } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Document, AuditEvent } from '@/lib/types';
import type { Client } from '@/lib/types';
import { getClients } from '@/ai/flows/client-actions';
import { getDocuments } from '@/ai/flows/document-actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountantDashboard() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadState = async () => {
            setLoading(true);
            try {
                const clientsData = await getClients();
                setClients(clientsData);
                // Fetch documents for all clients for the dashboard overview
                const allDocsPromises = clientsData.map(c => getDocuments(c.id));
                const allDocsArrays = await Promise.all(allDocsPromises);
                const allDocs = allDocsArrays.flat();
                setDocuments(allDocs);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        loadState();
    }, []);

    const dashboardData = useMemo(() => {
        const today = new Date();
        const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const docsUploadedToday = documents.filter(d => {
            const uploadEvent = d.auditTrail.find(e => e.action.includes('téléversé'));
            return uploadEvent && new Date(uploadEvent.date) >= twentyFourHoursAgo;
        }).length;
        
        const docsPendingReview = documents.filter(d => ['pending', 'reviewing', 'error'].includes(d.status)).length;
        
        const docsApprovedToday = documents.filter(doc => {
            const approvalEvent = doc.auditTrail.find(e => e.action.includes('approuvé'));
            return approvalEvent && new Date(approvalEvent.date) >= twentyFourHoursAgo;
        }).length;
        
        const activityByClient = clients.map(client => {
            const clientDocsToday = documents.filter(d => 
                d.clientId === client.id && 
                d.auditTrail.length > 0 && 
                new Date(d.auditTrail[0].date) >= twentyFourHoursAgo
            ).length;
            return { name: client.name, docs: clientDocsToday };
        }).filter(c => c.docs > 0).sort((a,b) => b.docs - a.docs).slice(0, 5);

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
            docsApprovedToday,
            activityByClient,
            recentActivities
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-80" />
                    <Skeleton className="h-80" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
               <p className="text-muted-foreground mt-1">Vue d'ensemble de l'activité de tous vos clients.</p>
           </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Link href="/dashboard/documents?filter=today" legacyBehavior>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Documents du jour</CardTitle>
                            <FileUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{dashboardData.docsUploadedToday}</div>
                            <p className="text-xs text-muted-foreground">Téléversés dans les dernières 24h</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/documents?filter=pending_review" legacyBehavior>
                     <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">En attente d'examen</CardTitle>
                            <FileClock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData.docsPendingReview}</div>
                            <p className="text-xs text-muted-foreground">Tous clients confondus</p>
                        </CardContent>
                    </Card>
                </Link>
                 <Link href="/dashboard/documents?filter=approved_today" legacyBehavior>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Validations du jour</CardTitle>
                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData.docsApprovedToday}</div>
                            <p className="text-xs text-muted-foreground">Approuvés dans les dernières 24h</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Activité par client (24h)</CardTitle>
                        <CardDescription>Nombre de documents téléversés par les clients les plus actifs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dashboardData.activityByClient.length > 0 ? (
                            <ChartContainer config={{ docs: { label: "Documents", color: "hsl(var(--chart-1))" }}} className="h-[250px] w-full">
                                <BarChart data={dashboardData.activityByClient} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={120} />
                                    <XAxis dataKey="docs" type="number" hide />
                                     <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent 
                                            formatter={(value) => `${value} docs`}
                                            indicator="dot" 
                                        />}
                                    />
                                    <Bar dataKey="docs" fill="var(--color-docs)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                             <div className="h-[250px] w-full flex flex-col items-center justify-center text-center p-4">
                                <FileUp className="h-10 w-10 text-muted-foreground mb-3" />
                                <h3 className="font-semibold text-foreground">Peu d'activité aujourd'hui</h3>
                                <p className="text-sm text-muted-foreground mt-1">Aucun document n'a été téléversé par vos clients dans les dernières 24 heures.</p>
                             </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>Activités récentes</CardTitle>
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
                        <Button variant="outline" className="w-full mt-4" asChild>
                            <Link href="/dashboard/clients">Voir tous les clients</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
