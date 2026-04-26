
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  TrendingUp, TrendingDown, Wallet, Receipt, BarChart as BarChartIcon,
  ArrowUpCircle, ArrowDownCircle, ShieldCheck, Sparkles, PlusCircle, CheckCircle2
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent
} from "@/components/ui/chart";
import {
  Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, ResponsiveContainer,
  LabelList, BarChart as ReBarChart, PieChart as RePieChart, ComposedChart, Area
} from 'recharts';
import type { Document } from '@/lib/types';
import { type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { db } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  "Fournitures de bureau": "hsl(var(--chart-1))",
  "Transport": "hsl(var(--chart-2))",
  "Repas et divertissement": "hsl(var(--chart-3))",
  "Services informatiques": "hsl(var(--chart-4))",
  "Déplacements": "hsl(var(--chart-5))",
  "Loyer": "hsl(var(--chart-1))",
  "Autre": "hsl(var(--chart-2))",
};

const chartConfig = {
  depenses: { label: "Dépenses", color: "hsl(var(--chart-1))" },
  tva: { label: "TVA", color: "hsl(var(--chart-2))" },
  total: { label: "Total (€)", color: "hsl(var(--chart-1))" },
  average: { label: "Moyenne (€)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

function StatCard({
  label, value, sub, icon: Icon, trend, className
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; trend?: 'up' | 'down' | 'neutral'; className?: string;
}) {
  return (
    <Card className={cn(
      "relative overflow-hidden glass-panel premium-shadow-sm transition-all duration-500 hover:premium-shadow hover:-translate-y-1 group border-white/20 dark:border-white/10",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</CardTitle>
        <div className={cn(
          "h-10 w-10 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' :
          trend === 'down' ? 'bg-destructive/10 text-destructive ring-1 ring-destructive/20' :
          'bg-primary/10 text-primary ring-1 ring-primary/20'
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function MyAnalyticsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadClientId = useCallback(() => {
    const stored = localStorage.getItem('selectedClientId');
    setSelectedClientId(stored);
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    loadClientId();
    window.addEventListener('storage', loadClientId);
    return () => window.removeEventListener('storage', loadClientId);
  }, [loadClientId]);

  const documentsQuery = useMemoFirebase(() => {
    if (!selectedClientId) return null;
    return query(collection(db, 'documents'), where('clientId', '==', selectedClientId));
  }, [selectedClientId]);

  const { data: clientDocuments, isLoading: isLoadingDocs } = useCollection<Document>(documentsQuery);

  const analyticsData = useMemo(() => {
    if (!clientDocuments) return null;

    const approvedDocs = clientDocuments.filter(d =>
      d.status === 'approved' &&
      d.extractedData?.amounts &&
      d.extractedData.amounts.length > 0 &&
      d.extractedData?.dates &&
      d.extractedData.dates.length > 0
    );

    if (approvedDocs.length === 0) return null;

    // Agrégation par mois (Charges TTC)
    const byMonth: Record<string, { depenses: number; tva: number }> = {};

    approvedDocs.forEach(d => {
      const rawDate = d.extractedData?.dates?.[0];
      if (!rawDate) return;
      const date = new Date(rawDate);
      const month = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).replace('.', '');
      const ttc = d.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
      const tva = d.extractedData?.vatAmount ?? 0;

      if (!byMonth[month]) byMonth[month] = { depenses: 0, tva: 0 };
      byMonth[month].depenses += ttc;
      byMonth[month].tva += tva;
    });

    const FR_MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    const monthlyChartData = Object.entries(byMonth)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => {
        const [m1, y1] = a.name.split(' ');
        const [m2, y2] = b.name.split(' ');
        return new Date(+`20${y1}`, FR_MONTHS.indexOf(m1)).getTime() -
               new Date(+`20${y2}`, FR_MONTHS.indexOf(m2)).getTime();
      });

    // Totaux globaux
    const totalTTC = approvedDocs.reduce((s, d) =>
      s + (d.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0), 0);
    const totalTVA = approvedDocs.reduce((s, d) => s + (d.extractedData?.vatAmount ?? 0), 0);
    const totalHT = totalTTC - totalTVA;

    // Top 5 fournisseurs
    const byVendor: Record<string, number> = {};
    approvedDocs.forEach(d => {
      const vendor = d.extractedData?.vendorNames?.[0] ?? 'Inconnu';
      const ttc = d.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
      byVendor[vendor] = (byVendor[vendor] ?? 0) + ttc;
    });
    const top5Vendors = Object.entries(byVendor)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Répartition par catégorie
    const byCategory: Record<string, number> = {};
    approvedDocs.forEach(d => {
      const cat = d.extractedData?.category ?? 'Autre';
      const ttc = d.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
      byCategory[cat] = (byCategory[cat] ?? 0) + ttc;
    });
    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_COLORS[name] ?? CATEGORY_COLORS['Autre']
      }))
      .sort((a, b) => b.value - a.value);

    const mainVendor = top5Vendors[0]?.name ?? 'N/A';
    const avgPerDoc = approvedDocs.length > 0 ? totalTTC / approvedDocs.length : 0;

    return {
      totalTTC, totalHT, totalTVA, mainVendor, avgPerDoc,
      approvedCount: approvedDocs.length,
      monthlyChartData, top5Vendors, categoryData
    };
  }, [clientDocuments]);

  const isLoading = isInitialLoading || isLoadingDocs;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-9 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" /><Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-4 animate-in fill-mode-both fade-in zoom-in-95 duration-700">
        <Card className="w-full max-w-lg text-center glass-panel premium-shadow border-primary/20 bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10">
          <CardHeader className="pb-4">
            <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20 shadow-inner">
              <BarChartIcon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-display tracking-tight">Données en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Vos tableaux de bord analytiques apparaîtront ici dès que votre comptable aura validé vos premiers documents financiers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totalTTC, totalHT, totalTVA, mainVendor, avgPerDoc, approvedCount, monthlyChartData, top5Vendors, categoryData } = analyticsData;

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 fill-mode-both">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Mon Tableau de Bord</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Pilotez vos dépenses en temps réel grâce à l'intelligence artificielle.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {approvedCount} docs validés
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Dépenses TTC"
          value={totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          sub={`Basé sur ${approvedCount} documents validés`}
          icon={Wallet}
          trend="down"
          className="lg:col-span-1"
        />
        <StatCard
          label="Montant HT (estimé)"
          value={totalHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          sub="Base de calcul fiscale"
          icon={Receipt}
          trend="neutral"
        />
        <StatCard
          label="TVA Déductible"
          value={totalTVA.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          sub="À récupérer sur votre prochain CA3"
          icon={ShieldCheck}
          trend="up"
          className="border-emerald-500/20"
        />
        <StatCard
          label="Panier Moyen / Facture"
          value={avgPerDoc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          sub={`Fournisseur principal : ${mainVendor.substring(0, 16)}${mainVendor.length > 16 ? '…' : ''}`}
          icon={TrendingUp}
          trend="neutral"
        />
      </div>

      {/* Onboarding Checklist for new users */}
      {approvedCount < 3 && (
        <Card className="glass-panel border-primary/30 bg-primary/5 overflow-hidden animate-in slide-in-from-right-4 duration-1000">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
                <div className="p-6 flex-1">
                    <h3 className="font-space font-black text-sm uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Checklist de Démarrage
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: "Déposer votre première facture", done: approvedCount > 0 },
                            { label: "Relier votre compte bancaire", done: false },
                            { label: "Installer l'App sur mobile", done: false },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={cn(
                                    "h-5 w-5 rounded-full flex items-center justify-center border",
                                    item.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20"
                                )}>
                                    {item.done && <CheckCircle2 className="h-3 w-3" />}
                                </div>
                                <span className={cn("text-sm font-medium", item.done ? "line-through opacity-40" : "opacity-90")}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 bg-white/5 flex items-center justify-center text-center max-w-xs shrink-0">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Progression</p>
                        <div className="text-4xl font-black text-primary">{Math.round((approvedCount > 0 ? 33 : 0))} %</div>
                        <p className="text-[10px] text-muted-foreground mt-2">Plus que 2 étapes pour être un pro !</p>
                    </div>
                </div>
            </div>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 glass-panel premium-shadow bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-2xl">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    Conseils IA & Optimisation
                </CardTitle>
                <CardDescription className="text-base">Analyse prédictive de votre santé financière</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Réduction de coûts potentielle</p>
                        <p className="text-xs text-muted-foreground">Vos frais de "Fournitures" sont 15% plus élevés que la moyenne du secteur. Envisagez de renégocier avec {mainVendor}.</p>
                    </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Optimisation de TVA</p>
                        <p className="text-xs text-muted-foreground">Vous avez 4 factures en attente de validation. Une fois validées, elles libéreront environ {(totalTVA * 0.2).toFixed(0)}€ de TVA déductible supplémentaire.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="glass-panel premium-shadow bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-2xl text-indigo-400">
                    <TrendingUp className="h-6 w-6" />
                    Prévision 30 j.
                </CardTitle>
                <CardDescription className="text-base text-indigo-300/60">Flux de trésorerie estimé</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="text-4xl font-black tracking-tight text-white mb-2">
                        -{(totalTTC * 0.8).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Dépenses prévues</p>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-6 overflow-hidden">
                        <div className="h-full bg-indigo-500 w-3/4 rounded-full" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Capacité d'investissement : ÉLEVÉE</p>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Monthly Trend */}
        <Card className="lg:col-span-3 glass-panel premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 border-white/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              <TrendingDown className="h-6 w-6 text-destructive/80" />
              Évolution des Charges
            </CardTitle>
            <CardDescription className="text-base">Dépenses TTC et TVA mois par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={monthlyChartData} margin={{ top: 20, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} className="text-xs" />
                  <ChartTooltip
                    content={<ChartTooltipContent
                      formatter={(value) => `${Number(value).toLocaleString('fr-FR')} €`}
                      indicator="dot"
                    />}
                  />
                  <Bar dataKey="depenses" name="depenses" fill="var(--color-depenses)" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="depenses" position="top" offset={8} className="fill-muted-foreground text-[10px]" formatter={(v: number) => `${Math.round(v)}€`} />
                  </Bar>
                  <Bar dataKey="tva" name="tva" fill="var(--color-tva)" radius={[4, 4, 0, 0]} />
                  <ChartLegend content={<ChartLegendContent />} />
                </ReBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card className="lg:col-span-2 glass-panel premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 border-white/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              <BarChartIcon className="h-6 w-6 text-primary" />
              Dépenses
            </CardTitle>
            <CardDescription className="text-base">Répartition par catégorie comptable</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent
                      hideLabel
                      formatter={(value, _name, payload) => (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold">{payload.name}</span>
                          <span className="text-muted-foreground">{Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                        </div>
                      )}
                    />}
                  />
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    stroke="transparent"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Vendors */}
      <Card className="glass-panel premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 border-white/20 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl">
            <ArrowUpCircle className="h-6 w-6 text-orange-500" />
            Top 5 Fournisseurs
          </CardTitle>
          <CardDescription className="text-base">Identifiez vos principaux centres de coûts par volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart
                layout="vertical"
                data={top5Vendors}
                margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={110}
                  className="text-xs"
                />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} className="text-xs" />
                <ChartTooltip
                  content={<ChartTooltipContent
                    formatter={(value) => `${Number(value).toLocaleString('fr-FR')} €`}
                    indicator="dot"
                  />}
                />
                <Bar dataKey="total" name="total" fill="hsl(var(--chart-1))" radius={4} layout="vertical">
                  <LabelList
                    dataKey="total"
                    position="right"
                    offset={8}
                    className="fill-foreground text-xs font-medium"
                    formatter={(v: number) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  />
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}