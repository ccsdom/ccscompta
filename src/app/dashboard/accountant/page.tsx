'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, FileUp, FileCheck, FileClock, Building } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Document, AuditEvent } from '../documents/page';
import type { Client } from '../clients/page';

const MOCK_CLIENTS: Client[] = [
    { id: 'alpha', name: 'Entreprise Alpha', siret: '12345678901234', address: '123 Rue de la Paix, 75001 Paris', legalRepresentative: 'Jean Dupont', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 3, lastActivity: '2024-07-16', email: 'contact@alpha.com', phone: '0123456789' },
    { id: 'beta', name: 'Bêta SARL', siret: '23456789012345', address: '45 Avenue des Champs-Élysées, 75008 Paris', legalRepresentative: 'Marie Curie', fiscalYearEndDate: '30/06', status: 'active', newDocuments: 0, lastActivity: '2024-07-15', email: 'compta@beta.eu', phone: '0987654321' },
    { id: 'gamma', name: 'Gamma Inc.', siret: '34567890123456', address: '67 Boulevard Saint-Germain, 75005 Paris', legalRepresentative: 'Louis Pasteur', fiscalYearEndDate: '31/03', status: 'onboarding', newDocuments: 1, lastActivity: '2024-07-17', email: 'factures@gamma.io', phone: '0112233445' },
    { id: 'delta', name: 'Delta Industries', siret: '45678901234567', address: '89 Rue de Rivoli, 75004 Paris', legalRepresentative: 'Simone Veil', fiscalYearEndDate: '30/09', status: 'active', newDocuments: 5, lastActivity: '2024-07-16', email: 'admin@delta-industries.fr', phone: '0655443322' },
    { id: 'epsilon', name: 'Epsilon Global', siret: '56789012345678', address: '101 Avenue Victor Hugo, 75116 Paris', legalRepresentative: 'Charles de Gaulle', fiscalYearEndDate: '31/12', status: 'inactive', newDocuments: 0, lastActivity: '2024-05-20', email: 'support@epsilon.com', phone: '0788990011' },
];

export default function AccountantDashboard() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);

    useEffect(() => {
        const loadState = () => {
            try {
                const storedDocs = localStorage.getItem('documents');
                if (storedDocs) {
                    const parsedDocs = JSON.parse(storedDocs).map((d: any) => ({...d, file: new File([], d.name), auditTrail: d.auditTrail || [], comments: d.comments || [] }));
                    setDocuments(parsedDocs);
                }
            } catch (error) {
                console.error("Failed to load documents from localStorage", error);
            }
        };
        loadState();
        window.addEventListener('storage', loadState);
        return () => window.removeEventListener('storage', loadState);
    }, []);

    const dashboardData = useMemo(() => {
        const today = new Date();
        const todayStr = today.toLocaleDateString('fr-FR');
        const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const docsUploadedToday = documents.filter(d => d.uploadDate === todayStr).length;
        const docsPendingReview = documents.filter(d => ['pending', 'reviewing'].includes(d.status)).length;
        
        const docsApprovedToday = documents.filter(doc => {
            const approvalEvent = doc.auditTrail.find(e => e.action.includes('approuvé'));
            return approvalEvent && new Date(approvalEvent.date) >= twentyFourHoursAgo;
        }).length;
        
        const activityByClient = clients.map(client => {
            const clientDocsToday = documents.filter(d => 
                d.clientId === client.id && new Date(d.auditTrail[0]?.date) >= twentyFourHoursAgo
            ).length;
            return { name: client.name, docs: clientDocsToday };
        }).filter(c => c.docs > 0).sort((a,b) => b.docs - a.docs).slice(0, 5);

        const recentActivities = documents
            .flatMap(doc => {
                const client = clients.find(c => c.id === doc.clientId);
                return doc.auditTrail.map(event => ({
                    ...event,
                    clientName: client?.name || 'Inconnu',
                    documentName: doc.name,
                }));
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5); // Get top 5 most recent events across all documents


        return {
            totalClients: clients.filter(c => c.status === 'active').length,
            docsUploadedToday,
            docsPendingReview,
            docsApprovedToday,
            activityByClient,
            recentActivities
        };
    }, [documents, clients]);

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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents du jour</CardTitle>
                        <FileUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{dashboardData.docsUploadedToday}</div>
                        <p className="text-xs text-muted-foreground">Téléversés par les clients aujourd'hui</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En attente d'examen</CardTitle>
                        <FileClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.docsPendingReview}</div>
                        <p className="text-xs text-muted-foreground">Tous clients confondus</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Validations du jour</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.docsApprovedToday}</div>
                        <p className="text-xs text-muted-foreground">Documents approuvés par vos soins</p>
                    </CardContent>
                </Card>
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
