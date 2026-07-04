'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  TrendingUp, TrendingDown, Wallet, Receipt, BarChart as BarChartIcon,
  ArrowUpCircle, ArrowDownCircle, ShieldCheck, Sparkles, PlusCircle, CheckCircle2,
  RefreshCw, AlertTriangle, Info, Calendar, Sliders, HelpCircle, Landmark, Coins
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent
} from "@/components/ui/chart";
import {
  Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, ResponsiveContainer,
  LabelList, BarChart as ReBarChart, PieChart as RePieChart, ComposedChart, Area, Line
} from 'recharts';
import type { Document, SalesInvoice } from '@/lib/types';
import { type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase, functions } from '@/firebase';
import { db } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Badge } from '@/components/ui/badge';
import { cn, parseDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

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
  depenses: { label: "Dépenses (€)", color: "hsl(var(--chart-1))" },
  revenus: { label: "Revenus (€)", color: "hsl(var(--chart-3))" },
  tva: { label: "TVA (€)", color: "hsl(var(--chart-2))" },
  balance: { label: "Trésorerie (€)", color: "#6366f1" },
  net: { label: "Flux Net (€)", color: "#10b981" },
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
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const { toast } = useToast();

  // Custom Controls for Simulation
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'vat'>('overview');
  const [startingBalance, setStartingBalance] = useState(12450);
  const [simulatedSubscriptions, setSimulatedSubscriptions] = useState([
    { id: 'loyer', label: 'Loyer Bureau', amount: 1500, active: true, desc: 'Prélèvement fixe mensuel' },
    { id: 'edf', label: 'EDF Pro', amount: 245.50, active: true, desc: 'Facturation bimestrielle' },
    { id: 'orange', label: 'Télécoms Orange', amount: 49.90, active: true, desc: 'Abonnement mobile + fibre' },
    { id: 'adobe', label: 'Abonnements SaaS', amount: 65.99, active: true, desc: 'Licences logicielles' },
    { id: 'payroll', label: 'Rémunérations', amount: 3200, active: true, desc: 'Salaires & charges dirigeants' }
  ]);

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

  const salesQuery = useMemoFirebase(() => {
    if (!selectedClientId) return null;
    return query(collection(db, 'sales_invoices'), where('clientId', '==', selectedClientId));
  }, [selectedClientId]);
  const { data: salesInvoices, isLoading: isLoadingSales } = useCollection<SalesInvoice>(salesQuery);

  const bankStatementsQuery = useMemoFirebase(() => {
    if (!selectedClientId) return null;
    return query(
      collection(db, 'documents'),
      where('clientId', '==', selectedClientId),
      where('type', '==', 'bank statement')
    );
  }, [selectedClientId]);
  const { data: bankStatements, isLoading: isLoadingBank } = useCollection<Document>(bankStatementsQuery);

  const briefingQuery = useMemoFirebase(() => {
    if (!selectedClientId) return null;
    return query(
        collection(db, 'notifications'), 
        where('clientId', '==', selectedClientId),
        where('type', '==', 'weekly_briefing')
    );
  }, [selectedClientId]);

  const { data: briefings, isLoading: isLoadingBriefings } = useCollection<any>(briefingQuery);

  const latestBriefing = useMemo(() => {
    if (!briefings || briefings.length === 0) return null;
    return [...briefings].sort((a, b) => (parseDate(b.date)?.getTime() || 0) - (parseDate(a.date)?.getTime() || 0))[0]?.extraData || null;
  }, [briefings]);

  const handleRefreshBriefing = async () => {
    if (!selectedClientId) return;
    setIsGeneratingBriefing(true);
    try {
        const requestWeeklySummary = httpsCallable(functions, 'requestWeeklySummary');
        const res = await requestWeeklySummary({ clientId: selectedClientId }) as any;
        if (res.data?.success) {
            toast({
                title: "Rapport IA généré avec succès",
                description: "Vos données ont été analysées.",
                variant: "default",
            });
        } else {
            toast({
                title: "Information",
                description: res.data?.message || "Action terminée.",
            });
        }
    } catch (err: any) {
        toast({
            title: "Erreur IA",
            description: err.message,
            variant: "destructive",
        });
    } finally {
        setIsGeneratingBriefing(false);
    }
  };

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

    // Agrégation par mois (Charges TTC, Revenus TTC, et Net)
    const byMonth: Record<string, { depenses: number; tva: number; revenus: number; net: number }> = {};

    approvedDocs.forEach(d => {
      const rawDate = d.extractedData?.dates?.[0];
      if (!rawDate) return;
      const date = parseDate(rawDate) || new Date();
      const month = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).replace('.', '');
      const ttc = d.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
      const tva = d.extractedData?.vatAmount ?? 0;

      if (!byMonth[month]) byMonth[month] = { depenses: 0, tva: 0, revenus: 0, net: 0 };
      byMonth[month].depenses += ttc;
      byMonth[month].tva += tva;
    });

    // Incorporer les factures de vente (Chiffre d'Affaires client) dans l'historique mensuel
    (salesInvoices || []).forEach(inv => {
      const rawDate = inv.date;
      if (!rawDate) return;
      const date = parseDate(rawDate) || new Date();
      const month = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).replace('.', '');
      const ttc = inv.totalTTC || 0;

      if (!byMonth[month]) byMonth[month] = { depenses: 0, tva: 0, revenus: 0, net: 0 };
      byMonth[month].revenus += ttc;
    });

    // Calculer le flux net mensuel
    Object.keys(byMonth).forEach(month => {
      byMonth[month].net = byMonth[month].revenus - byMonth[month].depenses;
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

    // Totaux globaux dépenses
    const totalTTC = approvedDocs.reduce((s, d) =>
      s + (d.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0), 0);
    const totalTVA = approvedDocs.reduce((s, d) => s + (d.extractedData?.vatAmount ?? 0), 0);
    const totalHT = totalTTC - totalTVA;

    // Totaux globaux revenus
    const totalRevenueTTC = (salesInvoices || []).reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const totalRevenueTVA = (salesInvoices || []).reduce((s, inv) => s + (inv.totalVAT || 0), 0);
    const totalRevenueHT = totalRevenueTTC - totalRevenueTVA;

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
      totalRevenueTTC, totalRevenueHT, totalRevenueTVA,
      approvedCount: approvedDocs.length,
      monthlyChartData, top5Vendors, categoryData,
      approvedDocs,
    };
  }, [clientDocuments, salesInvoices]);

  // ── Calcul de trésorerie prédictive avec simulations ─────────────────────────
  const { predictiveCashflowData, projectedBalance30j, recurringDeductionsTotal } = useMemo(() => {
    const fallback = {
      predictiveCashflowData: [] as { date: string; balance: number; inflow: number; outflow: number; subs: number }[],
      projectedBalance30j: 0,
      recurringDeductionsTotal: 0
    };
    if (!analyticsData) return fallback;

    const now = new Date();
    const horizons = [
      { label: 'Auj.', days: 0 },
      { label: '+15j', days: 15 },
      { label: '+30j', days: 30 },
      { label: '+60j', days: 60 },
      { label: '+90j', days: 90 },
    ];

    // 1. Identifier les documents déjà rapprochés via les relevés bancaires
    const matchedDocIds = new Set<string>();
    (bankStatements || []).forEach(bs => {
      const txs = (bs as any).extractedData?.transactions || [];
      txs.forEach((tx: any) => {
        if (tx.matchingDocumentId) matchedDocIds.add(tx.matchingDocumentId);
      });
    });

    // 2. Dettes (factures d'achat approuvées non rapprochées)
    const unpaidPayables = (analyticsData.approvedDocs || []).filter(d => !matchedDocIds.has(d.id));
    const payablesByHorizon = horizons.map(h => {
      const cutoff = new Date(now.getTime() + h.days * 86_400_000);
      return unpaidPayables
        .filter(d => {
          const docDate = parseDate(d.extractedData?.dates?.[0] ?? '') || new Date(d.uploadDate || now);
          const dueDate = new Date(docDate.getTime() + 30 * 86_400_000); // échéance à +30j
          return dueDate <= cutoff;
        })
        .reduce((sum, d) => sum + (d.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0), 0);
    });

    // 3. Créances (factures de vente non payées — statut sent ou overdue)
    const unpaidReceivables = (salesInvoices || []).filter(
      inv => inv.status === 'sent' || inv.status === 'overdue'
    );
    const receivablesByHorizon = horizons.map(h => {
      const cutoff = new Date(now.getTime() + h.days * 86_400_000);
      return unpaidReceivables
        .filter(inv => {
          const dueDate = parseDate(inv.dueDate) || new Date(now.getTime() + 30 * 86_400_000);
          return dueDate <= cutoff;
        })
        .reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    });

    // 4. Somme des abonnements/échéances récurrentes simulés activés (par mois)
    const activeSubsTotal = simulatedSubscriptions
      .filter(s => s.active)
      .reduce((sum, s) => sum + s.amount, 0);

    // 5. TVA nette estimée (collectée - déductible)
    const totalVatCollected = unpaidReceivables.reduce((s, inv) => s + (inv.totalVAT || 0), 0);
    const totalVatDeductible = analyticsData.totalTVA || 0;
    const netVAT = Math.max(0, totalVatCollected - totalVatDeductible);
    const nextVatPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);

    // 6. Projection par horizon
    const data = horizons.map((h, i) => {
      const cutoff = new Date(now.getTime() + h.days * 86_400_000);
      const inflow = receivablesByHorizon[i];
      
      // Multiplicateur pour les abonnements selon la durée projetée
      const monthsMultiplier = h.days === 0 ? 0 : h.days === 15 ? 0.5 : h.days === 30 ? 1 : h.days === 60 ? 2 : 3;
      const subOutflow = activeSubsTotal * monthsMultiplier;
      
      const outflow = payablesByHorizon[i] + subOutflow + (cutoff >= nextVatPaymentDate ? netVAT : 0);
      return {
        date: h.label,
        balance: Math.round(startingBalance + inflow - outflow),
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
        subs: Math.round(subOutflow)
      };
    });

    return {
      predictiveCashflowData: data,
      projectedBalance30j: data[2]?.balance ?? startingBalance,
      recurringDeductionsTotal: activeSubsTotal
    };
  }, [analyticsData, salesInvoices, bankStatements, startingBalance, simulatedSubscriptions]);

  // ── Calculs TVA Détaillés ──────────────────────────────────────────────────
  const vats = useMemo(() => {
    if (!analyticsData) return { collected: 0, deductible: 0, net: 0 };
    const collected = analyticsData.totalRevenueTVA;
    const deductible = analyticsData.totalTVA;
    return {
      collected,
      deductible,
      net: collected - deductible
    };
  }, [analyticsData]);

  const toggleSubscription = (id: string) => {
    setSimulatedSubscriptions(prev =>
      prev.map(sub => sub.id === id ? { ...sub, active: !sub.active } : sub)
    );
  };

  const isLoading = isInitialLoading || isLoadingDocs || isLoadingSales || isLoadingBank;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 animate-pulse">
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
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Cockpit Analytique Premium</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Pilotez votre trésorerie, vos prévisions de cash-flow et votre TVA en temps réel.
          </p>
        </div>
        
        {/* Tab Controls */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5 self-start">
          {[
            { id: 'overview', label: 'Flux Trésorerie', icon: BarChartIcon },
            { id: 'forecast', label: 'Prévisions & Simulations', icon: Calendar },
            { id: 'vat', label: 'Calculateur TVA', icon: Landmark }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards (Always visible for consistent overview) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenus TTC (Ventes)"
          value={analyticsData.totalRevenueTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          sub="Volume d'affaires facturé"
          icon={ArrowUpCircle}
          trend="up"
        />
        <StatCard
          label="Dépenses TTC (Achats)"
          value={totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          sub={`Sur ${approvedCount} pièces approuvées`}
          icon={ArrowDownCircle}
          trend="down"
        />
        <StatCard
          label="Trésorerie Projetée (30j)"
          value={projectedBalance30j.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          sub="Prévision cumulative"
          icon={Wallet}
          trend="neutral"
          className="border-indigo-500/20"
        />
        <StatCard
          label="TVA Déductible (Cumul)"
          value={totalTVA.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          sub="À récupérer sur vos achats"
          icon={ShieldCheck}
          trend="up"
          className="border-emerald-500/20"
        />
      </div>

      {/* Tab Area 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Interactive Composed Flow Chart */}
            <Card className="lg:col-span-3 glass-panel premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 border-white/20 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-2xl">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Flux de Trésorerie Historique
                </CardTitle>
                <CardDescription className="text-base">Comparatif mensuel des revenus encaissés vs dépenses payées</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyChartData} margin={{ top: 20, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} className="text-xs" />
                      <ChartTooltip
                        content={<ChartTooltipContent
                          formatter={(value) => `${Number(value).toLocaleString('fr-FR')} €`}
                          indicator="dot"
                        />}
                      />
                      <Bar dataKey="revenus" name="revenus" fill="var(--color-revenus)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="depenses" name="depenses" fill="var(--color-depenses)" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="net" name="net" stroke="var(--color-net)" strokeWidth={3} dot={{ r: 4 }} />
                      <ChartLegend content={<ChartLegendContent />} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Pie */}
            <Card className="lg:col-span-2 glass-panel premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 border-white/20 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-2xl">
                  <BarChartIcon className="h-6 w-6 text-primary" />
                  Dépenses par Catégorie
                </CardTitle>
                <CardDescription className="text-base">Répartition de vos charges approuvées</CardDescription>
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

          {/* Top Suppliers */}
          <Card className="glass-panel premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-2xl">
                <ArrowUpCircle className="h-6 w-6 text-orange-500" />
                Principaux Fournisseurs
              </CardTitle>
              <CardDescription className="text-base">Classement par volume de dépenses accumulées</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
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
      )}

      {/* Tab Area 2: Projections & Simulations */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-panel border-white/10 bg-white/5 p-4 rounded-2xl flex flex-col justify-center">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-primary" />
                Ajuster Solde Initial
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(Number(e.target.value))}
                  className="bg-background border border-input focus-visible:ring-1 focus-visible:ring-primary h-10 font-bold font-space text-lg"
                />
                <span className="text-sm font-semibold text-muted-foreground">EUR</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Modifiez le montant de départ pour affiner la courbe de trésorerie.</p>
            </Card>

            <Card className="glass-panel border-white/10 bg-white/5 p-4 rounded-2xl flex flex-col justify-center">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">Charges récurrentes simulées</div>
              <div className="text-2xl font-black font-space text-indigo-400">
                {recurringDeductionsTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                <span className="text-xs font-medium text-muted-foreground"> / mois</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Impact direct cumulé sur le prévisionnel trimestriel.</p>
            </Card>

            <Card className="glass-panel border-white/10 bg-white/5 p-4 rounded-2xl flex flex-col justify-center">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">Solde à +90 jours (IA)</div>
              <div className={cn(
                "text-2xl font-black font-space",
                predictiveCashflowData[4]?.balance >= startingBalance ? "text-emerald-500" : "text-rose-500"
              )}>
                {predictiveCashflowData[4]?.balance?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Projection calculée sur factures, TVA et abonnements.</p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* 3-Month Forecast Line Chart */}
            <Card className="lg:col-span-3 glass-panel premium-shadow bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-2xl text-indigo-400">
                  <TrendingUp className="h-6 w-6" />
                  Courbe Prévisionnelle à 90 jours
                </CardTitle>
                <CardDescription className="text-base text-indigo-300/60">Évolution de la trésorerie disponible en fonction des simulations</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center min-h-[260px]">
                <ChartContainer config={chartConfig} className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={predictiveCashflowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} className="text-xs" />
                      <ChartTooltip
                        content={<ChartTooltipContent
                          formatter={(value) => `${Number(value).toLocaleString('fr-FR')} €`}
                          indicator="dot"
                        />}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#6366f1" 
                        strokeWidth={3.5}
                        fillOpacity={1} 
                        fill="url(#colorBalance)" 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recurring Subscriptions Simulator */}
            <Card className="lg:col-span-2 glass-panel premium-shadow bg-white/5 border-white/10 flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-400" />
                  Simulateur d'échéances
                </CardTitle>
                <CardDescription className="text-xs">Désactivez les coûts optionnels pour tester l'impact sur le cash.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 flex-1 overflow-y-auto">
                {simulatedSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        {sub.label}
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded bg-white/5 border-white/10 font-bold">{sub.amount}€</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">{sub.desc}</div>
                    </div>
                    
                    {/* Beautiful Glass Switch Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleSubscription(sub.id)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary",
                        sub.active ? "bg-primary" : "bg-white/5"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out",
                          sub.active ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Area 3: VAT Calculator */}
      {activeTab === 'vat' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-5">
            {/* VAT Net Calculation Gauge Panel */}
            <Card className="md:col-span-3 glass-panel premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 border-white/20 dark:border-white/10 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <Landmark className="h-5.5 w-5.5 text-primary" />
                  TVA Période en Cours
                </CardTitle>
                <CardDescription>Calcul basé sur vos factures de ventes et achats approuvées.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                
                {/* Visual indicator bar comparing Deductible vs Collected */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>TVA Déductible (Achats) : {vats.deductible.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    <span>TVA Collectée (Ventes) : {vats.collected.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/5 p-0.5">
                    <div 
                      className="bg-emerald-500 rounded-full h-full transition-all duration-500" 
                      style={{ 
                        width: `${vats.collected + vats.deductible > 0 ? (vats.deductible / (vats.collected + vats.deductible)) * 100 : 50}%` 
                      }} 
                    />
                    <div 
                      className="bg-primary rounded-full h-full transition-all duration-500" 
                      style={{ 
                        width: `${vats.collected + vats.deductible > 0 ? (vats.collected / (vats.collected + vats.deductible)) * 100 : 50}%` 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground/60 font-semibold">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Taux de récupération d'achats</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Part de TVA collectée</span>
                  </div>
                </div>

                {/* KPI Result block */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-black tracking-wider">TVA Nette Estimée</div>
                    <div className={cn(
                      "text-3xl font-black font-space mt-1",
                      vats.net > 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {Math.abs(vats.net).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </div>
                  <Badge className={cn(
                    "text-xs font-black uppercase tracking-wider py-1.5 px-3 rounded-xl",
                    vats.net > 0 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  )}>
                    {vats.net > 0 ? "À payer (Décaisser)" : "Crédit de TVA (À reporter/rembourser)"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Smart Alerts & Deadline */}
            <Card className="md:col-span-2 glass-panel border-white/10 bg-white/5 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Info className="h-4.5 w-4.5 text-primary" />
                  Conseils de gestion TVA
                </h4>
                
                {vats.net > 1000 ? (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-semibold leading-relaxed flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-sm">Provisionnez votre TVA</div>
                      Votre solde net estimé dépasse les 1 000 €. Conservez un solde suffisant pour le règlement attendu au 15 du mois prochain.
                    </div>
                  </div>
                ) : vats.net < 0 ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold leading-relaxed flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-sm">Crédit de TVA disponible</div>
                      Vous avez payé plus de TVA que collecté. Ce crédit sera automatiquement reporté sur votre prochaine déclaration ou pourra faire l'objet d'une demande de remboursement.
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-muted-foreground text-xs leading-relaxed flex gap-3">
                    <Info className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                    <div>
                      <div className="font-black text-sm text-foreground">Activité TVA Neutre</div>
                      Le volume de TVA collecté est équilibré par rapport à vos achats professionnels déductibles pour le moment.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 text-xs text-muted-foreground font-semibold space-y-1.5">
                <div className="flex justify-between">
                  <span>Prochaine déclaration estimée :</span>
                  <span className="text-foreground">15 {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Période fiscale analysée :</span>
                  <span className="text-foreground">Trimestre en cours</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

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

      {/* Bottom Area: AI Assistant Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3 glass-panel premium-shadow bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2 font-display text-2xl">
                        <Sparkles className={cn("h-6 w-6 text-primary", isGeneratingBriefing ? "animate-spin" : "animate-pulse")} />
                        Recommandations Proactives de l'Assistant IA
                    </CardTitle>
                    <CardDescription className="text-base mt-1">Synthèse et opportunités identifiées automatiquement par l'IA</CardDescription>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                    onClick={handleRefreshBriefing}
                    disabled={isGeneratingBriefing}
                >
                    <RefreshCw className={cn("h-4 w-4", isGeneratingBriefing && "animate-spin")} />
                    Actualiser
                </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {!latestBriefing ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                        <p className="text-sm font-medium">Aucun rapport de gestion disponible pour l'instant.</p>
                        <p className="text-xs text-muted-foreground mt-1">Cliquez sur Actualiser pour lancer l'analyse prédictive.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm leading-relaxed font-medium">
                            {latestBriefing.summary}
                        </div>

                        <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-emerald-400">Piste d'optimisation fiscale</p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{latestBriefing.smartTip}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Documents scannés & analysés</p>
                                <p className="text-2xl font-black">{latestBriefing.kpis?.documentsCount || 0}</p>
                             </div>
                             <div className={cn(
                                "p-4 rounded-2xl border flex flex-col justify-center",
                                latestBriefing.urgencyLevel === 'high' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                                latestBriefing.urgencyLevel === 'medium' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
                                'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                             )}>
                                <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold mb-1">Niveau d'urgence comptable</p>
                                <p className="text-lg font-black uppercase tracking-wider">{latestBriefing.urgencyLevel === 'high' ? 'Élevé' : latestBriefing.urgencyLevel === 'medium' ? 'Modéré' : 'Normal'}</p>
                             </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}