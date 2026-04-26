
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, CheckCircle, Clock } from "lucide-react";
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

    const getStatusBadge = (status: Invoice['status']) => {
        switch(status) {
            case 'paid': return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100/80"><CheckCircle className="mr-1 h-3 w-3"/>Payée</Badge>
            case 'pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>En attente</Badge>
            case 'overdue': return <Badge variant="destructive"><Clock className="mr-1 h-3 w-3"/>En retard</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }
    
    const handlePayment = async (invoiceId: string) => {
        await updateDoc(doc(db, 'invoices', invoiceId), { status: 'paid' });
        toast({
            title: "Paiement réussi !",
            description: "Votre facture a été marquée comme payée. Merci.",
        });
    }

     if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Mes Factures</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Consultez et réglez les factures de votre cabinet comptable.</p>
                </div>
                <Card className="glass-panel overflow-hidden border-primary/20 bg-gradient-to-br from-white/40 to-muted/10">
                    <CardHeader><Skeleton className="h-8 w-1/2 opacity-50" /></CardHeader>
                    <CardContent className="p-4 md:p-8">
                        <Skeleton className="h-64 w-full opacity-50" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 fill-mode-both">
             <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Mes Factures</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Consultez et réglez les factures de votre cabinet comptable en toute sécurité.</p>
                </div>
            </div>

            <Card className="glass-panel overflow-hidden border-white/20 dark:border-white/10 premium-shadow bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10">
                <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="font-display text-2xl">Historique de facturation</CardTitle>
                    <CardDescription className="text-base">Retrouvez ici toutes les factures émises, leur statut et les options de paiement.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-transparent/50">
                            <TableRow className="border-b-border/40 hover:bg-transparent">
                                <TableHead className="font-semibold text-foreground/80 h-12 pl-6">Numéro</TableHead>
                                <TableHead className="font-semibold text-foreground/80 h-12">Date d'émission</TableHead>
                                <TableHead className="font-semibold text-foreground/80 h-12">Date d'échéance</TableHead>
                                <TableHead className="font-semibold text-foreground/80 h-12">Montant TTC</TableHead>
                                <TableHead className="font-semibold text-foreground/80 h-12">Statut</TableHead>
                                <TableHead className="text-right font-semibold text-foreground/80 h-12 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices && invoices.length > 0 ? invoices.map(invoice => (
                                <TableRow key={invoice.id} className="transition-colors duration-300 hover:bg-primary/5 data-[state=selected]:bg-primary/10 border-b-border/20 group">
                                    <TableCell className="font-semibold py-4 pl-6 text-primary/80">{invoice.number}</TableCell>
                                    <TableCell className="py-4 text-muted-foreground">{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell className="py-4 text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell className="py-4 font-bold">{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</TableCell>
                                    <TableCell className="py-4">{getStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right space-x-2 py-4 pr-6">
                                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Télécharger</span>
                                        </Button>
                                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button className="premium-shadow-sm group-hover:scale-[1.02] transition-transform">
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        Régler
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="glass-panel w-[90vw] md:w-full rounded-2xl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="font-display text-xl">Paiement sécurisé</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Vous allez être redirigé vers notre portail de paiement sécurisé pour régler la facture <strong>{invoice.number}</strong> d'un montant de <strong>{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                                                        <AlertDialogCancel className="border-border/50 mt-0">Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handlePayment(invoice.id)} className="bg-primary hover:bg-primary/90 text-primary-foreground premium-shadow-sm">
                                                            Confirmer et payer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
                                            <span>Aucune facture pour le moment. Tout est à jour !</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="bg-primary/5 text-xs text-muted-foreground p-4 md:px-6 rounded-b-2xl border-t border-border/40">
                    <p className="flex items-center gap-2 font-medium">
                        <Clock className="h-3 w-3" />
                        Pour toute question concernant une facture, veuillez contacter directement votre responsable de dossier.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )

    
}
