
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Banknote, Users, TrendingUp, TrendingDown, FileCheck2, UserCheck, CalendarDays } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, LabelList, ResponsiveContainer, YAxis } from "recharts";
import {type ChartConfig} from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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

const monthlyRevenueData = [
  { month: 'Jan 24', revenue: 18600 },
  { month: 'Fév 24', revenue: 30500 },
  { month: 'Mar 24', revenue: 23700 },
  { month: 'Avr 24', revenue: 73000, label: 'Bilans' },
  { month: 'Mai 24', revenue: 20900 },
  { month: 'Juin 24', revenue: 21400 },
]

const topClientsData = [
    { name: 'Delta Industries', revenue: 15230, status: 'paid' },
    { name: 'Entreprise Alpha', revenue: 12800, status: 'paid' },
    { name: 'Gamma Inc.', revenue: 9500, status: 'overdue' },
    { name: 'Bêta SARL', revenue: 7800, status: 'paid' },
    { name: 'Epsilon Global', revenue: 4500, status: 'pending' },
]


export default function ReportingPage() {
    const [timeRange, setTimeRange] = useState('6m');

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
                        <CardTitle className="text-sm font-medium">Chiffre d'affaires (Annuel)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">450,231.89€</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500"/>
                            +20.1% par rapport à l'année dernière
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,250.00€</div>
                        <p className="text-xs text-muted-foreground">
                            Sur 8 factures non réglées
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">73</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                           <TrendingUp className="h-3 w-3 text-green-500"/>
                           +5 depuis le dernier trimestre
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents Traités (Mois)</CardTitle>
                        <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,832</div>
                         <p className="text-xs text-muted-foreground flex items-center gap-1">
                           <TrendingDown className="h-3 w-3 text-red-500"/>
                           -12% par rapport au mois dernier
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Chiffre d'affaires mensuel</CardTitle>
                        <CardDescription>Évolution du CA facturé sur la période sélectionnée.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyRevenueData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis tickFormatter={(value) => `${(value as number / 1000)}k€`} tickLine={false} axisLine={false} />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent 
                                            formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
                                            indicator="dot" 
                                        />}
                                    />
                                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={5}>
                                        <LabelList dataKey="revenue" position="top" offset={8} className="fill-foreground text-xs" formatter={(value: number) => `${value.toLocaleString('fr-FR', {notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1, minimumFractionDigits: 1})}€`} />
                                        <LabelList dataKey="label" position="top" offset={-15} className="fill-background text-xs font-bold"/>
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Classement des clients</CardTitle>
                        <CardDescription>Top clients par chiffre d'affaires sur la période sélectionnée.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">CA facturé</TableHead>
                                    <TableHead className="text-center">Statut de paiement</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topClientsData.map(client => (
                                    <TableRow key={client.name}>
                                        <TableCell className="font-medium flex items-center gap-3">
                                             <Avatar className="h-8 w-8 border">
                                                <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {client.name}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{client.revenue.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
                                        <TableCell className="text-center">
                                            {client.status === 'paid' && <Badge>À jour</Badge>}
                                            {client.status === 'pending' && <Badge variant="secondary">En attente</Badge>}
                                            {client.status === 'overdue' && <Badge variant="destructive">En retard</Badge>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Bons payeurs</CardTitle>
                        <CardDescription>Clients les plus rapides à régler leurs factures.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                            <span className="text-2xl font-bold">🥇</span>
                            <div>
                                <p className="font-semibold">Entreprise Alpha</p>
                                <p className="text-xs text-muted-foreground">Paye en moyenne 2 jours avant l'échéance</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                             <span className="text-2xl font-bold">🥈</span>
                            <div>
                                <p className="font-semibold">Bêta SARL</p>
                                <p className="text-xs text-muted-foreground">Paye en moyenne le jour de l'échéance</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                             <span className="text-2xl font-bold">🥉</span>
                            <div>
                                <p className="font-semibold">Delta Industries</p>
                                <p className="text-xs text-muted-foreground">Paye en moyenne 5 jours après l'échéance</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
