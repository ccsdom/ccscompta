'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart, PieChart, LineChart, DollarSign, Users, FileText } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, Cell, ResponsiveContainer, Label, LabelList } from 'recharts';
import type { Document } from '../documents/page'; // Reuse the type

// Mock data - In a real app, this would come from a shared state or API
const MOCK_DOCUMENTS: Document[] = [
  { id: '1', name: 'facture-apple.pdf', uploadDate: '15/06/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', type: 'invoice', extractedData: { dates: ['2024-06-15'], amounts: [1200.50], vendorNames: ['Apple'], otherInformation: '' } },
  { id: '2', name: 'recu-hotel.pdf', uploadDate: '10/06/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', type: 'receipt', extractedData: { dates: ['2024-06-10'], amounts: [350.00], vendorNames: ['Hilton Hotels'], otherInformation: '' } },
  { id: '3', name: 'facture-google.pdf', uploadDate: '05/06/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', type: 'invoice', extractedData: { dates: ['2024-06-05'], amounts: [450.75], vendorNames: ['Google'], otherInformation: '' } },
  { id: '4', name: 'facture-aws.pdf', uploadDate: '22/05/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', type: 'invoice', extractedData: { dates: ['2024-05-22'], amounts: [890.20], vendorNames: ['AWS'], otherInformation: '' } },
  { id: '5', name: 'recu-restaurant.pdf', uploadDate: '18/05/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', type: 'receipt', extractedData: { dates: ['2024-05-18'], amounts: [120.00], vendorNames: ['Le Fouquet\'s'], otherInformation: '' } },
  { id: '6', name: 'releve-bancaire.pdf', uploadDate: '01/05/2024', status: 'reviewing', file: new File([], 'f'), dataUrl: '', type: 'bank statement' },
  { id: '7', name: 'facture-microsoft.pdf', uploadDate: '15/04/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', type: 'invoice', extractedData: { dates: ['2024-04-15'], amounts: [750.00], vendorNames: ['Microsoft'], otherInformation: '' } },
  { id: '8', name: 'facture-adobe.pdf', uploadDate: '12/04/2024', status: 'approved', file: new File([], 'f'), dataUrl: '', type: 'invoice', extractedData: { dates: ['2024-04-12'], amounts: [250.99], vendorNames: ['Adobe'], otherInformation: '' } },
];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalyticsPage() {
    // In a real app, you'd fetch this data or get it from a global state
    const [documents, setDocuments] = useState<Document[]>([]);

    useEffect(() => {
        // Simulating data fetching
        setDocuments(MOCK_DOCUMENTS);
    }, [])

    const analyticsData = useMemo(() => {
        const approvedDocs = documents.filter(d => d.status === 'approved' && d.extractedData);

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
                const d1 = new Date(`01 ${m1} 20${y1}`);
                const d2 = new Date(`01 ${m2} 20${y2}`);
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

        const docsByType = documents.reduce((acc, doc) => {
            const type = doc.type || 'Inconnu';
             if (!acc[type]) {
                acc[type] = 0;
            }
            acc[type]++;
            return acc;
        }, {} as Record<string, number>);

        const typeChartData = Object.entries(docsByType).map(([name, value]) => ({ name, value }));

        return {
            totalSpent,
            averageSpent,
            mainVendor,
            monthlyChartData,
            vendorChartData,
            typeChartData
        }
    }, [documents]);

    const chartConfig = {
      total: {
        label: "Total",
        color: "hsl(var(--chart-1))",
      },
    }

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dépenses Approuvées</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
              <p className="text-xs text-muted-foreground">Basé sur {documents.filter(d=>d.status === 'approved').length} documents approuvés</p>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
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
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
                                        indicator="dot" 
                                    />}
                                />
                                <Bar dataKey="total" fill="var(--color-total)" radius={4}>
                                     <LabelList dataKey="total" position="top" offset={8} className="fill-foreground text-xs" formatter={(value: number) => `${value.toLocaleString('fr-FR')}€`} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Répartition par Type</CardTitle>
                    <CardDescription>Distribution des documents par type.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={analyticsData.typeChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                dataKey="value"
                                nameKey="name"
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                    return (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                    );
                                }}
                            >
                            {analyticsData.typeChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Legend content={<ChartLegendContent />} />
                        </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
        
         <div className="grid grid-cols-1 gap-6">
            <Card>
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
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
                                        indicator="dot" 
                                    />}
                                />
                                <Bar dataKey="total" fill="var(--color-total)" radius={4} layout="vertical">
                                    <LabelList dataKey="total" position="right" offset={8} className="fill-foreground text-xs" formatter={(value: number) => `${value.toLocaleString('fr-FR')}€`} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
