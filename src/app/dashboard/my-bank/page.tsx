
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Landmark, ArrowRightLeft, CheckCircle2, AlertCircle, 
    Link as LinkIcon, RefreshCw, Smartphone, ShieldCheck,
    Banknote, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCollection, useMemoFirebase } from '@/firebase';
import { db } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'matched' | 'pending' | 'anomaly';
    matchedDocId?: string;
    vendor?: string;
}

const MOCK_TRANSACTIONS: BankTransaction[] = [
    { id: 'tx-1', date: '2026-04-22', description: 'AMAZON.FR SERVICES', amount: -42.50, status: 'pending' },
    { id: 'tx-2', date: '2026-04-21', description: 'TOTAL ENERGIES PARIS', amount: -65.00, status: 'pending' },
    { id: 'tx-3', date: '2026-04-20', description: 'VIREMENT URSSAF', amount: -850.00, status: 'pending' },
    { id: 'tx-4', date: '2026-04-19', description: 'ABONNEMENT ADOBE', amount: -24.99, status: 'pending' },
    { id: 'tx-5', date: '2026-04-18', description: 'RESTAURANT LE GOURMET', amount: -38.00, status: 'pending' },
];

export default function MyBankPage() {
    const [isLinked, setIsLinked] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [transactions, setTransactions] = useState<BankTransaction[]>(MOCK_TRANSACTIONS);
    const [isMatching, setIsMatching] = useState(false);

    const storedClientId = typeof window !== 'undefined' ? localStorage.getItem('selectedClientId') : null;

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
            toast({
                title: "Banque connectée",
                description: "Votre flux bancaire est désormais synchronisé avec CCS Compta.",
            });
        }, 2000);
    };

    const runAutoMatch = () => {
        if (!clientDocuments || isMatching) return;
        setIsMatching(true);

        const newTxs = [...transactions];
        let matchCount = 0;

        // On simule le matching IA
        setTimeout(() => {
            newTxs.forEach((tx, idx) => {
                if (tx.status === 'pending') {
                    // On cherche un doc qui correspond au montant
                    const match = clientDocuments.find(doc => 
                        doc.status === 'approved' && 
                        doc.extractedData?.amounts?.some(a => Math.abs(a) === Math.abs(tx.amount))
                    );

                    if (match) {
                        newTxs[idx] = { ...tx, status: 'matched', matchedDocId: match.id };
                        matchCount++;
                    }
                }
            });

            setTransactions(newTxs);
            setIsMatching(false);
            
            if (matchCount > 0) {
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
        }, 1500);
    };

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
                <Card className="glass-panel border-white/10">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-black text-[10px]">Justificatifs Manquants</CardDescription>
                        <CardTitle className="text-3xl font-black text-orange-500">12</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Action requise pour la clôture</p>
                    </CardContent>
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
                            {transactions.map((tx) => (
                                <motion.div 
                                    layout
                                    key={tx.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
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
                                        
                                        <div className="w-32 flex justify-end">
                                            {tx.status === 'matched' ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 animate-in zoom-in duration-300">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Associé
                                                </Badge>
                                            ) : tx.status === 'pending' ? (
                                                <Badge variant="outline" className="text-muted-foreground border-white/10">
                                                    En attente
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Anomalie
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

