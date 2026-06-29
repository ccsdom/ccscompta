'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Landmark, ArrowRightLeft, CheckCircle2, AlertCircle, 
    Link as LinkIcon, RefreshCw, Smartphone, ShieldCheck,
    Banknote, ArrowUpRight, ArrowDownLeft, TrendingUp, Search, FileText, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCollection, useMemoFirebase } from '@/firebase';
import { db } from '@/firebase';
import { collection, query, where, doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import type { Document } from '@/lib/types';
import { cn, formatDate, parseDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Area, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import { BankService, type BankTransaction } from '@/services/bank-service';

export default function MyBankPage() {
    const [isLinked, setIsLinked] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [isMatching, setIsMatching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [missingCount, setMissingCount] = useState(0);

    // States for manual matching
    const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
    const [isMatchSheetOpen, setIsMatchSheetOpen] = useState(false);
    const [docSearchQuery, setDocSearchQuery] = useState('');
    const [isSavingMatch, setIsSavingMatch] = useState(false);

    const storedClientId = typeof window !== 'undefined' ? localStorage.getItem('selectedClientId') : null;

    useEffect(() => {
        const loadTransactions = async () => {
            if (storedClientId) {
                const isBankLinked = localStorage.getItem(`bank_linked_${storedClientId}`) === 'true';
                setIsLinked(isBankLinked);
                if (isBankLinked) {
                    setIsLoading(true);
                    const data = await BankService.getTransactions(storedClientId);
                    setTransactions(data);
                    setIsLoading(false);
                }
            }
        };
        loadTransactions();
    }, [storedClientId]);

    useEffect(() => {
        if (!storedClientId) return;
        const unsub = onSnapshot(doc(db, 'missing_documents', storedClientId), (snap) => {
            if (snap.exists()) {
                setMissingCount(snap.data()?.items?.filter((i: any) => i.status === 'missing')?.length || 0);
            } else {
                setMissingCount(0);
            }
        });
        return () => unsub();
    }, [storedClientId]);

    const documentsQuery = useMemoFirebase(() => {
        if (!storedClientId) return null;
        return query(collection(db, 'documents'), where('clientId', '==', storedClientId));
    }, [storedClientId]);

    const { data: clientDocuments } = useCollection<Document>(documentsQuery);

    const handleLinkBank = () => {
        setIsLinking(true);
        // Simulation d'une connexion via Bridge/Budget Insight
        setTimeout(() => {
            setIsLinked(true);
            setIsLinking(false);
            if (storedClientId) {
                localStorage.setItem(`bank_linked_${storedClientId}`, 'true');
                window.dispatchEvent(new Event('storage'));
            }
            toast({
                title: "Banque connectée",
                description: "Votre flux bancaire est désormais synchronisé avec CCS Compta.",
            });
        }, 1500);
    };

    const runAutoMatch = async () => {
        if (!storedClientId || isMatching || transactions.length === 0) return;
        setIsMatching(true);

        try {
            const { httpsCallable } = await import('firebase/firestore').then(() => import('firebase/functions'));
            const { functions } = await import('@/firebase');
            
            const autoMatchFn = httpsCallable(functions, 'autoMatchBankTransactions');
            const result = await autoMatchFn({ clientId: storedClientId }) as any;
            
            const matchCount = result.data?.matchCount || 0;
            
            if (matchCount > 0) {
                const data = await BankService.getTransactions(storedClientId);
                setTransactions(data);

                toast({
                    title: "Rapprochement terminé",
                    description: `${matchCount} transactions ont été automatiquement associées à vos justificatifs.`,
                });
            } else {
                toast({
                    title: "Analyse terminée",
                    description: "Aucune nouvelle correspondance trouvée pour le moment.",
                });
            }
        } catch (error: any) {
            console.error("Auto-match error:", error);
            toast({
                variant: "destructive",
                title: "Erreur de rapprochement",
                description: "Une erreur s'est produite lors de l'appel au moteur de lettrage.",
            });
        } finally {
            setIsMatching(false);
        }
    };

    const handleOpenMatchSheet = (tx: BankTransaction) => {
        setSelectedTransaction(tx);
        setDocSearchQuery('');
        setIsMatchSheetOpen(true);
    };

    const handleMatchTransaction = async (docId: string) => {
        if (!selectedTransaction || !storedClientId) return;
        setIsSavingMatch(true);
        
        try {
            const bankStatementDocRef = doc(db, 'documents', selectedTransaction.sourceDocId);
            const docSnap = await getDoc(bankStatementDocRef);
            if (!docSnap.exists()) throw new Error("Relevé bancaire introuvable");
            
            const data = docSnap.data();
            const txs = [...(data.extractedData?.transactions || [])];
            
            const txIndex = parseInt(selectedTransaction.id.split('-').pop() || '');
            if (isNaN(txIndex) || !txs[txIndex]) throw new Error("Transaction introuvable");
            
            // Link the document ID
            txs[txIndex].matchingDocumentId = docId;
            
            await updateDoc(bankStatementDocRef, {
                'extractedData.transactions': txs
            });
            
            // Reload transactions
            const updatedTxs = await BankService.getTransactions(storedClientId);
            setTransactions(updatedTxs);
            
            toast({
                title: "Transaction associée !",
                description: "Le justificatif a été lié avec succès."
            });
            
            setIsMatchSheetOpen(false);
            setSelectedTransaction(null);
        } catch (error: any) {
            console.error("Match error:", error);
            toast({
                variant: "destructive",
                title: "Erreur d'association",
                description: error.message || "Une erreur est survenue."
            });
        } finally {
            setIsSavingMatch(false);
        }
    };

    // Calculate daily balance history (30 days) working backwards from 12450.20
    const balanceTrendData = useMemo(() => {
        if (transactions.length === 0) return [];
        let current = 12450.20;
        const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const points = [];
        const now = new Date();
        
        for (let i = 30; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            
            const dayTxs = sortedTxs.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate.getDate() === d.getDate() && txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
            });
            
            dayTxs.forEach(tx => {
                current += tx.amount;
            });
            
            points.push({
                date: dateStr,
                solde: Math.round(current)
            });
        }
        return points;
    }, [transactions]);

    // List of matchable documents (excluding bank statements, only approved or pending)
    const matchableDocuments = useMemo(() => {
        if (!clientDocuments) return [];
        
        // Filter out bank statements
        let docs = clientDocuments.filter(d => d.type !== 'bank statement');
        
        // Search filter
        if (docSearchQuery.trim()) {
            const queryLower = docSearchQuery.toLowerCase();
            docs = docs.filter(d => 
                d.name.toLowerCase().includes(queryLower) ||
                (d.extractedData?.vendorNames && d.extractedData.vendorNames.some(v => v && v.toLowerCase().includes(queryLower))) ||
                (d.extractedData?.amounts && d.extractedData.amounts.some(a => a && a.toString().includes(queryLower)))
            );
        }

        // Sort: place documents that have the exact same amount as the selected transaction first!
        if (selectedTransaction) {
            const targetAmount = Math.abs(selectedTransaction.amount);
            docs.sort((a, b) => {
                const aHasMatchingAmount = a.extractedData?.amounts?.some(amt => amt != null && Math.abs(amt - targetAmount) < 0.01);
                const bHasMatchingAmount = b.extractedData?.amounts?.some(amt => amt != null && Math.abs(amt - targetAmount) < 0.01);
                
                if (aHasMatchingAmount && !bHasMatchingAmount) return -1;
                if (!aHasMatchingAmount && bHasMatchingAmount) return 1;
                return 0;
            });
        }
        
        return docs;
    }, [clientDocuments, docSearchQuery, selectedTransaction]);

    if (!isLinked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
                <div className="relative">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/30 shadow-2xl relative z-10 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent group-hover:rotate-12 transition-transform duration-700" />
                        <Landmark className="h-16 w-16 text-primary relative z-10" />
                    </div>
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl -z-10" 
                    />
                </div>

                <div className="max-w-md space-y-4">
                    <h1 className="text-4xl font-black tracking-tight gradient-text font-display">Reliez votre Banque</h1>
                    <p className="text-muted-foreground text-lg">
                        Plus besoin de pointer vos relevés. Notre IA associe automatiquement vos transactions bancaires à vos factures reçues par mail ou scannées.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl px-4">
                    {[
                        { icon: ShieldCheck, title: "Sécurisé", desc: "Chiffrement bancaire AES-256" },
                        { icon: RefreshCw, title: "Automatique", desc: "Sync quotidienne 24/7" },
                        { icon: CheckCircle2, title: "Zéro Papier", desc: "Rapprochement intelligent" }
                    ].map((feature, i) => (
                        <div key={i} className="glass-panel p-6 rounded-3xl border-white/10 text-center space-y-2 hover:border-primary/30 transition-colors">
                            <feature.icon className="h-6 w-6 text-primary mx-auto opacity-70" />
                            <h3 className="font-bold text-sm">{feature.title}</h3>
                            <p className="text-[10px] text-muted-foreground leading-tight">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                <Button 
                    size="lg" 
                    disabled={isLinking}
                    onClick={handleLinkBank}
                    className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-space font-black uppercase tracking-widest premium-shadow group hover:scale-105 transition-all duration-300"
                >
                    {isLinking ? (
                        <>
                            <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                            Connexion sécurisée...
                        </>
                    ) : (
                        <>
                            <LinkIcon className="mr-3 h-5 w-5 group-hover:rotate-45 transition-transform" />
                            Connecter mes comptes
                        </>
                    )}
                </Button>
                
                <p className="text-[10px] text-primary/40 font-mono flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" />
                    CERTIFIÉ DSP2 PAR LA BANQUE DE FRANCE
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Mon Flux Bancaire</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Suivi en temps réel et rapprochement automatique.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={runAutoMatch}
                        disabled={isMatching}
                        className="h-10 px-4 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold"
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isMatching && "animate-spin")} />
                        {isMatching ? "Analyse IA..." : "Lancer le Rapprochement"}
                    </Button>
                    <Badge variant="secondary" className="h-10 px-4 rounded-xl flex items-center gap-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Banque Connectée
                    </Badge>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-panel border-white/10 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-black text-[10px]">Solde Actuel</CardDescription>
                        <CardTitle className="text-3xl font-black">12 450,20 €</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            +2.4% vs mois dernier
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-white/10 hover:border-orange-500/50 transition-colors cursor-pointer group">
                    <Link href="/dashboard/my-bank/missing">
                        <CardHeader className="pb-2">
                            <CardDescription className="uppercase tracking-widest font-black text-[10px] group-hover:text-orange-500 transition-colors">Justificatifs Manquants</CardDescription>
                            <CardTitle className="text-3xl font-black text-orange-500">{missingCount}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground flex items-center justify-between">
                                Action requise
                                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                            </p>
                        </CardContent>
                    </Link>
                </Card>
                <Card className="glass-panel border-white/10">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-black text-[10px]">Taux de Matching IA</CardDescription>
                        <CardTitle className="text-3xl font-black">94%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Efficacité opérationnelle</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 glass-panel border-white/10 p-6 flex flex-col h-[280px]">
                    <CardHeader className="pb-0 pl-0 pt-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 font-display">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Évolution du Solde (30 jours)
                        </CardTitle>
                        <CardDescription className="text-xs">Historique reconstitué sur la base de vos transactions</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 pl-0 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={balanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="bankBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} className="text-[10px] text-muted-foreground" />
                                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} className="text-[10px] text-muted-foreground" />
                                <Tooltip
                                    formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} €`, "Solde"]}
                                    contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', border: 'none', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="solde" 
                                    stroke="var(--primary)" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#bankBalanceGrad)" 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-white/10 p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 flex flex-col justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold font-display flex items-center gap-2 text-primary">
                            <ShieldCheck className="h-5 w-5 animate-pulse" />
                            Sécurité & Synchronisation
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                            Votre connexion bancaire est protégée par un chiffrement de niveau militaire (AES-256) et régie par la directive européenne DSP2. Vos identifiants ne sont jamais stockés.
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>Dernière synchro : Aujourd'hui</span>
                        <span className="text-emerald-500 flex items-center gap-1.5 font-bold">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Actif
                        </span>
                    </div>
                </Card>
            </div>

            {/* Transaction List */}
            <Card className="glass-panel border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="font-space font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                        Transactions Récentes
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground uppercase font-black tracking-widest">
                        <span>Date</span>
                        <span className="w-48 text-right">Montant</span>
                        <span className="w-32 text-right">Statut</span>
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <div className="p-12 text-center flex flex-col items-center gap-4">
                                    <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-20" />
                                    <p className="text-xs text-muted-foreground animate-pulse">Récupération des données bancaires...</p>
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="p-16 text-center space-y-4">
                                    <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ArrowRightLeft className="h-8 w-8 text-muted-foreground opacity-20" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">Aucune transaction détectée sur vos dernières factures.</p>
                                    <p className="text-[10px] text-muted-foreground uppercase opacity-40">Uploadez un relevé bancaire pour commencer</p>
                                </div>
                            ) : transactions.map((tx) => (
                                <motion.div 
                                    layout
                                    key={tx.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                                            tx.amount < 0 ? "bg-red-500/5 text-red-500 group-hover:bg-red-500/10" : "bg-emerald-500/5 text-emerald-500 group-hover:bg-emerald-500/10"
                                        )}>
                                            {tx.amount < 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{tx.description}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono uppercase opacity-50">{tx.date}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className={cn(
                                            "text-lg font-black tracking-tighter w-48 text-right",
                                            tx.amount < 0 ? "text-foreground" : "text-emerald-500"
                                        )}>
                                            {tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                        
                                        <div className="w-32 flex items-center justify-end gap-2">
                                            {tx.status === 'matched' ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 animate-in zoom-in duration-300">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Associé
                                                </Badge>
                                            ) : (
                                                <>
                                                    <Badge 
                                                        variant={tx.status === 'pending' ? 'outline' : 'destructive'} 
                                                        className={cn(
                                                            tx.status === 'pending' ? "text-muted-foreground border-border/60" : "bg-red-500/10 text-red-500 border-red-500/20"
                                                        )}
                                                    >
                                                        {tx.status === 'pending' ? 'En attente' : 'Anomalie'}
                                                    </Badge>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => handleOpenMatchSheet(tx)}
                                                        className="h-8 px-2.5 rounded-lg text-primary hover:bg-primary/10 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Lier
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>

            {/* Manual Matching Dialog/Sheet */}
            <Sheet open={isMatchSheetOpen} onOpenChange={setIsMatchSheetOpen}>
                <SheetContent side="right" className="flex !w-full !max-w-none flex-col p-0 sm:!max-w-md md:!max-w-lg">
                    {selectedTransaction && (
                        <>
                            <SheetHeader className="border-b p-6 text-left shrink-0">
                                <SheetTitle className="font-display font-bold text-xl">Lier un justificatif</SheetTitle>
                                <SheetDescription>
                                    Associez un document comptable à cette transaction bancaire.
                                </SheetDescription>

                                {/* Transaction summary box */}
                                <div className="mt-4 p-4 rounded-2xl bg-muted/50 border border-border/10 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{selectedTransaction.description}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{selectedTransaction.date}</p>
                                    </div>
                                    <span className={cn(
                                        "text-base font-black tracking-tight",
                                        selectedTransaction.amount < 0 ? "text-foreground" : "text-emerald-500"
                                    )}>
                                        {selectedTransaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </span>
                                </div>
                            </SheetHeader>

                            {/* Search box inside Sheet */}
                            <div className="px-6 py-3 border-b shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Rechercher par nom, montant..."
                                        value={docSearchQuery}
                                        onChange={(e) => setDocSearchQuery(e.target.value)}
                                        className="pl-9 h-10 bg-background/50 border-border/40 focus-visible:ring-primary focus-visible:ring-1"
                                    />
                                </div>
                            </div>

                            {/* Document List */}
                            <div className="flex-1 min-h-0">
                                <ScrollArea className="h-full px-6">
                                    <div className="space-y-3 py-4">
                                        {matchableDocuments.length > 0 ? (
                                            matchableDocuments.map((docItem) => {
                                                const docAmount = docItem.extractedData?.amounts?.[0];
                                                const isExactAmountMatch = docAmount != null && Math.abs(docAmount - Math.abs(selectedTransaction.amount)) < 0.01;
                                                const vendorName = docItem.extractedData?.vendorNames?.[0] || docItem.extractedData?.supplierName || "Fournisseur inconnu";

                                                return (
                                                    <div 
                                                        key={docItem.id}
                                                        onClick={() => !isSavingMatch && handleMatchTransaction(docItem.id)}
                                                        className={cn(
                                                            "p-4 rounded-2xl border border-border/10 bg-background hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between group/doc relative overflow-hidden",
                                                            isExactAmountMatch && "border-emerald-500/20 bg-emerald-500/[0.01] hover:bg-emerald-500/[0.03]",
                                                            isSavingMatch && "opacity-50 pointer-events-none"
                                                        )}
                                                    >
                                                        {isExactAmountMatch && (
                                                            <div className="absolute top-0 right-0 h-4 bg-emerald-500 text-[8px] font-black uppercase text-white px-2 rounded-bl-lg tracking-widest">
                                                                Montant Idéale
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex items-start gap-3 min-w-0 pr-2">
                                                            <div className="p-2.5 rounded-xl bg-muted group-hover/doc:bg-background transition-colors shrink-0">
                                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-sm truncate">{docItem.name}</p>
                                                                <p className="text-[10px] text-muted-foreground mt-0.5">Fournisseur : {vendorName}</p>
                                                                <p className="text-[9px] text-muted-foreground">Date : {docItem.extractedData?.dates?.[0] ? formatDate(docItem.extractedData.dates[0]) : formatDate(docItem.uploadDate)}</p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                                            {docAmount != null && (
                                                                <span className="font-black text-sm tracking-tight">
                                                                    {docAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                                </span>
                                                            )}
                                                            <Button 
                                                                size="sm" 
                                                                variant={isExactAmountMatch ? "default" : "outline"} 
                                                                className={cn(
                                                                    "h-7 text-[10px] font-bold px-2 rounded-lg opacity-0 group-hover/doc:opacity-100 transition-opacity",
                                                                    isExactAmountMatch && "bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                                                                )}
                                                            >
                                                                Choisir
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-12 text-sm text-muted-foreground">
                                                Aucun justificatif disponible.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Footer */}
                            <div className="border-t p-6 shrink-0 bg-muted/10">
                                <Button 
                                    variant="outline" 
                                    className="w-full h-11 rounded-xl"
                                    onClick={() => setIsMatchSheetOpen(false)}
                                    disabled={isSavingMatch}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
