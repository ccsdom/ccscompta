
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Users, BarChart as BarChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, ResponsiveContainer, Label, LabelList, BarChart as ReBarChart, PieChart as RePieChart } from 'recharts';
import type { Document } from '@/lib/types';
import {type ChartConfig} from '@/components/ui/chart';
import { getDocuments } from '@/ai/flows/document-actions';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  total: {
    label: "Total (€)",
    color: "hsl(var(--chart-1))",
  },
   average: {
    label: "Moyenne (€)",
    color: "hsl(var(--chart-2))",
  },
  invoice: { label: "Facture"},
  receipt: { label: "Reçu"},
  "bank statement": { label: "Relevé"},
  "Fournitures de bureau": { label: "Fournitures", color: "hsl(var(--chart-1))" },
  "Transport": { label: "Transport", color: "hsl(var(--chart-2))" },
  "Repas et divertissement": { label: "Repas", color: "hsl(var(--chart-3))" },
  "Services informatiques": { label: "IT", color: "hsl(var(--chart-4))" },
  "Déplacements": { label: "Déplacements", color: "hsl(var(--chart-5))" },
  "Autre": { label: "Autre", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export default function MyAnalyticsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadState = async () => {
            setIsLoading(true);
            try {
                const storedClientId = localStorage.getItem('selectedClientId');
                if (storedClientId) {
                    setSelectedClientId(storedClientId);
                    const docs = await getDocuments(storedClientId);
                    setDocuments(docs);
                }
            } catch (e) {
                console.error("Failed to load documents from local storage", e)
            } finally {
                setIsLoading(false);
            }
        }
        loadState();
        window.addEventListener('storage', loadState);
        return () => window.removeEventListener('storage', loadState);
    }, [])

    const clientDocuments = useMemo(() => {
        if (!selectedClientId) return [];
        return documents.filter(d => d.clientId === selectedClientId);
    }, [documents, selectedClientId]);


    const analyticsData = useMemo(() => {
        const approvedDocs = clientDocuments.filter(d => d.status === 'approved' && d.extractedData && d.extractedData.amounts && d.extractedData.amounts.length > 0 && d.extractedData.dates && d.extractedData.dates.length > 0);

        if (approvedDocs.length === 0) {
            return null;
        }

        const totalSpent = approvedDocs.reduce((sum, doc) => sum + (doc.extractedData?.amounts.reduce((a, b) => a! + b!, 0) ?? 0), 0);
        const averageSpent = approvedDocs.length > 0 ? totalSpent / approvedDocs.length : 0;
        
        const expensesByMonth = approvedDocs.reduce((acc, doc) => {
            const date = new Date(doc.extractedData!.dates[0]!);
            const month = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).replace('.', '');
            const amount = doc.extractedData!.amounts.reduce((a, b) => a! + b!, 0);
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += amount;
            return acc;
        }, {} as Record<string, number>);

        const monthlyChartData = Object.entries(expensesByMonth)
            .map(([name, total]) => ({ name, total }))
            .sort((a,b) => {
                const [m1, y1] = a.name.split(' ');
                const [m2, y2] = b.name.split(' ');
                const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
                const d1 = new Date(parseInt(`20${y1}`), months.indexOf(m1));
                const d2 = new Date(parseInt(`20${y2}`), months.indexOf(m2));
                return d1.getTime() - d2.getTime();
            });

        const expensesByCategory = approvedDocs.reduce((acc, doc) => {
            const category = doc.extractedData?.category || 'Autre';
             if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category]+= doc.extractedData!.amounts.reduce((a, b) => a! + b!, 0);
            return acc;
        }, {} as Record<string, number>);

        const categoryChartData = Object.entries(expensesByCategory).map(([name, value]) => ({ 
            name, 
            value, 
            fill: (chartConfig[name as keyof typeof chartConfig] || chartConfig['Autre'])?.color 
        }));

        const expensesByVendor = approvedDocs.reduce((acc, doc) => {
            const vendor = doc.extractedData!.vendorNames![0]! || 'Inconnu';
            const amount = doc.extractedData!.amounts.reduce((a, b) => a! + b!, 0);
             if (!acc[vendor]) {
                acc[vendor] = 0;
            }
            acc[vendor] += amount;
            return acc;
        }, {} as Record<string, number>);
        
        const vendorChartData = Object.entries(expensesByVendor)
            .map(([name, total]) => ({ name, total }))
            .sort((a,b) => b.total - a.total).slice(0, 5);

        const spendByType = approvedDocs.reduce((acc, doc) => {
            const type = doc.type || 'other';
            const amount = doc.extractedData!.amounts.reduce((a, b) => a! + b!, 0);
            if (!acc[type]) {
                acc[type] = { total: 0, count: 0 };
            }
            acc[type].total += amount;
            acc[type].count++;
            return acc;
        }, {} as Record<string, { total: number, count: number }>);
        
        const averageSpendByTypeChartData = Object.entries(spendByType)
            .map(([name, { total, count }]) => ({
                name: chartConfig[name as keyof typeof chartConfig]?.label || name,
                average: total / count
            }))
            .sort((a, b) => b.average - a.average);

        return {
            totalSpent,
            averageSpent,
            vendorChartData,
            monthlyChartData,
            categoryChartData,
            averageSpendByTypeChartData,
            approvedDocsCount: approvedDocs.length,
            mainVendor: vendorChartData.length > 0 ? vendorChartData[0].name : 'N/A'
        };
    }, [clientDocuments]);
    
  if (isLoading) {
      return (
          <div className="space-y-6">
              <div>
                  <Skeleton className="h-9 w-1/2" />
                  <Skeleton className="h-5 w-2/3 mt-2" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
              </div>
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                   <Skeleton className="h-80" /><Skeleton className="h-80" />
              </div>
          </div>
      )
  }

  if (!analyticsData) {
        return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
                <Card className="w-full max-w-md text-center">
                     <CardHeader>
                        <BarChartIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                        <CardTitle className="mt-4">Pas de données à afficher</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Aucun document n'a encore été approuvé par votre comptable. Les analyses apparaîtront ici une fois les données validées.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Mon Analyse de Dépenses</h1>
            <p className="text-muted-foreground mt-1">Visualisez les données de vos documents validés par votre comptable.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dépenses Approuvées</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
              <p className="text-xs text-muted-foreground">Basé sur {analyticsData.approvedDocsCount} documents</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépense Moyenne / Document</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.averageSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
               <p className="text-xs text-muted-foreground">Moyenne sur {analyticsData.approvedDocsCount} documents</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fournisseur Principal</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.mainVendor}</div>
              <p className="text-xs text-muted-foreground">Le plus grand volume de dépenses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Dépenses Mensuelles</CardTitle>
                    <CardDescription>Évolution de vos dépenses au fil des mois.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={analyticsData.monthlyChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}€`} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
                                        indicator="dot" 
                                    />}
                                />
                                <Bar dataKey="total" fill="var(--color-total)" radius={4}>
                                     <LabelList dataKey="total" position="top" offset={8} className="fill-foreground text-xs" formatter={(value: number) => `${Math.round(value)}€`} />
                                </Bar>
                            </ReBarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Répartition par Catégorie</CardTitle>
                    <CardDescription>Vos principaux postes de dépenses.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                     <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-w-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value, name, payload) => <div className="flex flex-col"><span className="font-semibold">{chartConfig[payload.name as keyof typeof chartConfig]?.label}</span><span className="text-muted-foreground">{Number(payload.value).toLocaleString('fr-FR', {style:'currency', currency: 'EUR'})}</span></div>}/>} />
                            <Pie
                                data={analyticsData.categoryChartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                stroke="hsl(var(--border))"
                            >
                                {analyticsData.categoryChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" formatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}/>} className="flex-wrap" />
                        </RePieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Top 5 des Dépenses par Fournisseur</CardTitle>
                    <CardDescription>Classement de vos fournisseurs par montant total dépensé.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart layout="vertical" data={analyticsData.vendorChartData} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={100} />
                                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
                                        indicator="dot" 
                                    />}
                                />
                                <Bar dataKey="total" fill="var(--color-total)" radius={4} layout="vertical">
                                    <LabelList dataKey="total" position="right" offset={8} className="fill-foreground text-xs" formatter={(value: number) => `${value.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}`} />
                                </Bar>
                            </ReBarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Dépense Moyenne par Type</CardTitle>
                    <CardDescription>Montant moyen pour chaque type de document.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={analyticsData.averageSpendByTypeChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}€`} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
                                        indicator="dot" 
                                    />}
                                />
                                <Bar dataKey="average" fill="var(--color-average)" radius={4}>
                                     <LabelList dataKey="average" position="top" offset={8} className="fill-foreground text-xs" formatter={(value: number) => `${Math.round(value).toLocaleString('fr-FR')}€`} />
                                </Bar>
                            </ReBarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
