
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Banknote, Users, TrendingUp, TrendingDown, FileCheck2, UserCheck, CalendarDays } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, LabelList, ResponsiveContainer, YAxis } from "recharts";
import {type ChartConfig} from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getClients } from '@/ai/flows/client-actions';
import { getDocuments } from '@/ai/flows/document-actions';
import type { Client } from '@/lib/client-data';
import type { Document } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


const chartConfig = {
  revenue: {
    label: "Chiffre d'affaires",
    color: "hsl(var(--chart-1))",
  },
  clients: {
    label: "Clients",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig


export default function ReportingPage() {
    const [timeRange, setTimeRange] = useState('1y');
    const [clients, setClients] = useState<Client[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const clientsData = await getClients();
                setClients(clientsData);

                const allDocsPromises = clientsData.map(c => getDocuments(c.id));
                const allDocsArrays = await Promise.all(allDocsPromises);
                setDocuments(allDocsArrays.flat());

            } catch (error) {
                console.error("Failed to load reporting data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const reportingData = useMemo(() => {
        if (clients.length === 0 || documents.length === 0) {
            return null;
        }

        const now = new Date();
        let filteredDocuments = documents;
        if (timeRange === '1m') {
            filteredDocuments = documents.filter(d => new Date(d.uploadDate).getMonth() === now.getMonth() && new Date(d.uploadDate).getFullYear() === now.getFullYear());
        } else if (timeRange === '6m') {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            filteredDocuments = documents.filter(d => new Date(d.uploadDate) >= sixMonthsAgo);
        } else { // 1y
             filteredDocuments = documents.filter(d => new Date(d.uploadDate).getFullYear() === now.getFullYear());
        }


        const approvedDocs = filteredDocuments.filter(d => d.status === 'approved' && d.extractedData?.amounts?.[0]);

        const totalRevenue = approvedDocs.reduce((sum, doc) => sum + (doc.extractedData?.amounts?.[0] || 0), 0);
        
        const activeClients = clients.filter(c => c.status === 'active').length;
        
        const docsThisMonth = documents.filter(d => {
            const docDate = new Date(d.uploadDate);
            return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
        }).length;

        const monthlyRevenue = approvedDocs.reduce((acc, doc) => {
            const date = new Date(doc.extractedData!.dates![0]);
            const month = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).replace('.', '');
            const amount = doc.extractedData!.amounts![0];
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += amount;
            return acc;
        }, {} as Record<string, number>);

        const monthlyRevenueChartData = Object.entries(monthlyRevenue)
            .map(([name, revenue]) => ({ name, revenue }))
            .sort((a,b) => {
                const [m1, y1] = a.name.split(' ');
                const [m2, y2] = b.name.split(' ');
                const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
                const d1 = new Date(parseInt(`20${y1}`), months.indexOf(m1));
                const d2 = new Date(parseInt(`20${y2}`), months.indexOf(m2));
                return d1.getTime() - d2.getTime();
            });

        const revenueByClient = approvedDocs.reduce((acc, doc) => {
            if (!acc[doc.clientId]) {
                acc[doc.clientId] = 0;
            }
            acc[doc.clientId] += doc.extractedData?.amounts?.[0] || 0;
            return acc;
        }, {} as Record<string, number>);

        const topClientsData = Object.entries(revenueByClient)
            .map(([clientId, revenue]) => {
                const client = clients.find(c => c.id === clientId);
                return {
                    name: client?.name || 'Client Inconnu',
                    revenue
                }
            })
            .sort((a,b) => b.revenue - a.revenue)
            .slice(0, 5);


        return {
            totalRevenue,
            pendingInvoices: 12250.00, // This remains mock data for now
            activeClients,
            docsThisMonth,
            monthlyRevenueChartData,
            topClientsData,
        }

    }, [clients, documents, timeRange]);

     if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-1/3" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28" /> <Skeleton className="h-28" />
                    <Skeleton className="h-28" /> <Skeleton className="h-28" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-80 lg:col-span-2" />
                    <Skeleton className="h-80" />
                    <Skeleton className="h-80" />
                </div>
            </div>
        )
    }

    if (!reportingData) {
        return (
            <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
                <Card className="w-full max-w-md text-center">
                     <CardHeader>
                        <AreaChart className="h-12 w-12 mx-auto text-muted-foreground" />
                        <CardTitle className="mt-4">Pas de données à analyser</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Aucune donnée de client ou de document n'est disponible pour générer des rapports.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Rapports & Performance</h1>
                    <p className="text-muted-foreground mt-1">Analyse de la performance financière et opérationnelle du cabinet.</p>
                </div>
                 <div className="w-[180px]">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une période" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1m">Ce mois-ci</SelectItem>
                            <SelectItem value="6m">6 derniers mois</SelectItem>
                            <SelectItem value="1y">Cette année</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chiffre d'affaires (Période)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportingData.totalRevenue.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</div>
                        <p className="text-xs text-muted-foreground">
                            Basé sur les documents approuvés
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportingData.pendingInvoices.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</div>
                        <p className="text-xs text-muted-foreground">
                            Donnée statique de démonstration
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportingData.activeClients}</div>
                        <p className="text-xs text-muted-foreground">
                           Total des clients avec statut "actif"
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents Traités (Mois)</CardTitle>
                        <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportingData.docsThisMonth}</div>
                         <p className="text-xs text-muted-foreground">
                           Documents téléversés ce mois-ci
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Chiffre d'affaires mensuel</CardTitle>
                        <CardDescription>Évolution du CA des documents approuvés sur la période.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportingData.monthlyRevenueChartData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis tickFormatter={(value) => `${(value as number / 1000)}k€`} tickLine={false} axisLine={false} />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent 
                                            formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
                                            indicator="dot" 
                                        />}
                                    />
                                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={5}>
                                        <LabelList dataKey="revenue" position="top" offset={8} className="fill-foreground text-xs" formatter={(value: number) => `${value.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR', notation: 'compact'})}`} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Classement des clients</CardTitle>
                        <CardDescription>Top clients par chiffre d'affaires (documents approuvés) sur la période.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">CA approuvé</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportingData.topClientsData.map(client => (
                                    <TableRow key={client.name}>
                                        <TableCell className="font-medium flex items-center gap-3">
                                             <Avatar className="h-8 w-8 border">
                                                <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {client.name}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{client.revenue.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
