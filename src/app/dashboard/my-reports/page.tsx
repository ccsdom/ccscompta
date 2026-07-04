'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  BookOpen, TrendingUp, TrendingDown, Landmark, Sparkles, Activity, FileText
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import {
  Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LabelList, BarChart as ReBarChart, Cell
} from 'recharts';
import type { Document, SalesInvoice } from '@/lib/types';
import { type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { db } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { cn, parseDate } from '@/lib/utils';
import { salesService } from '@/services/sales-service';

export default function MyReportsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

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

  // Chargement des factures de vente (Chiffre d'Affaires)
  useEffect(() => {
    if (selectedClientId) {
      setLoadingSales(true);
      salesService.getClientInvoices(selectedClientId)
        .then(data => setInvoices(data))
        .catch(console.error)
        .finally(() => setLoadingSales(false));
    }
  }, [selectedClientId]);

  // Chargement des documents d'achats approuvés
  const documentsQuery = useMemoFirebase(() => {
    if (!selectedClientId) return null;
    return query(collection(db, 'documents'), where('clientId', '==', selectedClientId), where('status', '==', 'approved'));
  }, [selectedClientId]);

  const { data: clientDocuments, isLoading: isLoadingDocs } = useCollection<Document>(documentsQuery);

  const reportData = useMemo(() => {
    if (!clientDocuments || !invoices) return null;

    // 1. Calcul du Chiffre d'Affaires (Ventes HT et TTC)
    let totalRevenueHT = 0;
    let totalRevenueTTC = 0;
    
    invoices.forEach(inv => {
        if (inv.status === 'paid' || inv.status === 'sent') {
            totalRevenueHT += inv.totalHT;
            totalRevenueTTC += inv.totalTTC;
        }
    });

    // 2. Calcul des Dépenses par catégorie (Coût des ventes vs Dépenses Opérationnelles)
    let cogs = 0; // Cost of Goods Sold
    let opex = 0; // Operating Expenses
    
    const categories: Record<string, number> = {
        "Achats de Marchandises": 0,
        "Services extérieurs": 0,
        "Frais de Personnel": 0,
        "Impôts et Taxes": 0,
        "Autres Dépenses": 0
    };

    clientDocuments.forEach(d => {
        const cat = d.extractedData?.category || 'Autre';
        const ttc = d.extractedData?.amounts?.reduce((a, b) => (a || 0) + (b || 0), 0) ?? 0;
        const tva = d.extractedData?.vatAmount ?? 0;
        const ht = Math.max(0, ttc - tva);

        if (cat.toLowerCase().includes('marchandise') || cat.toLowerCase().includes('matière')) {
            cogs += ht;
            categories["Achats de Marchandises"] += ht;
        } else if (cat.toLowerCase().includes('personnel') || cat.toLowerCase().includes('salaire')) {
            opex += ht;
            categories["Frais de Personnel"] += ht;
        } else if (cat.toLowerCase().includes('impôt') || cat.toLowerCase().includes('taxe')) {
            opex += ht;
            categories["Impôts et Taxes"] += ht;
        } else if (cat.toLowerCase().includes('service') || cat.toLowerCase().includes('loyer') || cat.toLowerCase().includes('informatique')) {
            opex += ht;
            categories["Services extérieurs"] += ht;
        } else {
            opex += ht;
            categories["Autres Dépenses"] += ht;
        }
    });

    const grossMargin = totalRevenueHT - cogs;
    const netIncome = grossMargin - opex;
    const netMarginPercent = totalRevenueHT > 0 ? (netIncome / totalRevenueHT) * 100 : 0;

    const healthStatus = netIncome > 0 ? 'good' : netIncome === 0 && totalRevenueHT === 0 ? 'neutral' : 'bad';

    const waterfallData = [
        { name: 'Chiffre d\'Affaires', value: totalRevenueHT, fill: "hsl(var(--primary))" },
        { name: 'Achats Marchandises', value: -cogs, fill: "#f43f5e" },
        { name: 'Marge Brute', value: grossMargin, fill: "#10b981" },
        { name: 'Charges Opérat.', value: -opex, fill: "#f97316" },
        { name: 'Résultat Net', value: netIncome, fill: netIncome >= 0 ? "#10b981" : "#ef4444" }
    ];

    return {
        totalRevenueHT, totalRevenueTTC, cogs, opex, grossMargin, netIncome, netMarginPercent, healthStatus, categories, waterfallData
    };
  }, [clientDocuments, invoices]);

  const strategicAdvice = useMemo(() => {
    if (!reportData) return null;
    const { totalRevenueHT, netIncome, netMarginPercent } = reportData;

    if (totalRevenueHT === 0) {
      return {
        title: "Démarrage d'Activité",
        content: "Vous n'avez pas encore enregistré de Chiffre d'Affaires significatif. Concentrez-vous sur la facturation de vos premières prestations ou produits depuis le module Ventes.",
        status: "neutral"
      };
    }
    if (netIncome < 0) {
      return {
        title: "Optimisation de rentabilité requise",
        content: "Votre résultat net estimé est négatif. Vos charges globales dépassent vos revenus. Nous vous conseillons de mener un audit de vos charges de fonctionnement (OPEX) et de revoir vos coûts d'achats directs.",
        status: "bad"
      };
    }
    if (netMarginPercent < 10) {
      return {
        title: "Performance Modérée",
        content: `Votre marge nette s'établit à ${netMarginPercent.toFixed(1)}%. Bien que bénéficiaire, elle se situe sous la moyenne idéale de 10%. Envisagez d'ajuster vos tarifs ou de réduire vos abonnements récurrents non essentiels.`,
        status: "warning"
      };
    }
    return {
      title: "Rentabilité Excellente",
      content: `Félicitations ! Votre structure génère une marge nette solide de ${netMarginPercent.toFixed(1)}%. Votre business model est viable et profitable. Profitez de ce cash excédentaire pour investir ou provisionner vos échéances fiscales.`,
      status: "good"
    };
  }, [reportData]);

  const isLoading = isInitialLoading || isLoadingDocs || loadingSales;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 animate-pulse">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid gap-4 md:grid-cols-3 mt-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 mt-6" />
      </div>
    );
  }

  if (!reportData) return null;

  const { totalRevenueHT, cogs, opex, grossMargin, netIncome, netMarginPercent, healthStatus, categories, waterfallData } = reportData;

  const chartConfig = {
    value: { label: "Montant (€)" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Bilan & Compte de Résultat
        </h1>
        <p className="text-muted-foreground text-lg">
          Votre santé financière vulgarisée et expliquée en temps réel.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel premium-shadow-sm hover:premium-shadow transition-all duration-500 hover:-translate-y-0.5 border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="h-24 w-24" /></div>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chiffre d'Affaires (HT)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-black text-primary">
                    {totalRevenueHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Revenus de votre activité principale</p>
            </CardContent>
        </Card>

        <Card className="glass-panel premium-shadow-sm hover:premium-shadow transition-all duration-500 hover:-translate-y-0.5 border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Activity className="h-24 w-24" /></div>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Marge Brute (HT)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-black text-emerald-500">
                    {grossMargin.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Ce qu'il reste après déduction des coûts directs</p>
            </CardContent>
        </Card>

        <Card className={cn(
            "glass-panel premium-shadow-sm hover:premium-shadow transition-all duration-500 hover:-translate-y-0.5 relative overflow-hidden border",
            healthStatus === 'good' ? "bg-emerald-500/10 border-emerald-500/30 animate-in fade-in" : 
            healthStatus === 'bad' ? "bg-destructive/10 border-destructive/30 animate-in fade-in" : 
            "bg-muted/30 border-white/10"
        )}>
             <div className="absolute top-0 right-0 p-4 opacity-10">
                {healthStatus === 'good' ? <Sparkles className="h-24 w-24 text-emerald-500" /> : <TrendingDown className="h-24 w-24 text-destructive" />}
             </div>
            <CardHeader className="pb-2">
                <CardTitle className={cn(
                    "text-sm font-black uppercase tracking-widest",
                    healthStatus === 'good' ? "text-emerald-600 dark:text-emerald-400" : 
                    healthStatus === 'bad' ? "text-destructive" : 
                    "text-muted-foreground"
                )}>Résultat Net (Bénéfice/Perte)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={cn(
                    "text-4xl font-black",
                    healthStatus === 'good' ? "text-emerald-600 dark:text-emerald-400" : 
                    healthStatus === 'bad' ? "text-destructive" : ""
                )}>
                    {netIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        healthStatus === 'good' ? "bg-emerald-500/20 text-emerald-600" : 
                        healthStatus === 'bad' ? "bg-destructive/20 text-destructive" : 
                        "bg-muted text-muted-foreground"
                    )}>
                        {netMarginPercent.toFixed(1)}% Marge Nette
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Après toutes charges</span>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Strategic Advisor Panel */}
      {strategicAdvice && (
        <Card className="glass-panel premium-shadow bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
              <CardTitle className="text-xl font-display flex items-center gap-2">
                  <Sparkles className="h-5.5 w-5.5 text-primary" />
                  Conseils Stratégiques IA
              </CardTitle>
              <CardDescription>Recommandations d'optimisation générées en temps réel.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
              <div className={cn(
                  "p-4 rounded-2xl border flex gap-4 items-start",
                  strategicAdvice.status === 'good' ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" :
                  strategicAdvice.status === 'bad' ? "bg-rose-500/10 border-rose-500/25 text-rose-500" :
                  strategicAdvice.status === 'warning' ? "bg-amber-500/10 border-amber-500/25 text-amber-500" :
                  "bg-white/5 border-white/5 text-muted-foreground"
              )}>
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10 dark:bg-black/20 flex items-center justify-center text-primary">
                      <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                      <h4 className="font-black text-sm uppercase tracking-wider mb-1">{strategicAdvice.title}</h4>
                      <p className="text-xs font-semibold leading-relaxed text-foreground/80">{strategicAdvice.content}</p>
                  </div>
              </div>
          </CardContent>
        </Card>
      )}

      {/* Graphique Waterfall (P&L Visuel) */}
      <Card className="glass-panel premium-shadow border-white/10">
          <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" />
                  Formation du Résultat (P&L)
              </CardTitle>
              <CardDescription>Comment votre chiffre d'affaires se transforme en bénéfice net</CardDescription>
          </CardHeader>
          <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} className="text-xs font-medium" />
                          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k€`} className="text-xs" />
                          <ChartTooltip
                              cursor={{ fill: 'transparent' }}
                              content={<ChartTooltipContent
                                  formatter={(value) => `${Number(value).toLocaleString('fr-FR')} €`}
                              />}
                          />
                          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                               {waterfallData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                              <LabelList dataKey="value" position="top" className="fill-foreground text-[11px] font-bold" formatter={(v: number) => `${v > 0 ? '+' : ''}${Math.round(v).toLocaleString()}€`} />
                          </Bar>
                      </ReBarChart>
                  </ResponsiveContainer>
              </ChartContainer>
          </CardContent>
      </Card>

      {/* Détail des charges */}
      <Card className="glass-panel premium-shadow border-white/10">
          <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  Détail des Dépenses (OPEX & COGS)
              </CardTitle>
              <CardDescription>Répartition vulgarisée de vos charges comptables hors taxes</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([catName, amount], i) => {
                      if (amount === 0) return null;
                      const percentage = ((amount / (cogs + opex)) * 100).toFixed(1);
                      return (
                          <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex justify-between items-center">
                                  <span className="font-bold text-sm">{catName}</span>
                                  <span className="font-black font-space">{amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percentage}%` }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground font-bold w-12 text-right">{percentage}%</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
