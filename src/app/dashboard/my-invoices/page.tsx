'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, CheckCircle2, Clock, Calendar, ShieldCheck, HelpCircle, Receipt, ArrowUpRight, TrendingUp } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { formatDate } from '@/lib/utils';

export default function MyInvoicesPage() {
    const [clientId, setClientId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const id = localStorage.getItem('selectedClientId');
        setClientId(id);
    }, []);

    const invoicesQuery = useMemoFirebase(() => {
        if (!clientId) return null;
        return query(collection(db, 'invoices'), where('clientId', '==', clientId));
    }, [clientId]);

    const { data: invoices, isLoading } = useCollection<Invoice>(invoicesQuery);

    // Compute metrics
    const metrics = useMemo(() => {
        if (!invoices || invoices.length === 0) {
            return { totalPending: 0, totalPaid: 0, rate: 100, paidCount: 0, totalCount: 0 };
        }
        
        let totalPending = 0;
        let totalPaid = 0;
        let paidCount = 0;

        invoices.forEach(inv => {
            if (inv.status === 'paid') {
                totalPaid += inv.amount;
                paidCount++;
            } else {
                totalPending += inv.amount;
            }
        });

        const rate = Math.round((paidCount / invoices.length) * 100);

        return {
            totalPending,
            totalPaid,
            rate,
            paidCount,
            totalCount: invoices.length
        };
    }, [invoices]);

    const getStatusBadge = (status: Invoice['status']) => {
        switch(status) {
            case 'paid': 
                return (
                    <Badge className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-500 dark:text-emerald-400 border-emerald-500/25 animate-in zoom-in duration-300 font-semibold px-2.5 py-1 rounded-xl">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Payée
                    </Badge>
                );
            case 'pending': 
                return (
                    <Badge variant="outline" className="bg-amber-500/5 hover:bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/20 font-semibold px-2.5 py-1 rounded-xl">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        En attente
                    </Badge>
                );
            case 'overdue': 
                return (
                    <Badge variant="destructive" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/25 font-semibold px-2.5 py-1 rounded-xl shadow-inner">
                        <Clock className="mr-1 h-3.5 w-3.5 animate-pulse" />
                        En retard
                    </Badge>
                );
            default: 
                return <Badge variant="outline" className="rounded-xl px-2.5 py-1">{status}</Badge>;
        }
    };
    
    const handlePayment = async (invoiceId: string) => {
        try {
            await updateDoc(doc(db, 'invoices', invoiceId), { status: 'paid' });
            toast({
                title: "Paiement réussi !",
                description: "Votre facture a été marquée comme payée. Merci.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erreur lors du paiement",
                description: error.message || "Une erreur est survenue."
            });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-6 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Mes Factures</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Consultez et réglez les factures de votre cabinet comptable.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl opacity-50" />)}
                </div>
                <Card className="glass-panel overflow-hidden border-white/10 bg-background/20">
                    <CardHeader><Skeleton className="h-8 w-1/3 opacity-50" /></CardHeader>
                    <CardContent className="p-4 md:p-8">
                        <Skeleton className="h-64 w-full opacity-50" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/30">
                <div>
                    <h1 className="text-4xl font-black font-space tracking-tight flex items-center gap-3">
                        <Receipt className="h-8 w-8 text-primary" />
                        Mes Factures
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Consultez et réglez vos factures de prestations de manière cryptée et sécurisée.</p>
                </div>
                <Badge variant="secondary" className="h-8 px-3 rounded-lg flex items-center gap-1.5 bg-primary/10 text-primary border-primary/20 shrink-0 self-start md:self-auto">
                    <ShieldCheck className="h-4 w-4" />
                    Portail de Règlement Sécurisé
                </Badge>
            </div>

            {/* Stats Dashboard */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Pending Invoices Amount */}
                <Card className="glass-panel border-white/10 dark:border-white/5 bg-background/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-[4rem] flex items-start justify-end p-3 transition-transform group-hover:scale-105" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-black text-[10px] text-amber-500">Montant à Régler</CardDescription>
                        <CardTitle className="text-3xl font-black tracking-tight mt-1 text-amber-500">
                            {metrics.totalPending.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground font-medium">Factures en attente d'échéance ou en retard</p>
                    </CardContent>
                </Card>

                {/* Paid Invoices Amount */}
                <Card className="glass-panel border-white/10 dark:border-white/5 bg-background/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-[4rem] flex items-start justify-end p-3 transition-transform group-hover:scale-105" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-black text-[10px] text-emerald-500">Total Réglé</CardDescription>
                        <CardTitle className="text-3xl font-black tracking-tight mt-1 text-emerald-500">
                            {metrics.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground font-medium">Prestations acquittées pour cette année fiscale</p>
                    </CardContent>
                </Card>

                {/* Payment Rate */}
                <Card className="glass-panel border-white/10 dark:border-white/5 bg-background/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-[4rem] flex items-start justify-end p-3 transition-transform group-hover:scale-105" />
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase tracking-widest font-black text-[10px]">Taux de Règlement</CardDescription>
                        <CardTitle className="text-3xl font-black tracking-tight mt-1 flex items-baseline gap-2">
                            {metrics.rate}%
                            <span className="text-xs font-medium text-muted-foreground font-sans">
                                ({metrics.paidCount}/{metrics.totalCount} factures)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                            <div 
                                className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${metrics.rate}%` }} 
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices List */}
            <Card className="glass-panel overflow-hidden border-white/10 dark:border-white/5 premium-shadow bg-background/20">
                <CardHeader className="pb-4 border-b border-border/20 bg-white/5">
                    <CardTitle className="font-display font-bold text-xl">Historique de Facturation</CardTitle>
                    <CardDescription className="text-xs">Visualisez et téléchargez vos factures ou effectuez un règlement sécurisé.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {invoices && invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/[0.02]">
                                    <TableRow className="border-b-border/20 hover:bg-transparent">
                                        <TableHead className="font-bold text-foreground/80 h-12 pl-6 text-xs uppercase tracking-wider">Numéro</TableHead>
                                        <TableHead className="font-bold text-foreground/80 h-12 text-xs uppercase tracking-wider">Date d'émission</TableHead>
                                        <TableHead className="font-bold text-foreground/80 h-12 text-xs uppercase tracking-wider">Date d'échéance</TableHead>
                                        <TableHead className="font-bold text-foreground/80 h-12 text-xs uppercase tracking-wider">Montant TTC</TableHead>
                                        <TableHead className="font-bold text-foreground/80 h-12 text-xs uppercase tracking-wider">Statut</TableHead>
                                        <TableHead className="text-right font-bold text-foreground/80 h-12 pr-6 text-xs uppercase tracking-wider">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map(invoice => (
                                        <TableRow key={invoice.id} className="transition-colors duration-300 hover:bg-muted/30 border-b-border/10 group">
                                            <TableCell className="font-bold py-4 pl-6 text-sm text-foreground tracking-tight">{invoice.number}</TableCell>
                                            <TableCell className="py-4 text-xs font-semibold text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                                                    {formatDate(invoice.date)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-xs font-semibold text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                                                    {formatDate(invoice.dueDate)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-sm font-black tracking-tight">
                                                {invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                            </TableCell>
                                            <TableCell className="py-4">{getStatusBadge(invoice.status)}</TableCell>
                                            <TableCell className="text-right space-x-2 py-4 pr-6">
                                                <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground h-9 w-9 rounded-xl">
                                                    <Download className="h-4.5 w-4.5" />
                                                    <span className="sr-only">Télécharger</span>
                                                </Button>
                                                {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button className="h-9 px-4 rounded-xl font-bold text-xs premium-shadow bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-650 hover:scale-[1.02] active:scale-95 transition-all text-white border-none">
                                                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                                                Régler
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="glass-panel w-[90vw] md:w-full max-w-md rounded-3xl border-white/15 dark:border-white/5 backdrop-blur-2xl">
                                                            <AlertDialogHeader>
                                                                <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-4">
                                                                    <ShieldCheck className="h-6 w-6" />
                                                                </div>
                                                                <AlertDialogTitle className="font-display font-bold text-xl">Règlement Sécurisé</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-sm mt-2 text-muted-foreground leading-relaxed">
                                                                    Vous allez procéder au paiement sécurisé de la facture <strong>{invoice.number}</strong>.<br />
                                                                    Montant total : <strong className="text-foreground">{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                                                                <AlertDialogCancel className="border-border/40 mt-0 h-11 rounded-xl font-bold">Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handlePayment(invoice.id)} className="bg-primary hover:bg-primary/90 text-primary-foreground premium-shadow h-11 rounded-xl font-bold">
                                                                    Confirmer et payer
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-16 text-center space-y-4 flex flex-col items-center">
                            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h3 className="font-bold text-lg">Toutes vos factures sont réglées !</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Merci, votre situation de facturation est parfaitement à jour avec notre cabinet.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-white/[0.02] text-xs text-muted-foreground p-4 md:px-6 rounded-b-2xl border-t border-border/20">
                    <p className="flex items-center gap-2 font-medium">
                        <HelpCircle className="h-4 w-4 text-muted-foreground/75" />
                        Pour toute question concernant une facture, veuillez contacter directement votre responsable de dossier.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
