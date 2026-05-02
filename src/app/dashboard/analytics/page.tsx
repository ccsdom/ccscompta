
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { DollarSign, Users, FileText, LayoutGrid, BarChart as BarChartIcon, PercentCircle, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, ResponsiveContainer, Label, LabelList, BarChart, PieChart } from 'recharts';
import type { Document, Client } from '@/lib/types';
import {type ChartConfig} from '@/components/ui/chart';
import type { IntelligentSearchOutput } from '@/ai/flows/intelligent-search-flow';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as ShadcnTableFooter } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranding } from '@/components/branding-provider';

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

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
  "Loyer": { label: "Loyer", color: "hsl(var(--chart-1))" },
  "Autre": { label: "Autre", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

const defaultVisibleComponents = {
    keyStats: true,
    expensesByMonth: true,
    distributionByCategory: true,
    expensesByVendor: true,
    averageSpendByType: true,
}

export default function AnalyticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
    const [visibleComponents, setVisibleComponents] = useState(defaultVisibleComponents);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [clientName, setClientName] = useState('Vue d\'ensemble');

    const { profile: userProfile, role: userRole } = useBranding();

    // Explicit block for Super Admin to force impersonation
    if (userRole === 'admin') {
        return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
                <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
                    <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black font-space tracking-tight mb-4 text-foreground">Zone Interdite</h2>
                    <p className="text-muted-foreground mb-8 text-lg font-medium">L'analyse financière directe est restreinte pour le Super Admin. Veuillez impersonner un cabinet pour accéder à ses analyses.</p>
                    <Button onClick={() => router.push('/dashboard/cabinets')} className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                        Aller à la Gestion Cabinets
                    </Button>
                </Card>
            </div>
        )
    }

    const clientRef = useMemoFirebase(() => {
        if (!selectedClientId) return null;
        return doc(db, 'clients', selectedClientId);
    }, [selectedClientId]);
    const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

    const documentsQuery = useMemoFirebase(() => {
        if (!selectedClientId || !userProfile || !userProfile.cabinetId) return null;
        return query(
            collection(db, 'documents'), 
            where('clientId', '==', selectedClientId), 
            where('cabinetId', '==', userProfile.cabinetId)
        );
    }, [selectedClientId, userProfile]);
    const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

    useEffect(() => {
        const loadState = () => {
            setIsLoading(true);
            try {
                const storedClientId = localStorage.getItem('selectedClientId');
                setSelectedClientId(storedClientId);
                
                const storedQuery = localStorage.getItem('searchQuery');
                if (storedQuery) setSearchQuery(storedQuery);
                const storedCriteria = localStorage.getItem('searchCriteria');
                if (storedCriteria) setSearchCriteria(JSON.parse(storedCriteria));
                const storedVisibility = localStorage.getItem('analyticsVisibility');
                if (storedVisibility) setVisibleComponents(JSON.parse(storedVisibility));

            } catch (e) {
                console.error("Failed to load documents", e);
            } finally {
                setIsLoading(false);
            }
        }
        loadState();
        window.addEventListener('storage', loadState);
        return () => window.removeEventListener('storage', loadState);
    }, []);

    useEffect(() => {
        if (client) {
            setClientName(`Analyse pour ${client.name}`);
        } else if (!selectedClientId && !isLoadingClient) {
            setClientName('Veuillez sélectionner un client');
        }
    }, [client, selectedClientId, isLoadingClient]);


     useEffect(() => {
        try {
            localStorage.setItem('analyticsVisibility', JSON.stringify(visibleComponents));
        } catch (error) {
            console.error("Failed to save visibility state to localStorage", error);
        }
    }, [visibleComponents]);
    
    const filteredDocuments = useMemo(() => {
        if (!documents) return [];
        let docs = [...documents];
        
        if (searchCriteria) {
            const { documentTypes, minAmount, maxAmount, startDate, endDate, vendor, keywords, originalQuery } = searchCriteria;

            if (documentTypes && documentTypes.length > 0) {
                docs = docs.filter(d => d.type && documentTypes.some(type => d.type!.toLowerCase().includes(type.toLowerCase())));
            }
            if (minAmount != null) {
                docs = docs.filter(d => d.extractedData?.amounts?.some(a => a != null && a >= minAmount));
            }
            if (maxAmount != null) {
                docs = docs.filter(d => d.extractedData?.amounts?.some(a => a != null && a <= maxAmount));
            }
            if (startDate) {
                docs = docs.filter(d => d.extractedData?.dates?.some(date => date != null && new Date(date) >= new Date(startDate)));
            }
            if (endDate) {
                docs = docs.filter(d => d.extractedData?.dates?.some(date => date != null && new Date(date) <= new Date(endDate)));
            }
            if (vendor) {
                const lowerVendor = vendor.toLowerCase();
                docs = docs.filter(d => d.extractedData?.vendorNames?.some(v => v != null && v.toLowerCase().includes(lowerVendor)));
            }
            if (keywords && keywords.length > 0) {
                docs = docs.filter(d => {
                    const searchableText = [d.name, d.extractedData?.otherInformation || '', ...(d.extractedData?.vendorNames || [])].join(' ').toLowerCase();
                    return keywords.every(kw => searchableText.includes(kw.toLowerCase()));
                });
            }
            if (!docs.length && originalQuery) {
                 const lowercasedQuery = originalQuery.toLowerCase();
                 docs = [...documents].filter(doc => 
                    doc.name.toLowerCase().includes(lowercasedQuery) ||
                    (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(v => v != null && v.toLowerCase().includes(lowercasedQuery)))
                );
            }

        } else if (searchQuery) {
             const lowercasedQuery = searchQuery.toLowerCase();
            docs = docs.filter(doc => 
                doc.name.toLowerCase().includes(lowercasedQuery) ||
                (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(vendor => vendor != null && vendor.toLowerCase().includes(lowercasedQuery)))
            );
        }
        return docs;
    }, [documents, searchQuery, searchCriteria]);

    const analyticsData = useMemo(() => {
        if (!filteredDocuments) return null;
        const approvedDocs = filteredDocuments.filter(d => d.status === 'approved' && d.extractedData?.amounts?.[0] && d.extractedData?.dates?.[0]);

        if (approvedDocs.length === 0) {
            return null;
        }

        const totalSpent = approvedDocs.reduce((sum, doc) => sum + (doc.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0), 0);
        const totalVat = approvedDocs.reduce((sum, doc) => sum + (doc.extractedData?.vatAmount ?? 0), 0);
        const averageSpent = approvedDocs.length > 0 ? totalSpent / approvedDocs.length : 0;
        
        const expensesByMonth = approvedDocs.reduce((acc, doc) => {
            const rawDate = doc.extractedData?.dates?.[0];
            if (!rawDate) return acc;
            const date = new Date(rawDate);
            const month = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).replace('.', '');
            const amount = doc.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
            if (!acc[month]) acc[month] = 0;
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

        const expensesByVendor = approvedDocs.reduce((acc, doc) => {
            const vendor = doc.extractedData?.vendorNames?.[0] ?? 'Inconnu';
            const amount = doc.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
            if (!acc[vendor]) acc[vendor] = 0;
            acc[vendor] += amount;
            return acc;
        }, {} as Record<string, number>);
        
        const vendorChartData = Object.entries(expensesByVendor)
            .map(([name, total]) => ({ name, total }))
            .sort((a,b) => b.total - a.total).slice(0, 5);
        
        const mainVendor = vendorChartData.length > 0 ? vendorChartData[0].name : 'N/A';

        const expensesByCategory = approvedDocs.reduce((acc, doc) => {
            const category = doc.extractedData?.category ?? 'Autre';
            if (!acc[category]) acc[category] = 0;
            acc[category] += doc.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
            return acc;
        }, {} as Record<string, number>);

        const CATEGORY_COLORS: Record<string, string> = {
            "Fournitures de bureau": "hsl(var(--chart-1))",
            "Transport": "hsl(var(--chart-2))",
            "Repas et divertissement": "hsl(var(--chart-3))",
            "Services informatiques": "hsl(var(--chart-4))",
            "Déplacements": "hsl(var(--chart-5))",
            "Loyer": "hsl(var(--chart-1))",
            "Autre": "hsl(var(--chart-2))",
        };

        const categoryChartData = Object.entries(expensesByCategory).map(([name, value]) => ({ 
            name, 
            value, 
            fill: CATEGORY_COLORS[name] ?? CATEGORY_COLORS['Autre']
        }));
        
        const spendByType = approvedDocs.reduce((acc, doc) => {
            const type = doc.type || 'other';
            const amount = doc.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
            if (!acc[type]) acc[type] = { total: 0, count: 0 };
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
            totalVat,
            averageSpent,
            mainVendor,
            monthlyChartData,
            vendorChartData,
            categoryChartData,
            averageSpendByTypeChartData,
            approvedDocs,
            approvedDocsCount: approvedDocs.length
        };
    }, [filteredDocuments]);

    const handleVisibilityChange = (key: keyof typeof visibleComponents, checked: boolean) => {
        setVisibleComponents(prev => ({
            ...prev,
            [key]: checked
        }));
    }

    const PieCenterLabel = ({ viewBox }: any) => {
        if (!analyticsData) return null;
        const { cx, cy } = viewBox;
        const total = analyticsData.categoryChartData.reduce((acc, entry) => acc + entry.value, 0);
        return (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                <tspan x={cx} y={cy} className="text-3xl font-bold fill-foreground">
                    {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </tspan>
                <tspan x={cx} y={cy + 20} className="text-sm text-muted-foreground">
                    Total Dépenses
                </tspan>
            </text>
        );
    };

    if (isLoading || isLoadingClient || isLoadingDocuments) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-5 w-80 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
                </div>
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    <Skeleton className="h-80" />
                    <Skeleton className="h-80" />
                 </div>
            </div>
        )
    }

    if (!selectedClientId) {
         return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
                <Card className="w-full max-w-md text-center">
                     <CardHeader>
                        <BarChartIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                        <CardTitle className="mt-4">Aucun client sélectionné</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Veuillez sélectionner un client dans la barre de navigation pour afficher ses analyses.</p>
                    </CardContent>
                </Card>
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
                        <p className="text-muted-foreground">Aucun document approuvé ne correspond aux critères actuels. Essayez de modifier votre sélection de client ou vos filtres de recherche.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{clientName}</h1>
                <p className="text-muted-foreground mt-1">Analyse financière avancée — documents approuvés par le cabinet.</p>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline"><LayoutGrid className="mr-2 h-4 w-4" />Personnaliser</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Afficher/Masquer les composants</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={visibleComponents.keyStats} onCheckedChange={(checked: boolean) => handleVisibilityChange('keyStats', checked)}>Statistiques Clés</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleComponents.expensesByMonth} onCheckedChange={(checked: boolean) => handleVisibilityChange('expensesByMonth', checked)}>Dépenses par Mois</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleComponents.distributionByCategory} onCheckedChange={(checked: boolean) => handleVisibilityChange('distributionByCategory', checked)}>Dépenses par Catégorie</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleComponents.expensesByVendor} onCheckedChange={(checked: boolean) => handleVisibilityChange('expensesByVendor', checked)}>Dépenses par Fournisseur</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleComponents.averageSpendByType} onCheckedChange={(checked: boolean) => handleVisibilityChange('averageSpendByType', checked)}>Dépense Moyenne par Type</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

       {visibleComponents.keyStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border-primary/10 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Dépenses (TTC)</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{analyticsData.totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground mt-1">Basé sur {analyticsData.approvedDocsCount} documents approuvés</p>
            </CardContent>
          </Card>
           <Card className="bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border-emerald-500/10 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TVA Déductible</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><PercentCircle className="h-4 w-4 text-emerald-500" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{analyticsData.totalVat.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground mt-1">Sur les documents de la période</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fournisseur Principal</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center"><Users className="h-4 w-4 text-orange-500" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">{analyticsData.mainVendor}</div>
              <p className="text-xs text-muted-foreground mt-1">Plus grand volume de dépenses</p>
            </CardContent>
          </Card>
           <Card className="bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Panier Moyen / Doc</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{analyticsData.averageSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
               <p className="text-xs text-muted-foreground mt-1">Moyenne des montants validés</p>
            </CardContent>
          </Card>
        </div>
       )}

        <Tabs defaultValue="overview">
            <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="vat_analysis">Analyse TVA</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6 mt-4">
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {visibleComponents.expensesByMonth && (
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Dépenses par Mois</CardTitle>
                            <CardDescription>Évolution des dépenses totales approuvées au fil du temps.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.monthlyChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
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
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    )}

                    {visibleComponents.distributionByCategory && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Répartition par Catégorie</CardTitle>
                            <CardDescription>Distribution des dépenses par catégorie comptable.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-w-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value, name, payload) => <div className="flex flex-col"><span className="font-semibold">{chartConfig[payload.name as keyof typeof chartConfig]?.label}</span><span className="text-muted-foreground">{Number(payload.value).toLocaleString('fr-FR', {style:'currency', currency: 'EUR'})}</span></div>}/>} />
                                    <Pie
                                        data={analyticsData.categoryChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        innerRadius={60}
                                        labelLine={false}
                                    >
                                        <Label content={<PieCenterLabel />} />
                                        {analyticsData.categoryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="name" />} className="flex-wrap" />
                                </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {visibleComponents.expensesByVendor && (
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Top 5 des Dépenses par Fournisseur</CardTitle>
                            <CardDescription>Classement des fournisseurs par montant total dépensé.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={analyticsData.vendorChartData} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
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
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    )}
                    {visibleComponents.averageSpendByType && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Dépense Moyenne par Type</CardTitle>
                            <CardDescription>Montant moyen des dépenses pour chaque type de document.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.averageSpendByTypeChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
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
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="vat_analysis" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Détail de la TVA Déductible</CardTitle>
                        <CardDescription>Liste de tous les documents approuvés avec TVA pour la période sélectionnée.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Document</TableHead>
                                    <TableHead>Fournisseur</TableHead>
                                    <TableHead className="text-right">Total HT</TableHead>
                                    <TableHead className="text-right">Taux TVA</TableHead>
                                    <TableHead className="text-right">Montant TVA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyticsData.approvedDocs.filter(d => d.extractedData?.vatAmount).map(doc => {
                                    const totalTTC = doc.extractedData!.amounts?.[0] ?? 0;
                                    const vatAmount = doc.extractedData!.vatAmount ?? 0;
                                    const ht = totalTTC - vatAmount;
                                    return (
                                        <TableRow key={doc.id}>
                                            <TableCell>{new Date(doc.extractedData!.dates![0]!).toLocaleDateString('fr-FR')}</TableCell>
                                            <TableCell className="font-medium">{doc.name}</TableCell>
                                            <TableCell>{doc.extractedData!.vendorNames?.[0]}</TableCell>
                                            <TableCell className="text-right">{ht.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
                                            <TableCell className="text-right">{doc.extractedData!.vatRate}%</TableCell>
                                            <TableCell className="text-right font-semibold">{vatAmount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                             <ShadcnTableFooter>
                                <TableRow className="font-bold text-base bg-muted/50">
                                    <TableCell colSpan={5} className="text-right">Total TVA Déductible</TableCell>
                                    <TableCell className="text-right">{analyticsData.totalVat.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
                                </TableRow>
                            </ShadcnTableFooter>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
       
    </div>
  );
}
    
    