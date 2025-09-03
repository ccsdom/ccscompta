
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, FileText, LayoutGrid } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, ResponsiveContainer, Label, LabelList, BarChart, PieChart } from 'recharts';
import type { Document } from '../documents/page'; 
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


// Mock data - In a real app, this would come from a shared state or API
const MOCK_DOCUMENTS: Document[] = [
  { id: '1', name: 'facture-apple.pdf', uploadDate: '15/06/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', clientId: 'alpha', type: 'invoice', extractedData: { dates: ['2024-06-15'], amounts: [1200.50], vendorNames: ['Apple'], category: 'Services informatiques', otherInformation: '' }, auditTrail: [], comments:[] },
  { id: '2', name: 'recu-hotel.pdf', uploadDate: '10/06/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', clientId: 'alpha', type: 'receipt', extractedData: { dates: ['2024-06-10'], amounts: [350.00], vendorNames: ['Hilton Hotels'], category: 'Déplacements', otherInformation: '' }, auditTrail: [], comments:[] },
  { id: '3', name: 'facture-google.pdf', uploadDate: '05/06/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', clientId: 'beta', type: 'invoice', extractedData: { dates: ['2024-06-05'], amounts: [450.75], vendorNames: ['Google'], category: 'Services informatiques', otherInformation: '' }, auditTrail: [], comments:[] },
  { id: '4', name: 'facture-aws.pdf', uploadDate: '22/05/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', clientId: 'gamma', type: 'invoice', extractedData: { dates: ['2024-05-22'], amounts: [890.20], vendorNames: ['AWS'], category: 'Services informatiques', otherInformation: '' }, auditTrail: [], comments:[] },
  { id: '5', name: 'recu-restaurant.pdf', uploadDate: '18/05/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', clientId: 'alpha', type: 'receipt', extractedData: { dates: ['2024-05-18'], amounts: [120.00], vendorNames: ['Le Fouquet\'s'], category: 'Repas et divertissement', otherInformation: '' }, auditTrail: [], comments:[] },
  { id: '6', name: 'releve-bancaire.pdf', uploadDate: '01/05/2024', status: 'reviewing', file: new File([], 'f'), dataUrl: '', clientId: 'beta', type: 'bank statement', auditTrail: [], comments:[] },
  { id: '7', name: 'facture-microsoft.pdf', uploadDate: '15/04/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', clientId: 'beta', type: 'invoice', extractedData: { dates: ['2024-04-15'], amounts: [750.00], vendorNames: ['Microsoft'], category: 'Fournitures de bureau', otherInformation: '' }, auditTrail: [], comments:[] },
  { id: '8', name: 'facture-adobe.pdf', uploadDate: '12/04/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', clientId: 'gamma', type: 'invoice', extractedData: { dates: ['2024-04-12'], amounts: [250.99], vendorNames: ['Adobe'], category: 'Services informatiques', otherInformation: '' }, auditTrail: [], comments:[] },
];

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
  "Fournitures de bureau": { label: "Fournitures", color: "hsl(var(--chart-1))" },
  "Transport": { label: "Transport", color: "hsl(var(--chart-2))" },
  "Repas et divertissement": { label: "Repas", color: "hsl(var(--chart-3))" },
  "Services informatiques": { label: "IT", color: "hsl(var(--chart-4))" },
  "Déplacements": { label: "Déplacements", color: "hsl(var(--chart-5))" },
  "Autre": { label: "Autre", color: "hsl(var(--chart-1))" }, // Fallback color
} satisfies ChartConfig

const defaultVisibleComponents = {
    keyStats: true,
    expensesByMonth: true,
    distributionByCategory: true,
    expensesByVendor: true,
    averageSpendByType: true,
}

