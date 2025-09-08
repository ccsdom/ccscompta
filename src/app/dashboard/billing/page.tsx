
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, CheckCircle, Clock, MoreHorizontal } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

interface Invoice {
    id: string;
    clientName: string;
    number: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
}

const mockInvoices: Invoice[] = [
    { id: '1', clientName: 'ACTION AVENTURE', number: 'FACT-2024-007', date: '01/07/2024', dueDate: '31/07/2024', amount: 350.00, status: 'pending' },
    { id: '2', clientName: 'AUTO ECOLE DE LA MAIRIE', number: 'FACT-2024-006', date: '01/06/2024', dueDate: '30/06/2024', amount: 350.00, status: 'paid' },
    { id: '3', clientName: 'BODY MINUTE', number: 'FACT-2024-005', date: '01/05/2024', dueDate: '31/05/2024', amount: 350.00, status: 'paid' },
    { id: '4', clientName: 'CABINET FLORET', number: 'FACT-2023-BILAN', date: '15/04/2024', dueDate: '15/05/2024', amount: 1800.00, status: 'overdue' },
    { id: '5', clientName: 'CABINET MEDICAL GALEA', number: 'FACT-2024-004', date: '01/04/2024', dueDate: '30/04/2024', amount: 350.00, status: 'paid' },
    { id: '6', clientName: 'CHICKEN SPOT', number: 'FACT-2024-008', date: '05/07/2024', dueDate: '05/08/2024', amount: 450.00, status: 'pending' },

];

export default function BillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
    const { toast } = useToast();

    const getStatusBadge = (status: Invoice['status']) => {
        switch(status) {
            case 'paid': return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100/80"><CheckCircle className="mr-1 h-3 w-3"/>Payée</Badge>
            case 'pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>En attente</Badge>
            case 'overdue': return <Badge variant="destructive"><Clock className="mr-1 h-3 w-3"/>En retard</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }
    
    const handleMarkAsPaid = (invoiceId: string) => {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? {...inv, status: 'paid'} : inv));
        toast({
            title: "Facture mise à jour",
            description: "La facture a été marquée comme payée.",
        });
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturation Clients</h1>
                <p className="text-muted-foreground mt-1">Suivez les paiements et gérez les factures de vos clients.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Suivi des factures</CardTitle>
                    <CardDescription>Liste de toutes les factures émises pour l'ensemble des clients.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Échéance</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length > 0 ? invoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.clientName}</TableCell>
                                    <TableCell>{invoice.number}</TableCell>
                                    <TableCell>{invoice.dueDate}</TableCell>
                                    <TableCell>{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</TableCell>
                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Plus d'actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                 <DropdownMenuItem>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Télécharger
                                                </DropdownMenuItem>
                                                {invoice.status !== 'paid' && (
                                                    <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Marquer comme payée
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
