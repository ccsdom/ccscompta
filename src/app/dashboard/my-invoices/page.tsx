
'use client';

import { useState, useEffect } from 'react';
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
import { getInvoices, updateInvoice } from '@/ai/flows/invoice-actions';
import { Skeleton } from '@/components/ui/skeleton';


export default function MyInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchClientInvoices = async () => {
            setIsLoading(true);
            const clientId = localStorage.getItem('selectedClientId');
            if (clientId) {
                try {
                    const allInvoices = await getInvoices();
                    const clientInvoices = allInvoices.filter(inv => inv.clientId === clientId);
                    setInvoices(clientInvoices);
                } catch(e) {
                    toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger vos factures.' });
                }
            }
            setIsLoading(false);
        }
        fetchClientInvoices();
    }, [toast])

    const getStatusBadge = (status: Invoice['status']) => {
        switch(status) {
            case 'paid': return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100/80"><CheckCircle className="mr-1 h-3 w-3"/>Payée</Badge>
            case 'pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>En attente</Badge>
            case 'overdue': return <Badge variant="destructive"><Clock className="mr-1 h-3 w-3"/>En retard</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }
    
    const handlePayment = async (invoiceId: string) => {
        const updated = await updateInvoice(invoiceId, { status: 'paid' });
        if(updated) {
            setInvoices(prev => prev.map(inv => inv.id === invoiceId ? updated : inv));
             toast({
                title: "Paiement réussi !",
                description: "Votre facture a été marquée comme payée. Merci.",
            });
        }
    }

     if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Mes Factures</h1>
                <p className="text-muted-foreground mt-1">Consultez et réglez les factures de votre cabinet comptable.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historique de facturation</CardTitle>
                    <CardDescription>Retrouvez ici toutes les factures émises par notre cabinet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Date d'émission</TableHead>
                                <TableHead>Date d'échéance</TableHead>
                                <TableHead>Montant TTC</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length > 0 ? invoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.number}</TableCell>
                                    <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell>{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</TableCell>
                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon">
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Télécharger</span>
                                        </Button>
                                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button>
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        Payer
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Paiement sécurisé</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Vous allez être redirigé vers notre portail de paiement sécurisé pour régler la facture <strong>{invoice.number}</strong> d'un montant de <strong>{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handlePayment(invoice.id)}>Confirmer et payer</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Aucune facture pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="text-xs text-muted-foreground p-6">
                    <p>Pour toute question concernant une facture, veuillez contacter directement votre gestionnaire de dossier.</p>
                </CardFooter>
            </Card>
        </div>
    )

    
}

    