export default function AnalyticsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCriteria, setSearchCriteria] = useState<IntelligentSearchOutput | null>(null);
    const [visibleComponents, setVisibleComponents] = useState(defaultVisibleComponents);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [clientName, setClientName] = useState<string>('');

    useEffect(() => {
        const loadState = () => {
            try {
                const storedDocs = localStorage.getItem('documents');
                 if (storedDocs) {
                    const parsedDocs = JSON.parse(storedDocs).map((d: any) => ({...d, file: new File([], d.name)}));
                    const initialDocs = parsedDocs.length > 0 ? parsedDocs : MOCK_DOCUMENTS;
                    setDocuments(initialDocs);
                } else {
                    setDocuments(MOCK_DOCUMENTS);
                }

                const storedQuery = localStorage.getItem('searchQuery');
                if (storedQuery) {
                    setSearchQuery(storedQuery);
                }

                const storedCriteria = localStorage.getItem('searchCriteria');
                if (storedCriteria) {
                    setSearchCriteria(JSON.parse(storedCriteria));
                }

                const storedVisibility = localStorage.getItem('analyticsVisibility');
                if (storedVisibility) {
                    setVisibleComponents(JSON.parse(storedVisibility));
                }
                const storedClientId = localStorage.getItem('selectedClientId');
                if (storedClientId) {
                    setSelectedClientId(storedClientId);
                    // This is a mock, in a real app you'd fetch the client's name.
                    const client = [
                        { id: 'alpha', name: 'Entreprise Alpha'},
                        { id: 'beta', name: 'Bêta SARL'},
                        { id: 'gamma', name: 'Gamma Inc.'},
                        { id: 'delta', name: 'Delta Industries'},
                        { id: 'epsilon', name: 'Epsilon Global'},
                    ].find(c => c.id === storedClientId);
                    setClientName(client ? `pour ${client.name}` : '');
                }

            } catch (e) {
                console.error("Failed to parse documents from local storage", e)
                setDocuments(MOCK_DOCUMENTS);
            }
        }
        loadState();
        window.addEventListener('storage', loadState);
        return () => window.removeEventListener('storage', loadState);
    }, [])

     useEffect(() => {
        try {
            localStorage.setItem('analyticsVisibility', JSON.stringify(visibleComponents));
        } catch (error) {
            console.error("Failed to save visibility state to localStorage", error);
        }
    }, [visibleComponents]);
    
    const filteredDocuments = useMemo(() => {
        let docs = [...documents].filter(d => d.clientId === selectedClientId);
        
        if (!selectedClientId) return [];

        if (searchCriteria) {
            // AI Search Logic
            const { documentTypes, minAmount, maxAmount, startDate, endDate, vendor, keywords, originalQuery } = searchCriteria;

            if (documentTypes && documentTypes.length > 0) {
                docs = docs.filter(d => d.type && documentTypes.some(type => d.type!.toLowerCase().includes(type.toLowerCase())));
            }
            if (minAmount) {
                docs = docs.filter(d => d.extractedData && d.extractedData.amounts && d.extractedData.amounts.some(a => a >= minAmount));
            }
            if (maxAmount) {
                docs = docs.filter(d => d.extractedData && d.extractedData.amounts && d.extractedData.amounts.some(a => a <= maxAmount));
            }
            if (startDate) {
                docs = docs.filter(d => d.extractedData && d.extractedData.dates && d.extractedData.dates.some(date => new Date(date) >= new Date(startDate)));
            }
            if (endDate) {
                docs = docs.filter(d => d.extractedData && d.extractedData.dates && d.extractedData.dates.some(date => new Date(date) <= new Date(endDate)));
            }
            if (vendor) {
                const lowerVendor = vendor.toLowerCase();
                docs = docs.filter(d => d.extractedData && d.extractedData.vendorNames && d.extractedData.vendorNames.some(v => v.toLowerCase().includes(lowerVendor)));
            }
            if (keywords && keywords.length > 0) {
                docs = docs.filter(d => {
                    const searchableText = [d.name, d.extractedData?.otherInformation || '', ...(d.extractedData?.vendorNames || [])].join(' ').toLowerCase();
                    return keywords.every(kw => searchableText.includes(kw.toLowerCase()));
                });
            }
            if (!docs.length && originalQuery) {
                 const lowercasedQuery = originalQuery.toLowerCase();
                 docs = [...documents].filter(d => d.clientId === selectedClientId).filter(doc => 
                    doc.name.toLowerCase().includes(lowercasedQuery) ||
                    (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(v => v.toLowerCase().includes(lowercasedQuery)))
                );
            }

        } else if (searchQuery) {
             // Fallback to simple search
            const lowercasedQuery = searchQuery.toLowerCase();
            docs = docs.filter(doc => 
                doc.name.toLowerCase().includes(lowercasedQuery) ||
                (doc.extractedData?.vendorNames && doc.extractedData.vendorNames.some(vendor => vendor.toLowerCase().includes(lowercasedQuery)))
            );
        }
        return docs;
    }, [documents, searchQuery, searchCriteria, selectedClientId]);

    const analyticsData = useMemo(() => {
        const approvedDocs = filteredDocuments.filter(d => d.status === 'approved' && d.extractedData && d.extractedData.amounts && d.extractedData.amounts.length > 0 && d.extractedData.dates && d.extractedData.dates.length > 0);

        const totalSpent = approvedDocs.reduce((sum, doc) => sum + (doc.extractedData?.amounts.reduce((a, b) => a + b, 0) ?? 0), 0);
        const averageSpent = approvedDocs.length > 0 ? totalSpent / approvedDocs.length : 0;
        
        const expensesByMonth = approvedDocs.reduce((acc, doc) => {
            const date = new Date(doc.extractedData!.dates[0]);
            const month = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).replace('.', '');
            const amount = doc.extractedData!.amounts.reduce((a, b) => a + b, 0);
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

        const expensesByVendor = approvedDocs.reduce((acc, doc) => {
            const vendor = doc.extractedData!.vendorNames[0] || 'Inconnu';
            const amount = doc.extractedData!.amounts.reduce((a, b) => a + b, 0);
             if (!acc[vendor]) {
                acc[vendor] = 0;
            }
            acc[vendor] += amount;
            return acc;
        }, {} as Record<string, number>);
        
        const vendorChartData = Object.entries(expensesByVendor)
            .map(([name, total]) => ({ name, total }))
            .sort((a,b) => b.total - a.total).slice(0, 5);
        
        const mainVendor = vendorChartData.length > 0 ? vendorChartData[0].name : 'N/A';

        const expensesByCategory = approvedDocs.reduce((acc, doc) => {
            const category = doc.extractedData?.category || 'Autre';
             if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category]+= doc.extractedData!.amounts.reduce((a, b) => a + b, 0);
            return acc;
        }, {} as Record<string, number>);

        const categoryChartData = Object.entries(expensesByCategory).map(([name, value]) => ({ 
            name, 
            value, 
            fill: (chartConfig[name as keyof typeof chartConfig] || chartConfig['Autre'])?.color 
        }));
        
        const spendByType = approvedDocs.reduce((acc, doc) => {
            const type = doc.type || 'other';
            const amount = doc.extractedData!.amounts.reduce((a, b) => a + b, 0);
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
            mainVendor,
            monthlyChartData,
            vendorChartData,
            categoryChartData,
            averageSpendByTypeChartData,
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

    if (!selectedClientId) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Aucun client sélectionné</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Veuillez sélectionner un client dans le menu en haut à gauche pour afficher ses analyses détaillées.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analyse Détaillée {clientName}</h1>
                <p className="text-muted-foreground mt-1">Visualisez les données extraites des documents approuvés pour le client sélectionné.</p>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline"><LayoutGrid className="mr-2 h-4 w-4" />Personnaliser</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Afficher/Masquer les composants</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={visibleComponents.keyStats} onCheckedChange={(checked) => handleVisibilityChange('keyStats', !!checked)}>Statistiques Clés</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleComponents.expensesByMonth} onCheckedChange={(checked) => handleVisibilityChange('expensesByMonth', !!checked)}>Dépenses par Mois</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleComponents.distributionByCategory} onCheckedChange={(checked) => handleVisibilityChange('distributionByCategory', !!checked)}>Dépenses par Catégorie</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleComponents.expensesByVendor} onCheckedChange={(checked) => handleVisibilityChange('expensesByVendor', !!checked)}>Dépenses par Fournisseur</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={visibleComponents.averageSpendByType} onCheckedChange={(checked) => handleVisibilityChange('averageSpendByType', !!checked)}>Dépense Moyenne par Type</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

       {visibleComponents.keyStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dépenses Approuvées</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
              <p className="text-xs text-muted-foreground">Basé sur {analyticsData.approvedDocsCount} documents approuvés</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépense Moyenne / Document</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.averageSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
               <p className="text-xs text-muted-foreground">Moyenne des montants validés</p>
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
       )}

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
                            <ChartLegend content={<ChartLegendContent nameKey="name" formatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}/>} className="flex-wrap" />
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
    </div>
  );
}
